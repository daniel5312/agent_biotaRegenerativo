// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {BiotaRWA} from "../src/BiotaRWA.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployBiotaRWAOnly is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("ADMIN_PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);

        // Agregamos un pequeño multiplicador de gas en la configuracion de foundry o forzamos en CLI
        vm.startBroadcast(deployerPrivateKey);

        console.log("=== BIOTA PROTOCOL V4: DESPLEGANDO SOLO RWA (Rescue) ===");
        console.log("Deployer:", deployerAddress);

        BiotaRWA rwaImpl = new BiotaRWA();
        ERC1967Proxy rwaProxy = new ERC1967Proxy(
            address(rwaImpl),
            abi.encodeWithSelector(BiotaRWA.initialize.selector, deployerAddress)
        );
        address rwa = address(rwaProxy);
        
        console.log("BIOTA_RWA_PROXY =", rwa);
        vm.stopBroadcast();
    }
}
