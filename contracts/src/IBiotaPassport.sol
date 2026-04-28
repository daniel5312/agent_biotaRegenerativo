// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title IBiotaPassport
 * @notice [CROSS-CONTRACT] Interfaz ligera para interactuar con el BiotaPassport.
 * @dev Expone solo las funciones necesarias para validar la elegibilidad del productor. 
 * Esta interfaz optimiza el consumo de gas al no importar el contrato completo.
 */
interface IBiotaPassport {
    /**
     * @notice Devuelve el número de pasaportes (tokens) que posee el agricultor.
     * @param owner Dirección del agricultor.
     */
    function balanceOf(address owner) external view returns (uint256);

    /**
     * @notice Devuelve los detalles de un pasaporte específico.
     * @dev El orden de los parámetros debe coincidir exactamente con el mapping del contrato original.
     * @param tokenId ID del pasaporte.
     */
    function lotePasaporte(uint256 tokenId) external view returns (
        address verificador,
        bool esVerificado,
        bool isHumanVerified,
        uint32 areaM2,
        uint32 cmSueloRecuperado,
        uint64 fechaRegistro,
        uint64 ultimaActualizacion
    );
}
