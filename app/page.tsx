"use client"

import { useEffect, useState, useCallback } from "react"
import { usePrivy } from "@privy-io/react-auth"
import Link from "next/link"
import { ArrowRight, Globe, Leaf, Moon, Sprout, Sun, Coins, Terminal, Activity, Cpu, Shield, Zap, ExternalLink, Network, MoveRight, BrainCircuit, Database, ShieldCheck, UserCircle2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { useTheme } from "next-themes"

// COMPONENTES PRINCIPALES DE LA DAPP
import { AppShell } from "@/components/biota/app-shell"
import { PasaporteView } from "@/components/biota/pasaporte-view"
import { MercadoView } from "@/components/biota/mercado-view"
import { AcademiaView } from "@/components/biota/academia-view"
import { AsesoriaView } from "@/components/biota/asesoria-view"
import { ImpactoView } from "@/components/biota/impacto-view"

// SI QUIERES USAR BIOTAPROTOCOL COMO INTERFAZ DESCOMENTA ESTO
// import BiotaProtocol from "@/components/biotaProtocol"

export type TabId = "pasaporte" | "mercado" | "academia" | "asesoria" | "impacto"

function LandingPage() {
  const { login, ready, authenticated } = usePrivy();
  const [mounted, setMounted] = useState(false);
  const [logIndex, setLogIndex] = useState(0);

  const logs = [
    "[System] Inicializando Oráculo BiotaScrow...",
    "[Agent: Daniel_Experto] Validando espectrometría de suelo en Nodo Envigado.",
    "[Network] Conectando a Celo Mainnet...",
    "[SmartContract] Ejecutando DoubleTrigger para dispersión UBI.",
    "[Agent: Capataz] Verificando coordenadas geográficas de la parcela.",
    "[GoodDollar] Identidad verificada. Preparando cUSD/G$.",
    "[System] Veredicto BIO emitido: APROBADO."
  ];

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setLogIndex((prev) => (prev + 1) % logs.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [logs.length]);

  const scrollToTop = useCallback(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  if (!mounted) return <div className="min-h-screen bg-[#030712]" />;

  const handleCTA = () => {
    if (!authenticated) {
      login();
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-stone-300 font-sans selection:bg-emerald-500/30 antialiased overflow-x-hidden">
      {/* FONDO CYBER-ORGÁNICO */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-amber-900/10 blur-[150px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-[100] bg-[#030712]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={scrollToTop}
          >
            <div className="w-8 h-8 bg-[#0a0a0a] border border-emerald-500/30 rounded-lg flex items-center justify-center text-emerald-500 group-hover:border-emerald-400 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all">
              <Cpu size={18} />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic text-white">
              BIOTA<span className="text-emerald-500">_</span>
            </span>
          </div>
          <button
            onClick={handleCTA}
            disabled={!ready}
            className="text-[10px] font-black tracking-[0.2em] bg-emerald-500 text-black px-6 py-2.5 rounded-sm hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all uppercase disabled:opacity-50"
          >
            {ready && authenticated ? "Ingresar a la Red" : "Conectar Billetera"}
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        {/* HERO SECTION: THE IMPACT & AGENTS */}
        <section className="flex flex-col lg:flex-row items-center gap-12 mb-32 relative">
          <div className="flex-1 text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono uppercase tracking-widest px-4 py-1.5 rounded-full mb-8">
              <Activity size={12} className="animate-pulse" /> Estado: Oráculo En Línea
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-[1.1] text-white">
              REGENERACIÓN <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-500 to-amber-500 italic">
                IMPULSADA POR IA.
              </span>
            </h1>
            <p className="text-lg text-stone-400 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Despliega **Agentes Autónomos** para certificar la salud de tu suelo y activa contratos inteligentes de Renta Básica Universal (**UBI**). BiotaProtocol fusiona biología y blockchain.
            </p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
              <button
                onClick={handleCTA}
                className="bg-emerald-500 text-black px-8 py-4 rounded-sm font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 transition-all"
              >
                Desplegar Agentes <BrainCircuit size={18} />
              </button>
              <a
                href="https://agent-biota-regenerativo.vercel.app/"
                target="_blank"
                rel="noreferrer"
                className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-sm font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
              >
                Ver Oráculo Scrow <ExternalLink size={16} />
              </a>
            </div>
          </div>

          {/* TERMINAL LOG SIMULATOR */}
          <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-amber-500/5 blur-2xl rounded-full" />
            <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6 relative shadow-2xl overflow-hidden font-mono text-sm">
              <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-4">
                <Terminal size={16} className="text-stone-500" />
                <span className="text-stone-500 text-xs">biota-agent-core.exe</span>
              </div>
              <div className="space-y-3 min-h-[160px]">
                {logs.slice(0, logIndex + 1).slice(-5).map((log, i) => (
                  <div key={i} className={`flex gap-2 ${i === Math.min(logIndex, 4) ? 'text-emerald-400' : 'text-stone-600'}`}>
                    <span className="opacity-50">{">"}</span>
                    <span className={log.includes('APROBADO') ? 'text-amber-400 font-bold' : ''}>{log}</span>
                  </div>
                ))}
                <div className="flex gap-2 text-emerald-400/50 animate-pulse">
                  <span>{">"}</span> <span className="w-2 h-4 bg-emerald-400/50 inline-block" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BIOTASCROW PROMO SECTION */}
        <section className="mb-32">
          <div className="bg-gradient-to-br from-[#0a0a0a] to-[#030712] border border-emerald-500/20 rounded-[2rem] p-10 lg:p-16 relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <BrainCircuit size={200} className="text-emerald-500" />
            </div>
            <div className="max-w-3xl relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-amber-500/10 text-amber-500 p-3 rounded-lg">
                  <ShieldCheck size={24} />
                </div>
                <h2 className="text-3xl font-black text-white italic">BIOTASCROW</h2>
              </div>
              <h3 className="text-xl md:text-2xl text-stone-300 font-medium leading-relaxed mb-8">
                El **Oráculo de la Tierra**. Una capa de infraestructura descentralizada donde agentes de IA evalúan datos biométricos del suelo (Cromas de Pfeiffer) y gatillan contratos inteligentes de manera determinista.
              </h3>
              <a 
                href="https://agent-biota-regenerativo.vercel.app/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-widest text-xs transition-colors"
              >
                Explorar el Oráculo en Vercel <MoveRight size={16} />
              </a>
            </div>
          </div>
        </section>

        {/* PORTAL DAPP (CONECTOR MINIMALISTA) */}
        <section className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black italic mb-4">INGRESAR AL PROTOCOLO</h2>
            <p className="text-stone-500">Conecta tu identidad digital y comienza a operar en la red.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Dialog>
              <DialogTrigger asChild>
                <button
                  className="bg-[#0a0a0a] border border-white/5 hover:border-emerald-500/30 p-8 rounded-2xl flex flex-col items-center justify-center gap-4 group transition-all w-full"
                >
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-emerald-500 group-hover:scale-110 group-hover:bg-emerald-500/10 transition-all">
                    <Leaf size={32} />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wide">Soy Productor</h3>
                    <p className="text-stone-500 text-sm">Gestiona tu pasaporte, sube evidencias y recibe recompensas.</p>
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent className="bg-[#030712] border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-0">
                <DialogHeader className="p-8 pb-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-500">
                      <UserCircle2 size={24} />
                    </div>
                    <DialogTitle className="text-2xl font-black text-white uppercase italic">Registro de Productor</DialogTitle>
                  </div>
                  <DialogDescription className="text-stone-500">
                    Completa tu pasaporte biológico para empezar a recibir UBI y créditos de impacto.
                  </DialogDescription>
                </DialogHeader>
                <div className="p-4 sm:p-8">
                  <PasaporteView />
                </div>
              </DialogContent>
            </Dialog>

            <button
              onClick={handleCTA}
              className="bg-[#0a0a0a] border border-white/5 hover:border-amber-500/30 p-8 rounded-2xl flex flex-col items-center justify-center gap-4 group transition-all"
            >
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-amber-500 group-hover:scale-110 group-hover:bg-amber-500/10 transition-all">
                <Globe size={32} />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wide">Soy Sponsor</h3>
                <p className="text-stone-500 text-sm">Compra tokens de impacto y financia la regeneración global.</p>
              </div>
            </button>
          </div>
        </section>

        {/* ECOSYSTEM TECH GRID */}
        <section>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black italic mb-4">TECNOLOGÍA DE FRONTERA</h2>
            <p className="text-stone-500 uppercase tracking-widest text-xs font-bold">Arquitectura Web3 Invisible</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0a0a0a] p-8 rounded-2xl border border-white/5 hover:bg-white/[0.02] transition-colors">
              <Zap size={24} className="text-emerald-400 mb-6" />
              <h3 className="text-lg font-black text-white mb-3">Celo Mainnet</h3>
              <p className="text-stone-400 text-sm leading-relaxed">
                Ejecutamos nuestros contratos en una red **carbono-neutral** y optimizada para dispositivos móviles (Mobile-First). Transacciones instantáneas a coste cero.
              </p>
            </div>
            
            <div className="bg-[#0a0a0a] p-8 rounded-2xl border border-white/5 hover:bg-white/[0.02] transition-colors">
              <Coins size={24} className="text-blue-400 mb-6" />
              <h3 className="text-lg font-black text-white mb-3">GoodDollar UBI</h3>
              <p className="text-stone-400 text-sm leading-relaxed">
                Integración nativa para la verificación de identidad (Proof of Personhood) y la distribución de una Renta Básica Universal como base del ecosistema.
              </p>
            </div>

            <div className="bg-[#0a0a0a] p-8 rounded-2xl border border-white/5 hover:bg-white/[0.02] transition-colors">
              <Database size={24} className="text-amber-400 mb-6" />
              <h3 className="text-lg font-black text-white mb-3">Opera MiniPay</h3>
              <p className="text-stone-400 text-sm leading-relaxed">
                Fricción cero para el productor rural. Sin necesidad de guardar frases semilla complejas ni pagar gas de red. **Adopción masiva simplificada.**
              </p>
            </div>
          </div>
        </section>

      </main>

      <footer className="py-8 border-t border-white/5 text-center bg-[#0a0a0a]">
        <p className="text-stone-600 font-mono text-[10px] uppercase tracking-[0.3em]">
          &copy; 2026 BIOTA REFI NETWORK | MAINNET DEPLOYMENT
        </p>
      </footer>
    </div>
  );
}

export default function Page() {
  const { ready, authenticated } = usePrivy()
  const [activeTab, setActiveTab] = useState<TabId>("impacto")
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

  const isDebug = typeof window !== 'undefined' && localStorage.getItem('BIOTA_DEBUG') === 'true';

  // Si no está autenticado y no tiene el debug flag, muestra la LandingPage
  if (!authenticated && !isDebug) {
    return <LandingPage />
  }

  // SPA original con AppShell y Vistas
  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="flex flex-col h-full">
        {/* ENLACES A RUTAS FÍSICAS (ECOSISTEMA TRAS BAMBALINAS) */}
        <div className="flex justify-center gap-4 py-2 px-4 bg-emerald-950/20 border-b border-emerald-900/30">
          <Link 
            href="/productor" 
            className="text-[10px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 transition-all hover:bg-emerald-500/20"
          >
            <Sprout size={12} /> Acceso Productor
          </Link>
          <Link 
            href="/verificador" 
            className="text-[10px] font-black text-amber-500 hover:text-amber-400 uppercase tracking-widest flex items-center gap-1 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 transition-all hover:bg-amber-500/20"
          >
            <ShieldCheck size={12} /> Acceso Verificador
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto animate-fade-in pb-20">
          {activeTab === "pasaporte" && <PasaporteView />}
          {activeTab === "impacto" && <ImpactoView />}
          {activeTab === "mercado" && <MercadoView />}
          {activeTab === "academia" && <AcademiaView />}
          {activeTab === "asesoria" && <AsesoriaView />}
        </div>
      </div>
    </AppShell>
  )
}
