// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/BiotaSplitter.sol";

/**
 * @title DeploySplitter - Automatización de Despliegue Biota
 * @notice Script para lanzar el contrato BiotaSplitter a redes Celo.
 * @dev Usa el motor de Foundry (Forge Script).
 */
contract DeploySplitter is Script {
    function run() external {
        // Obtenemos la llave privada desde el entorno de forma segura
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Iniciamos la transmisión de la transacción a la red
        vm.startBroadcast(deployerPrivateKey);

        // Despliegue del contrato
        BiotaSplitter splitter = new BiotaSplitter();
        
        // Registro visual en consola para el desarrollador
        console.log("-----------------------------------------");
        console.log("BiotaSplitter desplegado con EXITO!");
        console.log("Direccion:", address(splitter));
        console.log("-----------------------------------------");

        vm.stopBroadcast();
    }
}
