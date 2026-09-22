import { loadEnvConfig } from '@next/env';
// Cargamos el .env PRIMERO
loadEnvConfig(process.cwd());

import type { LabData } from '../lib/oracle';

async function main() {
    console.log("🌱 INICIANDO SIMULACIÓN DEL ORÁCULO BIOTA 🌱");

    // TODO: ¡Pon tu dirección de Metamask aquí para que te lleguen los BCO2 a ti!
    const MI_BILLETERA_PRODUCTOR = '0xb6Fb8C69FeD8FC27750c58B2DCA293cc12662A12'; // Reemplázala

    // Estos son los datos científicos de la microbiología de tu suelo (La Burbuja)
    const datosMicrobiologia: LabData = {
        laboratorio: "Biota Lab Central",
        fecha: new Date().toISOString(),
        ubicacionGeografica: "Finca La Nube | Vereda Alta | Antioquia",
        areaM2: 10000, // 1 Hectárea
        materiaOrganicaPorcentaje: 12.5, // ¡Altísimo! Suelo muy sano
        hongosPorcentaje: 60, // Alta biomasa fúngica (Las hifas secuestran carbono)
        bacteriasPorcentaje: 40,
        ufc: 5000000, // 5 millones de Unidades Formadoras de Colonias
        metodosAgricolas: "Agricultura Sintrópica",
        verificadoPor: "Oráculo Descentralizado Biota"
    };

    console.log("🔬 Datos de laboratorio recopilados:", datosMicrobiologia.laboratorio);
    console.log("🧫 Evaluando ecosistema microbiológico...");

    try {
        // Importamos dinámicamente el agente DESPUÉS de que las variables ya cargaron
        const { agentExecuteDoubleMint } = await import('../lib/agents/ubi-relayer');

        // Invocamos al Agente 8004
        const resultado = await agentExecuteDoubleMint(
            MI_BILLETERA_PRODUCTOR as `0x${string}`,
            datosMicrobiologia
        );

        console.log("\n===========================================");
        console.log("✅ ¡DOBLE MINTEO EXITOSO EN CELO MAINNET!");
        console.log(`📜 Hash Certificado dMRV: ${resultado.hashCertificacion}`);
        console.log(`🪙 Kilos de Carbono Minteados: ${resultado.kilos} BCO2`);
        console.log(`🚀 Hash Tx (Etapa NFT): ${resultado.stageTx}`);
        console.log(`🚀 Hash Tx (BCO2 ERC20): ${resultado.carbonTx}`);
        console.log("===========================================\n");

    } catch (error) {
        console.error("❌ Falló la simulación:", error);
    }
}

main().catch(console.error);
