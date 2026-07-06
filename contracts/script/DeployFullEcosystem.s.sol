// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";

// [EVM] ERC1967Proxy: el contenedor Proxy estándar que delega las llamadas a la Implementación.
// BiotaPassport, BiotaScrow, BiotaUBI, BiotaSplitter y BiotaRWA son PROXIES UUPS.
// Esto significa que se despliegan en 2 pasos: Implementación (lógica) + Proxy (dirección permanente).
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

// [BLOCKCHAIN] Implementaciones lógicas de cada contrato (el código real).
// Estas NO son las direcciones que usan los usuarios. Las direcciones de los Proxies son las finales.
import {BiotaPassport} from "../src/BiotaPassport.sol";   // PROXY UUPS
import {BiotaSplitter} from "../src/BiotaSplitter.sol";   // PROXY UUPS
import {BiotaScrow} from "../src/BiotaScrow.sol";         // PROXY UUPS
import {BiotaUBI} from "../src/BiotaUBI.sol";             // PROXY UUPS
import {BiotaRWA} from "../src/BiotaRWA.sol";             // PROXY UUPS

/**
 * @title DeployFullEcosystem V4 — El "Master Script" de Biota Protocol
 * @author Biota Protocol
 * @notice [SENIOR] Despliega el ecosistema completo de contratos Core usando Proxies UUPS.
 * @dev [EVM] Orquesta el despliegue de 5 implementaciones + 5 proxies en una sola sesión.
 *      AaveStrategy se despliega por separado con DeployDeFiStrategy.s.sol.
 *
 * FLUJO DE DESPLIEGUE:
 *   1. BiotaPassport  (Identidad del productor)
 *   2. BiotaSplitter  (Router de pagos)
 *   3. BiotaScrow     (Motor de Doble Gatillo - se vincula al Passport)
 *   4. BiotaUBI       (Motor de streaming Superfluid)
 *   5. BiotaRWA       (Tokenización RWA del café físico)
 *
 * DESPUÉS DE ESTE SCRIPT, ejecutar DeployDeFiStrategy.s.sol para conectar Aave V3.
 */
