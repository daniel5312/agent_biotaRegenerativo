// SPDX-License-Identifier: MIT
pragma solidity 0.8.28; // [SOLIDITY] Actualizado a la versión más reciente según requerimiento Core.

// [BLOCKCHAIN] Importaciones del ecosistema OpenZeppelin Upgradeable v5.x.
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {AccessControlDefaultAdminRulesUpgradeable} from "@openzeppelin/contracts-upgradeable/access/extensions/AccessControlDefaultAdminRulesUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IBiotaPassport} from "./IBiotaPassport.sol";

// [GOODDOLLAR] Interfaz genérica para interactuar con los Pools de GoodCollective en Celo Mainnet.
interface IGoodCollectivePool {
    function distributeReward(address _recipient) external;
}

/**
 * @title BiotaScrow - Doble Gatillo Regenerativo (Hard Fork V4)
 * @author Biota Protocol
 * @notice [REFI] Certifica las acciones biológicas y detona los pagos en GoodDollar.
 * @dev [EVM] UUPS blindado con AccessControlDefaultAdminRules (TimeLock).
 */
contract BiotaScrow is
    Initializable,
    AccessControlDefaultAdminRulesUpgradeable,
    UUPSUpgradeable
{
    // ==========================================
    // [EVM] CONSTANTES Y ROLES
    // ==========================================
    // [SOLIDITY] Uso de constante y pre-cálculo de keccak256 en tiempo de compilación para ahorrar gas.
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");

    string public constant NAME = "BiotaScrow: Doble Gatillo Regenerativo";
    string public constant VERSION = "4.0.0"; // V4 Hard Fork

    // ==========================================
    // [EVM] CUSTOM ERRORS (Gas Optimization)
    // ==========================================
    error BiotaScrow__UnauthorizedOracle(address caller); 
    error BiotaScrow__InvalidRegenerationData(); 
    error BiotaScrow__ActionAlreadyRegistered(uint256 id); 
    error Biota__ProductorNoVerificado(); 

    // ==========================================
    // [EVM] STORAGE PACKING
    // ==========================================
    // [SOLIDITY] Estructura empacada magistralmente en exactamente 32 bytes (1 slot de storage).
    struct RegenerationValidation {
        address farmerWallet;    // 20 bytes: Dirección del agricultor.
        uint64 validationTime;   // 8 bytes: Timestamp.
        uint32 currentBioScore;  // 4 bytes: Puntaje biológico o cm de suelo regenerado.
        // 20 + 8 + 4 = 32 bytes 🎯
    }

    // [CELO] Almacena el historial on-chain de las regeneraciones en la red.
    mapping(uint256 => RegenerationValidation) public validations;

    // [CROSS-CONTRACT] Instancia del contrato de pasaporte (Identidad).
    IBiotaPassport public passport;

    // [GOODDOLLAR] Dirección del Pool de GoodCollective en Celo Mainnet.
    address public goodCollectivePoolAddress;

    // ==========================================
    // [SOLIDITY] EVENTOS
    // ==========================================
    event DoubleTriggerFired(
        uint256 indexed actionId,
        address indexed farmer,
        uint32 bioScore
    );

    // ==========================================
    // [EVM] INICIALIZACIÓN
    // ==========================================
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers(); 
    }

    /**
     * @notice [BLOCKCHAIN] Inicializa el Scrow con seguridad 2-Step.
     * @param defaultAdmin MultiSig que controlará el protocolo.
     * @param agentOracle Billetera controlada por la IA para detonar los gatillos.
     */
    function initialize(
        address defaultAdmin,
        address agentOracle
    ) public initializer {
        // [SEGURIDAD] Retraso de 3 días para aceptar transferencia de rol (Anti-Hackeo).
        __AccessControlDefaultAdminRules_init(3 days, defaultAdmin);

        _grantRole(AGENT_ROLE, agentOracle);
    }

    // ==========================================
    // [REFI] SETTERS ADMINISTRATIVOS
    // ==========================================
    
    function setPassportContract(
        address _passport
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        passport = IBiotaPassport(_passport);
    }

    function setGoodCollectivePool(
        address _poolAddress
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        goodCollectivePoolAddress = _poolAddress;
    }

    // ==========================================
    // [REFI] EL DOBLE GATILLO ON-CHAIN
    // ==========================================
    
    /**
     * @notice [REFI] Certifica la regeneración y ejecuta el pago de UBI.
     * @dev Restringido a AGENT_ROLE. Revisa la validez de identidad en BiotaPassport.
     */
    function executeDoubleTrigger(
        uint256 actionId,
        address farmerTarget, 
        uint256 tokenId, 
        uint32 fieldBioScore 
    ) external {
        if (!hasRole(AGENT_ROLE, msg.sender)) {
            revert BiotaScrow__UnauthorizedOracle(msg.sender); 
        }

        if (farmerTarget == address(0) || fieldBioScore == 0) {
            revert BiotaScrow__InvalidRegenerationData(); 
        }

        if (validations[actionId].farmerWallet != address(0)) {
            revert BiotaScrow__ActionAlreadyRegistered(actionId); 
        }

        // ==========================================
        // [FIX M-02] VALIDACIÓN DE PASAPORTE — OBLIGATORIA, NO OPCIONAL
        // ==========================================
        // [SEGURIDAD] El Passport DEBE estar configurado. Si el Admin no llamó
        // setPassportContract(), el Oráculo no puede certificar nada. Esto impide que
        // se certifiquen wallets sin identidad real en modo "pre-configuración".
        if (address(passport) == address(0)) {
            revert BiotaScrow__InvalidRegenerationData();
        }

        if (passport.balanceOf(farmerTarget) == 0) {
            revert Biota__ProductorNoVerificado();
        }

        // [EVM] Obtenemos solo los booleanos de seguridad del Passport V4 (esVerificado, isHumanVerified)
        (
            , // verificador
            , // areaM2
            , // cmSueloRecuperado
            bool esVerificado,
            bool isHumanVerified,
            , // fechaRegistro
            , // ultimaActualizacion
            , // ubicacionGeografica
            , // estadoBiologico
            , // hashAnalisisLab
            , // ingredientesHash
              // metodosAgricolas
        ) = passport.lotePasaporte(tokenId);

        if (!esVerificado || !isHumanVerified) {
            revert Biota__ProductorNoVerificado();
        }


        // [EVM] Escritura en Storage (SSTORE optimizado en 1 bloque de 32 bytes).
        validations[actionId] = RegenerationValidation({
            farmerWallet: farmerTarget, 
            validationTime: uint64(block.timestamp), 
            currentBioScore: fieldBioScore 
        });

        // [BLOCKCHAIN] El gatillo ha sido jalado.
        emit DoubleTriggerFired(actionId, farmerTarget, fieldBioScore); 

        // [GOODDOLLAR] Disparamos la liberación de G$.
        if (goodCollectivePoolAddress != address(0)) {
            try IGoodCollectivePool(goodCollectivePoolAddress).distributeReward(farmerTarget) {} catch {}
        }
    }

    // ==========================================
    // [BLOCKCHAIN] SISTEMA DE ACTUALIZACIÓN
    // ==========================================
    
    // [SEGURIDAD] Solo la MultiSig puede firmar una actualización de contrato.
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
