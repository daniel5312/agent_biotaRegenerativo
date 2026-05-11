// SPDX-License-Identifier: MIT
pragma solidity 0.8.28; // [SOLIDITY] Versión fija para determinismo total y optimización de bytecode avanzada.

// [BLOCKCHAIN] Importaciones del ecosistema OpenZeppelin Upgradeable v5.x.
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {ERC721URIStorageUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title BiotaPassport - Pasaporte Biológico Dinámico (Upgradeable)
 * @author Biota Protocol
 * @notice [REFI] El alma del protocolo. Tokeniza la identidad y el impacto regenerativo del productor.
 * @dev [EVM] Implementa el patrón UUPS para permitir actualizaciones de lógica preservando los datos históricos.
 */
contract BiotaPassport is 
    Initializable, 
    ERC721Upgradeable, 
    ERC721URIStorageUpgradeable, 
    AccessControlUpgradeable, 
    UUPSUpgradeable 
{
    // [SOLIDITY] Definición de Roles (Control de Acceso Granular).
    bytes32 public constant VERIFICADOR_ROLE = keccak256("VERIFICADOR_ROLE");

    // [EVM] Variables de Estado (Storage).
    uint256 private _nextTokenId;

    // [CELO] Direcciones de infraestructura crítica (Inmutables por convención en esta versión).
    address public constant REFI_TREASURY = 0xd4AC6c14B4C96F7e66049210F56cb07468028d4e;
    address public constant MUJERES_CARMEN = 0x0d43131f1577310D6349bAF9D6Da4fC1Cd39764C;
    IERC20 public constant G_TOKEN = IERC20(0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A);

    // [REFI] Parámetros económicos de entrada al protocolo.
    uint256 public constant MINT_PRICE_CELO = 0.01 ether;
    uint256 public constant MINT_PRICE_G = 50 * 1e18;

    // ==========================================
    // [EVM] CUSTOM ERRORS (Gas-Friendly)
    // ==========================================
    error Biota__PagoInsuficiente(); // [CELO] Falla si el cUSD/G$ enviado es menor al fee.
    error Biota__NoEresElPropietario(); // [SOLIDITY] Error de seguridad en ownership.
    error Biota__NoEresVerificador(); // [BLOCKCHAIN] Error de privilegio de rol.
    error Biota__AreaInvalida(); // [REFI] Protección contra datos de lote nulos.
    error Biota__TransferenciaFallida(); // [EVM] Falla en low-level calls de fondos.

    // ==========================================
    // [EVM] STRUCT PACKING (Optimización Extrema)
    // ==========================================
    /**
     * @dev [REFI] Estructura que encapsula la salud del suelo.
     * [SOLIDITY] Empaquetado de variables para minimizar el uso de slots de 256 bits.
     */
    struct LoteData {
        // --- SLOT 1 (30 bytes usados) ---
        address verificador;     // 20 bytes: Quien dio el visto bueno técnico.
        bool esVerificado;       // 1 byte: Flag de auditoría terminada.
        bool isHumanVerified;    // 1 byte: [GOODDOLLAR] Resultado de prueba anti-sybil.
        uint32 areaM2;           // 4 bytes: Tamaño del lote (Máx 4k hectáreas).
        uint32 cmSueloRecuperado; // 4 bytes: Métrica principal de impacto.
        // --- SLOT 2 (16 bytes usados) ---
        uint64 fechaRegistro;    // 8 bytes: Timestamp inmutable de entrada.
        uint64 ultimaActualizacion; // 8 bytes: Auditoría temporal.
        // --- SLOTS DINÁMICOS (Storage Pointers) ---
        string ubicacionGeografica;
        string estadoBiologico;
        string hashAnalisisLab;
        string ingredientesHash;
        string metodosAgricolas;
    }

    // [BLOCKCHAIN] Mapeo de identidad NFT -> Datos de Impacto.
    mapping(uint256 => LoteData) public lotePasaporte;

    // ==========================================
    // [SOLIDITY] EVENTOS
    // ==========================================
    event PassportMinted(uint256 indexed tokenId, address indexed producer, string ubicacion, bool pagadoConCelo);
    event EvidenciaActualizada(uint256 indexed tokenId, uint32 nuevoCmSuelo, string nuevoEstado);
    event ImpactoVerificado(uint256 indexed tokenId, address indexed verificador);

    // ==========================================
    // [EVM] INICIALIZACIÓN (Pattern UUPS)
    // ==========================================
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers(); // [SOLIDITY] Bloquea el contrato base para evitar secuestro de la lógica.
    }

    /**
     * @notice [BLOCKCHAIN] Reemplaza al constructor en contratos Proxy.
     * @param initialOwner Dirección de la Multisig o Admin del protocolo.
     */
    function initialize(address initialOwner) public initializer {
        __ERC721_init("BiotaPassport", "BIO");
        __ERC721URIStorage_init();
        __AccessControl_init();

        // [BLOCKCHAIN] Configuración inicial de roles.
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(VERIFICADOR_ROLE, initialOwner);
    }

    // ==========================================
    // [REFI] LÓGICA DE NEGOCIO (Minting)
    // ==========================================

    /**
     * @notice [REFI] Crea un nuevo pasaporte biológico.
     * @dev [SOLIDITY] Usa 'calldata' para ahorrar gas al leer strings.
     */
    function mintPasaporte(
        string calldata _tokenURI,
        string calldata _ubicacionGeografica,
        uint32 _areaM2,
        uint32 _cmSueloRecuperado,
        string calldata _estadoBiologico,
        string calldata _hashAnalisisLab,
        string calldata _ingredientesHash,
        string calldata _metodosAgricolas
    ) external payable returns (uint256) {
        if (_areaM2 == 0) revert Biota__AreaInvalida();

        bool pagadoConCelo = false;

        // [CELO] Lógica de pagos atómicos para sostener el protocolo.
        if (msg.value > 0) {
            if (msg.value < MINT_PRICE_CELO) revert Biota__PagoInsuficiente();
            
            // [EVM] Reparto manual de CELO (Donación + Tesorería).
            uint256 paraMujeres = (msg.value * 10) / 100;
            uint256 paraTreasury = msg.value - paraMujeres;

            (bool s1, ) = REFI_TREASURY.call{value: paraTreasury}("");
            (bool s2, ) = MUJERES_CARMEN.call{value: paraMujeres}("");
            if (!s1 || !s2) revert Biota__TransferenciaFallida();
            pagadoConCelo = true;
        } else {
            // [BLOCKCHAIN] Pago alternativo con G$ (GoodDollar).
            uint256 paraMujeres = (MINT_PRICE_G * 10) / 100;
            uint256 paraTreasury = MINT_PRICE_G - paraMujeres;

            bool s1 = G_TOKEN.transferFrom(msg.sender, REFI_TREASURY, paraTreasury);
            bool s2 = G_TOKEN.transferFrom(msg.sender, MUJERES_CARMEN, paraMujeres);
            if (!s1 || !s2) revert Biota__PagoInsuficiente();
        }

        // [SOLIDITY] Generación de Identidad NFT.
        uint256 newId = _nextTokenId;
        
        // [EVM] Escritura eficiente en storage.
        lotePasaporte[newId] = LoteData({
            verificador: address(0),
            esVerificado: false,
            isHumanVerified: false,
            areaM2: _areaM2,
            cmSueloRecuperado: _cmSueloRecuperado,
            fechaRegistro: uint64(block.timestamp),
            ultimaActualizacion: uint64(block.timestamp),
            ubicacionGeografica: _ubicacionGeografica,
            estadoBiologico: _estadoBiologico,
            hashAnalisisLab: _hashAnalisisLab,
            ingredientesHash: _ingredientesHash,
            metodosAgricolas: _metodosAgricolas
        });

        _safeMint(msg.sender, newId);
        _setTokenURI(newId, _tokenURI);

        emit PassportMinted(newId, msg.sender, _ubicacionGeografica, pagadoConCelo);

        // [GAS-OPTIMIZATION] Unchecked increment (Ahorra ~20 gas por mint).
        unchecked { _nextTokenId++; }
        return newId;
    }

    /**
     * @notice [REFI] Permite al productor reportar avances sin necesidad de un verificador inmediato.
     */
    function actualizarEvidencia(
        uint256 tokenId,
        uint32 _nuevoCmSuelo,
        string calldata _nuevoEstado,
        string calldata _nuevoHashLab,
        string calldata _nuevosMetodos
    ) external {
        // [SOLIDITY] Verificación de Ownership manual para ahorrar gas de modificador.
        if (ownerOf(tokenId) != msg.sender) revert Biota__NoEresElPropietario();

        LoteData storage lote = lotePasaporte[tokenId];
        lote.cmSueloRecuperado = _nuevoCmSuelo;
        lote.estadoBiologico = _nuevoEstado;
        lote.hashAnalisisLab = _nuevoHashLab;
        lote.metodosAgricolas = _nuevosMetodos;
        lote.ultimaActualizacion = uint64(block.timestamp);
        lote.esVerificado = false; // [REFI] Al cambiar datos, requiere nueva auditoría.

        emit EvidenciaActualizada(tokenId, _nuevoCmSuelo, _nuevoEstado);
    }

    /**
     * @notice [BLOCKCHAIN] Los verificadores aprueban el impacto para habilitar flujos de UBI.
     */
    function validarImpacto(uint256 tokenId) external onlyRole(VERIFICADOR_ROLE) {
        lotePasaporte[tokenId].esVerificado = true;
        lotePasaporte[tokenId].verificador = msg.sender;
        emit ImpactoVerificado(tokenId, msg.sender);
    }

    /**
     * @notice [GOODDOLLAR] Enlaza la identidad humana verificada con el pasaporte biológico.
     */
    function setHumanVerification(uint256 tokenId, bool status) external onlyRole(VERIFICADOR_ROLE) {
        lotePasaporte[tokenId].isHumanVerified = status;
    }

    /**
     * @notice [BLOCKCHAIN] Permite destruir un pasaporte en caso de fraude o error grave.
     */
    function burnPassport(uint256 tokenId) external onlyRole(VERIFICADOR_ROLE) {
        _burn(tokenId);
        delete lotePasaporte[tokenId]; // [GAS-OPTIMIZATION] Libera storage y devuelve gas (Refund).
    }

    // ==========================================
    // [BLOCKCHAIN] SISTEMA DE ACTUALIZACIÓN
    // ==========================================

    /**
     * @dev [SOLIDITY] Hook obligatorio para autorizar mejoras del Proxy.
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    // [SOLIDITY] Overrides requeridos por Solidity para herencia múltiple de OZ.
    function tokenURI(uint256 tokenId) public view override(ERC721Upgradeable, ERC721URIStorageUpgradeable) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Upgradeable, ERC721URIStorageUpgradeable, AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // [SOLIDITY] Storage Gap: Reserva de 50 slots para que el equipo de Biota duerma tranquilo.
    // Esto previene colisiones al añadir nuevas métricas de impacto en la V2.
    uint256[50] private __gap;
}
