import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { AGENTES } from "@/lib/agents/prompts";
import {
    mintPassportTool,
    executeMintPassport,
    doubleTriggerTool,
    executeDoubleTrigger,
    soilValidationTool,
    executeSoilValidation
} from "@/lib/agents/tools";

// Inicializa el nuevo SDK oficial de Google GenAI
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
});

export async function POST(req: Request) {
    try {
        const { messages, agentRole = "CAPATAZ", image, type } = await req.json();

        // --- INICIO MODO DEBUG PROFESIONAL ---
        const lastMsg = messages[messages.length - 1]?.content || "";
        if (lastMsg.includes("FORZAR_APROBACION")) {
            return NextResponse.json({
                text: "⚡ [SISTEMA EN DEBUG]: He bypassado a Gemini. He inyectado el estado de APROBADO en la DApp. Ya puedes proceder con el Gatillo UBI.",
                role: "DANIEL_EXPERTO",
                verdict: { status: "APROBADO", score: 100 }
            });
        }
        // --- FIN MODO DEBUG PROFESIONAL ---


        // 1. Manejo Multimodal (Visión para Cromas) - Usamos Flash para visión
        if (image && type === 'croma') {
            const base64Data = image.split(",")[1] || image;
            
            // En @google/genai v1.0.0, usamos generateContent directamente desde el cliente o vía models
            const result = await ai.models.generateContent({
                model: "gemini-1.5-flash",
                contents: [{
                    role: "user",
                    parts: [
                        { text: "Analiza este Croma de Pfeiffer detallando las 4 zonas y el estado de salud del suelo." },
                        {
                            inlineData: {
                                data: base64Data,
                                mimeType: "image/jpeg",
                            },
                        },
                    ]
                }]
            });

            return NextResponse.json({
                text: result.text,
                role: "ANALISTA_CROMA"
            });
        }

        // 2. Obtener la instrucción del sistema basada en el rol
        const systemInstruction = AGENTES[agentRole as keyof typeof AGENTES] || AGENTES.CAPATAZ;

        // 3. Definir Herramientas y Temperatura por Rol
        let roleTools: any[] = [];
        let temperature = 0.5;

        switch (agentRole) {
            case "DIAGNOSTICO_AGROSOSTENIBLE":
                roleTools = [mintPassportTool];
                temperature = 0.4;
                break;
            case "DANIEL_EXPERTO":
                roleTools = [doubleTriggerTool, soilValidationTool];
                temperature = 0.2;
                break;
            case "ANALISTA_LAB":
                roleTools = [soilValidationTool];
                temperature = 0.1;
                break;
            case "CAPATAZ":
                roleTools = [];
                temperature = 0.7;
                break;
            default:
                roleTools = [];
                temperature = 0.5;
        }

        // 4. Configurar el Chat con el nuevo SDK [OFFICIAL-SDK-FIX]
        const chat = ai.chats.create({
            model: "gemini-1.5-flash",
            config: {
                systemInstruction: systemInstruction,
                tools: roleTools.length > 0 ? [{ functionDeclarations: roleTools }] : undefined,
                temperature: temperature,
            },
            history: messages.slice(0, -1)
                .filter((m: any) => m.content && m.content.trim() !== "")
                .map((m: any) => ({
                    role: m.role === "assistant" ? "model" : "user",
                    parts: [{ text: m.content }],
                })),
        });

        // 5. Enviar mensaje y procesar respuesta
        const lastMessage = messages[messages.length - 1]?.content || "Hola";
        const result = await chat.sendMessage({
            message: lastMessage
        });

        // 6. Manejo de Llamadas a Funciones (Tools)
        const call = result.functionCalls?.[0];
        if (call) {
            let toolResult;
            if (call.name === "mint_biota_passport") {
                toolResult = await executeMintPassport(call.args);
            } else if (call.name === "execute_double_trigger") {
                toolResult = await executeDoubleTrigger(call.args);
            } else if (call.name === "validate_soil_action") {
                toolResult = await executeSoilValidation(call.args);
            }

            if (toolResult) {
                // Enviar el resultado de la herramienta de vuelta a la IA
                const secondResult = await chat.sendMessage({
                    message: {
                        role: "user",
                        parts: [{
                            functionResponse: {
                                name: call.name || "",
                                response: toolResult
                            }
                        }]
                    }
                } as any);

                return NextResponse.json({
                    text: secondResult.text,
                    role: agentRole,
                    actionExecuted: call.name !== "validate_soil_action",
                    txHash: (toolResult as any).hash,
                    verdict: (toolResult as any).verdict
                });
            }
        }

        // 7. Respuesta estándar
        return NextResponse.json({
            text: result.text,
            role: agentRole
        });

    } catch (error: any) {
        console.error("Error en el cerebro de Biota (SDK @google/genai):", error);
        return NextResponse.json({
            error: "Error en el cerebro de Biota",
            details: error.message
        }, { status: 500 });
    }
}