// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

// [OPENZEPPELIN] importamos los contratos base upgrades de la suite v5.x
import {ERC1155Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// [BIOTA] importamos nuestra propia interfaz de estrategia DeFi.
// esto es el "enchufe" al que conectaremos Moola, Beefy, etc.
import {IYieldStrategy} from "./IYieldStrategy.sol";

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

    // -------------------------------------------------------
    // [DEFI] ARQUITECTURA DE YIELD ENCHUFABLE
    // -------------------------------------------------------
    // yieldStrategy es la dirección del contrato adaptador DeFi activo.
    // el admin puede cambiarla para migrar entre protocolos sin redesplegar BiotaRWA.
    // ej: hoy apunta a MoolaStrategy, mañana podemos cambiarlo a BeefyStrategy.
    IYieldStrategy public yieldStrategy;

    // [REFI] cuánto ha invertido cada usuario a través de la tienda Biota.
    // clave: wallet del inversor → valor: total en cUSD depositado en el protocolo DeFi
    // esto nos permite calcular cuánto le corresponde retirar a cada quien.
    mapping(address => uint256) public investorYield;

    // [EVENTOS]
    event RWACreated(uint256 indexed productId, string finca, string variedad);
    event RWAMinted(address indexed investor, uint256 indexed productId, uint256 amount);
    event EtapaActualizada(uint256 indexed productId, string nuevaEtapa);
    event CafeReclamado(address indexed investor, uint256 indexed productId);
    // se emite cuando el admin cambia la estrategia DeFi activa (ej: Moola → Beefy)
    event YieldStrategyUpdated(address indexed oldStrategy, address indexed newStrategy);
    // se emite cuando un inversor hace una compra y su porción DeFi queda registrada
    event InvestmentRecorded(address indexed investor, uint256 productId, uint256 yieldAmount);

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
     * @dev en produccion, esto debe ser llamado por el contrato BiotaSplitter (la tienda)
     *      cuando el pago en cUSD pase con exito. el oracle_role es quien autoriza el minteo.
     */
    function mintInvestorRWA(address _investor, uint256 _productId, uint256 _amount) external onlyRole(ORACLE_ROLE) {
        require(_productId < nextProductId && _productId > 0, "BiotaRWA: Producto no existe");
        
        // [ERC-1155] minta N unidades del token _productId al inversor
        _mint(_investor, _productId, _amount, "");
        emit RWAMinted(_investor, _productId, _amount);
    }

    // -------------------------------------------------------
    // FUNCIÓN: recordInvestment
    // -------------------------------------------------------
    // [REFI] Registra la porción DeFi de una compra y la deposita en la estrategia activa.
    // @param _investor    la wallet del inversor que hizo la compra
    // @param _productId   qué café compró (ID del lote)
    // @param _token       el ERC-20 usado en el pago (ej: cUSD)
    // @param _yieldAmount cuántos tokens van al protocolo DeFi (el 40% del pago)
    //
    // [FLUJO] BiotaSplitter paga al productor y al treasury, luego llama esto
    // para que el 40% restante vaya al protocolo DeFi en nombre del inversor.
    //
    // [SEGURIDAD] solo el ORACLE_ROLE puede llamar esto, igual que el minteo.
    // Así el frontend no puede llamarlo directamente y manipular los datos.
    // -------------------------------------------------------
    function recordInvestment(
        address _investor,
        uint256 _productId,
        address _token,
        uint256 _yieldAmount
    ) external onlyRole(ORACLE_ROLE) {
        // [VALIDACIÓN] no registramos inversiones si no hay estrategia configurada
        require(address(yieldStrategy) != address(0), "BiotaRWA: sin estrategia DeFi activa");
        require(_yieldAmount > 0, "BiotaRWA: monto de yield debe ser mayor a cero");

        // [REFI] acumulamos el total invertido por este usuario para llevar el historial
        investorYield[_investor] += _yieldAmount;

        // [ERC-20] transferimos los tokens desde quien llama (el splitter) hacia este contrato
        // el splitter debe haber dado approve() antes para que esto funcione
        IERC20(_token).transferFrom(msg.sender, address(this), _yieldAmount);

        // [DEFI] llamamos a la estrategia enchufable (Moola, Beefy, etc.)
        // la estrategia se encarga de hacer el approve y deposit en el protocolo DeFi
        // el inversor recibirá mcUSD (o el token equivalente) directamente en su wallet
        IERC20(_token).approve(address(yieldStrategy), _yieldAmount);
        yieldStrategy.deposit(_token, _yieldAmount, _investor);

        emit InvestmentRecorded(_investor, _productId, _yieldAmount);
    }

    // -------------------------------------------------------
    // FUNCIÓN: setYieldStrategy
    // -------------------------------------------------------
    // [ARQUITECTURA] Permite al admin cambiar el protocolo DeFi activo sin redesplegar.
    // @param _newStrategy  dirección del nuevo contrato de estrategia
    //
    // [EJEMPLO] Hoy: setYieldStrategy(direccionMoolaStrategy)
    //           En 6 meses: setYieldStrategy(direccionBeefyStrategy)
    // El inversor ni se entera del cambio, todo sigue funcionando igual.
    // -------------------------------------------------------
    function setYieldStrategy(address _newStrategy) external onlyRole(DEFAULT_ADMIN_ROLE) {
        address old = address(yieldStrategy);
        // [SOLIDITY] convertimos la dirección en el tipo IYieldStrategy
        // esto verifica en tiempo de compilación que el contrato tenga las funciones correctas
        yieldStrategy = IYieldStrategy(_newStrategy);
        emit YieldStrategyUpdated(old, _newStrategy);
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

