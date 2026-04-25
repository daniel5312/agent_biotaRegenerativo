// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script} from "forge-std/Script.sol";
import {BiotaScrow} from "../src/BiotaScrow.sol";

/**
 * @title UpgradeBiotaScrow
 * @notice Script para actualizar la lógica del Escrow (V2) e integrar el BiotaPassport.
 */
contract UpgradeBiotaScrow is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Direcciones desde el .env
        address proxyAddress = vm.envAddress("NEXT_PUBLIC_BIOTASCROW_PROXY_ADDRESS");
        address passportAddress = vm.envAddress("NEXT_PUBLIC_BIOTA_PASSPORT_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Desplegar la nueva implementación lógica (V2)
        BiotaScrow newLogic = new BiotaScrow();

        // 2. Ejecutar el Upgrade en el Proxy existente
        // Usamos BiotaScrow(proxyAddress) para acceder a las funciones UUPS.
        BiotaScrow(proxyAddress).upgradeToAndCall(address(newLogic), "");

        // 3. Vincular el contrato de Pasaporte para las validaciones cross-contract
        BiotaScrow(proxyAddress).setPassportContract(passportAddress);

        vm.stopBroadcast();
    }
}
