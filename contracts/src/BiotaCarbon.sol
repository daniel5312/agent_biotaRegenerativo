// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title BiotaCarbon
 * @author Biota Protocol (ReFi)
 * @notice Activo financiero (ERC-20) que tokeniza la captura de carbono (1 Token = 1 Kilo).
 * @dev Mantiene 18 decimales. Permite la quema (retirement) para compensación de huella.
 */
contract BiotaCarbon is ERC20, ERC20Burnable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // Evento específico para la compensación ecológica (Retirement)
    event CarbonRetired(address indexed compensator, uint256 amount);
    event CarbonMinted(address indexed producer, uint256 amount);

    constructor(address initialAdmin) ERC20("Biota Carbon", "BIOC") {
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        
        // [Capa Humana] El admin tiene permisos de minteo para revisar manualmente.
        _grantRole(MINTER_ROLE, initialAdmin);
    }

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
        // Usa la función interna _burn de ERC20Burnable (verifica saldos automáticamente)
        _burn(msg.sender, amount);
        emit CarbonRetired(msg.sender, amount);
    }
}
