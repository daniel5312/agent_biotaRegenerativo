// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {BiotaPassport} from "../src/BiotaPassport.sol";

contract DeployBiotaPassport is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // Desplegamos pasando el deployer como initialOwner
        BiotaPassport passport = new BiotaPassport(deployerAddress);

        console.log("BiotaPassport desplegado en:", address(passport));
        console.log("Owner inicial:", deployerAddress);

        vm.stopBroadcast();
    }
}
