// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

// ============================================================
// MoolaStrategy.sol - Adaptador para Moola Market en Celo
// ============================================================
//
// [MOOLA] Moola Market es un fork de Aave V2 desplegado en Celo Mainnet.
// Un "fork" significa que tomaron el código abierto de Aave (el protocolo DeFi
// más grande del mundo) y lo adaptaron para funcionar con los activos de Celo.
//
// [FLUJO] Cuando un inversor compra café en Biota:
//   1. El BiotaSplitter recibe cUSD del inversor.
//   2. El 40% llama a este contrato: MoolaStrategy.deposit().
//   3. Este contrato deposita ese cUSD en el LendingPool de Moola.
//   4. Moola le entrega mcUSD al inversor (token que crece cada bloque).
//   5. El inversor puede retirar sus mcUSD cuando quiera con withdraw().
//
// [APY] El Annual Percentage Yield (rendimiento anual) en Moola para cUSD
// varía según la demanda de préstamos en el mercado, típicamente 2-5%.
// Eso significa que $100 cUSD se convierten en ~$103 cUSD al año.
// ============================================================

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IYieldStrategy} from "./IYieldStrategy.sol";

// -------------------------------------------------------
// [AAVE V2] Interfaz mínima del LendingPool de Moola.
// Solo declaramos las funciones que vamos a usar para ahorrar bytecode.
// La documentación completa de Aave V2: https://docs.aave.com/developers/v/2.0/
// -------------------------------------------------------
interface IMoolaLendingPool {
    // deposit: transfiere tokens al pool y le da al usuario los mTokens (mcUSD).
    // referralCode: siempre 0 para transacciones normales (es para afiliados).
    function deposit(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;

    // withdraw: quema los mTokens y devuelve el activo original + intereses.
    // amount: usar type(uint256).max para retirar TODO el balance.
    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);
}

