// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {ERC20BurnableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title BiotaCarbon
 * @author Biota Protocol (ReFi)
 * @notice Activo financiero (ERC-20) que tokeniza la captura de carbono (1 Token = 1 Kilo).
 * @dev Mantiene 18 decimales. Permite la quema (retirement) para compensación de huella.
 */
contract BiotaCarbon is Initializable, ERC20Upgradeable, ERC20BurnableUpgradeable, AccessControlUpgradeable, UUPSUpgradeable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // Evento específico para la compensación ecológica (Retirement)
    event CarbonRetired(address indexed compensator, uint256 amount);
    event CarbonMinted(address indexed producer, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialAdmin) initializer public {
        __ERC20_init("Biota Carbon", "BIOC");
        __ERC20Burnable_init();
        __AccessControl_init();


        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        
        // [Capa Humana] El admin tiene permisos de minteo para revisar manualmente.
        _grantRole(MINTER_ROLE, initialAdmin);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(DEFAULT_ADMIN_ROLE)
        override
    {}

    /**
     * @notice Mintea (crea) nuevos tokens de carbono para un productor.
     * @dev Solo puede ser ejecutado por el Agente 8004 (Backend de Biota) o el Admin (Tú).
     * @param to Dirección del productor/campesino.
     * @param amount Cantidad a mintear (Recordar: 10^18 wei = 1 Kilo).
     */
    function mintCarbon(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
        emit CarbonMinted(to, amount);
    }

    /**
     * @notice Quema tokens de carbono para compensar la huella ecológica.
     * @dev Sobrescribe la función burn por defecto para emitir nuestro evento personalizado.
     * @param amount Cantidad de tokens a quemar/compensar.
     */
    function retireCarbon(uint256 amount) external {
        // Usa la función interna _burn de ERC20BurnableUpgradeable
        _burn(msg.sender, amount);
        emit CarbonRetired(msg.sender, amount);
    }
}
