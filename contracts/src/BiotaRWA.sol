// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

// [OPENZEPPELIN] importamos los contratos base upgrades de la suite v5.x
import {ERC1155Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// [BIOTA] importamos nuestra propia interfaz de estrategia DeFi.
import {IYieldStrategy} from "./IYieldStrategy.sol";

/**
 * @title BiotaRWA - Real World Assets Tokenizados
 * @author Biota Protocol
 * @notice [REFI] Convierte el café físico en un Certificado de Inversión con metadatos modificables on-chain.
 */
contract BiotaRWA is Initializable, ERC1155Upgradeable, AccessControlUpgradeable, UUPSUpgradeable, ReentrancyGuard {
    
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    
    struct CoffeeData {
        string finca;
        string municipio;
        string vereda;
        string nombreProductor;
        string etapaBiota;
        string variedad;
        string tonosPerfil;
        uint256 alturaMsnm;
        bool activoParaReclamo;
    }

    mapping(uint256 => CoffeeData) public coffeeRegistry;
    uint256 public nextProductId;

    // -------------------------------------------------------
    // [DEFI] ARQUITECTURA DE YIELD ENCHUFABLE MULTI-TOKEN
    // -------------------------------------------------------
    // Mapeamos el token (ej: cUSD, G$, CELO) a su estrategia DeFi correspondiente.
    mapping(address => IYieldStrategy) public yieldStrategies;
    
    // [REFI] cuánto ha invertido cada usuario a través de la tienda Biota.
    mapping(address => uint256) public investorYield;

    // [EVENTOS]
    event RWACreated(uint256 indexed productId, string finca, string variedad);
    event RWAMinted(address indexed investor, uint256 indexed productId, uint256 amount);
    event EtapaActualizada(uint256 indexed productId, string nuevaEtapa);
    event CafeReclamado(address indexed investor, uint256 indexed productId);
    event YieldStrategyUpdated(address indexed token, address indexed oldStrategy, address indexed newStrategy);
    event InvestmentRecorded(address indexed investor, uint256 productId, address token, uint256 yieldAmount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) initializer public {
        __ERC1155_init("ipfs://metadata-base-url/{id}.json");
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(ORACLE_ROLE, initialOwner);
        
        nextProductId = 1;
    }

    struct CoffeeBatchParams {
        string finca;
        string municipio;
        string vereda;
        string productor;
        string etapa;
        string variedad;
        string tonos;
        uint256 altura;
    }

    /**
     * @notice [REFI] registra un nuevo lote de cafe en la blockchain.
     */
    function createCoffeeBatch(
        CoffeeBatchParams calldata params
    ) external onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256) {
        uint256 newId = nextProductId;
        
        coffeeRegistry[newId] = CoffeeData({
            finca: params.finca,
            municipio: params.municipio,
            vereda: params.vereda,
            nombreProductor: params.productor,
            etapaBiota: params.etapa,
            variedad: params.variedad,
            tonosPerfil: params.tonos,
            alturaMsnm: params.altura,
            activoParaReclamo: true
        });

        emit RWACreated(newId, params.finca, params.variedad);
        
        unchecked { nextProductId++; }
        return newId;
    }

    /**
     * @notice [REFI] mintea certificados a los inversores.
     */
    function mintInvestorRWA(address _investor, uint256 _productId, uint256 _amount) external onlyRole(ORACLE_ROLE) {
        require(_productId < nextProductId && _productId > 0, "BiotaRWA: Producto no existe");
        _mint(_investor, _productId, _amount, "");
        emit RWAMinted(_investor, _productId, _amount);
    }

    /**
     * @notice Registra la porción DeFi de una compra y la deposita en la estrategia.
     */
    function recordInvestment(
        address _investor,
        uint256 _productId,
        address _token,
        uint256 _yieldAmount
    ) external onlyRole(ORACLE_ROLE) {
        IYieldStrategy strategy = yieldStrategies[_token];
        require(address(strategy) != address(0), "BiotaRWA: sin estrategia DeFi activa para este token");
        require(_yieldAmount > 0, "BiotaRWA: monto de yield debe ser mayor a cero");

        investorYield[_investor] += _yieldAmount;
        IERC20(_token).transferFrom(msg.sender, address(this), _yieldAmount);

        // [GAS OPTIMIZATION - REFI] Aprobación infinita condicional.
        if (IERC20(_token).allowance(address(this), address(strategy)) < _yieldAmount) {
            IERC20(_token).approve(address(strategy), type(uint256).max);
        }
        
        strategy.deposit(_token, _yieldAmount, _investor);
        emit InvestmentRecorded(_investor, _productId, _token, _yieldAmount);
    }

    /**
     * @notice [TRADUCTOR DE INFINITO V2] Retira liquidez del inversor (Capital + Interés) aplicando patrón CEI.
     */
    function withdrawYield(address _token, uint256 _amount) external nonReentrant {
        IYieldStrategy strategy = yieldStrategies[_token];
        require(address(strategy) != address(0), "BiotaRWA: estrategia DeFi no configurada para este token");

        // [SEGURIDAD SENIOR]: Consultamos el saldo real (Principal + Interés) dinámicamente
        // Esto asegura que el inversor pueda retirar sus ganancias generadas sin que queden atascadas.
        uint256 realBalance = strategy.getBalance(_token, msg.sender);
        require(realBalance > 0, "BiotaRWA: No posees capital rindiendo en la estrategia DeFi");

        // Atajamos el infinito del frontend y lo acotamos al saldo real en el protocolo externo.
        uint256 safeAmount = (_amount == type(uint256).max) ? realBalance : _amount;
        require(realBalance >= safeAmount, "BiotaRWA: Saldo insuficiente en la estrategia DeFi");

        // 1. EFFECTS (Descontamos el estado interno antes de salir)
        // Si retira más de lo que invirtió (porque está sacando interés), el principal queda en 0.
        uint256 internalPrincipal = investorYield[msg.sender];
        if (safeAmount >= internalPrincipal) {
            investorYield[msg.sender] = 0;
        } else {
            investorYield[msg.sender] -= safeAmount;
        }

        // 2. INTERACTIONS
        strategy.withdraw(_token, safeAmount, msg.sender);
    }

    /**
     * @notice [ARQUITECTURA] Permite configurar una estrategia DeFi por cada token distinto (cUSD, G$, CELO).
     */
    function setYieldStrategy(address _token, address _newStrategy) external onlyRole(DEFAULT_ADMIN_ROLE) {
        address old = address(yieldStrategies[_token]);
        yieldStrategies[_token] = IYieldStrategy(_newStrategy);
        emit YieldStrategyUpdated(_token, old, _newStrategy);
    }

    /**
     * @notice [REFI] actualiza dinamicamente el estado del productor.
     */
    function updateEtapaBiota(uint256 _productId, string calldata _nuevaEtapa) external onlyRole(ORACLE_ROLE) {
        coffeeRegistry[_productId].etapaBiota = _nuevaEtapa;
        emit EtapaActualizada(_productId, _nuevaEtapa);
    }

    /**
     * @notice [LOGISTICA] quema 1 token para envio de cafe fisico.
     */
    function claimPhysicalCoffee(uint256 _productId) external {
        require(balanceOf(msg.sender, _productId) >= 1, "BiotaRWA: No tienes balance");
        require(coffeeRegistry[_productId].activoParaReclamo, "BiotaRWA: Ya no disponible");
        _burn(msg.sender, _productId, 1);
        emit CafeReclamado(msg.sender, _productId);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(DEFAULT_ADMIN_ROLE)
        override
    {}

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