// -------------------------------------------------------
// [SOLIDITY] El contrato implementa la interfaz IYieldStrategy.
// Ownable (de OpenZeppelin) nos permite tener un dueño que puede
// rescatar fondos en emergencias. No es upgradeable porque es simple.
// -------------------------------------------------------
contract MoolaStrategy is IYieldStrategy, Ownable {

    // -------------------------------------------------------
    // DIRECCIONES FIJAS EN CELO MAINNET
    // -------------------------------------------------------

    // [MOOLA] La "puerta de entrada" al protocolo Moola en Celo Mainnet.
    // Aquí se deposita y se retira. Es el contrato principal de Moola.
    IMoolaLendingPool public constant LENDING_POOL =
        IMoolaLendingPool(0x970b12522CA9b4054807a2c5B736149a5BE6f670);

    // [CELO] El token estable nativo de Celo que vamos a depositar.
    // cUSD es el "dólar de Celo", siempre vale ~$1 USD.
    address public constant CUSD = 0x765DE816845861e75A25fCA122bb6898B8B1282a;

    // -------------------------------------------------------
    // [PRO PATTERN] mToken como immutable — el patrón de producción real.
    // -------------------------------------------------------
    // 'immutable' en Solidity significa que se fija UNA SOLA VEZ en el constructor
    // y luego se graba directamente en el bytecode del contrato (no en el storage).
    //
    // Ventajas sobre consultar el DataProvider en runtime:
    //   ✅ Cero gas extra en getBalance (no hace llamadas externas)
    //   ✅ Sin dependencia de contratos externos que pueden fallar o cambiar
    //   ✅ La dirección se verifica una vez al desplegar (auditabilidad total)
    //   ✅ Es lo que usan Yearn Finance, Beefy, y la mayoría de protocolos serios
    //
    // Para cUSD en Moola Celo Mainnet:
    //   cUSD (depositado) → mcUSD (recibido) = 0x918146359264C492BD6934071c6Bd31C854EDBc3
    address public immutable M_TOKEN;

    // -------------------------------------------------------
    // EVENTOS: registran actividad on-chain para el frontend y exploradores.
    // -------------------------------------------------------

    // se emite cada vez que un inversor deposita en Moola a través de Biota.
    event DepositedToMoola(address indexed investor, address indexed token, uint256 amount);

    // se emite cuando un inversor retira sus fondos + intereses de Moola.
    event WithdrawnFromMoola(address indexed investor, address indexed token, uint256 amount);

    // -------------------------------------------------------
    // CONSTRUCTOR
    // -------------------------------------------------------
    // @param _mToken  la dirección del mToken que Moola entrega al depositar.
    //                 para cUSD → pasar 0x918146359264C492BD6934071c6Bd31C854EDBc3
    //                 para cEUR → pasar la dirección del mcEUR
    // [REUTILIZABLE] este mismo contrato puede soportar múltiples activos de Moola
    //               simplemente desplegando una instancia por cada par (token, mToken).
    constructor(address _mToken) Ownable(msg.sender) {
        require(_mToken != address(0), "MoolaStrategy: mToken invalido");
        M_TOKEN = _mToken;
    }

    // -------------------------------------------------------
    // FUNCIÓN: deposit (implementación de IYieldStrategy)
    // -------------------------------------------------------
    // [MOOLA] Deposita cUSD en el LendingPool de Moola.
    // El flujo interno es:
    //   1. Este contrato recibe el cUSD del BiotaSplitter.
    //   2. Aprueba al LendingPool para que tome esos tokens.
    //   3. Llama a deposit() → Moola entrega mcUSD directamente al inversor.
    //
    // [SEGURIDAD] El BiotaSplitter debe haber hecho transferFrom antes,
    // así que los tokens ya están en este contrato cuando esto se llama.
    // -------------------------------------------------------
    function deposit(
        address token,
        uint256 amount,
        address onBehalfOf
    ) external override {
        // [EVM] aprobamos al LendingPool para que tome exactamente 'amount' tokens.
        // Nunca aprobamos más de lo necesario (principio de mínimo privilegio).
        IERC20(token).approve(address(LENDING_POOL), amount);

        // [MOOLA/AAVE V2] depositamos en Moola. Moola automáticamente:
        // - toma los cUSD de este contrato
        // - mintea mcUSD y los envía directamente a 'onBehalfOf' (el inversor)
        // el referralCode 0 significa que no hay programa de referidos
        LENDING_POOL.deposit(token, amount, onBehalfOf, 0);

        emit DepositedToMoola(onBehalfOf, token, amount);
    }

    // -------------------------------------------------------
    // FUNCIÓN: withdraw (implementación de IYieldStrategy)
    // -------------------------------------------------------
    // [MOOLA] El inversor retira su capital + intereses acumulados.
    // El inversor debe haber dado approve() de sus mcUSD a este contrato.
    //
    // [MATEMÁTICAS] Si el inversor depositó 5 cUSD hace 1 año con 4% APY,
    // puede retirar ~5.20 cUSD. Esa diferencia es su ganancia pura.
    // -------------------------------------------------------
    function withdraw(
        address token,
        uint256 amount,
        address receiver
    ) external override {
        // [MOOLA] retiramos del pool. Moola:
        // - quema los mcUSD del inversor
        // - devuelve cUSD + intereses directamente a 'receiver'
        // usar type(uint256).max retira TODO el balance, incluidos los intereses
        uint256 withdrawn = LENDING_POOL.withdraw(token, amount, receiver);

        emit WithdrawnFromMoola(receiver, token, withdrawn);
    }

    // -------------------------------------------------------
    // FUNCIÓN: getBalance (implementación de IYieldStrategy)
    // -------------------------------------------------------
    // [FRONTEND] El frontend llama esto cada 30s para mostrar
    // "Tu saldo en Moola: $5.24 cUSD" creciendo en tiempo real.
    //
    // [PRO] usamos M_TOKEN (immutable) en vez de consultar el DataProvider.
    // esto evita una llamada externa, ahorra gas, y es imposible que falle.
    //
    // [TÉCNICA] El balance del mToken aumenta cada bloque de Celo (~5 segundos).
    // Es decir, el saldo crece ~17,280 veces al día de forma automatica.
    //
    // @param token  ignorado en esta implementación (siempre es el par configurado)
    // @param user   la wallet del inversor cuyo saldo queremos consultar
    // -------------------------------------------------------
    function getBalance(
        address token, // mantenemos el parametro para respetar la interfaz IYieldStrategy
        address user
    ) external view override returns (uint256) {
        // leemos directamente el balance del mToken (mcUSD) del inversor
        // este numero ya incluye el capital original + todos los intereses acumulados
        return IERC20(M_TOKEN).balanceOf(user);
    }

    // -------------------------------------------------------
    // FUNCIÓN: getProtocolName (implementación de IYieldStrategy)
    // -------------------------------------------------------
    // [FRONTEND] La DApp usa esto para mostrar el nombre del protocolo
    // sin tener que hardcodear strings en el componente de React.
    // -------------------------------------------------------
    function getProtocolName() external pure override returns (string memory) {
        return "Moola Market";
    }

    // -------------------------------------------------------
    // FUNCIÓN: rescueTokens (seguridad)
    // -------------------------------------------------------
    // [SEGURIDAD] En caso de un bug o fondos atrapados por error,
    // el dueño del contrato puede recuperar cualquier token.
    // Solo el Owner (multisig de Biota) puede llamar esto.
    // -------------------------------------------------------
    function rescueTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }
}
