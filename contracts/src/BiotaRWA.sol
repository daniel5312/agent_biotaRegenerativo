// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

// ==========================================
// [BLOCKCHAIN] IMPORTACIONES OPENZEPPELIN V5
// ==========================================
// [ERC1155] Estándar de tokens semifungibles. Perfecto para certificados de café:
// un mismo ID puede tener múltiples copias (ej: 100 inversores compran el lote #5).
import {ERC1155Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";

// [SEGURIDAD] Reemplazamos el AccessControl genérico por la versión con TimeLock de 3 días.
// Cualquier intento de cambiar el Admin requiere una espera de 72 horas.
import {AccessControlDefaultAdminRulesUpgradeable} from "@openzeppelin/contracts-upgradeable/access/extensions/AccessControlDefaultAdminRulesUpgradeable.sol";

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

// [SEGURIDAD] Protección contra ataques de Reentrancia. Crítico para withdrawYield().
// Un ataque de reentrancia ocurre cuando un contrato malicioso llama de vuelta a tu función
// antes de que termine, drenando fondos en un loop. nonReentrant lo bloquea.
// [NOTA TÉCNICA] Usamos la versión no-upgradeable porque ReentrancyGuardUpgradeable fue eliminado
// en la versión instalada de OZ v5. El guard simple es compatible con Proxies UUPS.
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// [ARQUITECTURA] Interfaz enchufable. BiotaRWA no sabe si usa Aave, Beefy o cualquier otro.
// Solo habla el "idioma" de IYieldStrategy.
import {IYieldStrategy} from "./IYieldStrategy.sol";

/**
 * @title BiotaRWA V4 - Real World Assets Tokenizados (Hard Fork)
 * @author Biota Protocol
 * @notice [REFI] Convierte el café físico colombiano en un Certificado de Inversión on-chain (ERC1155).
 *         Los inversores compran fracciones de lotes de café real y acumulan rendimiento en Aave V3.
 * @dev [EVM] Proxy UUPS con AccessControlDefaultAdminRules (TimeLock 3 días).
 *      IMPORTANTE: Al hacer upgrade de implementación, el Storage Layout DEBE preservarse.
 */
contract BiotaRWA is
    Initializable,
    ERC1155Upgradeable,
    AccessControlDefaultAdminRulesUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuard
{
    using SafeERC20 for IERC20;

    // ==========================================
    // [EVM] ROLES (Constantes, sin costo de storage)
    // ==========================================
    // [REFI] El ORACLE_ROLE lo tiene el Agente IA o el backend autorizado.
    // Puede mintear certificados y actualizar el estado del café en cada etapa de producción.
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    // ==========================================
    // [EVM] CUSTOM ERRORS
    // ==========================================
    error BiotaRWA__ProductoNoExiste(); // [REFI] El ID de lote no fue creado.
    error BiotaRWA__SinEstrategiaActiva(); // [DEFI] No hay adaptador DeFi para ese token.
    error BiotaRWA__MontoInvalido(); // [SOLIDITY] El monto de yield es 0.
    error BiotaRWA__SinCapitalEnEstrategia(); // [DEFI] El inversor no tiene fondos en Aave.
    error BiotaRWA__SaldoInsuficiente(); // [DEFI] Intenta retirar más de lo que tiene.
    error BiotaRWA__NoTieneBalance(); // [LOGISTICA] No tiene certificados para reclamar café.
    error BiotaRWA__NoDisponibleParaReclamo(); // [LOGISTICA] El lote ya no está activo.

    // ==========================================
    // [EVM] STORAGE - Layout Preservado (Upgrade-Safe)
    // ==========================================
    // ⚠️ REGLA DE ORO: Nunca reordenar ni eliminar estas variables. Solo agregar al final.

    // [REFI] Registro de datos biológicos y físicos de cada lote de café tokenizado.
    struct CoffeeData {
        string finca;
        string municipio;
        string vereda;
        string nombreProductor;
        string etapaBiota; // [REFI] Ej: "Cosecha", "Beneficiado", "Exportación"
        string variedad; // [REFI] Ej: "Castillo", "Caturra", "Geisha"
        string tonosPerfil; // [REFI] Perfil de taza: "Chocolate, Caramelo, Cítrico"
        uint256 alturaMsnm; // [REFI] Altura sobre el nivel del mar (métrica de calidad)
        bool activoParaReclamo; // [LOGISTICA] El inversor puede canjear su certificado por café físico
    }

    mapping(uint256 => CoffeeData) public coffeeRegistry; // [REFI] tokenId → datos del lote
    uint256 public nextProductId; // [EVM] Contador de lotes creados

    // -------------------------------------------------------
    // [DEFI] ARQUITECTURA DE YIELD ENCHUFABLE MULTI-TOKEN
    // -------------------------------------------------------
    // [ARQUITECTURA] Mapeamos cada token ERC20 (cUSD, G$, CELO) a su estrategia DeFi.
    // Esto nos permite enchufar o cambiar de protocolo (Aave → Beefy) sin tocar este contrato.
    mapping(address => IYieldStrategy) public yieldStrategies;

    // [REFI] Cuánto ha invertido cada usuario a través de la tienda Biota (su capital principal).
    mapping(address => uint256) public investorYield;

    // ==========================================
    // [BLOCKCHAIN] EVENTOS
    // ==========================================
    event RWACreated(uint256 indexed productId, string finca, string variedad);
    event RWAMinted(
        address indexed investor,
        uint256 indexed productId,
        uint256 amount
    );
    event EtapaActualizada(uint256 indexed productId, string nuevaEtapa);
    event CafeReclamado(address indexed investor, uint256 indexed productId);
    event YieldStrategyUpdated(
        address indexed token,
        address indexed oldStrategy,
        address indexed newStrategy
    );
    event InvestmentRecorded(
        address indexed investor,
        uint256 productId,
        address token,
        uint256 yieldAmount
    );

    // ==========================================
    // [EVM] INICIALIZACIÓN
    // ==========================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers(); // [SEGURIDAD] Bloquea la implementación directa del contrato.
    }

    /**
     * @notice [BLOCKCHAIN] Inicializa el contrato (solo se ejecuta una vez vía el Proxy).
     * @param initialOwner MultiSig que recibirá el DEFAULT_ADMIN_ROLE con TimeLock de 3 días.
     */
    function initialize(address initialOwner) public initializer {
        __ERC1155_init("ipfs://metadata-base-url/{id}.json"); // [IPFS] URL base de metadata de los certificados.
        // [SEGURIDAD] TimeLock de 3 días para transferencia de Admin.
        __AccessControlDefaultAdminRules_init(3 days, initialOwner);
        // [NOTA] ReentrancyGuard simple no requiere inicialización.

        _grantRole(ORACLE_ROLE, initialOwner);

        nextProductId = 1; // [SOLIDITY] Empezamos en 1 para que el ID 0 sirva como "no existe".
    }

    // ==========================================
    // [REFI] GESTIÓN DE LOTES DE CAFÉ
    // ==========================================

    // [SOLIDITY] Struct auxiliar para evitar el error "Stack Too Deep" al pasar muchos parámetros.
    struct CoffeeBatchParams {
        string finca;
        string municipio;
        string vereda;
        string productor;
        string etapa;
        string variedad;
        string tonos;
        uint256 altura;
    }

    /**
     * @notice [REFI] Registra un nuevo lote de café en la blockchain (tokenización RWA).
     * @dev Solo el Admin puede crear lotes. El Oráculo puede actualizar el estado después.
     */
    function createCoffeeBatch(
        CoffeeBatchParams calldata params // [GAS] calldata en vez de memory: no copia el struct, lo lee directamente.
    ) external onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256) {
        uint256 newId = nextProductId;

        coffeeRegistry[newId] = CoffeeData({
            finca: params.finca,
            municipio: params.municipio,
            vereda: params.vereda,
            nombreProductor: params.productor,
            etapaBiota: params.etapa,
            variedad: params.variedad,
            tonosPerfil: params.tonos,
            alturaMsnm: params.altura,
            activoParaReclamo: true
        });

        emit RWACreated(newId, params.finca, params.variedad);

        unchecked {
            nextProductId++;
        } // [GAS] Sin overflow check: nextProductId nunca llegará a 2^256.
        return newId;
    }

    /**
     * @notice [REFI] Mintea certificados ERC1155 al inversor después de su compra.
     * @dev [EVM] Solo el ORACLE_ROLE (Agente IA/Backend) puede ejecutar esto.
     */
    function mintInvestorRWA(
        address _investor,
        uint256 _productId,
        uint256 _amount
    ) external onlyRole(ORACLE_ROLE) {
        // [SOLIDITY] Validación compacta: el ID debe existir (< nextProductId) y no ser 0.
        if (_productId == 0 || _productId >= nextProductId)
            revert BiotaRWA__ProductoNoExiste();
        _mint(_investor, _productId, _amount, "");
        emit RWAMinted(_investor, _productId, _amount);
    }

    // ==========================================
    // [DEFI] LÓGICA DE YIELD (Aave V3)
    // ==========================================

    /**
     * @notice [DEFI] Registra la porción DeFi de una compra y la deposita en Aave V3.
     * @dev [ARQUITECTURA] El flujo es: BiotaSplitter → llama esto → deposita en AaveStrategy.
     */
    function recordInvestment(
        address _investor,
        uint256 _productId,
        address _token,
        uint256 _yieldAmount
    ) external onlyRole(ORACLE_ROLE) {
        IYieldStrategy strategy = yieldStrategies[_token];
        if (address(strategy) == address(0))
            revert BiotaRWA__SinEstrategiaActiva();
        if (_yieldAmount == 0) revert BiotaRWA__MontoInvalido();

        investorYield[_investor] += _yieldAmount;

        // [EVM] Traemos los tokens del Oráculo/Backend hacia este contrato.
        IERC20(_token).safeTransferFrom(
            msg.sender,
            address(this),
            _yieldAmount
        );

        // [GAS] Aprobación condicional: solo ejecutamos el costoso SSTORE si la allowance es insuficiente.
        if (
            IERC20(_token).allowance(address(this), address(strategy)) <
            _yieldAmount
        ) {
            IERC20(_token).forceApprove(address(strategy), type(uint256).max);
        }

        // [AAVE] Depositamos en el adaptador DeFi. El adaptador llama a Aave.supply() por nosotros.
        strategy.deposit(_token, _yieldAmount, _investor);
        emit InvestmentRecorded(_investor, _productId, _token, _yieldAmount);
    }

    /**
     * @notice [DEFI] Retira el capital + intereses acumulados del inversor desde Aave V3.
     * @dev [SEGURIDAD] nonReentrant protege contra ataques de reentrancia.
     *      Patrón CEI (Check → Effect → Interact): primero actualizamos el estado, luego transferimos.
     */
    function withdrawYield(
        address _token,
        uint256 _amount
    ) external nonReentrant {
        IYieldStrategy strategy = yieldStrategies[_token];
        if (address(strategy) == address(0))
            revert BiotaRWA__SinEstrategiaActiva();

        // [DEFI] Consultamos el saldo REAL en Aave (principal + intereses). Siempre up-to-date.
        uint256 realBalance = strategy.getBalance(_token, msg.sender);
        if (realBalance == 0) revert BiotaRWA__SinCapitalEnEstrategia();

        // [SOLIDITY] Si el frontend manda type(uint256).max, interpretamos: "retirar todo".
        uint256 safeAmount = (_amount == type(uint256).max)
            ? realBalance
            : _amount;
        if (realBalance < safeAmount) revert BiotaRWA__SaldoInsuficiente();

        // 1. [EFFECT] Actualizamos el estado ANTES de interactuar con Aave (patrón CEI anti-reentrancia).
        uint256 internalPrincipal = investorYield[msg.sender];
        if (safeAmount >= internalPrincipal) {
            investorYield[msg.sender] = 0; // Retiró todo (incluido interés).
        } else {
            investorYield[msg.sender] -= safeAmount; // Retiro parcial.
        }

        // 2. [INTERACT] Ahora sí interactuamos con el protocolo externo (Aave).
        strategy.withdraw(_token, safeAmount, msg.sender);
    }

    // ==========================================
    // [REFI] CONFIGURACIÓN DE ESTRATEGIAS DEFI
    // ==========================================

    /**
     * @notice [ARQUITECTURA] Conecta o reemplaza la estrategia DeFi para un token específico.
     * @dev Clave para conectar BiotaRWA con AaveStrategy después del redeploy.
     *      Llamada: setYieldStrategy(cUSD_address, AaveStrategy_address)
     */
    function setYieldStrategy(
        address _token,
        address _newStrategy
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        address old = address(yieldStrategies[_token]);
        yieldStrategies[_token] = IYieldStrategy(_newStrategy);
        emit YieldStrategyUpdated(_token, old, _newStrategy);
    }

    // ==========================================
    // [LOGISTICA] CANJE DE CAFÉ FÍSICO
    // ==========================================

    /**
     * @notice [REFI] Actualiza dinámicamente la etapa del proceso del café en la blockchain.
     * @dev El Agente IA actualiza esto conforme el café avanza: Cosecha → Beneficio → Exportación.
     */
    function updateEtapaBiota(
        uint256 _productId,
        string calldata _nuevaEtapa
    ) external onlyRole(ORACLE_ROLE) {
        coffeeRegistry[_productId].etapaBiota = _nuevaEtapa;
        emit EtapaActualizada(_productId, _nuevaEtapa);
    }

    /**
     * @notice [LOGISTICA] El inversor quema 1 certificado para reclamar su café físico real.
     * @dev [REFI] Esto es el puente RWA: del token digital al producto tangible.
     */
    function claimPhysicalCoffee(uint256 _productId) external {
        if (balanceOf(msg.sender, _productId) < 1)
            revert BiotaRWA__NoTieneBalance();
        if (!coffeeRegistry[_productId].activoParaReclamo)
            revert BiotaRWA__NoDisponibleParaReclamo();
        _burn(msg.sender, _productId, 1);
        emit CafeReclamado(msg.sender, _productId);
    }

    // ==========================================
    // [BLOCKCHAIN] FUNCIONES INTERNAS
    // ==========================================

    /**
     * @dev [SEGURIDAD] Solo el DEFAULT_ADMIN_ROLE (MultiSig + TimeLock) puede actualizar
     *      la implementación del Proxy UUPS a una nueva versión.
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC1155Upgradeable, AccessControlDefaultAdminRulesUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
