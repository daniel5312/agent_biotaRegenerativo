"use client"

import React, { useState, useRef, useEffect } from "react"
import { 
  Send, 
  UserCheck, 
  Shield, 
  Beaker, 
  BarChart3, 
  Microscope, 
  Sparkles,
  MessageSquare,
  Bot,
  User,
  Loader2,
  Phone,
  Video,
  Info,
  ChevronRight,
  Sprout,
  Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAgent } from "@/context/agentProvider"

const AGENTS = [
  { 
    id: "DIAGNOSTICO_AGROSOSTENIBLE",
    name: "Onboarding", 
    role: "Guia Biota", 
    icon: UserCheck, 
    color: "from-emerald-500 to-teal-400",
    prompt: "Hola agricultor, soy tu Guia Biota. ¿Estas listo para regenerar tu tierra?"
  },
  { 
    id: "CAPATAZ",
    name: "Capataz", 
    role: "Gestion de Campo", 
    icon: Shield, 
    color: "from-green-600 to-emerald-400",
    prompt: "Capataz en linea. Reportando estado de las parcelas..."
  },
  { 
    id: "DANIEL_EXPERTO",
    name: "D. Experto", 
    role: "Agronomo IA", 
    icon: Microscope, 
    color: "from-lime-500 to-emerald-500",
    prompt: "Analizando microbiologia del suelo. ¿Que observas hoy?"
  },
  { 
    id: "ANALISTA_LAB",
    name: "Laboratorio", 
    role: "Analisis MM", 
    icon: Beaker, 
    color: "from-cyan-500 to-blue-400",
    prompt: "Camara de laboratorio activa. Listo para procesar tu receta MM."
  },
  { 
    id: "ANALISTA_CROMA",
    name: "Croma", 
    role: "Visualizacion", 
    icon: BarChart3, 
    color: "from-teal-600 to-lime-400",
    prompt: "Escaner Croma listo. Sube la foto de tu analisis de suelo."
  },
]

export function AsesoriaView() {
  const { messages, sendMessage, isLoading } = useAgent()
  const [input, setInput] = useState("")
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    sendMessage(input, selectedAgent.id)
    setInput("")
  }

  const selectAgent = (agent: typeof AGENTS[0]) => {
    setSelectedAgent(agent)
    sendMessage(agent.prompt, agent.id)
  }

  return (
    <div className="flex flex-col h-full mb-nav">
      {/* Top Section: Agent Selection */}
      <div className="px-4 py-4 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-emerald-950 dark:text-white flex items-center gap-2 transition-theme">
            <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse-dot" />
            Red de Asesores IA
          </h2>
          {isLoading && (
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold animate-pulse uppercase tracking-widest">
              Conectando...
            </span>
          )}
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x">
          {AGENTS.map((agent) => {
            const Icon = agent.icon
            const isSelected = selectedAgent.id === agent.id
            return (
              <button
                key={agent.id}
                onClick={() => selectAgent(agent)}
                className={`
                  relative min-w-[100px] snap-center flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-300 border touch-active
                  ${isSelected 
                    ? `bg-gradient-to-br ${agent.color} border-white/30 shadow-lg glow-sm` 
                    : "bg-white dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-600/30"
                  }
                `}
              >
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center shadow-md
                  ${isSelected ? "bg-white/20" : `bg-gradient-to-br ${agent.color} text-white`}
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className={`text-[10px] font-bold ${isSelected ? "text-white" : "text-emerald-950 dark:text-white"}`}>
                    {agent.name}
                  </p>
                  <p className={`text-[8px] font-medium uppercase tracking-tighter ${isSelected ? "text-white/80" : "text-emerald-600/70"}`}>
                    {agent.role}
                  </p>
                </div>
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#FCFF52] border-2 border-emerald-500 shadow-sm animate-pulse" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Chat Interface */}
      <Card className="flex-1 mx-4 mb-4 glass-card overflow-hidden flex flex-col bg-emerald-100/80 dark:bg-emerald-900/30">
        {/* Chat Header */}
        <div className="px-4 py-3 border-b border-emerald-200 dark:border-emerald-500/20 bg-white/40 dark:bg-emerald-950/40 flex items-center justify-between transition-theme">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedAgent.color} flex items-center justify-center shadow-md`}>
              {React.createElement(selectedAgent.icon, { className: "w-4 h-4 text-white" })}
            </div>
            <div>
              <h3 className="text-xs font-bold text-emerald-950 dark:text-white leading-none mb-1 transition-theme">
                {selectedAgent.name}
              </h3>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] text-emerald-700 dark:text-emerald-400/60 font-medium">En linea</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="w-8 h-8 rounded-lg text-emerald-600 dark:text-emerald-400">
              <Phone className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="w-8 h-8 rounded-lg text-emerald-600 dark:text-emerald-400">
              <Video className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-grid-overlay"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shadow-inner">
                <Bot className="w-8 h-8 text-emerald-600 dark:text-emerald-500 animate-float" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-emerald-950 dark:text-white">Oraculo Biota Activo</h4>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400/60 max-w-[200px]">
                  Selecciona un asesor o escribe tu consulta sobre agricultura regenerativa.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {["¿Como esta mi suelo?", "Receta de MM", "Credito disponible"].map((q, i) => (
                  <button 
                    key={i}
                    onClick={() => { setInput(q); }}
                    className="px-3 py-1.5 rounded-full bg-emerald-200/50 dark:bg-emerald-800/30 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-300/50 hover:bg-emerald-300/50 transition-all shadow-sm"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isBot = msg.role === "assistant"
              return (
                <div 
                  key={i} 
                  className={`flex ${isBot ? "justify-start" : "justify-end"} animate-slide-up`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className={`flex gap-2 max-w-[85%] ${isBot ? "flex-row" : "flex-row-reverse"}`}>
                    <div className={`
                      w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center shadow-sm
                      ${isBot 
                        ? `bg-gradient-to-br ${selectedAgent.color} text-white` 
                        : "bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-600"
                      }
                    `}>
                      {isBot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                    </div>
                    <div className={`
                      p-3 rounded-2xl text-[11px] leading-relaxed shadow-sm
                      ${isBot 
                        ? "bg-white dark:bg-emerald-800/50 text-emerald-950 dark:text-emerald-50 border border-emerald-200 dark:border-emerald-700/50" 
                        : "bg-emerald-600 text-white border border-emerald-500"
                      }
                    `}>
                      {msg.content}
                      {isBot && (
                        <div className="mt-2 flex items-center gap-2 pt-2 border-t border-emerald-100 dark:border-emerald-700/30">
                          <button className="text-[8px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:underline">
                            Ver Mas
                          </button>
                          <ChevronRight className="w-2.5 h-2.5 text-emerald-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-white dark:bg-emerald-800/50 p-3 rounded-2xl flex items-center gap-2 border border-emerald-200 dark:border-emerald-700/50 shadow-sm">
                <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Analizando datos...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white/60 dark:bg-emerald-950/60 border-t border-emerald-200 dark:border-emerald-500/20 transition-theme">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Pregunta a tu asesor..."
                className="h-10 bg-white dark:bg-emerald-900/50 border-emerald-200 dark:border-emerald-600/30 pr-10 text-xs focus:border-emerald-400 transition-theme"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Zap className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
              </div>
            </div>
            <Button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="h-10 w-10 p-0 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg glow-sm transition-all active:scale-90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[8px] text-emerald-600/50 dark:text-emerald-500/40 mt-1.5 text-center font-medium">
            Impulsado por el Protocolo Biota & GPT-4o
          </p>
        </div>
      </Card>
    </div>
  )
}
