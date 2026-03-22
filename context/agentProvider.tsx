"use client";

import { createContext, useContext, useState, ReactNode } from "react";

// 1. Definimos la estructura de la memoria del Agente
type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

interface AgentContextType {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (text: string) => Promise<void>;
  analizarCroma: (imagenBase64: string) => Promise<void>;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

// 2. Aquí inyectaremos TU CONOCIMIENTO EXCLUSIVO
const CONOCIMIENTO_EXCLUSIVO = `
Eres el Agente de Inteligencia Agrícola de Biota Protocol que opera en Telegram.
Fuiste entrenado con el conocimiento técnico exclusivo de tu creador.
Tus funciones son:
1. Diagnosticar suelos basándote en observaciones del campesino o cromatogramas.
2. Dar recetas precisas de agricultura de procesos (como Microorganismos de Montaña - MM).
3. NUNCA dar consejos químicos tradicionales, tu enfoque es 100% regenerativo.
`;

export function AgentProvider({ children }: { children: ReactNode }) {
  // Inicializamos el chat con tu conocimiento base
  const [messages, setMessages] = useState<Message[]>([
    { role: "system", content: CONOCIMIENTO_EXCLUSIVO },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Función para hablar con el agente
  const sendMessage = async (text: string) => {
    try {
      setIsLoading(true);
      const newMessages = [
        ...messages,
        { role: "user" as const, content: text },
      ];
      setMessages(newMessages);

      // Aquí conectaremos con la API real de IA (OpenAI, Gemini, etc.)
      // Por ahora simulamos la respuesta para conectar la interfaz
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Entendido. Según nuestros protocolos regenerativos, ¿qué insumos tienes a la mano para iniciar el tratamiento?",
          },
        ]);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error("Error en el Agente:", error);
      setIsLoading(false);
    }
  };

  // Función específica para analizar cromas
  const analizarCroma = async (imagenBase64: string) => {
    // Aquí irá la lógica de visión artificial configurada con tus parámetros
    console.log("Analizando croma...");
  };

  return (
    <AgentContext.Provider
      value={{ messages, isLoading, sendMessage, analizarCroma }}
    >
      {children}
    </AgentContext.Provider>
  );
}

// Hook personalizado para usar el Agente en cualquier parte de la App
export function useAgent() {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error("useAgent debe usarse dentro de un AgentProvider");
  }
  return context;
}
