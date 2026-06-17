// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC1155Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title BiotaRWA - Real World Assets Tokenizados
 * @author Biota Protocol
 * @notice [REFI] Convierte el café físico en un Certificado de Inversión con metadatos modificables on-chain.
 */
contract BiotaRWA is Initializable, ERC1155Upgradeable, AccessControlUpgradeable, UUPSUpgradeable {
    
    // [SOLIDITY] rol administrador para la dapp o el oraculo que puede cambiar la etapa del productor.
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    
    // [EVM] estructura ultra empaquetada para ahorrar gas al maximo.
    struct CoffeeData {
        string finca;           // ej: "finca la esperanza"
        string municipio;       // ej: "chinchina"
        string vereda;          // ej: "el trébol"
        string nombreProductor; // ej: "don arturo"
        string etapaBiota;      // ej: "transición regenerativa"
        string variedad;        // ej: "chiroso y chinchiná castilla"
        string tonosPerfil;     // ej: "chocolate, frutos rojos, cítricos"
        uint256 alturaMsnm;     // ej: 1700
        bool activoParaReclamo; // si aun se puede cambiar por cafe fisico
    }

    // [BLOCKCHAIN] mapeo de ID de producto a su data on-chain.
    mapping(uint256 => CoffeeData) public coffeeRegistry;
    
    // [SOLIDITY] variable para trackear el total de items subidos a la tienda.
    uint256 public nextProductId;

    // [EVENTOS]
    event RWACreated(uint256 indexed productId, string finca, string variedad);
    event RWAMinted(address indexed investor, uint256 indexed productId, uint256 amount);
    event EtapaActualizada(uint256 indexed productId, string nuevaEtapa);
    event CafeReclamado(address indexed investor, uint256 indexed productId);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) initializer public {
        __ERC1155_init("ipfs://metadata-base-url/{id}.json");
        __AccessControl_init();
        // nota: en openzeppelin v5.x __UUPSUpgradeable_init() fue eliminada por estar vacia

        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(ORACLE_ROLE, initialOwner);
        
        nextProductId = 1; // el id 0 no se usa por convencion
    }

    /**
     * @notice [REFI] registra un nuevo lote de cafe en la blockchain antes de venderlo.
     * @dev lo llama el admin de biota cuando llega una nueva cosecha.
     */
    function createCoffeeBatch(
        string calldata _finca,
        string calldata _municipio,
        string calldata _vereda,
        string calldata _productor,
        string calldata _etapa,
        string calldata _variedad,
        string calldata _tonos,
        uint256 _altura
    ) external onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256) {
        uint256 newId = nextProductId;
        
        coffeeRegistry[newId] = CoffeeData({
            finca: _finca,
            municipio: _municipio,
            vereda: _vereda,
            nombreProductor: _productor,
            etapaBiota: _etapa,
            variedad: _variedad,
            tonosPerfil: _tonos,
            alturaMsnm: _altura,
            activoParaReclamo: true
        });

        emit RWACreated(newId, _finca, _variedad);
        
        unchecked { nextProductId++; }
        return newId;
    }

    /**
     * @notice [REFI] mintea los certificados a los inversores. 
     * @dev en produccion, esto debe ser llamado por el contrato BiotaSplitter (la tienda) cuando el pago en cUSD pase con exito.
     */
    function mintInvestorRWA(address _investor, uint256 _productId, uint256 _amount) external onlyRole(ORACLE_ROLE) {
        require(_productId < nextProductId && _productId > 0, "BiotaRWA: Producto no existe");
        
        _mint(_investor, _productId, _amount, "");
        emit RWAMinted(_investor, _productId, _amount);
    }

    /**
     * @notice [REFI] actualiza dinamicamente el estado del productor segun los datos de los sensores/IA.
     * @dev lo llama el oraculo sin necesidad de mintear nuevos tokens.
     */
    function updateEtapaBiota(uint256 _productId, string calldata _nuevaEtapa) external onlyRole(ORACLE_ROLE) {
        coffeeRegistry[_productId].etapaBiota = _nuevaEtapa;
        emit EtapaActualizada(_productId, _nuevaEtapa);
    }

    /**
     * @notice [LOGISTICA] el inversor quema 1 token (voucher) para que le envien el cafe fisico a su casa.
     */
    function claimPhysicalCoffee(uint256 _productId) external {
        require(balanceOf(msg.sender, _productId) >= 1, "BiotaRWA: No tienes balance de este lote");
        require(coffeeRegistry[_productId].activoParaReclamo, "BiotaRWA: Lote ya no disponible para reclamo fisico");
        
        // quema 1 token del inversor
        _burn(msg.sender, _productId, 1);
        emit CafeReclamado(msg.sender, _productId);
        
        // aqui iria un trigger hacia una base de datos logistica tradicional (webhook)
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(DEFAULT_ADMIN_ROLE)
        override
    {}

    // [SOLIDITY] override obligatorio cuando dos contratos padre definen supportsInterface.
    // super.supportsInterface recorre el arbol de herencia en orden (erc1155 -> accesscontrol)
    // y retorna true si alguno de los padres soporta la interfaz solicitada (erc-165).
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

