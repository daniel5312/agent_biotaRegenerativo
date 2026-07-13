// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {BiotaPassport} from "../src/BiotaPassport.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployBiotaPassport is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Desplegamos la Implementación (Lógica)
        BiotaPassport implementation = new BiotaPassport(); // Constructor sin argumentos

        // 2. Desplegamos el Proxy y llamamos a initialize() atómicamente
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            abi.encodeWithSelector(BiotaPassport.initialize.selector, deployerAddress)
        );

        // 3. Casteamos el Proxy a la interfaz de BiotaPassport
        BiotaPassport passport = BiotaPassport(address(proxy));

        console.log("BiotaPassport desplegado en:", address(passport));
        console.log("Owner inicial:", deployerAddress);

        vm.stopBroadcast();
    }
}
