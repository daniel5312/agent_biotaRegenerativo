// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BiotaPassport is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // DIRECCIONES EXACTAS DE TU COMPILADOR (Copiadas y pegadas de tu error)
    address public constant REFI_TREASURY =
        0xd4AC6c14B4C96F7e66049210F56cb07468028d4e;
    address public constant MUJERES_CARMEN =
        0x0d43131f1577310D6349bAF9D6Da4fC1Cd39764C;
    IERC20 public constant G_TOKEN =
        IERC20(0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A);

    uint256 public constant MINT_PRICE_CELO = 0.25 ether;
    uint256 public constant MINT_PRICE_G = 50 * 1e18;

    error Biota__PagoInsuficiente();
    error Biota__NoEresElPropietario();
    error Biota__NoEresVerificador();
    error Biota__AreaInvalida();
    error Biota__TransferenciaFallida();

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

    mapping(uint256 => LoteData) public lotePasaporte;
    mapping(address => bool) public isVerificador;

    event PassportMinted(
        uint256 indexed tokenId,
        address indexed producer,
        string ubicacion,
        bool pagadoConCelo
    );
    event EvidenciaActualizada(
        uint256 indexed tokenId,
        uint32 nuevoCmSuelo,
        string nuevoEstado
    );
    event ImpactoVerificado(
        uint256 indexed tokenId,
        address indexed verificador
    );

    constructor(
        address initialOwner
    ) ERC721("BiotaPassport", "BIO") Ownable(initialOwner) {
        isVerificador[initialOwner] = true;
    }

    modifier soloProductor(uint256 tokenId) {
        if (ownerOf(tokenId) != msg.sender) revert Biota__NoEresElPropietario();
        _;
    }

    function mintPasaporte(
        string calldata tokenURI,
        string calldata _ubicacionGeografica,
        uint32 _areaM2,
        uint32 _cmSueloRecuperado,
        string calldata _estadoBiologico,
        string calldata _hashAnalisisLab,
        string calldata _ingredientesHash,
        string calldata _metodosAgricolas
    ) public payable returns (uint256) {
        if (_areaM2 == 0) revert Biota__AreaInvalida();

        bool pagadoConCelo = false;

        if (msg.value > 0) {
            if (msg.value < MINT_PRICE_CELO) revert Biota__PagoInsuficiente();

            uint256 paraMujeres = (msg.value * 10) / 100;
            uint256 paraTreasury = msg.value - paraMujeres;

            (bool s1, ) = REFI_TREASURY.call{value: paraTreasury}("");
            (bool s2, ) = MUJERES_CARMEN.call{value: paraMujeres}("");

            if (!s1 || !s2) revert Biota__TransferenciaFallida();
            pagadoConCelo = true;
        } else {
            uint256 paraMujeres = (MINT_PRICE_G * 10) / 100;
            uint256 paraTreasury = MINT_PRICE_G - paraMujeres;

            bool s1 = G_TOKEN.transferFrom(
                msg.sender,
                REFI_TREASURY,
                paraTreasury
            );
            bool s2 = G_TOKEN.transferFrom(
                msg.sender,
                MUJERES_CARMEN,
                paraMujeres
            );

            if (!s1 || !s2) revert Biota__PagoInsuficiente();
        }

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
        _setTokenURI(newId, tokenURI);

        emit PassportMinted(
            newId,
            msg.sender,
            _ubicacionGeografica,
            pagadoConCelo
        );

        unchecked {
            _nextTokenId++;
        }
        return newId;
    }

    function actualizarEvidencia(
        uint256 tokenId,
        uint32 _nuevoCmSuelo,
        string calldata _nuevoEstado,
        string calldata _nuevoHashLab,
        string calldata _nuevosMetodos
    ) public soloProductor(tokenId) {
        LoteData storage lote = lotePasaporte[tokenId];

        lote.cmSueloRecuperado = _nuevoCmSuelo;
        lote.estadoBiologico = _nuevoEstado;
        lote.hashAnalisisLab = _nuevoHashLab;
        lote.metodosAgricolas = _nuevosMetodos;
        lote.ultimaActualizacion = uint64(block.timestamp);
        lote.esVerificado = false;

        emit EvidenciaActualizada(tokenId, _nuevoCmSuelo, _nuevoEstado);
    }

    function validarImpacto(uint256 tokenId) public {
        if (!isVerificador[msg.sender]) revert Biota__NoEresVerificador();
        lotePasaporte[tokenId].esVerificado = true;
        lotePasaporte[tokenId].verificador = msg.sender;
        emit ImpactoVerificado(tokenId, msg.sender);
    }

    function setHumanVerification(uint256 tokenId, bool status) public {
        if (!isVerificador[msg.sender]) revert Biota__NoEresVerificador();
        lotePasaporte[tokenId].isHumanVerified = status;
    }

    function gestionarVerificador(
        address cuenta,
        bool estado
    ) public onlyOwner {
        isVerificador[cuenta] = estado;
    }

    function burnPassport(uint256 tokenId) public {
        if (!isVerificador[msg.sender]) revert Biota__NoEresVerificador();
        _burn(tokenId);
        delete lotePasaporte[tokenId];
    }
}

