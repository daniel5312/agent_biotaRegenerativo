"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useConnection } from "wagmi";
import { useBiotaPass } from "@/hooks/useBiotaPass";

type Message = {
  role: "user" | "assistant";
  content: string;
  metadata?: {
    verdict?: any;
    txHash?: string;
    actionExecuted?: boolean;
  };
};

interface AgentContextType {
  messages: Message[];
  isLoading: boolean;
  agentAction: { isMinting: boolean; txHash?: string } | null;
  sendMessage: (text: string, agentRole?: string, txHash?: string) => Promise<void>;
  analizarImagen: (imagenBase64: string, agentRole: string, txHash?: string) => Promise<void>;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export function AgentProvider({ children }: { children: ReactNode }) {
  const { address } = useConnection();
  const { tokenId } = useBiotaPass();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [agentAction, setAgentAction] = useState<{ isMinting: boolean; txHash?: string } | null>(null);

  // 1. Preparar Metadatos de Sesión (Puente de Datos)
  const getSessionMetadata = () => ({
    address: address,
    tokenId: tokenId ? Number(tokenId) : null,
    isUbiActive: !!tokenId, // Simplificación: si tiene pasaporte, asumimos flujo
    timestamp: Date.now()
  });

  const sendMessage = async (text: string, agentRole?: string, txHash?: string) => {
    try {
      setIsLoading(true);
      const userMessage: Message = { role: "user", content: text };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      // Crear un placeholder para la respuesta del bot que se irá llenando
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          agentRole: agentRole || "CAPATAZ",
          sessionMetadata: getSessionMetadata(), // Inyección de contexto
          txHash: txHash
        }),
      });

      if (!response.body) throw new Error("No hay cuerpo en la respuesta");

      // 2. Lector de Stream (Streaming Real-Time)
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;

        // Actualizar el último mensaje (el del asistente) con el contenido acumulado
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          newMessages[lastIndex] = { 
            ...newMessages[lastIndex], 
            content: fullContent 
          };
          return newMessages;
        });
      }

    } catch (error) {
      console.error("Error en el Puente de Agentes:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Lo siento, hubo un error conectando con el oráculo de Biota." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const analizarImagen = async (imagenBase64: string, agentRole: string, txHash?: string) => {
    // Implementación similar para cromatografía con soporte de imagen
    try {
      setIsLoading(true);
      const userMsg: Message = { role: "user", content: "Analizando imagen adjunta..." };
      setMessages(prev => [...prev, userMsg, { role: "assistant", content: "Iniciando escaneo visual..." }]);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Por favor analiza los datos de esta imagen.", image: imagenBase64 }],
          agentRole: agentRole,
          sessionMetadata: getSessionMetadata(),
          txHash: txHash
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let content = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        content += decoder.decode(value);
        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1].content = content;
          return next;
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AgentContext.Provider
      value={{ messages, isLoading, agentAction, sendMessage, analizarImagen }}
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
