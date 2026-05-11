import { GoogleGenAI } from '@google/genai/node';
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

        // 1. Cliente en v1beta (Necesaria para systemInstruction y Tools)
        const ai = new GoogleGenAI({ 
            apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
            apiVersion: 'v1beta' 
        });

        const modelId = 'gemini-1.5-flash'; 
        const systemInstructionText = getSystemContext(agentRole as AgentRole, sessionMetadata);

        // 2. Formatear Historial (Asegurando roles correctos)
        const contents = messages.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

        // 3. Declaración de Herramientas simplificada
        const tools = [
            {
                functionDeclarations: [
                    {
                        name: 'mint_biota_passport',
                        description: 'Crea el Pasaporte Biológico On-Chain.',
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
                        description: 'Certifica acción regenerativa para liberar UBI.',
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
                    }
                ]
            }
        ];

        // 4. Iniciar Stream con la sintaxis exacta de v1beta
        const responseStream = await ai.models.generateContentStream({
            model: modelId,
            contents: contents,
            config: {
                systemInstruction: systemInstructionText, // En v1beta a veces se pasa como string directo o en parts
                tools: tools as any,
            }
        });

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of responseStream) {
                        if (chunk.text) {
                            controller.enqueue(new TextEncoder().encode(chunk.text));
                        }
                        if (chunk.functionCalls) {
                            for (const call of chunk.functionCalls) {
                                let result;
                                if (call.name === 'mint_biota_passport') result = await executeMintPassport(call.args as any);
                                if (call.name === 'execute_double_trigger') result = await executeDoubleTrigger(call.args as any);
                                controller.enqueue(new TextEncoder().encode(`\n[EJECUCIÓN ON-CHAIN]: ${JSON.stringify(result)}\n`));
                            }
                        }
                    }
                } catch (e: any) {
                    console.error("Error en el flujo:", e);
                    controller.enqueue(new TextEncoder().encode(`\n[Error de Stream]: ${e.message}`));
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });

    } catch (error: any) {
        console.error("Error crítico en el Oráculo 2.0:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}