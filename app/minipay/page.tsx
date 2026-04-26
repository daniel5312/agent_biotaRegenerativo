"use client"

import { useEffect, useState, Suspense } from "react"
import { useConnect, useAccount } from "wagmi"
import { Sprout, ShieldCheck, Zap, ArrowRight, Construction } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { AppShell } from "@/components/biota/app-shell"
import { PasaporteView } from "@/components/biota/pasaporte-view"
import { MercadoView } from "@/components/biota/mercado-view"
import { AcademiaView } from "@/components/biota/academia-view"
import { AsesoriaView } from "@/components/biota/asesoria-view"
import type { TabId } from "@/app/page"

function MiniPayContent() {
  const searchParams = useSearchParams()
  const isDevMode = searchParams.get('dev') === 'true'
  
  const { connect, connectors } = useConnect()
  const { isConnected, address } = useAccount()
  const [isMiniPay, setIsMiniPay] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>("pasaporte")

  useEffect(() => {
    const detectMiniPay = () => {
      const isMP = typeof window !== 'undefined' && (window as any).ethereum?.isMiniPay
      setIsMiniPay(!!isMP)
      
      if (isMP && !isConnected) {
        const miniPayConnector = connectors.find(c => c.id === 'miniPay')
        if (miniPayConnector) {
          connect({ connector: miniPayConnector })
        }
      }
    }
    detectMiniPay()
  }, [connect, connectors, isConnected])

  // --- MODO SIMULADOR (Dev Mode) ---
  // Si estamos en modo dev o conectados, mostramos la App completa
  if (isDevMode || isConnected) {
    return (
      <div className="animate-fade-in">
        {isDevMode && !isConnected && (
          <div className="fixed top-0 left-0 w-full z-50 bg-amber-500 text-white text-[10px] py-1 px-4 flex items-center justify-center gap-2 font-bold uppercase tracking-widest">
            <Construction size={12} /> Modo Simulador MiniPay Activo
          </div>
        )}
        <AppShell activeTab={activeTab} onTabChange={setActiveTab} isMiniPay={true}>
          <div className="animate-fade-in h-full">
            {activeTab === "pasaporte" && <PasaporteView />}
            {activeTab === "mercado" && <MercadoView />}
            {activeTab === "academia" && <AcademiaView />}
            {activeTab === "asesoria" && <AsesoriaView />}
          </div>
        </AppShell>
      </div>
    )
  }

  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-fade-in">
      <div className="relative">
        <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-2xl animate-pulse" />
        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-100 to-white dark:from-emerald-900/40 dark:to-emerald-800/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center shadow-xl">
          <Sprout className="w-10 h-10 text-emerald-600 dark:text-emerald-400 animate-bounce-slow" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-xl font-black text-emerald-950 dark:text-white tracking-tight">
          Conectando con MiniPay
        </h2>
        <p className="text-xs text-emerald-700/70 dark:text-emerald-400/60 max-w-[240px] mx-auto leading-relaxed">
          Detectando tu billetera Opera MiniPay para una experiencia sin fricciones.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 w-full">
        <div className="p-4 rounded-2xl bg-white/40 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-500/10 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-[11px] font-bold text-emerald-950 dark:text-white uppercase tracking-wider">Cero Gas</h3>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-500/70">Tus acciones no consumen tu saldo.</p>
          </div>
        </div>
      </div>

      {!isMiniPay && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20 text-center">
          <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
            Entorno MiniPay no detectado. Abre esta ruta desde Opera Mini para auto-conectar o usa ?dev=true para previsualizar.
          </p>
        </div>
      )}
    </div>
  )
}

export default function MiniPayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-emerald-50 dark:bg-[#021a0e]"><Sprout className="animate-spin text-emerald-500" /></div>}>
      <MiniPayContent />
    </Suspense>
  )
}
