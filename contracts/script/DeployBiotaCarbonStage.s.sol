// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/BiotaCarbon.sol";
import "../src/BiotaStage.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployBiotaCarbonStage is Script {
    function run() external {
        // Leer la llave privada de la variable de entorno
        uint256 deployerPrivateKey = vm.envUint("ADMIN_PRIVATE_KEY");
        address admin = vm.addr(deployerPrivateKey);
        
        // Iniciar la transacción con la llave del deployer
        vm.startBroadcast(deployerPrivateKey);

        // 1. Desplegar BiotaCarbon (Implementación + Proxy)
        BiotaCarbon carbonImpl = new BiotaCarbon();
        ERC1967Proxy carbonProxy = new ERC1967Proxy(
            address(carbonImpl),
            abi.encodeWithSelector(BiotaCarbon.initialize.selector, admin)
        );
        BiotaCarbon carbonToken = BiotaCarbon(address(carbonProxy));
        
        // 2. Desplegar BiotaStage (Implementación + Proxy)
        BiotaStage stageImpl = new BiotaStage();
        ERC1967Proxy stageProxy = new ERC1967Proxy(
            address(stageImpl),
            abi.encodeWithSelector(BiotaStage.initialize.selector, admin)
        );
        BiotaStage stageToken = BiotaStage(address(stageProxy));

        // 3. Otorgar permisos (MINTER_ROLE)
        // Le damos permiso al contrato BiotaStage para que pueda emitir (mintear) BiotaCarbon
        bytes32 MINTER_ROLE = carbonToken.MINTER_ROLE();
        carbonToken.grantRole(MINTER_ROLE, address(stageToken));

        vm.stopBroadcast();

        // Imprimir las direcciones en la terminal
        console.log("=========================================");
        console.log("BiotaCarbon (Proxy) deployed at:", address(carbonToken));
        console.log("BiotaCarbon (Impl) deployed at: ", address(carbonImpl));
        console.log("BiotaStage (Proxy) deployed at: ", address(stageToken));
        console.log("BiotaStage (Impl) deployed at:  ", address(stageImpl));
        console.log("=========================================");
    }
}
