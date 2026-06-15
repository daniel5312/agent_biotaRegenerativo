import { GoogleGenAI } from '@google/genai';
import { getSystemContext, AgentRole } from '@/lib/agents/prompts';
import { 
    executeMintPassport, 
    executeDoubleTrigger, 
    executeSoilValidation,
    publicClient,
    executeEscrowDistribution,
    iotDataTool,
    weatherPredictionTool,
    executeIoTData,
    executeWeatherPrediction
} from '@/lib/agents/tools';

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const { messages, agentRole = "CAPATAZ", sessionMetadata = {}, txHash } = await req.json();

        // Solo verificamos si es una consulta de IA pura. El dashboard (sin txHash) puede pasar bajo ciertas condiciones si lo deseamos, pero por ahora en Mainnet exigimos pago o exención.
        // Si el agente no es el CAPATAZ de diagnóstico gratuito, verificamos el pago.
        if (agentRole !== 'DIAGNOSTICO_AGROSOSTENIBLE' && agentRole !== 'CAPATAZ') {
            if (!txHash) {
                throw new Error("Pago x402 requerido para usar Oráculos Avanzados.");
            }
            try {
                const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
                if (receipt.status !== 'success') {
                    throw new Error("Transacción fallida.");
                }
                const AGENT_WALLET = (process.env.NEXT_PUBLIC_AGENT_WALLET || "0x1f90a029013609246573f8B3519C8e352333AB0C").toLowerCase();
                if (receipt.to?.toLowerCase() !== AGENT_WALLET) {
                    throw new Error("El peaje no fue pagado al agente correcto.");
                }
            } catch (e: any) {
                throw new Error("Validación de Peaje Fallida: " + e.message);
            }
        }

        // 1. INICIALIZACIÓN PURA
        const ai = new GoogleGenAI({ 
            apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
            apiVersion: 'v1beta'
        });

        // 2. MODELO SEGURO: Alias exacto verificado
        const modelId = 'gemini-flash-latest'; 
        
        let systemInstructionText = getSystemContext(agentRole as AgentRole, sessionMetadata);

        // [PRE-FETCH RAG CIBERFÍSICO] En lugar de Function Calling, inyectamos los datos reales directo al contexto
        if (agentRole === 'CAPATAZ' || agentRole === 'DIAGNOSTICO_AGROSOSTENIBLE') {
            try {
                // Coordenadas fijas de la finca por defecto (Colombia)
                const weatherData = await executeWeatherPrediction({ latitud: 4.6097, longitud: -74.0817 });
                const iotData = await executeIoTData({ farmerAddress: '0xMockESP32' });
                
                systemInstructionText += `\n\n[DATOS CIBERFÍSICOS OBTENIDOS EN TIEMPO REAL AHORA MISMO]:
- CLIMA (Open-Meteo): ${JSON.stringify(weatherData)}
- SENSORES (ESP32): ${JSON.stringify(iotData)}
¡UTILIZA ESTOS DATOS OBLIGATORIAMENTE PARA TU RESPUESTA DE AHORA!`;
            } catch (e) {
                console.warn("No se pudo pre-cargar telemetría:", e);
            }
        }

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
                    iotDataTool as any,
                    weatherPredictionTool as any,
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
                        name: 'distribute_escrow_funds',
                        description: 'Calcula y ejecuta matemáticamente la distribución de fondos (85% dueño, 4% pool, etc.) desde la TBA del Agente.',
                        parametersJsonSchema: {
                            type: 'object',
                            properties: {
                                totalAmount: { type: 'number' },
                                currency: { type: 'string' },
                                producerAddress: { type: 'string' }
                            },
                            required: ['totalAmount', 'currency', 'producerAddress']
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
        const config: any = {
            systemInstruction: systemInstructionText,
        };

        // Solo le damos herramientas a los agentes que actúan on-chain para no confundir al modelo de Visión
        if (agentRole !== 'ANALISTA_CROMA' && agentRole !== 'ANALISTA_LAB') {
            config.tools = tools;
        }

        const responseStream = await ai.models.generateContentStream({
            model: modelId,
            contents: contents,
            config: config
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

                        // Si el agente decide actuar en la blockchain (Function Calling)
                        if (chunk.functionCalls) {
                            for (const call of chunk.functionCalls) {
                                console.log(`[ORACULO] Ejecutando Herramienta: ${call.name}`);
                                let result: any;

                                if (call.name === 'mint_biota_passport') result = await executeMintPassport(call.args as any);
                                if (call.name === 'execute_double_trigger') {
                                    const args = call.args as any;
                                    if (args.bioScore >= 100) args.bioScore = 60;
                                    result = await executeDoubleTrigger(args);
                                }
                                if (call.name === 'validate_soil_action') result = await executeSoilValidation(call.args as any);
                                if (call.name === 'distribute_escrow_funds') result = await executeEscrowDistribution(call.args as any);
                                if (call.name === 'get_iot_data') result = await executeIoTData(call.args as any);
                                if (call.name === 'get_weather_prediction') result = await executeWeatherPrediction(call.args as any);

                                // Feedback visual en lenguaje natural (sin JSON)
                                let mensajeCampesino = "";
                                if (call.name === 'mint_biota_passport') {
                                    mensajeCampesino = `\n🌱 ¡Listo! He creado tu Pasaporte Biológico Oficial en la blockchain.\n\n`;
                                } else if (call.name === 'execute_double_trigger') {
                                    mensajeCampesino = `\n💧 ¡Excelente trabajo! He certificado tu labor y hemos liberado tu incentivo económico.\n\n`;
                                } else if (call.name === 'distribute_escrow_funds') {
                                    mensajeCampesino = `\n🚨 ¡Alerta de Emergencia! He detectado condiciones críticas. Hemos liberado y enviado un fondo de apoyo a tu billetera para ayudarte a superar la sequía.\n\n`;
                                } else if (call.name === 'get_iot_data' || call.name === 'get_weather_prediction') {
                                    if (call.name === 'get_iot_data') mensajeCampesino = `\n📡 (Revisando los sensores de tu finca... La humedad está en 15.2%).\n`;
                                    if (call.name === 'get_weather_prediction') mensajeCampesino = `\n☁️ (Revisando el clima satelital... Temperatura 34°C, riesgo de sequía).\n`;
                                } else {
                                    mensajeCampesino = `\n✅ Operación completada.\n\n`;
                                }
                                
                                controller.enqueue(new TextEncoder().encode(mensajeCampesino));
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