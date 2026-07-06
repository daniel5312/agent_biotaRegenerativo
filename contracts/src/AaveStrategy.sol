// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

// [BLOCKCHAIN] Librería para interactuar con tokens ERC20 de forma segura.
// SafeERC20 envuelve las llamadas y revierte si el token retorna 'false' en vez de lanzar excepción.
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// [SEGURIDAD] Ownable2Step: a diferencia de Ownable simple, la transferencia de propiedad
// requiere que el NUEVO dueño la ACEPTE explícitamente. Esto evita que te roben el contrato
// o que por error tipees una dirección incorrecta y pierdas el control para siempre.
import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";

// [ARQUITECTURA] La interfaz que define el "idioma" que BiotaRWA usa para hablar con este adaptador.
import {IYieldStrategy} from "./IYieldStrategy.sol";

// ==========================================
// [AAVE V3] INTERFAZ MÍNIMA DEL POOL
// ==========================================
// Solo declaramos las 2 funciones que realmente usamos para ahorrar bytecode.
// Documentación oficial Aave V3: https://docs.aave.com/developers/core-contracts/pool
interface IAavePool {
    // [AAVE] Deposita activos en el Pool. Mintea aTokens al 'onBehalfOf' que representan
    // el depósito + intereses acumulados. Los aTokens crecen de valor cada bloque de Celo.
    function supply(
        address asset,      // El token ERC20 a depositar (ej: cUSD)
        uint256 amount,     // Cantidad en wei
        address onBehalfOf, // Quién recibe los aTokens (ej: la wallet del inversor)
        uint16 referralCode // Siempre 0 para transacciones normales (es para afiliados)
    ) external;

    // [AAVE] Quema los aTokens y devuelve el activo original + intereses acumulados.
    function withdraw(
        address asset,   // El token original a retirar
        uint256 amount,  // Cuánto retirar (type(uint256).max = retirar todo el balance)
        address to       // Quién recibe los fondos
    ) external returns (uint256); // Retorna la cantidad REAL retirada (puede diferir del solicitado)
}

/**
 * @title AaveStrategy V4 — Adaptador de Yield para Aave V3 (Hard Fork)
 * @author Biota Protocol
 * @notice [DEFI] Conecta el ecosistema Biota con el Pool oficial de Aave V3 en Celo Mainnet.
 * @dev [ARQUITECTURA] Contrato simple (NO es Proxy). Si se necesitan cambios, se redespliega
 *      y se llama setYieldStrategy() en BiotaRWA con la nueva dirección. Esto es intencional:
 *      las estrategias DeFi son "enchufes" intercambiables, no la caja fuerte principal.
 */