contract DeployFullEcosystem is Script {
    
    // =========================================================
    // [CELO MAINNET] Direcciones oficiales de infraestructura
    // =========================================================
    
    /// @notice Contrato de identidad Anti-Sybil de GoodDollar en Celo Mainnet.
    address public constant GOODDOLLAR_IDENTITY = 0xC361A6E67822a0EDc17D899227dd9FC50BD62F42;
    
    /// @notice SuperToken G$ de GoodDollar para streams Superfluid en Celo Mainnet.
    address public constant GOODDOLLAR_SUPER_TOKEN = 0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A;

    function run() external {
        // [SEGURIDAD] Lee la llave privada del .env. Variable: ADMIN_PRIVATE_KEY
        // NUNCA se hardcodea una llave privada en el codigo fuente.
        uint256 deployerPrivateKey = vm.envUint("ADMIN_PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        console.log("=== BIOTA PROTOCOL V4: DESPLIEGUE MAESTRO DEL ECOSISTEMA ===");
        console.log("Deployer (wallet limpia post-hackeo):", deployerAddress);
        console.log("Red: Celo Mainnet (ChainID: 42220)");
        console.log("");

        // =========================================================
        // 1. BIOTAPASSPORT — PROXY UUPS
        // =========================================================
        // [REFI] Es la identidad del productor. El contrato raíz del que dependen todos.
        // Se despliega primero porque BiotaScrow y BiotaUBI necesitan su dirección.
        console.log("--- [1/5] Desplegando BiotaPassport (PROXY UUPS) ---");
        BiotaPassport passportImpl = new BiotaPassport();   // Implementacion logica
        ERC1967Proxy passportProxy = new ERC1967Proxy(
            address(passportImpl),
            abi.encodeWithSelector(BiotaPassport.initialize.selector, deployerAddress)
        );
        address passport = address(passportProxy);          // <-- Esta es la direccion real a guardar
        console.log("  Implementacion:", address(passportImpl));
        console.log("  Proxy (guardar esta):", passport);
        console.log("");

        // =========================================================
        // 2. BIOTASPLITTER — PROXY UUPS
        // =========================================================
        // [REFI] Router de pagos atómicos (96% Comerciante / 2% Collective / 2% Pool).
        // No tiene dependencias externas, se despliega independiente.
        console.log("--- [2/5] Desplegando BiotaSplitter (PROXY UUPS) ---");
        BiotaSplitter splitterImpl = new BiotaSplitter();
        ERC1967Proxy splitterProxy = new ERC1967Proxy(
            address(splitterImpl),
            abi.encodeWithSelector(BiotaSplitter.initialize.selector, deployerAddress)
        );
        address splitter = address(splitterProxy);
        console.log("  Implementacion:", address(splitterImpl));
        console.log("  Proxy (guardar esta):", splitter);
        console.log("");

        // =========================================================
        // 3. BIOTASCROW — PROXY UUPS
        // =========================================================
        // [REFI] Motor del Doble Gatillo. Se conecta al Passport para validar productores.
        // initialize(admin, oracle): admin = deployer, oracle = deployer (por ahora, se cambia despues a IA).
        console.log("--- [3/5] Desplegando BiotaScrow (PROXY UUPS) ---");
        BiotaScrow scrowImpl = new BiotaScrow();
        ERC1967Proxy scrowProxy = new ERC1967Proxy(
            address(scrowImpl),
            abi.encodeWithSelector(
                BiotaScrow.initialize.selector, 
                deployerAddress,  // defaultAdmin (MultiSig despues)
                deployerAddress   // agentOracle (IA Oraculo)
            )
        );
        address scrow = address(scrowProxy);
        // [CROSS-CONTRACT] Vinculamos BiotaScrow con el BiotaPassport recien desplegado.
        BiotaScrow(scrow).setPassportContract(passport);
        console.log("  Implementacion:", address(scrowImpl));
        console.log("  Proxy (guardar esta):", scrow);
        console.log("  -> Passport vinculado:", passport);
        console.log("");

        // =========================================================
        // 4. BIOTAUBI — PROXY UUPS
        // =========================================================
        // [REFI] Motor de streaming de UBI (G$) via Superfluid.
        // Requiere Passport + GoodDollar Identity + SuperToken de G$.
        console.log("--- [4/5] Desplegando BiotaUBI (PROXY UUPS) ---");
        BiotaUBI ubiImpl = new BiotaUBI();
        ERC1967Proxy ubiProxy = new ERC1967Proxy(
            address(ubiImpl),
            abi.encodeWithSelector(
                BiotaUBI.initialize.selector, 
                deployerAddress,          // initialOwner (Admin)
                passport,                 // BiotaPassport para validar productores
                GOODDOLLAR_IDENTITY,      // Contrato Anti-Sybil de GoodDollar
                GOODDOLLAR_SUPER_TOKEN    // G$ como SuperToken de Superfluid
            )
        );
        address ubi = address(ubiProxy);
        console.log("  Implementacion:", address(ubiImpl));
        console.log("  Proxy (guardar esta):", ubi);
        console.log("");

        // =========================================================
        // 5. BIOTARWA — PROXY UUPS
        // =========================================================
        // [REFI] Tokeniza el cafe fisico (ERC1155). Conecta los certificados con Aave V3.
        // La estrategia DeFi se conecta DESPUES con DeployDeFiStrategy.s.sol.
        console.log("--- [5/5] Desplegando BiotaRWA (PROXY UUPS) ---");
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

        // =========================================================
        // RESUMEN FINAL — Copiar estas direcciones al .env y constants.ts
        // =========================================================
        console.log("========================================================");
        console.log("=== ECOSISTEMA V4 DESPLEGADO CON EXITO ===");
        console.log("========================================================");
        console.log("BIOTA_PASSPORT_PROXY  =", passport);
        console.log("BIOTA_SPLITTER_PROXY  =", splitter);
        console.log("BIOTA_SCROW_PROXY     =", scrow);
        console.log("BIOTA_UBI_PROXY       =", ubi);
        console.log("BIOTA_RWA_PROXY       =", rwa);
        console.log("========================================================");
        console.log("SIGUIENTE PASO: Ejecutar DeployDeFiStrategy.s.sol");
        console.log("Luego: BiotaRWA.setYieldStrategy(cUSD, AaveStrategy)");
        console.log("========================================================");
    }
}
