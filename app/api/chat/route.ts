import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { AGENTES } from "@/lib/agents/prompts";
import { mintPassportTool, executeMintPassport } from "@/lib/agents/tools";

// Inicializa el SDK de Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { messages, agentRole = "CAPATAZ" } = await req.json();
        
        // 1. Obtener la instrucción del sistema basada en el rol
        const systemInstruction = AGENTES[agentRole as keyof typeof AGENTES] || AGENTES.CAPATAZ;

        // 2. Configurar el modelo con herramientas (Tools)
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: systemInstruction,
            tools: [{
                functionDeclarations: [mintPassportTool]
            }]
        });

        // 3. Preparar el historial para el chat
        const chat = model.startChat({
            history: messages
                .filter((m: any) => m.content && m.content.trim() !== "")
                .map((m: any) => ({
                    role: m.role === "assistant" ? "model" : "user",
                    parts: [{ text: m.content }],
                })),
        });

        // 4. Enviar el mensaje y procesar la respuesta (incluyendo posibles herramientas)
        const lastMessage = messages[messages.length - 1]?.content || "";
        const result = await chat.sendMessage(lastMessage);
        const response = result.response;
        const call = response.functionCalls()?.[0];

        // 5. Si la IA decide llamar a una función (Tool)
        if (call) {
            if (call.name === "mint_biota_passport") {
                const toolResult = await executeMintPassport(call.args);
                
                // Enviar el resultado de la función de vuelta a la IA para que le informe al usuario
                const secondResult = await chat.sendMessage([{
                    functionResponse: {
                        name: "mint_biota_passport",
                        response: toolResult
                    }
                }]);
                
                return NextResponse.json({ 
                    text: secondResult.response.text(), 
                    role: agentRole,
                    actionExecuted: true,
                    txHash: toolResult.hash
                });
            }
        }

        // 6. Respuesta normal si no hubo llamada a herramientas
        return NextResponse.json({ 
            text: response.text(), 
            role: agentRole 
        });

    } catch (error: any) {
        console.error("Error en el cerebro de Biota:", error);
        return NextResponse.json({ 
            error: "Error en el cerebro de Biota", 
            details: error.message 
        }, { status: 500 });
    }
}