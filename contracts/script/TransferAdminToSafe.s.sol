// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";

// [SEGURIDAD] Interfaz mínima para interactuar con los TimeLocks
interface IAccessControlDefaultAdminRules {
    function beginDefaultAdminTransfer(address newAdmin) external;
}

/**
 * @title TransferAdminToSafe
 * @notice FASE 1: Inicia la renuncia del EOA actual y transfiere el poder al Gnosis Safe.
 *         Esto activa automáticamente el TimeLock de 72 horas.
 */
contract TransferAdminToSafe is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("ADMIN_PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);
        
        // La Bóveda Safe que acabamos de crear en Mainnet
        address safeAddress = 0x4f2B46c179266Ad9Ed972202FAcDE9e7ac22c6B0;

        // Las direcciones CORRECTAS de los Proxies V4 en Celo Mainnet
        address passport = 0xF2432fa271adb07B13Aa6221d821a49Eb57de1c0;
        address splitter = 0x5C994bed61eD6f2B1F9A1Be505e48F9B979f0850;
        address scrow    = 0x4240Fc4C59d21a3C1CAed90aDB981d47f933a92B;
        address ubi      = 0xA3a720717eE892f249D5CDfe629FFd8C9B95964b;
        address rwa      = 0xb86c5d814fb694B0F85f57FD799532543EB1A98C;

        vm.startBroadcast(deployerPrivateKey);

        console.log("=== FASE 1: INICIANDO TRANSFERENCIA DE PODER A SAFE ===");
        console.log("Admin actual (Renunciante):", deployerAddress);
        console.log("Futuro Admin (Safe):", safeAddress);
        console.log("");

        // NOTA: Si alguna de estas transacciones ya se ejecutó, fallará al intentar
        // re-programar el transfer. Por seguridad y limpieza, el broadcast intentará todas.
        
        IAccessControlDefaultAdminRules(passport).beginDefaultAdminTransfer(safeAddress);
        console.log("1. BiotaPassport: Transferencia iniciada al Safe.");

        IAccessControlDefaultAdminRules(splitter).beginDefaultAdminTransfer(safeAddress);
        console.log("2. BiotaSplitter: Transferencia iniciada al Safe.");

        IAccessControlDefaultAdminRules(scrow).beginDefaultAdminTransfer(safeAddress);
        console.log("3. BiotaScrow: Transferencia iniciada al Safe.");

        IAccessControlDefaultAdminRules(ubi).beginDefaultAdminTransfer(safeAddress);
        console.log("4. BiotaUBI: Transferencia iniciada al Safe.");

        IAccessControlDefaultAdminRules(rwa).beginDefaultAdminTransfer(safeAddress);
        console.log("5. BiotaRWA: Transferencia iniciada al Safe.");

        console.log("==========================================================");
        console.log("EXITO: El reloj de seguridad de 72 horas ha comenzado.");
        console.log("En exactamente 3 dias, entra a app.safe.global y ejecuta");
        console.log("la funcion acceptDefaultAdminTransfer() en cada contrato.");
        console.log("==========================================================");
        
        vm.stopBroadcast();
    }
}
