// SPDX-License-Identifier: MIT
pragma solidity 0.8.28; // [SOLIDITY] Fija la versión exacta del compilador para asegurar determinismo en el bytecode.

// ==========================================
// [BLOCKCHAIN] IMPORTACIONES BASE (OPENZEPPELIN V5)
// Librerías auditadas para construir contratos actualizables (Proxies).
// ==========================================
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol"; // [EVM] Permite usar el patrón 'initializer' en vez de 'constructor' en proxies.
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol"; // [BLOCKCHAIN] Estándar de NFT base (Identidad).
import {ERC721URIStorageUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol"; // [BLOCKCHAIN] Extensión para guardar metadata descentralizada (IPFS/Pinata).
import {AccessControlDefaultAdminRulesUpgradeable} from "@openzeppelin/contracts-upgradeable/access/extensions/AccessControlDefaultAdminRulesUpgradeable.sol"; // [SEGURIDAD] Maneja roles y añade un retraso de tiempo para cambiar de Admin (Anti-hackeos).
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol"; // [EVM] Patrón de Proxy donde la lógica de actualización vive aquí, ahorrando Gas frente a Transparent Proxies.
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol"; // [BLOCKCHAIN] Interfaz estándar para interactuar con tokens como Celo Dólar (cUSD) o GoodDollar (G$).

// ==========================================
// [REFI] INTERFACES EXTERNAS
// ==========================================
interface IEngagementRewards {
    // [REFI] Llama al contrato de recompensas externas (GoodDollar/Minipay) para darle UBI al usuario.
    function appClaim(address user) external;
}

/**
 * @title BiotaPassport - Pasaporte Biológico Dinámico (Hard Fork V4)
 * @author Biota Protocol
 * @notice [REFI] Es el "alma" del protocolo. Tokeniza la identidad (ERC721) del productor rural y su impacto regenerativo.
 * @dev [EVM] Contrato UUPS (Universal Upgradeable Proxy Standard) blindado con AccessControl 2-Step. No tiene deuda técnica de storage.
 */
contract BiotaPassport is 
    Initializable, 
    ERC721Upgradeable, 
    ERC721URIStorageUpgradeable, 
    AccessControlDefaultAdminRulesUpgradeable, 
    UUPSUpgradeable 
{
    // ==========================================
    // [EVM] CONSTANTES Y ROLES (Bytecode, no usan Storage)
    // ==========================================
    
    // [SOLIDITY] Hash único que define quién tiene el poder de auditar tierras y aprobar lotes.
    bytes32 public constant VERIFICADOR_ROLE = keccak256("VERIFICADOR_ROLE");
    
    // [CELO] Dirección del token GoodDollar (G$) en Celo Mainnet. Setteable por Admin
    // para sobrevivir migraciones futuras del token sin necesitar redesplegar el contrato.
    // [FIX L-01] Cambiado de 'constant' a variable setteable. El contrato es upgradeable
    // así que podría corregirse en V5, pero es mejor prática hacerlo setteable desde ahora.
    address public gToken;

    // ==========================================
    // [EVM] VARIABLES DE ESTADO (Storage)
    // ==========================================
    
    // [SOLIDITY] Contador interno para asignar un ID único a cada nuevo pasaporte (NFT) creado.
    uint256 private _nextTokenId;

    // [REFI] Rutas de Tesorería (Router Inteligente). Se pueden cambiar dinámicamente.
    address public refiTreasury;             // Billetera principal donde caen los ingresos del protocolo.
    address public mujeresCarmen;            // Billetera social destinada a la causa "Mujeres del Carmen".
    address public poolLoginWallet;          // Billetera encargada de financiar el gas (Google Login / Privy).
    address public biotaProductoresPool;     // Tesorería que acumula el fondo principal de productores.
    address public engagementRewardsContract;// Contrato de recompensas de Celo/GoodDollar.

    // [ECONOMÍA] Precios de entrada que paga el productor/usuario para mintear su pasaporte.
    uint256 public mintPriceCelo; // [CELO] Precio si se paga con moneda nativa CELO (ej: 0.01 ether).
    uint256 public mintPriceG;    // [GOODDOLLAR] Precio si se paga con G$ (Tiene solo 2 decimales en Celo).

    // ==========================================
    // [EVM] CUSTOM ERRORS (Más baratos en Gas que los 'require')
    // ==========================================
    error Biota__PagoInsuficiente();      // [ECONOMÍA] El usuario no envió fondos suficientes para mintear.
    error Biota__NoEresElPropietario();   // [SEGURIDAD] Intenta actualizar datos de un NFT que no le pertenece.
    error Biota__AreaInvalida();          // [REFI] El área declarada del lote es 0 (datos inválidos).
    error Biota__TransferenciaFallida();  // [EVM] Falló el envío de CELO nativo por la red.
    error Biota__DireccionCero();         // [SOLIDITY] Evita quemar fondos enviándolos a la dirección 0x000...
    error Biota__TesoreriaNoConfigurada(); // [FIX M-01] Las rutas de pago aún no han sido inicializadas por el Admin.

    // ==========================================
    // [EVM] STRUCT PACKING (Gas Optimization Avanzado)
    // ==========================================
    /**
     * @dev [SOLIDITY] LoteData empaqueta las variables de impacto de manera estricta. 
     * En Ethereum/Celo, cada lectura/escritura de "Slot" (32 bytes) cuesta dinero. 
     * Al juntar los tipos pequeños, ahorramos a los productores costos masivos de Gas.
     */
    struct LoteData {
        // --- SLOT 1 (30 bytes en total. Entra perfecto en un cajón de 32 bytes) ---
        address verificador;        // [EVM] 20 bytes: Dirección del ingeniero agrónomo.
        uint32 areaM2;              // [SOLIDITY] 4 bytes: Área de siembra. (Max ~4 mil millones de m2).
        uint32 cmSueloRecuperado;   // [SOLIDITY] 4 bytes: Métrica ReFi de impacto.
        bool esVerificado;          // [SOLIDITY] 1 byte: ¿Agrónomo aprobó?
        bool isHumanVerified;       // [SOLIDITY] 1 byte: ¿Pasó prueba facial (Proof of Humanity)?
        
        // --- SLOT 2 (16 bytes en total. Quedan 16 bytes libres) ---
        uint64 fechaRegistro;       // [EVM] 8 bytes: Timestamp de creación.
        uint64 ultimaActualizacion; // [EVM] 8 bytes: Timestamp última modificación.
        
        // --- SLOTS DINÁMICOS (Cada string ocupa múltiples slots dependiendo de su longitud) ---
        string ubicacionGeografica; // [REFI] Coordenadas o descripción de la finca.
        string estadoBiologico;     // [REFI] Tipo de cultivo, salud del suelo.
        string hashAnalisisLab;     // [BLOCKCHAIN] Hash IPFS con PDF de análisis de laboratorio.
        string ingredientesHash;    // [BLOCKCHAIN] Hash IPFS de ingredientes usados.
        string metodosAgricolas;    // [REFI] Ej: Sintrópico, orgánico, tradicional.
    }

    // [SOLIDITY] Relaciona cada Token ID (ej: NFT #1) con su LoteData correspondiente.
    mapping(uint256 => LoteData) public lotePasaporte;

    // ==========================================
    // [BLOCKCHAIN] EVENTOS (Para escuchar desde el Frontend / The Graph)
    // ==========================================
    event PassportMinted(uint256 indexed tokenId, address indexed producer, string ubicacion, bool pagadoConCelo); // [APP] Disparado al crear pasaporte.
    event EvidenciaActualizada(uint256 indexed tokenId, uint32 nuevoCmSuelo, string nuevoEstado); // [APP] Cuando un campesino sube avances.
    event ImpactoVerificado(uint256 indexed tokenId, address indexed verificador); // [REFI] Agrónomo da sello de calidad.
    event ParametrosEconomicosActualizados(uint256 nuevoPrecioCelo, uint256 nuevoPrecioG); // [ECONOMÍA] Admin cambia precios.
    event RutasDePagoActualizadas(address refi, address mujeres, address login, address productores, address rewards); // [APP] Configuración de tesorerías.

    // ==========================================
    // [EVM] INICIALIZACIÓN (Patrón Proxy)
    // ==========================================
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers(); // [SEGURIDAD] Bloquea el contrato lógico original para que nadie lo inicialice o tome control directo.
    }

    /**
     * @notice [EVM] Función que reemplaza al 'constructor' en contratos Proxy. Solo se puede llamar una vez.
     * @param initialOwner [SEGURIDAD] Dirección segura (Idealmente una MultiSig) que recibirá el poder absoluto (DEFAULT_ADMIN_ROLE).
     */
    function initialize(address initialOwner) public initializer {
        __ERC721_init("BiotaPassport", "BIO"); // [BLOCKCHAIN] Nombra el token NFT.
        __ERC721URIStorage_init(); // [BLOCKCHAIN] Activa el módulo para guardar URIs (Links a metadata en IPFS).
        
        // [SEGURIDAD] Inicializa las reglas de administrador con un TimeLock (Retraso). 
        // Si alguien roba la llave del Admin y quiere pasárselo a su hacker-wallet, tardará 3 DÍAS en aplicar.
        __AccessControlDefaultAdminRules_init(3 days, initialOwner);
        
        // Otorga permisos al dueño para que también pueda fungir como ingeniero/verificador inicial.
        _grantRole(VERIFICADOR_ROLE, initialOwner);
        
        // [CELO] Dirección por defecto del token G$ en Celo Mainnet. Setteable por Admin.
        gToken = 0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A;

        // [CELO] Dirección hardcodeada por defecto del contrato de recompensas.
        engagementRewardsContract = 0x25db74CF4E7BA120526fd87e159CF656d94bAE43;
    }
    
    // ==========================================
    // [REFI] SETTERS ADMINISTRATIVOS (Configuración)
    // ==========================================
    
    /**
     * @notice [ECONOMÍA] Permite al administrador ajustar cuánto cuesta crear un pasaporte según mercado.
     * @dev Protegido estrictamente por el rol de ADMIN.
     */
    function setMintPrices(uint256 _nuevoPrecioCelo, uint256 _nuevoPrecioG) external onlyRole(DEFAULT_ADMIN_ROLE) {
        mintPriceCelo = _nuevoPrecioCelo;
        mintPriceG = _nuevoPrecioG;
        emit ParametrosEconomicosActualizados(_nuevoPrecioCelo, _nuevoPrecioG);
    }
    
    /**
     * @notice [REFI] Actualiza las billeteras de destino de los fondos del protocolo (Router).
     * @dev [SEGURIDAD] Tiene validaciones de address(0) para no perder fondos quemándolos en la nada.
     */
    function setTreasuryAddresses(
        address _refiTreasury, 
        address _mujeresCarmen, 
        address _poolLoginWallet, 
        address _biotaProductoresPool,
        address _engagementRewards
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_refiTreasury == address(0) || _poolLoginWallet == address(0)) revert Biota__DireccionCero();
        
        refiTreasury = _refiTreasury;
        mujeresCarmen = _mujeresCarmen;
        poolLoginWallet = _poolLoginWallet;
        biotaProductoresPool = _biotaProductoresPool;
        engagementRewardsContract = _engagementRewards;
        
        emit RutasDePagoActualizadas(_refiTreasury, _mujeresCarmen, _poolLoginWallet, _biotaProductoresPool, _engagementRewards);
    }

    /**
     * @notice [FIX L-01] Permite al Admin actualizar la dirección del token G$ si GoodDollar migra.
     * @dev Solo el Admin (MultiSig) puede cambiar esto. Protege al protocolo ante futuras migraciones del token.
     */
    function setGToken(address _newGToken) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_newGToken == address(0)) revert Biota__DireccionCero();
        gToken = _newGToken;
    }

    // ==========================================
    // [REFI] LÓGICA CORE DE NEGOCIO
    // ==========================================

    /**
     * @notice [REFI] Mintea (crea) el Pasaporte NFT del productor, cobrando la tarifa y enrutando los fondos.
     * @dev [CELO/SOLIDITY] Función 'payable' para recibir CELO nativo. Combina transferencias nativas y ERC20.
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
        // [FIX M-01] Guard de seguridad: las tesorerías deben estar configuradas antes de
        // aceptar pagos. Si el Admin no ha corrido AdminConfig.s.sol, falla aquí de forma
        // explícita y segura, sin posibilidad de perder fondos.
        if (poolLoginWallet == address(0) || biotaProductoresPool == address(0) || refiTreasury == address(0)) {
            revert Biota__TesoreriaNoConfigurada();
        }

        // [REFI] Validación básica: Un lote no puede tener 0 metros cuadrados.
        if (_areaM2 == 0) revert Biota__AreaInvalida();

        bool pagadoConCelo = false;

        // --- RUTA 1: PAGO CON MONEDA NATIVA (CELO) ---
        if (msg.value > 0) {
            // [ECONOMÍA] Verifica que el pago iguale o supere el precio actual.
            if (msg.value < mintPriceCelo) revert Biota__PagoInsuficiente();
            
            // [MATEMÁTICAS EVM] Distribución: 5% a Gas/Login y 95% al Pool de Productores.
            uint256 paraLoginGas = (msg.value * 5) / 100;
            uint256 paraProductores = msg.value - paraLoginGas; // Resta en vez de división directa para no perder 'wei' residuales.

            // [CELO/SEGURIDAD] `.call` se usa en lugar de `.transfer` para evitar quedarse sin gas si el destino es un Smart Contract/Multisig.
            (bool s1, ) = poolLoginWallet.call{value: paraLoginGas}("");
            (bool s2, ) = biotaProductoresPool.call{value: paraProductores}("");
            
            // Si cualquier envío falla, revierte la transacción entera (Atomicidad).
            if (!s1 || !s2) revert Biota__TransferenciaFallida();
            
            pagadoConCelo = true;
        } 
        // --- RUTA 2: PAGO CON TOKEN ERC20 (GOODDOLLAR) ---
        else {
            // [MATEMÁTICAS EVM] Distribución ERC20: 10% Mujeres, 90% Tesorería Principal.
            uint256 paraMujeres = (mintPriceG * 10) / 100; 
            uint256 paraTreasury = mintPriceG - paraMujeres; 

            // [EVM] Requiere que el usuario haya ejecutado antes 'approve' en el contrato de G$.
            bool s1 = IERC20(gToken).transferFrom(msg.sender, refiTreasury, paraTreasury);
            bool s2 = IERC20(gToken).transferFrom(msg.sender, mujeresCarmen, paraMujeres);
            if (!s1 || !s2) revert Biota__PagoInsuficiente();
        }

        // [CELO/REFI] Llamada al sistema de recompensas (UBI) externo. 
        // [SEGURIDAD] Se usa 'try/catch' para que si falla (por falta de registro facial, etc), no bloquee la creación del pasaporte.
        if (engagementRewardsContract != address(0)) {
            try IEngagementRewards(engagementRewardsContract).appClaim(msg.sender) {} catch {}
        }

        // [BLOCKCHAIN] Obtiene el ID disponible.
        uint256 newId = _nextTokenId;
        
        // [SOLIDITY] Almacena los datos en el mapping de Storage optimizado.
        lotePasaporte[newId] = LoteData({
            verificador: address(0),
            areaM2: _areaM2,
            cmSueloRecuperado: _cmSueloRecuperado,
            esVerificado: false,
            isHumanVerified: false,
            fechaRegistro: uint64(block.timestamp),
            ultimaActualizacion: uint64(block.timestamp),
            ubicacionGeografica: _ubicacionGeografica,
            estadoBiologico: _estadoBiologico,
            hashAnalisisLab: _hashAnalisisLab,
            ingredientesHash: _ingredientesHash,
            metodosAgricolas: _metodosAgricolas
        });

        // [BLOCKCHAIN] Ejecuta el minteo del NFT hacia la wallet del usuario.
        _safeMint(msg.sender, newId);
        
        // [BLOCKCHAIN] Vincula el ID del token con su JSON de Metadata (en IPFS/Pinata).
        _setTokenURI(newId, _tokenURI);

        emit PassportMinted(newId, msg.sender, _ubicacionGeografica, pagadoConCelo);

        // [EVM GAS] Al envolver el ++ en 'unchecked', nos ahorramos el checkeo de overflow de Solidity 0.8, ahorrando Gas.
        unchecked { _nextTokenId++; }
        
        return newId;
    }

    /**
     * @notice [REFI] Permite al campesino actualizar periódicamente la salud de su lote (dMRV).
     */
    function actualizarEvidencia(
        uint256 tokenId, uint32 _nuevoCmSuelo, string calldata _nuevoEstado, 
        string calldata _nuevoHashLab, string calldata _nuevosMetodos
    ) external {
        // [SEGURIDAD] Solo el portador del NFT de identidad puede subir actualizaciones de su propia tierra.
        if (ownerOf(tokenId) != msg.sender) revert Biota__NoEresElPropietario();
        
        LoteData storage lote = lotePasaporte[tokenId];
        lote.cmSueloRecuperado = _nuevoCmSuelo;
        lote.estadoBiologico = _nuevoEstado;
        lote.hashAnalisisLab = _nuevoHashLab;
        lote.metodosAgricolas = _nuevosMetodos;
        lote.ultimaActualizacion = uint64(block.timestamp);
        
        // [REFI] Al actualizar datos, se pierde el estado de verificado hasta que un agrónomo vuelva a auditar.
        lote.esVerificado = false; 
        
        emit EvidenciaActualizada(tokenId, _nuevoCmSuelo, _nuevoEstado);
    }

    /**
     * @notice [REFI] Función exclusiva para ingenieros agrónomos. Confirma que los datos son reales.
     */
    function validarImpacto(uint256 tokenId) external onlyRole(VERIFICADOR_ROLE) {
        lotePasaporte[tokenId].esVerificado = true;
        lotePasaporte[tokenId].verificador = msg.sender;
        emit ImpactoVerificado(tokenId, msg.sender);
    }

    /**
     * @notice [SEGURIDAD] Integra protocolos de identidad humanos (ej: GoodDollar Face Verification).
     */
    function setHumanVerification(uint256 tokenId, bool status) external onlyRole(VERIFICADOR_ROLE) {
        lotePasaporte[tokenId].isHumanVerified = status;
    }

    /**
     * @notice [EVM] Destruye el pasaporte si se descubre fraude severo.
     */
    function burnPassport(uint256 tokenId) external onlyRole(VERIFICADOR_ROLE) {
        _burn(tokenId); // [BLOCKCHAIN] Borra el token ERC721.
        delete lotePasaporte[tokenId];  // [EVM] Borrar el storage devuelve reembolso de Gas!
    }

    // ==========================================
    // [BLOCKCHAIN] FUNCIONES INTERNAS (UUPS Y HERENCIAS DE OPENZEPPELIN)
    // ==========================================

    /**
     * @notice [SEGURIDAD] Función CORE de UUPS. Autoriza la actualización del contrato (El "Upgrade").
     * @dev Al restringirse con `onlyRole(DEFAULT_ADMIN_ROLE)`, SOLO la multifirma (TimeLocked) puede desplegar una nueva versión.
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    /**
     * @notice [BLOCKCHAIN] Resuelve el conflicto de herencias de OpenZeppelin para leer el URI de IPFS.
     */
    function tokenURI(uint256 tokenId) public view override(ERC721Upgradeable, ERC721URIStorageUpgradeable) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /**
     * @notice [BLOCKCHAIN] Verifica qué estándares (ERC165, ERC721, AccessControl) soporta el contrato.
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721Upgradeable, ERC721URIStorageUpgradeable, AccessControlDefaultAdminRulesUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
