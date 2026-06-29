// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script} from "forge-std/Script.sol";
import {BiotaPassport} from "../src/BiotaPassport.sol";

/**
 * @title AdminConfig
 * @notice Script administrativo independiente para configurar parámetros y tesorerías.
 */
contract AdminConfig is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // [BLOCKCHAIN] Dirección fija del Proxy del Pasaporte en Celo Mainnet
        address proxyAddress = 0x89Bd1517b6feE42f0DC3Cb7C5c4453b4Ca3d0442;

        vm.startBroadcast(deployerPrivateKey);

        // 1. Configurar los precios dinámicos
        // 0.01 CELO (nativo) y 0.10 G$ (El token G$ tiene 18 decimales, así que 0.10 G$ = 0.10 * 10^18)
        BiotaPassport(proxyAddress).setMintPrices(0.01 ether, 100000000000000000);

        // 2. Configurar las rutas del Router Inteligente
        BiotaPassport(proxyAddress).setTreasuryAddresses(
            0xDd1c12f197E6D1E2FBA15487AaAE500eF6e07BCA, // Mujeres Quenia (G$ - Nueva Tesorería)
            0x0d43131f1577310D6349bAF9D6Da4fC1Cd39764C, // Mujeres Carmen (G$)
            0x9158C35f1a054F25f9D45EA47107D54a2ea25945, // Pool Login Wallet (5% CELO)
            0x9bc43f955ce11948e4fD6EAC28d46875Fba9f5F9, // Biota Productores (95% CELO)
            0x25db74CF4E7BA120526fd87e159CF656d94bAE43  // Engagement Rewards (GoodDollar Claim)
        );

        vm.stopBroadcast();
    }
}
