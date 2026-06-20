// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {BiotaRWA} from "../src/BiotaRWA.sol";

/**
 * @title DeployBiotaRWA - Script de despliegue para la Tienda RWA
 * @notice [SENIOR] Este script despliega el contrato BiotaRWA usando Proxies UUPS.
 * @dev [EVM] Esto debe ejecutarse ANTES de DeployDeFiStrategy, ya que
 *      la estrategia necesita la dirección del BiotaRWA para enlazarla después.
 */
contract DeployBiotaRWA is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("ADMIN_PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        console.log("=== DESPLEGANDO BIOTA RWA (TIENDA ERC-1155) ===");
        console.log("Deployer:", deployerAddress);

        // 1. Desplegar implementación lógica
        BiotaRWA rwaImpl = new BiotaRWA();
        console.log("BiotaRWA (Implementacion) desplegado en:", address(rwaImpl));

        // 2. Desplegar Proxy ERC1967 y llamar a initialize(initialOwner)
        ERC1967Proxy rwaProxy = new ERC1967Proxy(
            address(rwaImpl),
            abi.encodeWithSelector(BiotaRWA.initialize.selector, deployerAddress)
        );
        
        address proxyAddress = address(rwaProxy);
        console.log("BiotaRWA (Proxy UUPS) desplegado en:", proxyAddress);
        console.log("=== DESPLIEGUE EXITOSO ===");

        vm.stopBroadcast();
    }
}
