"use client"

import { useEffect, useState } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { ArrowRight, Globe, Leaf, Moon, Sprout, Sun, Coins, Terminal, Activity, Cpu, Shield, Zap, ExternalLink, Network } from "lucide-react"
import { useTheme } from "next-themes"
import { AppShell } from "@/components/biota/app-shell"
import { PasaporteView } from "@/components/biota/pasaporte-view"
import { MercadoView } from "@/components/biota/mercado-view"
import { AcademiaView } from "@/components/biota/academia-view"
import { AsesoriaView } from "@/components/biota/asesoria-view"

export type TabId = "pasaporte" | "mercado" | "academia" | "asesoria"

const translations = {
  es: {
    title: "Biota Protocol",
    subtitle: "Sistema Operativo para Regeneración",
    heroDesc: "Despliega Agentes de IA Autónomos para validación ambiental y coordinación financiera. Menos fricción, más impacto.",
    btnDeploy: "Desplegar Agentes Biota",
    btnReady: "Ingresar DApp",
    btnLoading: "Iniciando Sistema...",
    scrowTitle: "BiotaScrow Oráculo",
    scrowDesc: "Infraestructura de confianza y pagos condicionados para agricultura regenerativa.",
    scrowLink: "Ver Proyecto en Vercel",
    portalTitle: "Portal de Conexión",
    portalDesc: "Accede al ecosistema con tu billetera. Invisible Web3.",
    eduTitle: "Ecosistema Tecnológico",
    eduDesc: "Fomentamos la adopción regenerativa mediante una arquitectura descentralizada de alto rendimiento.",
    techCelo: "Construido en Celo Mainnet",
    techGD: "Impulsado por GoodDollar UBI",
    techMiniPay: "Optimizado para MiniPay",
    log1: "Agente de Validación ambiental en línea...",
    log2: "Verificando firmas criptográficas...",
    log3: "Coordinando pool de fondos...",
    footer: "Descentralizado · Autónomo · Regenerativo",
  },
  en: {
    title: "Biota Protocol",
    subtitle: "Operating System for Regeneration",
    heroDesc: "Deploy Autonomous AI Agents for environmental validation and financial coordination. Less friction, more impact.",
    btnDeploy: "Deploy Biota Agents",
    btnReady: "Enter DApp",
    btnLoading: "System Booting...",
    scrowTitle: "BiotaScrow Oracle",
    scrowDesc: "Trust infrastructure and conditional payments for regenerative agriculture.",
    scrowLink: "View Project on Vercel",
    portalTitle: "Connection Portal",
    portalDesc: "Access the ecosystem with your wallet. Invisible Web3.",
    eduTitle: "Technological Ecosystem",
    eduDesc: "We foster regenerative adoption through high-performance decentralized architecture.",
    techCelo: "Built on Celo Mainnet",
    techGD: "Powered by GoodDollar UBI",
    techMiniPay: "Optimized for MiniPay",
    log1: "Environmental Validation Agent online...",
    log2: "Verifying cryptographic signatures...",
    log3: "Coordinating funding pool...",
    footer: "Decentralized · Autonomous · Regenerative",
  },
}

