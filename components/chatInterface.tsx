"use client";

import { useState } from "react";
import { useAgent } from "@/context/agentProvider";

const AGENT_ROLES = [
  {
    id: "DIAGNOSTICO_AGROSOSTENIBLE",
    name: "📋 Onboarding",
    color: "bg-blue-500",
  },
  { id: "CAPATAZ", name: "👨‍🌾 Capataz", color: "bg-orange-500" },
  { id: "DANIEL_EXPERTO", name: "🧠 Daniel Experto", color: "bg-green-600" },
  { id: "ANALISTA_LAB", name: "🧪 Laboratorio", color: "bg-purple-500" },
  { id: "ANALISTA_CROMA", name: "👁️ Analista Croma", color: "bg-red-500" },
];

export default function ChatInterface() {
  const { messages, isLoading, sendMessage } = useAgent();
  const [input, setInput] = useState("");
  const [selectedRole, setSelectedRole] = useState("CAPATAZ");

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput("");
    // Pasamos el texto y el rol seleccionado a nuestro provider
    await sendMessage(text, selectedRole);
  };

  return (
    <div className="flex flex-col h-150 w-full max-w-2xl mx-auto border border-stone-200 rounded-2xl bg-white shadow-xl overflow-hidden">
      {/* Selector de Agente */}
      <div className="p-4 bg-stone-50 border-b flex gap-2 overflow-x-auto">
        {AGENT_ROLES.map((role) => (
          <button
            key={role.id}
            onClick={() => setSelectedRole(role.id)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              selectedRole === role.id
                ? `${role.color} text-white scale-105 shadow-md`
                : "bg-stone-200 text-stone-600 hover:bg-stone-300"
            }`}
          >
            {role.name}
          </button>
        ))}
      </div>

      {/* Caja de Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50">
        {messages.length === 0 && (
          <p className="text-center text-stone-400 mt-10">
            Selecciona un agente y empieza la transición regenerativa...
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${
                m.role === "user"
                  ? "bg-green-600 text-white rounded-tr-none"
                  : "bg-white border border-stone-200 text-stone-800 rounded-tl-none"
              }`}
            >
              <p className="text-sm">{m.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-stone-200 animate-pulse p-3 rounded-2xl rounded-tl-none w-24 h-10"></div>
          </div>
        )}
      </div>

      {/* Input de Texto */}
      <div className="p-4 bg-white border-t flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={`Hablar con el ${selectedRole.toLowerCase()}...`}
          className="flex-1 p-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-stone-800"
        />
        <button
          onClick={handleSend}
          disabled={isLoading}
          className="bg-green-600 text-white p-3 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          🚀
        </button>
      </div>
    </div>
  );
}
