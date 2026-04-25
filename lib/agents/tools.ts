import { createWalletClient, createPublicClient, http, parseAbiItem } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celoSepolia, celo } from 'viem/chains';
import { ADDRESSES, BIOTA_PASSPORT_ABI } from '../contracts';
import { SchemaType, FunctionDeclaration } from "@google/generative-ai";

/**
 * Herramientas (Tools) que los Agentes pueden ejecutar.
 * Permite que la IA interactúe con la blockchain de forma autónoma.
 */

// 1. Configuración del Cliente de Wallet (Backend Oracle)
const account = privateKeyToAccount((process.env.PRIVATE_KEY as `0x${string}`) || '0x');
const chain = process.env.NEXT_PUBLIC_CHAIN_ID === '42220' ? celo : celoSepolia;

const walletClient = createWalletClient({
    account,
    chain,
    transport: http(process.env.NEXT_PUBLIC_RPC_URL)
});

const publicClient = createPublicClient({
    chain,
    transport: http(process.env.NEXT_PUBLIC_RPC_URL)
});

/**
 * Definición de la herramienta para mintear el pasaporte.
 * Esta es la estructura que Gemini entiende.
 */
export const mintPassportTool: FunctionDeclaration = {
    name: "mint_biota_passport",
    description: "Crea el Pasaporte Biológico On-Chain para un agricultor después de completar el diagnóstico inicial.",
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            recipient: { type: SchemaType.STRING, description: "Dirección de la billetera del agricultor (0x...)" },
            ubicacion: { type: SchemaType.STRING, description: "Ubicación geográfica o nombre de la vereda" },
            areaM2: { type: SchemaType.NUMBER, description: "Área total en metros cuadrados" },
            cmSuelo: { type: SchemaType.NUMBER, description: "Centímetros de suelo recuperado (inicialmente suele ser 0)" },
            estado: { type: SchemaType.STRING, description: "Breve diagnóstico del estado biológico" },
            metodos: { type: SchemaType.STRING, description: "Métodos agrícolas que aplica actualmente" }
        },
        required: ["recipient", "ubicacion", "areaM2", "estado", "metodos"]
    }
};

/**
 * Lógica de ejecución de la herramienta en la blockchain.
 */
export async function executeMintPassport(args: any) {
    try {
        console.log("[AGENT-TOOL] Ejecutando mint_biota_passport con:", args);

        const hash = await walletClient.writeContract({
            address: ADDRESSES.BIOTA_PASSPORT as `0x${string}`,
            abi: BIOTA_PASSPORT_ABI,
            functionName: 'mintPasaporte',
            args: [
                args.recipient as `0x${string}`,
                "ipfs://bafybeibiz3zxtlzzp7eon7jzw4tqf4scj2u2x6sc6p7u7p7p7p7p7p7p7p", // URI Base
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
