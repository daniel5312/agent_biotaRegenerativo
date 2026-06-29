// SPDX-License-Identifier: MIT
pragma solidity 0.8.28; // [SOLIDITY] Optimización máxima de bytecode.

// [BLOCKCHAIN] Importaciones del ecosistema OpenZeppelin Upgradeable v5.x.
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {AccessControlDefaultAdminRulesUpgradeable} from "@openzeppelin/contracts-upgradeable/access/extensions/AccessControlDefaultAdminRulesUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title BiotaSplitter V4 - Motor de Impacto Regenerativo (Hard Fork)
 * @author Biota Protocol
 * @notice [REFI] Router financiero que automatiza el reparto de dividendos sociales y ecológicos.
 * @dev [EVM] Patrón UUPS con AccessControlDefaultAdminRules (TimeLock). Cero deuda técnica.
 */
contract BiotaSplitter is 
    Initializable, 
    AccessControlDefaultAdminRulesUpgradeable, 
    UUPSUpgradeable 
{
    // [EVM] Definición de Roles (Se evalúan en bytecode, sin gastar storage).
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    // [SOLIDITY] Custom Errors para ahorro de gas extremo.
    error BiotaSplitter__MontoInsuficiente(); // [REFI] Menor a 100 unidades mínimas.
    error BiotaSplitter__DireccionInvalida(); // [BLOCKCHAIN] Previene envío a address(0).
    error BiotaSplitter__TransferenciaFallida(); // [EVM] Error en ejecución ERC20.

    // ==========================================
    // [SOLIDITY] EVENTOS
    // ==========================================
    event PaymentSplit(
        address indexed payer,
        address indexed token,
        uint256 amount,
        address merchant,
        address collective,
        address pool
    );

    // ==========================================
    // [EVM] INICIALIZACIÓN
    // ==========================================
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers(); // [SOLIDITY] Bloquea la implementación para que no sea secuestrada.
    }

    /**
     * @notice [BLOCKCHAIN] Inicialización del router con seguridad MultiSig V4.
     */
    function initialize(address initialOwner) public initializer {
        // [SEGURIDAD] Retraso de 3 días para aceptar transferencia de rol de Administrador.
        __AccessControlDefaultAdminRules_init(3 days, initialOwner);

        _grantRole(MANAGER_ROLE, initialOwner);
    }

    // ==========================================
    // [REFI] FUNCIONES DE NEGOCIO (Atomic Split)
    // ==========================================

    /**
     * @notice [REFI] Ejecuta un pago atómico y reparte dividendos de impacto.
     * @dev [SOLIDITY] Uso de variables en memoria (stack) para optimizar SLOADs.
     */
    function payWithSplit(
        address token,
        uint256 amount,
        address merchant,
        address collective,
        address pool
    ) external {
        // [BLOCKCHAIN] Verificaciones de cordura inicial.
        if (amount < 100) revert BiotaSplitter__MontoInsuficiente();
        if (merchant == address(0) || collective == address(0) || pool == address(0)) {
            revert BiotaSplitter__DireccionInvalida();
        }

        IERC20 erc20 = IERC20(token);

        // [MATH] Cálculo de porcentajes (96% - 2% - 2%).
        // [SOLIDITY] Variables locales en stack (Ahorra SLOADs).
        uint256 collectivePart = (amount * 2) / 100;
        uint256 poolPart = (amount * 2) / 100;
        uint256 merchantPart = amount - collectivePart - poolPart; // Resta segura para evitar perder wei sobrantes.

        // [INTERACTION] Transferencia Usuario -> Splitter (Requiere Approve previo).
        if (!erc20.transferFrom(msg.sender, address(this), amount)) {
            revert BiotaSplitter__TransferenciaFallida();
        }

        // [EFFECT] Dispersión atómica de fondos.
        // [CELO] Estas transferencias son altamente eficientes en la red.
        if (!erc20.transfer(merchant, merchantPart)) revert BiotaSplitter__TransferenciaFallida();
        if (!erc20.transfer(collective, collectivePart)) revert BiotaSplitter__TransferenciaFallida();
        if (!erc20.transfer(pool, poolPart)) revert BiotaSplitter__TransferenciaFallida();

        emit PaymentSplit(msg.sender, token, amount, merchant, collective, pool);
    }

    // ==========================================
    // [BLOCKCHAIN] SEGURIDAD Y MANTENIMIENTO
    // ==========================================

    /**
     * @notice [BLOCKCHAIN] Rescata fondos atrapados por error o airdrops equivocados.
     * @dev [SEGURIDAD] Solo el DEFAULT_ADMIN_ROLE (MultiSig + TimeLock) puede ejecutar esto.
     */
    function rescueTokens(address token, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (!IERC20(token).transfer(msg.sender, amount)) {
            revert BiotaSplitter__TransferenciaFallida();
        }
    }

    /**
     * @dev [SOLIDITY] Hook de actualización UUPS. Protegido por TimeLock.
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
