// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

// ============================================================
//  DeployDeFiStrategy.s.sol — Script de Despliegue DeFi
// ============================================================
//
//  @custom:origin  Biota Protocol (TICKET-101, Sprint Inversor)
//  @custom:network Celo Mainnet (chainId: 42220)
//  @custom:version 1.0.0
//  @custom:status  LISTO PARA DESPLEGAR
//
//  ┌─────────────────────────────────────────────────────────┐
//  │            ¿QUÉ DESPLIEGA ESTE SCRIPT?                   │
//  │                                                         │
//  │  1. AaveStrategy.sol → Adaptador para Aave V3 en Celo   │
//  │  2. (Opcional) MoolaStrategy.sol → Fallback con Moola    │
//  │                                                         │
//  │  NOTA: Estos contratos NO son upgradeable porque son     │
//  │  adaptadores simples sin estado complejo. Si se quiere   │
//  │  cambiar la estrategia, se despliega un nuevo contrato   │
//  │  y se llama BiotaRWA.setYieldStrategy(nuevaDirección).   │
//  └─────────────────────────────────────────────────────────┘
//
//  [PRERREQUISITOS]
//
//  1. Tener las siguientes variables de entorno configuradas:
//     - PRIVATE_KEY: clave privada del deployer
//     - CELO_RPC_URL: URL del nodo RPC de Celo (ej: https://forno.celo.org)
//
//  2. Conocer las direcciones de Aave V3 en Celo:
//     - Pool: se obtiene de PoolAddressesProvider.getPool()
//     - aToken (acUSD): se obtiene de PoolDataProvider.getReserveTokensAddresses(cUSD)
//
//  [CÓMO EJECUTAR]
//
//  # Paso 1: Simulación (dry-run, no despliega nada)
//  forge script script/DeployDeFiStrategy.s.sol:DeployDeFiStrategy \
//    --rpc-url $CELO_RPC_URL \
//    -vvvv
//
//  # Paso 2: Despliegue real en Celo Mainnet
//  forge script script/DeployDeFiStrategy.s.sol:DeployDeFiStrategy \
//    --rpc-url $CELO_RPC_URL \
//    --broadcast \
//    --verify \
//    -vvvv
//
//  [POST-DESPLIEGUE]
//
//  Después de desplegar AaveStrategy, hay que conectarlo al ecosistema:
//
//    1. Llamar BiotaRWA.setYieldStrategy(dirección_AaveStrategy)
//       → Esto activa la estrategia en el contrato principal.
//
//    2. Verificar el contrato en CeloScan:
//       forge verify-contract <ADDRESS> AaveStrategy \
//         --chain-id 42220 \
//         --constructor-args $(cast abi-encode "constructor(address,address,address)" $POOL $CUSD $ACUSD)
// ============================================================

import {Script, console} from "forge-std/Script.sol";
import {AaveStrategy} from "../src/AaveStrategy.sol";

// [NOTA] Descomentar la siguiente línea cuando se confirmen las
// direcciones de Moola y se quiera desplegar también MoolaStrategy:
// import {MoolaStrategy} from "../src/MoolaStrategy.sol";

/**
 * @title DeployDeFiStrategy — Script Foundry para Desplegar Adaptadores DeFi
 * @author Biota Protocol
 * @notice Despliega AaveStrategy (y opcionalmente MoolaStrategy) en Celo Mainnet.
 * @dev Sigue el mismo patrón de DeployFullEcosystem.s.sol para consistencia.
 *
 *      CONTRATOS DESPLEGADOS:
 *      - AaveStrategy: adaptador para Aave V3 (producción)
 *      - MoolaStrategy: adaptador para Moola Market (fallback/legacy)
 */
