// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import {SuperTokenV1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";

/// @title Interfaz mínima del Pasaporte Biota (Core ReFi)
interface IBiotaPassport {
    function ownerOf(uint256 tokenId) external view returns (address);

    function lotePasaporte(
        uint256 tokenId
    )
        external
        view
        returns (
            address verificador,
            bool esVerificado,
            bool isHumanVerified,
            uint32 areaM2,
            uint32 cmSueloRecuperado,
            uint64 fechaRegistro,
            uint64 ultimaActualizacion
        );
}

/// @title Interfaz de Identidad de GoodDollar (Fricción Cero)
interface IIdentity {
    /// @notice Retorna la dirección raíz si el usuario superó la prueba facial
    function getWhitelistedRoot(
        address account
    ) external view returns (address);
}

/// @title BiotaUBI - Bóveda de Recompensas de Impacto Ecológico (Superfluid Streaming)
/// @notice Gotea liquidez regenerativa al guardián del ecosistema de manera ininterrumpida.
/// @dev Utiliza la librería SuperTokenV1 para crear streams directos de G$ (SuperToken).
contract BiotaUBI is Ownable {
    using SuperTokenV1Library for ISuperToken;

    // --- Variables Inmutables ---
    IBiotaPassport public immutable biotaPassport;
    IIdentity public immutable identity;
    ISuperToken public immutable gDollarToken;

    // --- Custom Errors ---
    error UBI__NoEsDueno();
    error UBI__ImpactoNoVerificado();
    error UBI__NoEsHumano();
    error UBI__FlujoYaActivo();
    error UBI__FlujoNoActivo();

    // --- Estado ---
    mapping(uint256 => bool) public isFlowActive;

    /// @notice Eventos de trazabilidad ReFi
    event FlowStarted(
        uint256 indexed tokenId,
        address indexed producer,
        int96 flowRate
    );
    event FlowStopped(uint256 indexed tokenId, address indexed producer);

    /// @dev Configuración de la tesorería (Inyectar las direcciones de Mainnet Celo)
    constructor(
        address initialOwner,
        address _biotaPassport,
        address _gdIdentity,
        address _gDollarSuperToken
    ) Ownable(initialOwner) {
        biotaPassport = IBiotaPassport(_biotaPassport);
        identity = IIdentity(_gdIdentity);
        gDollarToken = ISuperToken(_gDollarSuperToken);
    }

    /// @notice Inicia un goteo continuo (Stream) de G$ usando Superfluid
    /// @dev Libera capital regenerativo basado en la prueba de humanidad y salud del suelo.
    /// @dev FlowRate formula: (amountPerMonth * 1e18) / 2,592,000
    /// @param tokenId ID del Pasaporte del Productor
    /// @param flowRate Cantidad de tokens G$ a gotear por segundo (en wei/seg)
    function iniciarFlujoUBI(
        uint256 tokenId,
        int96 flowRate
    ) external onlyOwner {
        if (isFlowActive[tokenId]) revert UBI__FlujoYaActivo();

        address productor = biotaPassport.ownerOf(tokenId);

        // 1. Verificación Ecológica: Validar que el suelo esté en regeneración comprobada
        (, bool esVerificado, , , , , ) = biotaPassport.lotePasaporte(tokenId);
        if (!esVerificado) revert UBI__ImpactoNoVerificado();

        // 2. Fricción Cero: Verificación Anti-Sybil (Humanidad) directa con GoodDollar
        // Si retorna address(0), el productor no ha pasado la prueba facial
        if (identity.getWhitelistedRoot(productor) == address(0)) {
            revert UBI__NoEsHumano();
        }

        // 3. Abrir la bóveda: Crear o actualizar el Stream de fondos (goteo continuo)
        gDollarToken.flow(productor, flowRate);

        isFlowActive[tokenId] = true;
        emit FlowStarted(tokenId, productor, flowRate);
    }

    /// @notice Frena el goteo de liquidez si el productor incumple sus deberes ecológicos
    /// @param tokenId ID del Pasaporte del Productor
    function detenerFlujoUBI(uint256 tokenId) external onlyOwner {
        if (!isFlowActive[tokenId]) revert UBI__FlujoNoActivo();

        address productor = biotaPassport.ownerOf(tokenId);

        // 4. Cerrar la bóveda: Reducir el flowRate a 0 destruye el stream
        gDollarToken.flow(productor, 0);

        isFlowActive[tokenId] = false;
        emit FlowStopped(tokenId, productor);
    }

    /// @notice Hook opcional para inyectar donaciones climáticas de GoodCollective
    /// @dev Recibe aportes al pool de recompensas directamente
    function fundFromCollective(uint256 amountG) external {
        gDollarToken.transferFrom(msg.sender, address(this), amountG);
    }
}
