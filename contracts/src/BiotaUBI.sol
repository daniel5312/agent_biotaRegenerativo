// SPDX-License-Identifier: MIT
pragma solidity 0.8.28; // [SOLIDITY] Bytecode optimizado al límite.

// [BLOCKCHAIN] Importaciones Superfluid + OpenZeppelin Upgradeable v5.x.
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {AccessControlDefaultAdminRulesUpgradeable} from "@openzeppelin/contracts-upgradeable/access/extensions/AccessControlDefaultAdminRulesUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import {SuperTokenV1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";
import {IBiotaPassport} from "./IBiotaPassport.sol";

// [BLOCKCHAIN] Interfaz para Anti-Sybil.
interface IIdentity {
    function getWhitelistedRoot(address account) external view returns (address);
}

/**
 * @title BiotaUBI - Bóveda de Recompensas de Impacto (Hard Fork V4)
 * @author Biota Protocol
 * @notice [REFI] Motor de streaming que gotea G$ a los productores basándose en su salud del suelo.
 * @dev [SUPERFLUID] Implementa flujos continuos (Constant Flow Agreement). Protegido con TimeLock de 3 días.
 */
contract BiotaUBI is 
    Initializable, 
    AccessControlDefaultAdminRulesUpgradeable, 
    UUPSUpgradeable 
{
    using SuperTokenV1Library for ISuperToken;

    // ==========================================
    // [EVM] VARIABLES DE ESTADO (Storage)
    // ==========================================
    IBiotaPassport public biotaPassport;
    IIdentity public identity;
    ISuperToken public gDollarToken;

    // [BLOCKCHAIN] Mapeo de estado de flujos activos.
    mapping(uint256 => bool) public isFlowActive;

    // ==========================================
    // [EVM] CUSTOM ERRORS
    // ==========================================
    error UBI__ImpactoNoVerificado(); // [REFI] El suelo no ha sido auditado.
    error UBI__NoEsHumano(); // [GOODDOLLAR] Falló la prueba anti-sybil.
    error UBI__FlujoYaActivo(); // [SOLIDITY] Evita duplicidad de streams.
    error UBI__FlujoNoActivo(); // [EVM] Error al intentar cerrar algo inexistente.

    // ==========================================
    // [SOLIDITY] EVENTOS
    // ==========================================
    event FlowStarted(uint256 indexed tokenId, address indexed producer, int96 flowRate);
    event FlowStopped(uint256 indexed tokenId, address indexed producer);

    // ==========================================
    // [EVM] INICIALIZACIÓN
    // ==========================================
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers(); // [SOLIDITY] Seguridad en implementación lógica.
    }

    /**
     * @notice [BLOCKCHAIN] Inicializa las dependencias del oráculo UBI (Seguridad Anti-Hackeo V4).
     */
    function initialize(
        address initialOwner,
        address _biotaPassport,
        address _gdIdentity,
        address _gDollarSuperToken
    ) public initializer {
        // [SEGURIDAD] Retraso de 3 días para aceptar la transferencia del rol de administrador
        __AccessControlDefaultAdminRules_init(3 days, initialOwner);

        biotaPassport = IBiotaPassport(_biotaPassport);
        identity = IIdentity(_gdIdentity);
        gDollarToken = ISuperToken(_gDollarSuperToken);
    }

    // ==========================================
    // [REFI] LÓGICA DE STREAMING (Superfluid)
    // ==========================================

    /**
     * @notice [REFI] Inicia un goteo continuo de G$.
     * @param tokenId ID del Pasaporte del Productor.
     * @param flowRate Cantidad en wei/seg (Ej: 38580246913580 = 100 G$ al mes).
     */
    function iniciarFlujoUBI(uint256 tokenId, int96 flowRate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (isFlowActive[tokenId]) revert UBI__FlujoYaActivo();

        address productor = biotaPassport.ownerOf(tokenId);

        // 1. [REFI] Verificación Ecológica: Validar auditoría de suelo con Tupla V4.
        (
            , // verificador
            , // areaM2
            , // cmSueloRecuperado
            bool esVerificado,
            , // isHumanVerified
            , // fechaRegistro
            , // ultimaActualizacion
            , // ubicacionGeografica
            , // estadoBiologico
            , // hashAnalisisLab
            , // ingredientesHash
              // metodosAgricolas
        ) = biotaPassport.lotePasaporte(tokenId);
        
        if (!esVerificado) revert UBI__ImpactoNoVerificado();

        // 2. [GOODDOLLAR] Verificación Anti-Sybil.
        if (identity.getWhitelistedRoot(productor) == address(0)) {
            revert UBI__NoEsHumano();
        }

        // 3. [SUPERFLUID] Crear el Stream (Fricción Cero).
        gDollarToken.flow(productor, flowRate);

        isFlowActive[tokenId] = true;
        emit FlowStarted(tokenId, productor, flowRate);
    }

    /**
     * @notice [BLOCKCHAIN] Detiene el flujo de liquidez.
     */
    function detenerFlujoUBI(uint256 tokenId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (!isFlowActive[tokenId]) revert UBI__FlujoNoActivo();

        address productor = biotaPassport.ownerOf(tokenId);

        // [SUPERFLUID] Cerrar stream (flowRate = 0).
        gDollarToken.flow(productor, 0);

        isFlowActive[tokenId] = false;
        emit FlowStopped(tokenId, productor);
    }

    /**
     * @notice [REFI] Recibe donaciones de GoodCollective.
     */
    function fundFromCollective(uint256 amountG) external {
        gDollarToken.transferFrom(msg.sender, address(this), amountG);
    }

    // ==========================================
    // [BLOCKCHAIN] SISTEMA DE ACTUALIZACIÓN
    // ==========================================

    /**
     * @dev [SOLIDITY] Hook de actualización UUPS. Restringido por TimeLock.
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
