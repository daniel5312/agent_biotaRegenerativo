"use client"

import { useEffect, useState } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { ArrowRight, Globe, Leaf, Moon, Sprout, Sun, Coins } from "lucide-react"
import { useTheme } from "next-themes"
import { AppShell } from "@/components/biota/app-shell"
import { ImpactoView } from "@/components/biota/impacto-view"
import { MercadoView } from "@/components/biota/mercado-view"
import { AcademiaView } from "@/components/biota/academia-view"
import { AsesoriaView } from "@/components/biota/asesoria-view"

export type TabId = "impacto" | "mercado" | "academia" | "asesoria"

const translations = {
  es: {
    title: "Biota Protocol",
    subtitle: "Suelo Vivo · Agricultura de Procesos",
    heroDesc: "Empoderando a los campesinos con inteligencia artificial y tecnología Web3 para regenerar la tierra y acceder a una Renta Básica (UBI).",
    btnReady: "Ingresar a la App",
    btnLoading: "Cargando motor Web3...",
    feat1Title: "Microbioma Inteligente",
    feat1Desc: "Recetas guiadas de Microorganismos de Montaña (MM) para sanar tu suelo.",
    feat2Title: "Renta Básica (UBI)",
    feat2Desc: "Recibe incentivos directos en cUSD por cada acción regenerativa certificada.",
    feat3Title: "Tecnología Cero Fricción",
    feat3Desc: "Diseñado para funcionar desde MiniPay, sin frases semilla ni complicaciones.",
    footer: "Construido sobre Celo Network",
  },
  en: {
    title: "Biota Protocol",
    subtitle: "Living Soil · Process Agriculture",
    heroDesc: "Empowering farmers with AI and Web3 technology to regenerate the land and access Universal Basic Income (UBI).",
    btnReady: "Enter App",
    btnLoading: "Loading Web3...",
    feat1Title: "Smart Microbiome",
    feat1Desc: "Guided recipes for Mountain Microorganisms (MM) to heal your soil.",
    feat2Title: "Universal Basic Income",
    feat2Desc: "Receive direct cUSD incentives for every certified regenerative action.",
    feat3Title: "Zero-Friction Tech",
    feat3Desc: "Designed to work from MiniPay, no seed phrases or complications.",
    footer: "Built on Celo Network",
  },
}

function LandingPage() {
  const { login, ready } = usePrivy()
  const { theme, setTheme } = useTheme()
  const [lang, setLang] = useState<"es" | "en">("es")
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const t = translations[lang]

  if (!mounted) return null

  return (
    <div className="flex flex-col h-screen bg-[#fafafa] dark:bg-[#021a0e] max-w-md mx-auto relative overflow-hidden transition-theme">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse-dot" />
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-20">
        <button
          onClick={() => setLang(lang === "es" ? "en" : "es")}
          className="flex items-center gap-2 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-900/40 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-500/30 backdrop-blur-md transition-all touch-active"
        >
          <Globe size={14} /> {lang === "es" ? "EN" : "ES"}
        </button>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-8 h-8 flex items-center justify-center text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-900/40 rounded-full border border-emerald-200 dark:border-emerald-500/30 backdrop-blur-md transition-all touch-active"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center relative z-10">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-emerald-400/30 rounded-full blur-2xl animate-pulse-dot" />
          <div className="relative w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-emerald-400 via-emerald-500 to-green-600 flex items-center justify-center shadow-2xl animate-leaf-sway">
            <Leaf className="w-12 h-12 text-white" />
          </div>
        </div>

        <h1 className="text-emerald-950 dark:text-white text-4xl font-black mb-2 tracking-tighter dark:glow-text">
          {t.title}
        </h1>
        <p className="text-emerald-600 dark:text-emerald-400 font-bold text-xs mb-6 uppercase tracking-[0.2em]">
          {t.subtitle}
        </p>
        <p className="text-emerald-800/70 dark:text-emerald-300/60 text-sm leading-relaxed mb-10 max-w-[280px]">
          {t.heroDesc}
        </p>

        {/* Feature Highlights */}
        <div className="flex gap-4 mb-10">
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/30">
              <Sprout className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[8px] font-bold text-emerald-700 dark:text-emerald-500 uppercase tracking-widest">Suelo</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/30">
              <Coins className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[8px] font-bold text-emerald-700 dark:text-emerald-500 uppercase tracking-widest">UBI</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/30">
              <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[8px] font-bold text-emerald-700 dark:text-emerald-500 uppercase tracking-widest">ReFi</span>
          </div>
        </div>

        <button
          onClick={login}
          disabled={!ready}
          className="group relative w-full h-14 flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white rounded-2xl text-base font-bold shadow-xl glow-md active:scale-95 transition-all disabled:opacity-50"
        >
          {ready ? t.btnReady : t.btnLoading}
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="p-6 text-center">
        <p className="text-emerald-600/30 dark:text-emerald-400/20 text-[9px] font-mono uppercase tracking-[0.3em]">
          {t.footer}
        </p>
      </div>
    </div>
  )
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

  if (!authenticated) {
    return <LandingPage />
  }

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="animate-fade-in h-full">
        {activeTab === "impacto" && <ImpactoView />}
        {activeTab === "mercado" && <MercadoView />}
        {activeTab === "academia" && <AcademiaView />}
        {activeTab === "asesoria" && <AsesoriaView />}
      </div>
    </AppShell>
  )
}
