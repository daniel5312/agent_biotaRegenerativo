// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title IBiotaPassport
 * @notice [CROSS-CONTRACT] Interfaz liviana (ligera) del contrato BiotaPassport V4.
 *
 * @dev [ARQUITECTURA] ¿Por qué existe este archivo?
 * En lugar de importar el contrato BiotaPassport.sol completo (300+ líneas de código)
 * en cada contrato que lo necesite, usamos una "Interfaz": una tarjeta de visita
 * que solo expone las funciones públicas que otros contratos necesitan conocer.
 *
 * Ventajas:
 * ✅ [GAS] El compilador no mete el bytecode del Pasaporte en el Scrow, UBI, etc.
 * ✅ [ARQUITECTURA] Bajo acoplamiento: si cambia la implementación interna del
 *    Pasaporte, los contratos que usan esta interfaz NO se rompen.
 * ✅ [SEGURIDAD] Principio de mínimo privilegio: los contratos satélite solo
 *    pueden leer datos del Pasaporte, no escribir ni modificar nada.
 *
 * Contratos que la usan:
 * - BiotaScrow.sol  → valida que el productor tiene pasaporte verificado antes de pagar.
 * - BiotaUBI.sol    → verifica que el lote tiene auditoría de suelo antes de abrir el stream.
 */
interface IBiotaPassport {

    /**
     * @notice [ERC721] Devuelve cuántos pasaportes (NFTs) posee una dirección.
     * @dev Heredado del estándar ERC721 de OpenZeppelin.
     * @param owner Dirección del productor o inversor a consultar.
     * @return Número de pasaportes. Si es 0, el productor no está registrado en Biota.
     */
    function balanceOf(address owner) external view returns (uint256);

    /**
     * @notice [ERC721] Devuelve quién es el dueño de un pasaporte específico.
     * @dev Heredado del estándar ERC721. Revierte si el token no existe.
     * @param tokenId El ID del pasaporte NFT (ej: pasaporte #1, #2, #3...).
     * @return La dirección de la wallet que posee ese pasaporte.
     */
    function ownerOf(uint256 tokenId) external view returns (address);

    /**
     * @notice [REFI] Devuelve los datos biológicos y de validación de un lote de tierra.
     * @dev [EVM] El orden de los campos DEBE coincidir exactamente con el struct LoteData
     *      declarado en BiotaPassport.sol. Si no coinciden, el contrato lee datos incorrectos.
     *      Este Layout es el V4 (Hard Fork). Eliminamos el layout viejo V1/V2.
     * @param tokenId El ID del pasaporte del lote a consultar.
     * @return verificador     [REFI] Wallet del ingeniero agrónomo que auditó el lote.
     * @return areaM2          [REFI] Área de la finca en metros cuadrados.
     * @return cmSueloRecuperado [REFI] Centímetros de suelo vivo recuperado (métrica de impacto).
     * @return esVerificado    [SEGURIDAD] true si un agrónomo aprobó los datos del lote.
     * @return isHumanVerified [GOODDOLLAR] true si el productor pasó la verificación facial Anti-Sybil.
     * @return fechaRegistro   [EVM] Timestamp (Unix) de cuando se creó el pasaporte.
     * @return ultimaActualizacion [EVM] Timestamp de la última subida de evidencia del productor.
     * @return ubicacionGeografica [REFI] Coordenadas o descripción de la finca.
     * @return estadoBiologico [REFI] Estado de salud del cultivo.
     * @return hashAnalisisLab [BLOCKCHAIN] Hash IPFS del PDF de análisis de laboratorio.
     * @return ingredientesHash [BLOCKCHAIN] Hash IPFS de los insumos agrícolas usados.
     * @return metodosAgricolas [REFI] Método de cultivo (ej: sintrópico, orgánico).
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
