// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/BiotaCarbon.sol";
import "../src/BiotaStage.sol";

contract DeployBiotaCarbonStage is Script {
    function run() external {
        // Leer la llave privada de la variable de entorno
        uint256 deployerPrivateKey = vm.envUint("FONDEO_PRIVATE_KEY");
        
        // Iniciar la transacción con la llave del deployer
        vm.startBroadcast(deployerPrivateKey);

        // 1. Desplegar BiotaCarbon (El Dinero ERC-20)
        // address(this) es temporal. En producción, el admin inicial puede ser el deployer
        address admin = vm.addr(deployerPrivateKey);
        BiotaCarbon carbonToken = new BiotaCarbon(admin);
        
        // 2. Desplegar BiotaStage (El Pasaporte Auditor ERC-721)
        BiotaStage stageToken = new BiotaStage(admin);

        // 3. Otorgar permisos (MINTER_ROLE)
        // Le damos permiso al contrato BiotaStage para que pueda emitir (mintear) BiotaCarbon
        bytes32 MINTER_ROLE = carbonToken.MINTER_ROLE();
        carbonToken.grantRole(MINTER_ROLE, address(stageToken));

        vm.stopBroadcast();

        // Imprimir las direcciones en la terminal
        console.log("=========================================");
        console.log("BiotaCarbon deployed at:", address(carbonToken));
        console.log("BiotaStage deployed at: ", address(stageToken));
        console.log("=========================================");
    }
}
