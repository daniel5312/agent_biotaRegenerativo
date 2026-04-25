// SPDX-License-Identifier: MIT
pragma solidity 0.8.28; // [SOLIDITY] Actualizado a la versión más reciente según requerimiento Core.

// [SOLIDITY] Importación del inicializador base requerido por proxies UUPS.
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IBiotaPassport} from "./IBiotaPassport.sol";

// [BLOCKCHAIN] Declaración principal del contrato inteligente BiotaScrow.
// [EVM] Utiliza herencia múltiple inicializable (patrón Proxy) para ahorrar gas de despliegue y permitir mejoras futuras.
contract BiotaScrow is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    
    // [SOLIDITY] [EVM] Uso de constante y pre-cálculo de keccak256 en tiempo de compilación. 
    // Esto ahorra gas en tiempo de ejecución al no calcular el hash dinámicamente cada vez.
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");

    // [BLOCKCHAIN] Identidad del contrato para visibilidad en exploradores y herramientas.
    string public constant NAME = "BiotaScrow: Doble Gatillo Regenerativo";
    string public constant VERSION = "1.0.0";

    // ==========================================
    // [EVM] CUSTOM ERRORS (Maña de Dev Canchero)
    // ==========================================
    // [SOLIDITY] Reemplazar 'require("String largo")' por Custom Errors ahorra aprox ~400 de gas por cada string no guardado en bytecode.
    error BiotaScrow__UnauthorizedOracle(address caller);  // [BLOCKCHAIN] Identifica billetera que intenta usurpar a la IA.
    error BiotaScrow__InvalidRegenerationData();           // [REFI] Falla si los datos biológicos o wallets vienen vacíos.
    error BiotaScrow__ActionAlreadyRegistered(uint256 id); // [BLOCKCHAIN] Previene doble validación y drenaje de fondos (Doble Gasto).
    error Biota__ProductorNoVerificado();           // [REFI] Revierta si el productor no cumple requisitos del pasaporte.

    // ==========================================
    // [EVM] STORAGE PACKING (Optimización Extrema)
    // ==========================================
    // [SOLIDITY] Estructura empacada magistralmente en exactamente 32 bytes (1 slot de storage).
    struct RegenerationValidation {
        address farmerWallet;    // [BLOCKCHAIN] 20 bytes: Dirección del agricultor en Celo Sepolia (11142220).
        uint64 validationTime;   // [EVM] 8 bytes: Timestamp (alcanza para milenios sin sufrir overflow tipo Year 2038).
        uint32 currentBioScore;  // [REFI] 4 bytes: Puntaje biológico o cm de suelo regenerado. (20+8+4 = 32 bytes 🎯).
    }

    // [SOLIDITY] Mapeo que asocia un identificador único (creado off-chain) con la estructura compactada.
    // [CELO] Almacena el historial on-chain de las regeneraciones en la red.
    mapping(uint256 => RegenerationValidation) public validations;

    // [CROSS-CONTRACT] Instancia del contrato de pasaporte para validaciones de flujo de fondos.
    IBiotaPassport public passport;

    // ==========================================
    // [SOLIDITY] EVENTOS
    // ==========================================
    // [CELO] Evento emitido para que el subgrafo o el backend lo escuche a muy bajo costo y libere el cUSD.
    event DoubleTriggerFired(uint256 indexed actionId, address indexed farmer, uint32 bioScore);

    // [SOLIDITY] Constructor bloqueado para evitar que el contrato de Implementación Lógica sea secuestrado.
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers(); // [EVM] Directriz crítica de seguridad en patrones Proxy UUPS.
    }

    // [SOLIDITY] Función de inicialización que reemplaza al constructor clásico.
    // [BLOCKCHAIN] Se ejecuta una única vez mediante el modifier 'initializer' de OZ.
    function initialize(address defaultAdmin, address agentOracle) public initializer {
        __AccessControl_init();   // [SOLIDITY] Prepara la memoria de storage para el control de acceso.
        // [SOLIDITY] En OZ v5.x, UUPSUpgradeable ya no requiere inicialización explícita.

        // [BLOCKCHAIN] Asigna el rol administrador por defecto, usualmente una Multisig.
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        // [CELO] Otorga el rol AGENT_ROLE a la wallet controlada por el Oráculo/IA de BiotaScrow.
        _grantRole(AGENT_ROLE, agentOracle);
    }

    /**
     * @notice [BLOCKCHAIN] Configura la dirección del contrato BiotaPassport.
     * @dev Restringido a administradores para evitar redirección maliciosa de validaciones.
     * @param _passport Dirección del contrato que implementa IBiotaPassport.
     */
    function setPassportContract(address _passport) external onlyRole(DEFAULT_ADMIN_ROLE) {
        passport = IBiotaPassport(_passport);
    }

    // ==========================================
    // [REFI] EL DOBLE GATILLO ON-CHAIN
    // ==========================================
    // [SOLIDITY] Al ser tipos de valor base (uint, address), el compilador los empuja al EVM stack directamente (más barato que memory).
    // Si tuviéramos un array/string, usaríamos 'calldata' estricto por convención Senior.
    function executeDoubleTrigger(
        uint256 actionId,     // [BLOCKCHAIN] ID único asociado a la acción agronómica.
        address farmerTarget, // [CELO] Destinatario que recibirá la Renta Básica (UBI).
        uint256 tokenId,      // [REFI] ID del pasaporte para validación cross-contract.
        uint32 fieldBioScore  // [REFI] Métrica dictaminada por el Agente de IA.
    ) external {
        // [EVM] Verificación de rol usando operaciones bit a bit internas de OZ.
        // Si no es un oráculo autorizado, ejecutamos el Custom Error (Más gas friendly que un require).
        if (!hasRole(AGENT_ROLE, msg.sender)) {
            revert BiotaScrow__UnauthorizedOracle(msg.sender); // [SOLIDITY]
        }
        
        // [REFI] Verificación de cordura. La vida no existe en address(0) y el bioScore no puede ser 0.
        if (farmerTarget == address(0) || fieldBioScore == 0) {
            revert BiotaScrow__InvalidRegenerationData(); // [SOLIDITY]
        }
        
        // [BLOCKCHAIN] Comprueba que ese ID de acción esté limpio en el storage.
        if (validations[actionId].farmerWallet != address(0)) {
            revert BiotaScrow__ActionAlreadyRegistered(actionId); // [SOLIDITY]
        }

        // ==========================================
        // [CROSS-CONTRACT] VALIDACIÓN DE PASAPORTE
        // ==========================================
        // [REFI] Garantiza que el flujo de fondos solo llegue a productores con identidad verificada.
        if (address(passport) != address(0)) {
            // 1. Validar que posea al menos un pasaporte.
            if (passport.balanceOf(farmerTarget) == 0) {
                revert Biota__ProductorNoVerificado();
            }

            // 2. Validar flags de confianza del token específico.
            (, bool esVerificado, bool isHumanVerified, , , , , , , , , ) = passport.lotePasaporte(tokenId);
            
            if (!esVerificado || !isHumanVerified) {
                revert Biota__ProductorNoVerificado(); // [GAS-OPTIMIZATION] Uso de Custom Error.
            }
        }

        // [EVM] Escritura en Storage (SSTORE). Como llenamos todo el slot de 32 bytes de una pasada,
        // el compilador optimiza esto a una sola operación de escritura en caliente, salvando gas vital.
        validations[actionId] = RegenerationValidation({
            farmerWallet: farmerTarget,              // [CELO] Wallet asociada.
            validationTime: uint64(block.timestamp), // [EVM] Casteo necesario para encajar en los 8 bytes.
            currentBioScore: fieldBioScore           // [REFI] Nuevo puntaje a certificar.
        });

        // [BLOCKCHAIN] Detonación del evento on-chain. El gatillo ha sido jalado.
        emit DoubleTriggerFired(actionId, farmerTarget, fieldBioScore); // [SOLIDITY]
    }

    // ==========================================
    // [BLOCKCHAIN] SISTEMA DE ACTUALIZACIÓN
    // ==========================================
    // [SOLIDITY] Hook interno de OZ requerido para autorizar que el Proxy apunte a una nueva lógica (V2).
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {
        // [EVM] Solo el DEFAULT_ADMIN_ROLE puede firmar una actualización. El oráculo IA no tiene este poder.
    }
}
