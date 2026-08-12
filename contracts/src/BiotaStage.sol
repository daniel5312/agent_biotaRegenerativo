// SPDX-License-Identifier: MIT
pragma solidity 0.8.28; // [SOLIDITY] Usamos una versión fija para asegurar que el bytecode (código compilado) sea siempre exactamente el mismo.

// [SOLIDITY] Importaciones de OpenZeppelin (El estándar de seguridad mundial).
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title BiotaStage
 * @author Biota Protocol (ReFi)
 * @notice [REFI] Este contrato representa las Certificaciones de Etapas Agrícolas (Onboarding, Laboratorio, etc).
 * @dev [EVM] Está diseñado para usarse con ERC-6551. Los NFTs se mintean DENTRO de la billetera del BiotaPassport, no del campesino.
 */
contract BiotaStage is ERC721, AccessControl {
    
    // [SOLIDITY] Definimos un rol seguro. Solo quien tenga este rol podrá mintear (El Agente 8004 de IA).
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // [EVM] Esta variable lleva el conteo de cuántas etapas hemos certificado. Empezará en 0.
    uint256 private _nextTokenId;

    // ==========================================
    // [REFI] OPTIMIZACIÓN EXTREMA DE GAS (LA MAGIA)
    // ==========================================
    // En vez de guardar un texto largo (string) que cuesta muchísimo gas en Celo, 
    // guardamos un 'bytes32'. Un hash SHA-256 siempre cabe exactamente en 32 bytes.
    // Esto hace que la transacción cueste casi $0.00.
    mapping(uint256 => bytes32) public dataHashes;

    // [SOLIDITY] Los eventos permiten que tu DApp en Next.js escuche cuando algo pasa en la blockchain.
    event StageCertified(uint256 indexed tokenId, address indexed passportWallet, bytes32 dataHash);

    /**
     * @notice [EVM] Constructor: Se ejecuta una sola vez cuando despliegas el contrato.
     * @param initialAdmin La dirección de tu billetera de administrador.
     */
    constructor(address initialAdmin) ERC721("Biota Stage Certification", "STAGE") {
        // [SOLIDITY] Le damos el poder supremo al administrador inicial.
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(MINTER_ROLE, initialAdmin); // El admin también puede mintear si el Agente falla.
    }

    /**
     * @notice [REFI] Certifica una nueva etapa guardando su Huella Dactilar (Hash).
     * @dev [CELO] Protegida con onlyRole. Ahorra gas usando 'unchecked' para la suma.
     * @param to [EVM] La dirección de la billetera (La billetera ERC-6551 del BiotaPassport).
     * @param _dataHash [REFI] El hash SHA-256 de los datos de Supabase (El ancla criptográfica).
     */
    function mintStage(address to, bytes32 _dataHash) external onlyRole(MINTER_ROLE) {
        // Obtenemos el ID actual.
        uint256 tokenId = _nextTokenId;

        // [REFI] Guardamos la huella dactilar inmutable en el contrato.
        dataHashes[tokenId] = _dataHash;

        // [EVM] Función interna y segura de OpenZeppelin para crear el NFT.
        _safeMint(to, tokenId);

        // Disparamos el evento para que la interfaz web se actualice.
        emit StageCertified(tokenId, to, _dataHash);

        // [EVM] OPTIMIZACIÓN DE GAS: 'unchecked' le dice a Solidity que no gaste energía revisando
        // si el número superará el límite máximo (overflow), porque es imposible mintear trillones de NFTs.
        unchecked {
            _nextTokenId++;
        }
    }

    /**
     * @notice [SOLIDITY] Función requerida por AccessControl y ERC721 para verificar interfaces.
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