function LandingPage() {
  const { login, ready } = usePrivy()
  const { theme, setTheme } = useTheme()
  const [lang, setLang] = useState<"es" | "en">("es")
  const [mounted, setMounted] = useState(false)
  const [logIndex, setLogIndex] = useState(0)

  const t = translations[lang]

  const agentLogs = [
    "[System] Inicializando Oráculo BiotaScrow...",
    "[Agent: Daniel_Experto] Validando espectrometría de suelo en Nodo Envigado.",
    "[Network] Conectando a Celo Mainnet...",
    "[SmartContract] Ejecutando DoubleTrigger para dispersión UBI.",
    "[Agent: Capataz] Verificando coordenadas geográficas de la parcela.",
    "[GoodDollar] Identidad verificada. Preparando cUSD/G$.",
    "[System] Veredicto BIO emitido: APROBADO."
  ];

  useEffect(() => {
    setMounted(true)
    const interval = setInterval(() => {
      setLogIndex((prev) => (prev + 1) % agentLogs.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [agentLogs.length])

  if (!mounted) return null

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] dark:bg-[#030712] text-gray-300 font-sans relative overflow-x-hidden transition-theme selection:bg-emerald-500/30">
      {/* Cyberpunk Grid Background */}
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>

      {/* Ambient neon glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-amber-600/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>

      {/* Top Navigation (Connection in the corner) */}
      <div className="w-full p-4 md:px-8 flex justify-between items-center z-50 sticky top-0 bg-[#0a0a0a]/80 dark:bg-[#030712]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-8 h-8 bg-[#0a0a0a] border border-emerald-500/30 rounded-lg flex items-center justify-center text-emerald-500 group-hover:border-emerald-400 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all">
            <Cpu size={18} />
          </div>
          <span className="font-mono text-emerald-400 font-bold tracking-widest text-sm uppercase">Biota_Scrow</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex gap-2">
            <button
              onClick={() => setLang(lang === "es" ? "en" : "es")}
              className="flex items-center gap-2 text-[10px] font-mono text-emerald-400/80 hover:text-emerald-300 bg-white/5 px-2 py-1 rounded border border-white/10 transition-all uppercase"
            >
              <Globe size={12} /> {lang === "es" ? "EN" : "ES"}
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-6 h-6 flex items-center justify-center text-emerald-400/80 hover:text-emerald-300 bg-white/5 rounded border border-white/10 transition-all"
            >
              {theme === "dark" ? <Sun size={12} /> : <Moon size={12} />}
            </button>
          </div>
          
          {/* BOTON DE CONEXIÓN PEQUEÑO EN LA ESQUINA */}
          <button 
            onClick={login}
            disabled={!ready}
            className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-sm hover:bg-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all uppercase disabled:opacity-50"
          >
            <Zap size={14} /> {ready ? "Conectar Wallet" : "Cargando..."}
          </button>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        
        {/* 1. Hero Section: AI Agents Focus */}
        <section className="w-full grid lg:grid-cols-2 gap-12 items-center mb-24 animate-fade-in">
          <div className="text-left flex flex-col items-start z-10 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono uppercase tracking-widest mb-6">
              <Activity size={12} className="animate-pulse" /> Oráculo Descentralizado Activo
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-emerald-800 drop-shadow-sm leading-[1.1]">
              AGENTES IA <br/> <span className="text-emerald-500 italic">PARA LA TIERRA.</span>
            </h1>
            <p className="text-gray-400 md:text-lg max-w-xl leading-relaxed mb-10 text-balance">
              BiotaScrow utiliza agentes autónomos de Inteligencia Artificial para evaluar cromas de suelo y gatillar contratos inteligentes de manera determinista. Renta Básica Universal validada por la naturaleza.
            </p>

            <button 
              onClick={login}
              disabled={!ready}
              className="group relative px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-black rounded-sm font-black tracking-widest uppercase text-xs shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] transition-all border border-emerald-400 disabled:opacity-50">
              <span className="flex items-center gap-3">
                Desplegar Agentes <ArrowRight size={16} />
              </span>
            </button>
          </div>

          {/* Terminal Simulator - Huge Focus */}
          <div className="w-full order-1 lg:order-2 relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-amber-500/10 blur-3xl rounded-full group-hover:from-emerald-500/30 transition-all duration-700" />
            <div className="bg-[#050b07] border border-emerald-500/30 rounded-xl p-6 relative shadow-2xl overflow-hidden font-mono text-sm h-[320px] flex flex-col">
              <div className="flex items-center justify-between mb-4 border-b border-emerald-500/20 pb-4">
                <div className="flex items-center gap-2">
                  <Terminal size={16} className="text-emerald-500" />
                  <span className="text-emerald-500/80 text-xs tracking-widest uppercase">biota-agent-core.exe</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                </div>
              </div>
              
              <div className="flex-1 overflow-hidden flex flex-col justify-end space-y-3 pb-2">
                {agentLogs.slice(0, logIndex + 1).slice(-6).map((log, i) => (
                  <div key={i} className={`flex gap-3 text-xs md:text-sm ${i === Math.min(logIndex, 5) ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'text-emerald-800'}`}>
                    <span className="opacity-50 mt-0.5">{">"}</span>
                    <span className={log.includes('APROBADO') ? 'text-amber-400 font-bold tracking-wide drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : ''}>{log}</span>
                  </div>
                ))}
                <div className="flex gap-3 text-emerald-400/50 animate-pulse mt-2 text-xs md:text-sm">
                  <span>{">"}</span> <span className="w-2.5 h-4 bg-emerald-400/80 inline-block" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Educational & Tech Ecosystem (GoodDollar, MiniPay, Celo) */}
        <section className="w-full text-center pt-16">
          <h3 className="text-sm font-mono text-emerald-500 mb-2 tracking-[0.3em] uppercase">Infraestructura Invisible</h3>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-12 italic">ECOSISTEMA REGENERATIVO</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="flex flex-col items-center gap-4 p-8 bg-white/5 border border-white/5 hover:border-emerald-500/30 rounded-2xl transition-all group">
              <div className="p-4 bg-[#0a0a0a] rounded-xl text-emerald-400 border border-white/5 group-hover:scale-110 transition-transform shadow-lg"><Network size={28} /></div>
              <h4 className="text-lg font-bold text-white">Celo Mainnet</h4>
              <p className="text-xs text-gray-400 leading-relaxed text-center">Ejecución de contratos inteligentes en una blockchain carbono-neutral, diseñada para el mundo móvil.</p>
            </div>
            
            <div className="flex flex-col items-center gap-4 p-8 bg-white/5 border border-white/5 hover:border-blue-500/30 rounded-2xl transition-all group">
              <div className="p-4 bg-[#0a0a0a] rounded-xl text-blue-400 border border-white/5 group-hover:scale-110 transition-transform shadow-lg"><Coins size={28} /></div>
              <h4 className="text-lg font-bold text-white">GoodDollar UBI</h4>
              <p className="text-xs text-gray-400 leading-relaxed text-center">Prueba de humanidad (Proof of Personhood) y Renta Básica Universal como capa de liquidez para los productores.</p>
            </div>
            
            <div className="flex flex-col items-center gap-4 p-8 bg-white/5 border border-white/5 hover:border-amber-500/30 rounded-2xl transition-all group">
              <div className="p-4 bg-[#0a0a0a] rounded-xl text-amber-400 border border-white/5 group-hover:scale-110 transition-transform shadow-lg"><Zap size={28} /></div>
              <h4 className="text-lg font-bold text-white">Opera MiniPay</h4>
              <p className="text-xs text-gray-400 leading-relaxed text-center">Fricción nula para campesinos. Interfaz web3 invisible que paga el gas de red y elimina las frases semilla.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full p-6 text-center border-t border-white/5 relative z-10 bg-[#0a0a0a]/50">
        <p className="text-emerald-500/40 text-[10px] font-mono uppercase tracking-[0.3em]">
          {t.footer} | BiotaScrow Mainnet
        </p>
      </footer>
    </div>
  )
}

export default function Page() {
  const { ready, authenticated } = usePrivy()
  const [activeTab, setActiveTab] = useState<TabId>("asesoria")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window === "undefined") return
    const twa = (window as any).Telegram?.WebApp
    if (twa) {
      twa.expand()
      twa.enableClosingConfirmation()
      twa.setBackgroundColor(twa.colorScheme === "dark" ? "#021a0e" : "#fafafa")
      twa.setHeaderColor(twa.colorScheme === "dark" ? "#021a0e" : "#fafafa")
    }
  }, [])

  if (!mounted) return null

  if (!ready) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#fafafa] dark:bg-[#021a0e]">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 animate-pulse-ring" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sprout className="w-8 h-8 text-emerald-500 animate-bounce-slow" />
          </div>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return <LandingPage />
  }

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="animate-fade-in h-full">
        {activeTab === "pasaporte" && <PasaporteView />}
        {activeTab === "mercado" && <MercadoView />}
        {activeTab === "academia" && <AcademiaView />}
        {activeTab === "asesoria" && <AsesoriaView />}
      </div>
    </AppShell>
  )
}
