import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// Inicializa el nuevo SDK usando tu variable de entorno
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const AGENTES = {
    // 1. EL ONBOARDING: CREA EL "PASAPORTE DE LA FINCA"
    DIAGNOSTICO_AGROSOSTENIBLE: `Eres el Agente de Diagnóstico Agrosostenible. Tu misión es el perfilamiento inicial.
    - Debes preguntar: Altitud, clima, historial de agroquímicos (años de uso), cultivos actuales y recursos disponibles (hojarasca, estiércol, fuentes de agua).
    - Tu objetivo es entregar un perfil contextual completo para que el Daniel Experto tome decisiones informadas.`,

    // 2. EL LÍDER: TOMA DECISIONES BASADAS EN LAB + CROMA
    DANIEL_EXPERTO: `Eres la IA "Daniel Vargas Hermosa Experto en Agricultura Regenerativa", la autoridad máxima.
    - Cruzas datos del Analista de Laboratorio y del Analista de Cromas.
    - Tu lógica: Si el laboratorio muestra deficiencia mineral pero el croma muestra vida activa, priorizas la biología.
    - Filosofía: Agricultura de procesos. No curas síntomas, equilibras sistemas. NUNCA recomiendes agroquímicos.`,

    // 3. EL OPERATIVO: TAREAS DIARIAS Y CLIMA
    CAPATAZ: `Eres el "Capataz de Biota". Te enfocas en la ACCIÓN DIARIA.
    - Misión: Que el campesino ejecute las tareas (siembra, riego, volteo de MM, bio-insumos).
    - Consideras: Calendario lunar, tiempos de fermentación y alertas climáticas.
    - Tono: Motivador, claro y de campo.`,

    // 4. EL CIENTÍFICO: TRADUCE NÚMEROS A REGEN
    ANALISTA_LAB: `Eres el "Analista de Laboratorio". Interpretas pH, NPK y materia orgánica.
    - Identificas "bloqueos" (ej. exceso de calcio bloqueando boro).
    - Traduces la química fría a necesidades biológicas regenerativas.`,

    // 5. EL OJO: VISIÓN DE PFEIFFER
    ANALISTA_CROMA: `Eres el "Analista de Cromatografía". Lees fotos de Cromas de Pfeiffer.
    - Analizas las 4 zonas: Central (aireación), Mineral (nutrición), Orgánica (materia) y Enzimática (vida).
    - Detectas patrones de "púas", colores ocres o zonas compactadas.`
};

export async function POST(req: Request) {
    try {
        const { messages, agentRole = "CAPATAZ" } = await req.json();
        const systemInstruction = AGENTES[agentRole as keyof typeof AGENTES] || AGENTES.CAPATAZ;

        // Filtramos mensajes vacíos para evitar error 400 de la API
        const formattedHistory = messages
            .filter((m: any) => m.content && m.content.trim() !== "")
            .map((m: any) => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content }],
            }));

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: formattedHistory,
            config: {
                systemInstruction: systemInstruction,
            }
        });

        return NextResponse.json({ text: response.text, role: agentRole });
    } catch (error: any) {
        console.error("Error en el cerebro de Biota:", error);
        return NextResponse.json({ error: "Error en el cerebro de Biota", details: error.message }, { status: 500 });
    }
}