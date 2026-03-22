"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type Message = {
  role: "user" | "assistant"; // El 'system' lo manejamos en el servidor por seguridad
  content: string;
};

// 1. Actualiza la interface
interface AgentContextType {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (text: string, agentRole?: string) => Promise<void>; // Agregado agentRole
  analizarCroma: (imagenBase64: string) => Promise<void>;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

/*Asegúrate de que en tu AgentProvider.tsx la exportación sea consistente. Si lo importas como import { AgentProvider }, el archivo debe tener:
export function AgentProvider(...)
Y si usas import AgentProvider (sin llaves), debe tener:
export default function AgentProvider(...)*/

export function AgentProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (text: string, agentRole?: string) => {
    try {
      setIsLoading(true);
      // Actualizamos UI inmediatamente con el mensaje del usuario
      // Agregamos el mensaje del usuario a la lista
      const updatedMessages = [
        ...messages,
        { role: "user" as const, content: text },
      ];
      setMessages(updatedMessages);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          agentRole, // Enviamos el rol al servidor
        }),
      });
      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.text },
      ]);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const analizarCroma = async (imagenBase64: string) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imagenBase64,
          type: "croma",
        }),
      });

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.text },
      ]);
    } catch (error) {
      console.error("Error analizando croma:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AgentContext.Provider
      value={{ messages, isLoading, sendMessage, analizarCroma }}
    >
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const context = useContext(AgentContext);
  if (!context)
    throw new Error("useAgent debe usarse dentro de un AgentProvider");
  return context;
}
