// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script} from "forge-std/Script.sol";
import {BiotaPassport} from "../src/BiotaPassport.sol";

/**
 * @title UpgradeBiotaPassport
 * @notice Script para desplegar la V3 (Router Inteligente) y hacer el upgrade del proxy.
 */
contract UpgradeBiotaPassport is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // [BLOCKCHAIN] Dirección fija del Proxy del Pasaporte en Celo Mainnet
        address proxyAddress = 0x89Bd1517b6feE42f0DC3Cb7C5c4453b4Ca3d0442;

        vm.startBroadcast(deployerPrivateKey);

        // 1. Desplegar la nueva implementación lógica (V3)
        BiotaPassport newLogic = new BiotaPassport();

        // 2. Ejecutar el Upgrade en el Proxy existente
        BiotaPassport(proxyAddress).upgradeToAndCall(address(newLogic), "");

        vm.stopBroadcast();
    }
}