contract AaveStrategy is IYieldStrategy, Ownable2Step {
    using SafeERC20 for IERC20;

    // ==========================================
    // [EVM] VARIABLES INMUTABLES (bytecode, costo CERO en gas)
    // ==========================================
    IAavePool public immutable AAVE_POOL; // [AAVE] El contrato Pool oficial de Aave V3 en Celo.
    address public immutable ASSET;       // [CELO] El token base a depositar (ej: cUSD 0x765DE8...).
    address public immutable A_TOKEN;     // [AAVE] El aToken que Aave mintea (ej: aCELO-cUSD).

    // ==========================================
    // [ARQUITECTURA] Acoplamiento de Autoridad
    // ==========================================
    // [SEGURIDAD] Solo el contrato BiotaRWA puede llamar withdraw(). Si se filtra esta llave,
    // un atacante SOLO puede depositar (nunca retirar). Separación de poderes crítica.
    address public biotaStore;

    // ==========================================
    // [EVM] CUSTOM ERRORS (Gas optimization)
    // ==========================================
    error AaveStrategy__PoolInvalido();
    error AaveStrategy__AssetInvalido();
    error AaveStrategy__ATokenInvalido();
    error AaveStrategy__DireccionInvalida();
    error AaveStrategy__SoloEsBiotaRWA();          // [SEGURIDAD] Blinda el withdraw() ante llamadas externas.
    error AaveStrategy__ColateralIntocable();       // [SEGURIDAD] Nadie puede sacar los aTokens de los inversores.

    // ==========================================
    // [BLOCKCHAIN] EVENTOS
    // ==========================================
    event SuppliedToAave(address indexed investor, address indexed token, uint256 amount);
    event WithdrawnFromAave(address indexed investor, address indexed token, uint256 amount);
    event BiotaStoreActualizado(address indexed antiguo, address indexed nuevo);

    // ==========================================
    // [SOLIDITY] CONSTRUCTOR (No es Proxy, usa constructor normal)
    // ==========================================
    /**
     * @param _aavePool Dirección del Pool de Aave V3 en Celo Mainnet.
     * @param _asset    Dirección del token a depositar (ej: cUSD).
     * @param _aToken   Dirección del aToken correspondiente (ej: aBasCELO cUSD).
     */
    constructor(
        address _aavePool,
        address _asset,
        address _aToken
    ) Ownable(msg.sender) {
        // [SOLIDITY] Custom Errors en constructor. Más baratos que require con string.
        if (_aavePool == address(0)) revert AaveStrategy__PoolInvalido();
        if (_asset == address(0)) revert AaveStrategy__AssetInvalido();
        if (_aToken == address(0)) revert AaveStrategy__ATokenInvalido();
        
        AAVE_POOL = IAavePool(_aavePool);
        ASSET = _asset;
        A_TOKEN = _aToken;
    }

    // ==========================================
    // [REFI] SETTER ADMINISTRATIVO
    // ==========================================
    
    /**
     * @notice [ARQUITECTURA] Enlaza este adaptador con el contrato madre BiotaRWA.
     * @dev [SEGURIDAD] Solo el Owner (MultiSig o wallet limpia) puede hacer esto.
     *      Con Ownable2Step, cambiar el Owner requiere aceptación del nuevo dueño.
     */
    function setBiotaStore(address _biotaStore) external onlyOwner {
        if (_biotaStore == address(0)) revert AaveStrategy__DireccionInvalida();
        address antiguo = biotaStore;
        biotaStore = _biotaStore;
        emit BiotaStoreActualizado(antiguo, _biotaStore);
    }

    // ==========================================
    // [AAVE V3] IMPLEMENTACIONES DE IYieldStrategy
    // ==========================================

    /**
     * @notice [AAVE] Deposita tokens en el Pool de Aave V3. Los intereses se acumulan automáticamente.
     * @dev [GAS] Aprobación condicional infinita: solo se hace el SSTORE de aprobación cuando vence.
     *      Esto ahorra ~20,000 gas en depósitos recurrentes del mismo inversor.
     */
    function deposit(
        address token,
        uint256 amount,
        address onBehalfOf
    ) external override {
        // [EVM] Solo aprobamos al Pool si la allowance actual no alcanza. Ahorra un SSTORE.
        if (IERC20(token).allowance(address(this), address(AAVE_POOL)) < amount) {
            IERC20(token).forceApprove(address(AAVE_POOL), type(uint256).max);
        }

        // [AAVE V3] supply() transfiere los tokens desde este contrato hacia Aave,
        // y mintea aTokens directamente en la wallet del inversor (onBehalfOf).
        AAVE_POOL.supply(token, amount, onBehalfOf, 0);
        emit SuppliedToAave(onBehalfOf, token, amount);
    }

    /**
     * @notice [AAVE] Retira liquidez (capital + intereses acumulados) del Pool de Aave.
     * @dev [SEGURIDAD] SOLO puede ser llamado por BiotaRWA (biotaStore). Esta es la línea
     *      de defensa más importante del contrato. Un atacante con la llave del Owner
     *      no puede robar los fondos de los inversores directamente.
     */
    function withdraw(
        address token,
        uint256 amount,
        address receiver
    ) external override {
        // [SEGURIDAD] Acoplamiento de Autoridad: revierte si el llamador no es BiotaRWA.
        if (msg.sender != biotaStore) revert AaveStrategy__SoloEsBiotaRWA();
        
        // [AAVE V3] AAVE quema los aTokens del inversor y envía el activo original a 'receiver'.
        uint256 withdrawn = AAVE_POOL.withdraw(token, amount, receiver);
        emit WithdrawnFromAave(receiver, token, withdrawn);
    }

    /**
     * @notice [FRONTEND] Consulta el saldo actual del inversor en Aave (capital + intereses).
     * @dev [GAS] Función 'view'. El frontend la llama gratis cada N segundos para mostrar
     *      el saldo creciente en tiempo real: "Tu saldo: $102.45 cUSD".
     */
    function getBalance(
        address, // [SOLIDITY] Ignoramos el parámetro 'token'. Solo trabajamos con el par configurado.
        address user
    ) external view override returns (uint256) {
        // [AAVE] El balance del aToken ya incluye principal + intereses acumulados.
        // Crece cada bloque de Celo (~5 segundos) de forma automática.
        return IERC20(A_TOKEN).balanceOf(user);
    }

    /**
     * @notice [UI] Devuelve el nombre del protocolo para mostrarlo en el dashboard del inversor.
     */
    function getProtocolName() external pure override returns (string memory) {
        return "Aave V3 (Celo)";
    }

    /**
     * @notice [SEGURIDAD] Escotilla de emergencia para rescatar tokens atrapados por error.
     * @dev [SEGURIDAD] Jamás puede rescatar el A_TOKEN (aTokens de los inversores).
     *      Protección crítica: si alguien hace un airdrop de un token extraño aquí,
     *      el Owner lo puede recuperar sin tocar el colateral de los inversores.
     */
    function rescueStuckERC20(address tokenToRescue, address to, uint256 amount) external onlyOwner {
        // [SEGURIDAD] Los aTokens son intocables. Pertenecen a los inversores, no al protocolo.
        if (tokenToRescue == A_TOKEN) revert AaveStrategy__ColateralIntocable();
        IERC20(tokenToRescue).safeTransfer(to, amount);
    }
}
