// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {BiotaRWA} from "../src/BiotaRWA.sol";

contract DeployBiotaRWAOnly is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("ADMIN_PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        console.log("=== BIOTA PROTOCOL V4: DESPLIEGUE INDIVIDUAL RWA ===");
        console.log("Deployer:", deployerAddress);
        console.log("");

        console.log("--- Desplegando BiotaRWA (PROXY UUPS) ---");
        BiotaRWA rwaImpl = new BiotaRWA();
        ERC1967Proxy rwaProxy = new ERC1967Proxy(
            address(rwaImpl),
            abi.encodeWithSelector(BiotaRWA.initialize.selector, deployerAddress)
        );
        address rwa = address(rwaProxy);
        
        console.log("  Implementacion:", address(rwaImpl));
        console.log("  Proxy (guardar esta):", rwa);
        console.log("");
        
        vm.stopBroadcast();
    }
}
