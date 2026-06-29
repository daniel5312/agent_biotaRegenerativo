// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title IBiotaPassport
 * @notice [CROSS-CONTRACT] Interfaz ligera para interactuar con el BiotaPassport V4.
 */
interface IBiotaPassport {
    function balanceOf(address owner) external view returns (uint256);
    function ownerOf(uint256 tokenId) external view returns (address);

    /**
     * @notice Devuelve los detalles de un pasaporte específico (Layout V4).
     */
    function lotePasaporte(uint256 tokenId) external view returns (
        address verificador,
        uint32 areaM2,
        uint32 cmSueloRecuperado,
        bool esVerificado,
        bool isHumanVerified,
        uint64 fechaRegistro,
        uint64 ultimaActualizacion,
        string memory ubicacionGeografica,
        string memory estadoBiologico,
        string memory hashAnalisisLab,
        string memory ingredientesHash,
        string memory metodosAgricolas
    );
}
