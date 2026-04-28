import { createWalletClient, createPublicClient, http, parseAbiItem } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celo } from 'viem/chains';
import { ADDRESSES, BIOTA_PASSPORT_ABI, BIOTA_SCROW_ABI } from '../contracts';
import { generatePassportMetadata } from '../utils';

/**
 * Herramientas (Tools) que los Agentes pueden ejecutar.
 * Formato compatible con @google/genai
 */

// 1. Configuración del Cliente de Wallet (Backend Oracle) - MAINNET ENFORCEMENT
const account = privateKeyToAccount((process.env.PRIVATE_KEY as `0x${string}`) || '');

const chainId = 42220; // Celo Mainnet
const chain = celo;
const rpcUrl = "https://forno.celo.org";

const walletClient = createWalletClient({
    account,
    chain,
    transport: http(rpcUrl)
});

const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl)
});

/**
 * Definición de la herramienta para mintear el pasaporte.
 */
export const mintPassportTool = {
    name: "mint_biota_passport",
    description: "Crea el Pasaporte Biológico On-Chain para un agricultor después de completar el diagnóstico inicial.",
    parameters: {
        type: "OBJECT",
        properties: {
            recipient: { type: "STRING", description: "Dirección de la billetera del agricultor (0x...)" },
            ubicacion: { type: "STRING", description: "Ubicación geográfica o nombre de la vereda" },
            areaM2: { type: "NUMBER", description: "Área total en metros cuadrados" },
            cmSuelo: { type: "NUMBER", description: "Centímetros de suelo recuperado (inicialmente suele ser 0)" },
            estado: { type: "STRING", description: "Breve diagnóstico del estado biológico" },
            metodos: { type: "STRING", description: "Métodos agrícolas que aplica actualmente" }
        },
        required: ["recipient", "ubicacion", "areaM2", "estado", "metodos"]
    }
};

/**
 * Definición de la herramienta para ejecutar el Doble Gatillo.
 */
export const doubleTriggerTool = {
    name: "execute_double_trigger",
    description: "Certifica una acción regenerativa on-chain para liberar el incentivo de Renta Básica (UBI).",
    parameters: {
        type: "OBJECT",
        properties: {
            farmerTarget: { type: "STRING", description: "Dirección de la billetera del agricultor (0x...)" },
            tokenId: { type: "NUMBER", description: "ID del Pasaporte Biota del agricultor" },
            bioScore: { type: "NUMBER", description: "Puntaje biológico dictaminado (1-100)" },
            actionId: { type: "NUMBER", description: "ID único de la acción (opcional)" }
        },
        required: ["farmerTarget", "tokenId", "bioScore"]
    }
};

/**
 * Herramienta para validación determinista (Simulación Zero Gas).
 */
export const soilValidationTool = {
    name: "validate_soil_action",
    description: "Evalúa datos técnicos del suelo y emite un veredicto sobre si una labor regenerativa es válida para incentivo UBI.",
    parameters: {
        type: "OBJECT",
        properties: {
            ph: { type: "NUMBER", description: "Nivel de pH detectado" },
            materiaOrganica: { type: "NUMBER", description: "Porcentaje de materia orgánica (%)" },
            biodiversidad: { type: "NUMBER", description: "Puntaje de vida microbiana (1-100)" },
            laborEjecutada: { type: "STRING", description: "Descripción de la labor" },
            farmerAddress: { type: "STRING", description: "Dirección del agricultor" }
        },
        required: ["ph", "materiaOrganica", "biodiversidad", "laborEjecutada"]
    }
};

// ... (El resto de las funciones de ejecución se mantienen iguales)

/**
 * Lógica de ejecución de la herramienta en la blockchain.
 */
export async function executeMintPassport(args: any) {
    try {
        console.log("[AGENT-TOOL] Ejecutando mint_biota_passport con:", args);

        // Generar Metadata Dinámica On-Chain
        const dynamicTokenURI = generatePassportMetadata({
            ubicacion: args.ubicacion,
            areaM2: args.areaM2,
            estado: args.estado,
            metodos: args.metodos
        });

        const hash = await walletClient.writeContract({
            address: ADDRESSES.BIOTA_PASSPORT as `0x${string}`,
            abi: BIOTA_PASSPORT_ABI,
            functionName: 'mintPasaporte',
            args: [
                args.recipient as `0x${string}`,
                dynamicTokenURI,
                args.ubicacion,
                args.areaM2,
                args.cmSuelo || 0,
                args.estado,
                "0x", // hashAnalisisLab (opcional por ahora)
                "0x", // ingredientesHash
                args.metodos
            ]
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        return {
            success: true,
            hash: hash,
            blockNumber: receipt.blockNumber.toString(),
            message: "Pasaporte Biológico creado con éxito en Celo."
        };
    } catch (error: any) {
        console.error("[AGENT-TOOL-ERROR]", error);
        return {
            success: false,
            error: error.message
        };
    }
}



/**
 * Lógica de ejecución de la validación determinista.
 * [ZERO-GAS-SIMULATION] - No gasta gas, solo emite un veredicto.
 */
export async function executeSoilValidation(args: any) {
    console.log("[AI-VERDICT-TEST] 🧠 Procesando Veredicto para:", args.farmerAddress);

    // Lógica determinista simulada
    const score = (args.ph >= 5.5 && args.ph <= 7.5 ? 30 : 10) +
        (args.materiaOrganica > 3 ? 40 : 20) +
        (args.biodiversidad / 2);

    const status = score >= 60 ? "APROBADO" : "OBSERVACIÓN";

    const verdict = {
        veredictoId: `BIO-${Date.now()}`,
        status,
        score,
        recomendacion: status === "APROBADO"
            ? "La labor cumple con los estándares regenerativos. Listo para Gatillo UBI."
            : "Se requiere mayor integración biológica antes de liberar el incentivo.",
        detalles: args
    };

    console.log("[AI-VERDICT-TEST] ✅ Veredicto Generado:", JSON.stringify(verdict, null, 2));

    return {
        success: true,
        simulation: true,
        verdict: verdict,
        message: `Veredicto de ${args.laborEjecutada} completado exitosamente.`
    };
}

/**
 * Lógica de ejecución del Doble Gatillo en BiotaScrow.
 */
export async function executeDoubleTrigger(args: any) {
    try {
        console.log("[AGENT-TOOL] Ejecutando execute_double_trigger con:", args);

        const actionId = args.actionId || BigInt(Date.now());

        const hash = await walletClient.writeContract({
            address: ADDRESSES.BIOTA_SCROW as `0x${string}`,
            abi: BIOTA_SCROW_ABI,
            functionName: 'executeDoubleTrigger',
            args: [
                BigInt(actionId),
                args.farmerTarget as `0x${string}`,
                BigInt(args.tokenId),
                args.bioScore
            ]
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        return {
            success: true,
            hash: hash,
            blockNumber: receipt.blockNumber.toString(),
            message: "Acción Regenerativa Certificada. El incentivo UBI ha sido procesado."
        };
    } catch (error: any) {
        console.error("[AGENT-TOOL-ERROR-SCROW]", error);
        return {
            success: false,
            error: error.message
        };
    }
}
