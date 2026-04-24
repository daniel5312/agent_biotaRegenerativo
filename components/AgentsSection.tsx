"use client";

import React from "react";
import { UserCheck, Shield, Beaker, BarChart3, Microscope, Sparkles } from "lucide-react";
import { useAgent } from "@/context/agentProvider"; // [REFI-UI] Conexión con el Oráculo

const AGENTS = [
  { 
    id: "DIAGNOSTICO_AGROSOSTENIBLE",
    name: "Onboarding", 
    role: "Guía Biota", 
    icon: <UserCheck />, 
    color: "from-emerald-500 to-teal-400",
    prompt: "Hola agricultor, soy tu Guía Biota. ¿Estás listo para regenerar tu tierra?"
  },
  { 
    id: "CAPATAZ",
    name: "Capataz", 
    role: "Gestión de Campo", 
    icon: <Shield />, 
    color: "from-green-600 to-emerald-400",
    prompt: "Capataz en línea. Reportando estado de las parcelas..."
  },
  { 
    id: "DANIEL_EXPERTO",
    name: "D. Experto", 
    role: "Agrónomo IA", 
    icon: <Microscope />, 
    color: "from-lime-500 to-emerald-500",
    prompt: "Analizando microbiología del suelo. ¿Qué observas hoy?"
  },
  { 
    id: "ANALISTA_LAB",
    name: "Laboratorio", 
    role: "Análisis MM", 
    icon: <Beaker />, 
    color: "from-cyan-500 to-blue-400",
    prompt: "Cámara de laboratorio activa. Listo para procesar tu receta MM."
  },
  { 
    id: "ANALISTA_CROMA",
    name: "Croma", 
    role: "Visualización", 
    icon: <BarChart3 />, 
    color: "from-teal-600 to-lime-400",
    prompt: "Escáner Croma listo. Sube la foto de tu análisis de suelo."
  },
];

export default function AgentsSection() {
  const { sendMessage, isLoading } = useAgent();

  return (
    <section className="mt-8 px-4">
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600/60 flex items-center gap-2">
          <Sparkles size={12} /> Oráculo de Agentes Biota
        </h2>
        {isLoading && <div className="text-[9px] text-emerald-500 animate-pulse font-bold uppercase tracking-widest">Sincronizando...</div>}
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x px-2">
        {AGENTS.map((agent, i) => (
          <button
            key={i}
            onClick={() => sendMessage(agent.prompt, agent.id)}
            className="group relative min-w-[140px] snap-center text-left focus:outline-none"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${agent.color} opacity-20 blur-xl group-hover:opacity-40 transition-opacity`} />
            <div className="relative bg-white dark:bg-zinc-900 border border-emerald-500/10 rounded-[2rem] p-5 shadow-xl flex flex-col items-center gap-3 transition-all duration-300 group-hover:-translate-y-2 group-hover:border-emerald-500/40 group-active:scale-95">
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${agent.color} text-white shadow-lg shadow-emerald-500/20`}>
                {React.cloneElement(agent.icon as React.ReactElement, { size: 24 })}
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-zinc-800 dark:text-zinc-100 leading-tight">
                  {agent.name}
                </p>
                <p className="text-[9px] font-bold text-emerald-600/70 uppercase tracking-tighter mt-0.5">
                  {agent.role}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