contract DeployDeFiStrategy is Script {

    // =========================================================
    // [CELO MAINNET] Direcciones oficiales verificadas
    // =========================================================
    
    /// @notice Stablecoin cUSD en Celo Mainnet (Mento Protocol)
    /// @dev Verificada en: https://celoscan.io/token/0x765DE816845861e75A25fCA122bb6898B8B1282a
    address public constant CUSD = 0x765DE816845861e75A25fCA122bb6898B8B1282a;

    /// @notice PoolAddressesProvider de Aave V3 en Celo Mainnet
    /// @dev Verificada en: https://github.com/bgd-labs/aave-address-book
    ///      Este contrato es el "registro central" de Aave V3.
    ///      Todas las demás direcciones se obtienen de aquí.
    address public constant AAVE_POOL_ADDRESSES_PROVIDER = 0x52D306e36E3B6B02c153d0266ff0f85d18BCD413;

    // =========================================================
    // [AAVE V3] Direcciones que se deben obtener on-chain
    // =========================================================
    // 
    // ANTES DE DESPLEGAR, ejecutar estos comandos con cast para
    // obtener las direcciones reales del Pool y aToken en Celo:
    //
    // # Obtener la dirección del Pool:
    // cast call 0x52D306e36E3B6B02c153d0266ff0f85d18BCD413 \
    //   "getPool()(address)" --rpc-url $CELO_RPC_URL
    //
    // # Obtener la dirección del PoolDataProvider:
    // cast call 0x52D306e36E3B6B02c153d0266ff0f85d18BCD413 \
    //   "getPoolDataProvider()(address)" --rpc-url $CELO_RPC_URL
    //
    // # Obtener aToken (acUSD) para cUSD:
    // cast call <POOL_DATA_PROVIDER> \
    //   "getReserveTokensAddresses(address)(address,address,address)" \
    //   0x765DE816845861e75A25fCA122bb6898B8B1282a \
    //   --rpc-url $CELO_RPC_URL
    //
    // Luego actualizar estas constantes con los valores obtenidos:
    // =========================================================

    /// @notice Pool de Aave V3 en Celo — ACTUALIZAR ANTES DE DEPLOY
    /// @dev Obtener con: cast call $PROVIDER "getPool()(address)" --rpc-url $CELO_RPC_URL
    address public constant AAVE_POOL = 0x3E59A31363E2ad014dcbc521c4a0d5757d9f3402;

    /// @notice aToken de cUSD (acUSD) en Aave V3 Celo — ACTUALIZAR ANTES DE DEPLOY
    /// @dev Obtener con: cast call $DATA_PROVIDER "getReserveTokensAddresses(address)(...)" $CUSD
    address public constant ACUSD = 0xBba98352628B0B0c4b40583F593fFCb630935a45;

    // =========================================================
    // FUNCIÓN PRINCIPAL: run()
    // =========================================================
    function run() external {
        // [SEGURIDAD] Lee la llave privada del .env. Variable: ADMIN_PRIVATE_KEY
        uint256 deployerPrivateKey = vm.envUint("ADMIN_PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);

        // [VALIDACIÓN] Verificar que las direcciones estén configuradas
        require(AAVE_POOL != address(0), "DeployDeFi: AAVE_POOL no configurado. Lee los comentarios del script.");
        require(ACUSD != address(0), "DeployDeFi: ACUSD no configurado. Lee los comentarios del script.");

        vm.startBroadcast(deployerPrivateKey);

        console.log("=== BIOTA PROTOCOL: DESPLIEGUE DEFI (TICKET-101) ===");
        console.log("Deployer:", deployerAddress);
        console.log("Red: Celo Mainnet (42220)");
        console.log("");

        // -------------------------------------------------------
        // 1. [AAVE V3] Desplegar AaveStrategy
        // -------------------------------------------------------
        // Este es el adaptador principal de producción.
        // Conecta Biota con el Pool oficial de Aave V3 en Celo.
        console.log("--- Desplegando AaveStrategy ---");
        console.log("  Pool Aave V3:", AAVE_POOL);
        console.log("  Asset (cUSD):", CUSD);
        console.log("  aToken (acUSD):", ACUSD);

        AaveStrategy aaveStrategy = new AaveStrategy(
            AAVE_POOL,   // Pool oficial de Aave V3
            CUSD,        // cUSD como token base
            ACUSD        // acUSD como token de rendimiento
        );

        console.log("  -> AaveStrategy desplegado en:", address(aaveStrategy));
        console.log("");

        // -------------------------------------------------------
        // 2. [MOOLA] (OPCIONAL) Desplegar MoolaStrategy como fallback
        // -------------------------------------------------------
        // Descomentar cuando se confirmen las direcciones de Moola.
        // MoolaStrategy actúa como respaldo en caso de que Aave
        // tenga mantenimiento o congestión.
        //
        // console.log("--- Desplegando MoolaStrategy (fallback) ---");
        // MoolaStrategy moolaStrategy = new MoolaStrategy(
        //     MOOLA_LENDING_POOL,  // LendingPool de Moola
        //     CUSD,                // cUSD como token base
        //     MCUSD                // mcUSD como token de rendimiento
        // );
        // console.log("  -> MoolaStrategy desplegado en:", address(moolaStrategy));
        // console.log("");

        // -------------------------------------------------------
        // RESUMEN Y PRÓXIMOS PASOS
        // -------------------------------------------------------
        console.log("=== DESPLIEGUE DEFI COMPLETADO ===");
        console.log("");
        console.log("SIGUIENTE PASO (manual):");
        console.log("  Conectar la estrategia al contrato principal BiotaRWA:");
        console.log("");
        console.log("  cast send <BIOTA_RWA_PROXY> \\");
        console.log("    'setYieldStrategy(address)' \\");
        console.log("    ", address(aaveStrategy));
        console.log("    --private-key $PRIVATE_KEY \\");
        console.log("    --rpc-url $CELO_RPC_URL");

        vm.stopBroadcast();
    }
}