/*pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title BiotaPassport - Pasaporte Biológico Dinámico
/// @notice Core ReFi del protocolo Biota. Registra y tokeniza la regeneración del suelo.
/// @dev Optimizado con Struct Packing y Custom Errors para la red Celo y MiniPay.
contract BiotaPassport is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    /// @dev Errores personalizados para ahorrar gas en despliegue y ejecución
    error Biota__NoEresElPropietario();
    error Biota__NoEresVerificador();
    error Biota__AreaInvalida();

    /// @dev Estructura de datos empaquetada (Struct Packing)
    /// Se redujeron los tipos para que las variables encajen en menos slots de 256 bits.
    struct LoteData {
        // --- SLOT 1 (22 bytes usados de 32) ---
        address verificador; // 20 bytes
        bool esVerificado; // 1 byte
        bool isHumanVerified; // 1 byte (Base Anti-Sybil para GoodDollar G$)
        uint32 areaM2; // 4 bytes (Máx ~4.29 millones m2 / 429 hectáreas)
        uint32 cmSueloRecuperado; // 4 bytes (Máx ~4.29 millones cm)
        // --- SLOT 2 (16 bytes usados de 32) ---
        uint64 fechaRegistro; // 8 bytes (Timestamp seguro por miles de años)
        uint64 ultimaActualizacion; // 8 bytes
        // --- SLOTS DINÁMICOS ---
        string ubicacionGeografica;
        string estadoBiologico;
        string hashAnalisisLab;
        string ingredientesHash;
        string metodosAgricolas;
    }

    mapping(uint256 => LoteData) public lotePasaporte;
    mapping(address => bool) public isVerificador;

    /// @notice Emitido cuando un productor inicia su transición regenerativa
    event PassportMinted(
        uint256 indexed tokenId,
        address indexed producer,
        string ubicacion
    );

    /// @notice Emitido cuando se registra un avance ecológico on-chain
    event EvidenciaActualizada(
        uint256 indexed tokenId,
        uint32 nuevoCmSuelo,
        string nuevoEstado
    );

    /// @notice Emitido cuando un oráculo o técnico aprueba el impacto, habilitando el UBI
    event ImpactoVerificado(
        uint256 indexed tokenId,
        address indexed verificador
    );

    constructor(
        address initialOwner
    ) ERC721("BiotaPassport", "BIO") Ownable(initialOwner) {
        isVerificador[initialOwner] = true;
    }

    modifier soloProductor(uint256 tokenId) {
        if (ownerOf(tokenId) != msg.sender) revert Biota__NoEresElPropietario();
        _;
    }

    modifier soloVerificador() {
        if (!isVerificador[msg.sender]) revert Biota__NoEresVerificador();
        _;
    }

    /// @notice Mintea el pasaporte base para iniciar la medición de impacto
    /// @param recipient Dirección del productor
    /// @param tokenURI Enlace IPFS a la metadata visual del pasaporte
    function mintPasaporte(
        address recipient,
        string calldata tokenURI,
        string calldata _ubicacionGeografica,
        uint32 _areaM2,
        uint32 _cmSueloRecuperado,
        string calldata _estadoBiologico,
        string calldata _hashAnalisisLab,
        string calldata _ingredientesHash,
        string calldata _metodosAgricolas
    ) public soloVerificador returns (uint256) {
        if (_areaM2 == 0) revert Biota__AreaInvalida();

        uint256 newId = _nextTokenId;

        lotePasaporte[newId] = LoteData({
            verificador: address(0),
            esVerificado: false,
            isHumanVerified: false, // Inicia en false hasta pasar el flujo facial de G$
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

        _safeMint(recipient, newId);
        _setTokenURI(newId, tokenURI);

        emit PassportMinted(newId, recipient, _ubicacionGeografica);

        unchecked {
            _nextTokenId++;
        }

        return newId;
    }

    /// @notice El productor actualiza sus prácticas ecológicas para solicitar auditoría
    function actualizarEvidencia(
        uint256 tokenId,
        uint32 _nuevoCmSuelo,
        string calldata _nuevoEstado,
        string calldata _nuevoHashLab,
        string calldata _nuevosMetodos
    ) public soloProductor(tokenId) {
        LoteData storage lote = lotePasaporte[tokenId];

        lote.cmSueloRecuperado = _nuevoCmSuelo;
        lote.estadoBiologico = _nuevoEstado;
        lote.hashAnalisisLab = _nuevoHashLab;
        lote.metodosAgricolas = _nuevosMetodos;
        lote.ultimaActualizacion = uint64(block.timestamp);

        // Se reinician las validaciones al cambiar los datos del ecosistema
        lote.esVerificado = false;

        emit EvidenciaActualizada(tokenId, _nuevoCmSuelo, _nuevoEstado);
    }

    /// @notice Un oráculo o técnico verifica que la regeneración es real (Paso previo al UBI)
    function validarImpacto(uint256 tokenId) public soloVerificador {
        lotePasaporte[tokenId].esVerificado = true;
        lotePasaporte[tokenId].verificador = msg.sender;

        emit ImpactoVerificado(tokenId, msg.sender);
    }

    /// @notice Permite enlazar el resultado de la validación facial de GoodDollar
    function setHumanVerification(
        uint256 tokenId,
        bool status
    ) public soloVerificador {
        lotePasaporte[tokenId].isHumanVerified = status;
    }

    /// @notice Otorga o revoca permisos a cuentas para validar impacto ecológico
    function gestionarVerificador(
        address cuenta,
        bool estado
    ) public onlyOwner {
        isVerificador[cuenta] = estado;
    }

    /// @notice Permite a los verificadores del protocolo quemar un pasaporte por fraude ecológico
    function burnPassport(uint256 tokenId) public soloVerificador {
        _burn(tokenId);
        delete lotePasaporte[tokenId];
    }
}*/
