// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title BiotaStage
 * @author Biota Protocol (ReFi)
 * @notice [REFI] Este contrato representa las Certificaciones de Etapas Agrícolas (Onboarding, Laboratorio, etc).
 * @dev [EVM] Está diseñado para usarse con ERC-6551. Los NFTs se mintean DENTRO de la billetera del BiotaPassport, no del campesino.
 */
contract BiotaStage is Initializable, ERC721Upgradeable, AccessControlUpgradeable, UUPSUpgradeable {
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 private _nextTokenId;

    // ==========================================
    // [REFI] OPTIMIZACIÓN EXTREMA DE GAS (LA MAGIA)
    // ==========================================
    mapping(uint256 => bytes32) public dataHashes;

    event StageCertified(uint256 indexed tokenId, address indexed passportWallet, bytes32 dataHash);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialAdmin) initializer public {
        __ERC721_init("Biota Stage Certification", "STAGE");
        __AccessControl_init();


        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(MINTER_ROLE, initialAdmin); // El admin también puede mintear si el Agente falla.
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(DEFAULT_ADMIN_ROLE)
        override
    {}

    /**
     * @notice [REFI] Certifica una nueva etapa guardando su Huella Dactilar (Hash).
     * @dev [CELO] Protegida con onlyRole. Ahorra gas usando 'unchecked' para la suma.
     * @param to [EVM] La dirección de la billetera (La billetera ERC-6551 del BiotaPassport).
     * @param _dataHash [REFI] El hash SHA-256 de los datos de Supabase (El ancla criptográfica).
     */
    function mintStage(address to, bytes32 _dataHash) external onlyRole(MINTER_ROLE) {
        uint256 tokenId = _nextTokenId;

        dataHashes[tokenId] = _dataHash;

        _safeMint(to, tokenId);

        emit StageCertified(tokenId, to, _dataHash);

        unchecked {
            _nextTokenId++;
        }
    }

    /**
     * @notice [SOLIDITY] Función requerida por AccessControl y ERC721 para verificar interfaces.
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721Upgradeable, AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
