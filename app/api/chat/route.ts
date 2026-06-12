import { GoogleGenAI } from '@google/genai';
import { getSystemContext, AgentRole } from '@/lib/agents/prompts';
import { 
    executeMintPassport, 
    executeDoubleTrigger, 
    executeSoilValidation 
} from '@/lib/agents/tools';

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const { messages, agentRole = "CAPATAZ", sessionMetadata = {} } = await req.json();

        // 1. INICIALIZACIÓN PURA
        const ai = new GoogleGenAI({ 
            apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
            apiVersion: 'v1beta'
        });

        // 2. MODELO SEGURO: Alias exacto verificado por curl
        const modelId = 'gemini-flash-latest'; 
        const systemInstructionText = getSystemContext(agentRole as AgentRole, sessionMetadata);

        const contents = messages.map((m: any) => {
            const parts: any[] = [{ text: m.content }];
            
            // [VISION IA] Si el mensaje incluye una imagen en base64, se adjunta al prompt
            if (m.image) {
                // Removemos el prefijo data:image/...;base64, si existe
                const base64Data = m.image.replace(/^data:image\/\w+;base64,/, '');
                parts.push({
                    inlineData: {
                        data: base64Data,
                        mimeType: 'image/jpeg' // Asumimos jpeg/png estándar
                    }
                });
            }

            return {
                role: m.role === 'user' ? 'user' : 'model',
                parts: parts
            };
        });

        // MANTÉN LA DECLARACIÓN DE TOOLS INTACTA AQUÍ...
        const tools = [
            {
                functionDeclarations: [
                    {
                        name: 'mint_biota_passport',
                        description: 'Crea el Pasaporte Biológico On-Chain para un agricultor.',
                        parametersJsonSchema: {
                            type: 'object',
                            properties: {
                                recipient: { type: 'string' },
                                ubicacion: { type: 'string' },
                                areaM2: { type: 'number' },
                                estado: { type: 'string' },
                                metodos: { type: 'string' }
                            },
                            required: ['recipient', 'ubicacion', 'areaM2', 'estado', 'metodos']
                        }
                    },
                    {
                        name: 'execute_double_trigger',
                        description: 'Certifica acción regenerativa para liberar UBI (G$).',
                        parametersJsonSchema: {
                            type: 'object',
                            properties: {
                                farmerTarget: { type: 'string' },
                                tokenId: { type: 'number' },
                                bioScore: { type: 'number' },
                                actionId: { type: 'number' }
                            },
                            required: ['farmerTarget', 'tokenId', 'bioScore']
                        }
                    },
                    {
                        name: 'validate_soil_action',
                        description: 'Evaluación técnica del suelo (Veredicto BIO).',
                        parametersJsonSchema: {
                            type: 'object',
                            properties: {
                                ph: { type: 'number' },
                                materiaOrganica: { type: 'number' },
                                biodiversidad: { type: 'number' },
                                laborEjecutada: { type: 'string' },
                                farmerAddress: { type: 'string' }
                            },
                            required: ['ph', 'materiaOrganica', 'biodiversidad', 'laborEjecutada']
                        }
                    }
                ]
            }
        ];

        // 3. ESTRUCTURA OFICIAL: Todo estrictamente DENTRO de config
        const responseStream = await ai.models.generateContentStream({
            model: modelId,
            contents: contents,
            config: {
                systemInstruction: systemInstructionText,
                tools: tools as any,
            }
        });

        // 5. Manejo del Stream y ejecución On-Chain
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of responseStream) {
                        // Texto directo al agricultor
                        if (chunk.text) {
                            controller.enqueue(new TextEncoder().encode(chunk.text));
                        }

                        // Si el agente decide actuar en la blockchain
                        if (chunk.functionCalls) {
                            for (const call of chunk.functionCalls) {
                                console.log(`[ORACULO] Ejecutando Herramienta: ${call.name}`);
                                let result;

                                if (call.name === 'mint_biota_passport') result = await executeMintPassport(call.args as any);
                                if (call.name === 'execute_double_trigger') result = await executeDoubleTrigger(call.args as any);
                                if (call.name === 'validate_soil_action') result = await executeSoilValidation(call.args as any);

                                // Feedback visual inmediato del contrato en el chat
                                controller.enqueue(new TextEncoder().encode(`\n[EJECUCIÓN ON-CHAIN]: ${JSON.stringify(result)}\n`));
                            }
                        }
                    }
                } catch (e: any) {
                    console.error("Error en el flujo de datos del Oráculo:", e);
                    controller.enqueue(new TextEncoder().encode(`\n[Error de Stream]: ${e.message}`));
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache'
            }
        });

    } catch (error: any) {
        console.error("Error crítico en el Cerebro de Biota:", error);
        return new Response(JSON.stringify({
            error: "Error de conexión con el Oráculo",
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}