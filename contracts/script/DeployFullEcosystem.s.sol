// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

// [BLOCKCHAIN] Importación de nuestras implementaciones lógicas.
import {BiotaPassport} from "../src/BiotaPassport.sol";
import {BiotaSplitter} from "../src/BiotaSplitter.sol";
import {BiotaScrow} from "../src/BiotaScrow.sol";
import {BiotaUBI} from "../src/BiotaUBI.sol";

/**
 * @title DeployFullEcosystem - El "Master Script" de Biota
 * @notice [SENIOR] Este script despliega el ecosistema completo usando Proxies UUPS.
 * @dev [EVM] Orquesta el despliegue de 4 implementaciones y 4 proxies en una sola transacción.
 */
contract DeployFullEcosystem is Script {
    
    // [CELO] Direcciones oficiales de infraestructura en Mainnet.
    address public constant GOODDOLLAR_IDENTITY = 0xC361A6E67822a0EDc17D899227dd9FC50BD62F42;
    address public constant GOODDOLLAR_SUPER_TOKEN = 0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        console.log("=== INICIANDO DESPLIEGUE SENIOR DE BIOTA PROTOCOL ===");

        // 1. [REFI] Desplegar BiotaPassport (Upgradeable)
        BiotaPassport passportImpl = new BiotaPassport();
        ERC1967Proxy passportProxy = new ERC1967Proxy(
            address(passportImpl),
            abi.encodeWithSelector(BiotaPassport.initialize.selector, deployerAddress)
        );
        address passport = address(passportProxy);
        console.log("BiotaPassport (Proxy) desplegado en:", passport);

        // 2. [REFI] Desplegar BiotaSplitter (Upgradeable)
        BiotaSplitter splitterImpl = new BiotaSplitter();
        ERC1967Proxy splitterProxy = new ERC1967Proxy(
            address(splitterImpl),
            abi.encodeWithSelector(BiotaSplitter.initialize.selector, deployerAddress)
        );
        console.log("BiotaSplitter (Proxy) desplegado en:", address(splitterProxy));

        // 3. [REFI] Desplegar BiotaScrow (Upgradeable)
        BiotaScrow scrowImpl = new BiotaScrow();
        ERC1967Proxy scrowProxy = new ERC1967Proxy(
            address(scrowImpl),
            abi.encodeWithSelector(BiotaScrow.initialize.selector, deployerAddress, deployerAddress) // Admin y Oracle inicial
        );
        BiotaScrow(address(scrowProxy)).setPassportContract(passport);
        console.log("BiotaScrow (Proxy) desplegado en:", address(scrowProxy));

        // 4. [REFI] Desplegar BiotaUBI (Upgradeable)
        BiotaUBI ubiImpl = new BiotaUBI();
        ERC1967Proxy ubiProxy = new ERC1967Proxy(
            address(ubiImpl),
            abi.encodeWithSelector(
                BiotaUBI.initialize.selector, 
                deployerAddress, 
                passport, 
                GOODDOLLAR_IDENTITY, 
                GOODDOLLAR_SUPER_TOKEN
            )
        );
        console.log("BiotaUBI (Proxy) desplegado en:", address(ubiProxy));

        console.log("=== ECOSISTEMA DESPLEGADO Y VINCULADO CON EXITO ===");

        vm.stopBroadcast();
    }
}
