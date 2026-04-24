// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script} from "forge-std/Script.sol";
import {BiotaScrow} from "../src/BiotaScrow.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployBiotaScrow is Script {
    function run() external returns (address) {
        // [BLOCKCHAIN] Lee la llave privada de las variables de entorno
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // [CELO] Direcciones iniciales (Admin y Oracle IA)
        // Si no están en el .env, usamos el deployer por defecto.
        address adminAddress = vm.envOr("ADMIN_ADDRESS", vm.addr(deployerPrivateKey));
        address oracleAddress = vm.envOr("ORACLE_ADDRESS", vm.addr(deployerPrivateKey));

        vm.startBroadcast(deployerPrivateKey);

        // [SOLIDITY] 1. Desplegar la Implementación (Lógica)
        BiotaScrow logic = new BiotaScrow();

        // [SOLIDITY] 2. Preparar los datos de inicialización
        bytes memory initData = abi.encodeWithSelector(
            BiotaScrow.initialize.selector,
            adminAddress,
            oracleAddress
        );

        // [SOLIDITY] 3. Desplegar el Proxy apuntando a la implementación
        ERC1967Proxy proxy = new ERC1967Proxy(address(logic), initData);

        vm.stopBroadcast();

        return address(proxy);
    }
}
