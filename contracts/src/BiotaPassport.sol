// SPDX-License-Identifier: MIT
pragma solidity 0.8.28; // [SOLIDITY] Versión fija para determinismo y optimización de bytecode.

// [BLOCKCHAIN] Importaciones del ecosistema OpenZeppelin Upgradeable v5.x.
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {ERC721URIStorageUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IEngagementRewards {
    function appClaim(address user) external;
}

/**
 * @title BiotaPassport - Pasaporte Biológico Dinámico (Upgradeable V3 - Router Inteligente)
 * @author Biota Protocol
 * @notice [REFI] El alma del protocolo. Tokeniza la identidad y el impacto regenerativo del productor.
 * @dev [EVM] Implementa el patrón UUPS preservando el Storage Layout histórico.
 */
contract BiotaPassport is 
    Initializable, 
    ERC721Upgradeable, 
    ERC721URIStorageUpgradeable, 
    AccessControlUpgradeable, 
    UUPSUpgradeable 
{
    // ==========================================
    // [V1/V2] STORAGE LAYOUT ORIGINAL (INTOCABLE)
    // No mover, no borrar, no reordenar.
    // ==========================================
    
    // [SOLIDITY] Control de Acceso Granular. (No ocupa slot, es bytecode)
    bytes32 public constant VERIFICADOR_ROLE = keccak256("VERIFICADOR_ROLE");

    // [EVM] Slot 0 (después de herencias de OZ): ID del próximo token a mintear.
    uint256 private _nextTokenId;

    // [CELO] Token GoodDollar en Celo (Inmutable, el ERC20 G$ nunca cambia).
    IERC20 public constant G_TOKEN = IERC20(0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A);

    // ==========================================
    // [EVM] CUSTOM ERRORS (Gas-Friendly)
    // ==========================================
    error Biota__PagoInsuficiente(); // [CELO/GOODDOLLAR] Falla si el pago enviado es menor a las variables dinámicas de fee.
    error Biota__NoEresElPropietario(); // [SOLIDITY] Error de seguridad en ownership.
    error Biota__NoEresVerificador(); // [BLOCKCHAIN] Error de privilegio de rol.
    error Biota__AreaInvalida(); // [REFI] Protección contra datos de lote nulos.
    error Biota__TransferenciaFallida(); // [EVM] Falla en low-level calls de fondos nativos (CELO).

    // ==========================================
    // [EVM] STRUCT PACKING (Optimización Extrema)
    // ==========================================
    struct LoteData {
        address verificador;     
        bool esVerificado;       
        bool isHumanVerified;    
        uint32 areaM2;           
        uint32 cmSueloRecuperado; 
        uint64 fechaRegistro;    
        uint64 ultimaActualizacion; 
        string ubicacionGeografica;
        string estadoBiologico;
        string hashAnalisisLab;
        string ingredientesHash;
        string metodosAgricolas;
    }

    // [BLOCKCHAIN] Mapeo de identidad NFT -> Datos de Impacto (Storage V1).
    // Slot 1
    mapping(uint256 => LoteData) public lotePasaporte;

    // ==========================================
    // [V3] NUEVO STORAGE LAYOUT (ROUTER INTELIGENTE)
    // Agregamos las variables aquí abajo para no colisionar con _nextTokenId y lotePasaporte.
    // ==========================================
    
    // [REFI] Direcciones dinámicas para pagos en G$ (Antiguas constantes de V1/V2).
    address public refiTreasury;      // Slot 2
    address public mujeresCarmen;     // Slot 3

    // [CELO] Direcciones dinámicas para pagos nativos (Router Inteligente V3).
    address public poolLoginWallet;      // Slot 4: 0x9158... (Fondo Privy / Google Gas)
    address public biotaProductoresPool; // Slot 5: 0x9bc4... (Administración/Sostenibilidad)

    // [ECONOMÍA] Precios de entrada dinámicos.
    uint256 public mintPriceCelo; // Slot 6 (Ej: 0.01 ether = 10000000000000000)
    uint256 public mintPriceG;    // Slot 7 (¡OJO! 2 Decimales. 10 = 0.10 G$)

    // ==========================================
    // [SOLIDITY] EVENTOS
    // ==========================================
    event PassportMinted(uint256 indexed tokenId, address indexed producer, string ubicacion, bool pagadoConCelo);
    event EvidenciaActualizada(uint256 indexed tokenId, uint32 nuevoCmSuelo, string nuevoEstado);
    event ImpactoVerificado(uint256 indexed tokenId, address indexed verificador);
    event ParametrosEconomicosActualizados(uint256 nuevoPrecioCelo, uint256 nuevoPrecioG);
    event RutasDePagoActualizadas(address refi, address mujeres, address login, address productores);

    // ==========================================
    // [EVM] INICIALIZACIÓN (Pattern UUPS)
    // ==========================================
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers(); 
    }

    function initialize(address initialOwner) public initializer {
        __ERC721_init("BiotaPassport", "BIO");
        __ERC721URIStorage_init();
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(VERIFICADOR_ROLE, initialOwner);
    }
    
    // ==========================================
    // [V3] FUNCIONES DE CONFIGURACIÓN DINÁMICA (SETTERS)
    // ==========================================
    
    /**
     * @notice [ECONOMÍA] Modifica los precios de entrada en tiempo real (Protegido por ADMIN).
     * @param _nuevoPrecioCelo Precio nativo en wei (ej. 0.01 ether).
     * @param _nuevoPrecioG Precio en GoodDollars (Corrección V3: 2 decimales en Celo. Pasar '10' para cobrar 0.10 G$).
     */
    function setMintPrices(uint256 _nuevoPrecioCelo, uint256 _nuevoPrecioG) external onlyRole(DEFAULT_ADMIN_ROLE) {
        mintPriceCelo = _nuevoPrecioCelo;
        mintPriceG = _nuevoPrecioG;
        emit ParametrosEconomicosActualizados(_nuevoPrecioCelo, _nuevoPrecioG);
    }
    
    /**
     * @notice [REFI] Configura las rutas del Router Inteligente para la distribución de fondos sin hacer upgrade.
     */
    function setTreasuryAddresses(
        address _refiTreasury, 
        address _mujeresCarmen, 
        address _poolLoginWallet, 
        address _biotaProductoresPool
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        refiTreasury = _refiTreasury;
        mujeresCarmen = _mujeresCarmen;
        poolLoginWallet = _poolLoginWallet;
        biotaProductoresPool = _biotaProductoresPool;
        emit RutasDePagoActualizadas(_refiTreasury, _mujeresCarmen, _poolLoginWallet, _biotaProductoresPool);
    }

    // ==========================================
    // [REFI] LÓGICA DE NEGOCIO (Minting)
    // ==========================================

    /**
     * @notice [REFI] Crea un nuevo pasaporte biológico aplicando Router Inteligente V3.
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

        // [CELO] V3 Router Inteligente: Ruta Nativa
        if (msg.value > 0) {
            if (msg.value < mintPriceCelo) revert Biota__PagoInsuficiente();
            
            // [EVM] División matemática exacta: 5% Fondo Login, 95% Fondo Productores.
            uint256 paraLoginGas = (msg.value * 5) / 100;
            uint256 paraProductores = msg.value - paraLoginGas; // Resta segura que evita perder 'wei' por redondeo.

            // [CELO] Uso de low-level calls. Evita rebotar transacciones si la wallet destino es una MultiSig.
            (bool s1, ) = poolLoginWallet.call{value: paraLoginGas}("");
            (bool s2, ) = biotaProductoresPool.call{value: paraProductores}("");
            if (!s1 || !s2) revert Biota__TransferenciaFallida();
            
            pagadoConCelo = true;
        } else {
            // [GOODDOLLAR] V3 Router Inteligente: Ruta ERC-20
            // [MATEMÁTICA] La variable mintPriceG ya asume el uso de 2 decimales.
            uint256 paraMujeres = (mintPriceG * 10) / 100; // Ej: (10 * 10) / 100 = 1 G$ (entero)
            uint256 paraTreasury = mintPriceG - paraMujeres; // Ej: 10 - 1 = 9 G$ (entero)

            // [EVM] Transferencias limpias de tokens ERC-20
            bool s1 = G_TOKEN.transferFrom(msg.sender, refiTreasury, paraTreasury);
            bool s2 = G_TOKEN.transferFrom(msg.sender, mujeresCarmen, paraMujeres);
            if (!s1 || !s2) revert Biota__PagoInsuficiente();
        }

        // [GOODDOLLAR] Recompensas de Protocolo (EngagementRewards)
        // Envuelto en try/catch para no bloquear el minteo si la dApp no está aprobada o el usuario no está verificado facialmente.
        try IEngagementRewards(0x25db74CF4E7BA120526fd87e159CF656d94bAE43).appClaim(msg.sender) {} catch {}

        // [SOLIDITY] Generación de Identidad NFT.
        uint256 newId = _nextTokenId;
        
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

        // [GAS-OPTIMIZATION] Unchecked increment para ahorrar gas.
        unchecked { _nextTokenId++; }
        return newId;
    }

    function actualizarEvidencia(
        uint256 tokenId, uint32 _nuevoCmSuelo, string calldata _nuevoEstado, 
        string calldata _nuevoHashLab, string calldata _nuevosMetodos
    ) external {
        if (ownerOf(tokenId) != msg.sender) revert Biota__NoEresElPropietario();
        LoteData storage lote = lotePasaporte[tokenId];
        lote.cmSueloRecuperado = _nuevoCmSuelo;
        lote.estadoBiologico = _nuevoEstado;
        lote.hashAnalisisLab = _nuevoHashLab;
        lote.metodosAgricolas = _nuevosMetodos;
        lote.ultimaActualizacion = uint64(block.timestamp);
        lote.esVerificado = false; 
        emit EvidenciaActualizada(tokenId, _nuevoCmSuelo, _nuevoEstado);
    }

    function validarImpacto(uint256 tokenId) external onlyRole(VERIFICADOR_ROLE) {
        lotePasaporte[tokenId].esVerificado = true;
        lotePasaporte[tokenId].verificador = msg.sender;
        emit ImpactoVerificado(tokenId, msg.sender);
    }

    function setHumanVerification(uint256 tokenId, bool status) external onlyRole(VERIFICADOR_ROLE) {
        lotePasaporte[tokenId].isHumanVerified = status;
    }

    function burnPassport(uint256 tokenId) external onlyRole(VERIFICADOR_ROLE) {
        _burn(tokenId);
        delete lotePasaporte[tokenId]; 
    }

    // ==========================================
    // [BLOCKCHAIN] SISTEMA DE ACTUALIZACIÓN
    // ==========================================

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    function tokenURI(uint256 tokenId) public view override(ERC721Upgradeable, ERC721URIStorageUpgradeable) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Upgradeable, ERC721URIStorageUpgradeable, AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // [SOLIDITY] Storage Gap: Reducido de 50 a 44 slots para compensar las 6 nuevas variables dinámicas.
    // Esto asegura que NO haya Storage Collision con implementaciones anteriores de Proxy.
    uint256[44] private __gap;
}
