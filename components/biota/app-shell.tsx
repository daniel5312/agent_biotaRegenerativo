"use client"

import type { ReactNode } from "react"
import { useState, useEffect } from "react"
import type { TabId } from "@/app/page"
import { 
  Leaf, 
  ShoppingBag, 
  GraduationCap, 
  Users, 
  Wifi, 
  Sprout,
  Sun,
  Moon,
  Globe,
  Wallet,
  LogOut
} from "lucide-react"
import { useTheme } from "next-themes"
import { usePrivy } from "@privy-io/react-auth"
import { useConnection } from "wagmi"

interface AppShellProps {
  children: ReactNode
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  isMiniPay?: boolean
}

const tabs: { id: TabId; labelEs: string; labelEn: string; icon: typeof Leaf }[] = [
  { id: "pasaporte", labelEs: "Pasaporte", labelEn: "Passport", icon: Sprout },
  { id: "impacto", labelEs: "Impacto", labelEn: "Impact", icon: Leaf },
  { id: "mercado", labelEs: "Mercado", labelEn: "Market", icon: ShoppingBag },
  { id: "academia", labelEs: "Escuela", labelEn: "School", icon: GraduationCap },
  { id: "asesoria", labelEs: "Asesores", labelEn: "Advisors", icon: Users },
];

export function AppShell({ children, activeTab, onTabChange, isMiniPay = true }: AppShellProps) {
  const { theme, setTheme } = useTheme()
  const { logout, authenticated } = usePrivy()
  const { address } = useConnection()
  const [mounted, setMounted] = useState(false)
  const [lang, setLang] = useState<"es" | "en">("es")

  useEffect(() => {
    setMounted(true)
  }, [])

  const t = {
    es: {
      brand: "BIOTA",
      tagline: "Suelo Vivo",
      minipay: "MiniPay",
      connect: "Conectar",
      connected: "Conectado",
    },
    en: {
      brand: "BIOTA",
      tagline: "Living Soil",
      minipay: "MiniPay",
      connect: "Connect",
      connected: "Connected",
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen flex items-center justify-center p-0 sm:p-4 transition-theme">
      {/* Ambient glow - only in dark mode */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden dark:block hidden">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse-dot" />
        <div className="absolute bottom-1/4 right-0 w-[350px] h-[350px] bg-green-500/8 rounded-full blur-[100px] animate-pulse-dot delay-300" />
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-teal-500/6 rounded-full blur-[80px] animate-pulse-dot delay-150" />
      </div>

      {/* Mobile shell container */}
      <div className="relative w-full max-w-md min-h-screen sm:min-h-[812px] sm:max-h-[812px] flex flex-col shadow-2xl sm:rounded-[2.5rem] overflow-hidden border-0 sm:border border-emerald-300/50 dark:border-emerald-500/20 bg-emerald-50/80 dark:bg-transparent dark:glass leaf-pattern transition-theme">
        
        {/* Header */}
        <header className="flex-shrink-0 relative z-20">
          {/* Top gradient line */}
          <div className="h-1 bg-gradient-to-r from-[#FCFF52] via-emerald-400 to-[#00B0A0]" />
          
          <div className="px-4 pt-3 pb-2 bg-gradient-to-b from-emerald-100 dark:from-emerald-900/20 to-emerald-50/50 dark:to-transparent transition-theme">
            <div className="flex items-center justify-between">
              {/* Brand */}
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-400/30 dark:bg-emerald-400/40 rounded-xl blur-lg animate-pulse-dot" />
                  <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-green-600 flex items-center justify-center shadow-lg overflow-hidden animate-leaf-sway">
                    <Leaf className="w-5 h-5 text-white drop-shadow" />
                  </div>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-emerald-950 dark:text-white leading-none tracking-tight dark:glow-text transition-theme">
                    {t[lang].brand}
                  </h1>
                  <p className="text-[9px] text-emerald-700 dark:text-emerald-300/80 font-semibold tracking-[0.15em] uppercase transition-theme">
                    {t[lang].tagline}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                {/* Language Toggle */}
                <button
                  onClick={() => setLang(lang === "es" ? "en" : "es")}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-500/30 hover:border-emerald-400 transition-all touch-active"
                  aria-label="Toggle language"
                >
                  <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                </button>

                {/* Theme Toggle */}
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-500/30 hover:border-emerald-400 transition-all touch-active"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? (
                    <Sun className="w-4 h-4 text-yellow-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-emerald-600" />
                  )}
                </button>

                {/* Wallet / MiniPay Status */}
                {authenticated ? (
                  <button
                    onClick={() => logout()}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-500/40 dark:animate-glow-border transition-theme group"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-lg"></span>
                    </span>
                    <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 tracking-wide">
                      {address?.slice(0, 6)}...
                    </span>
                    <LogOut className="w-3 h-3 text-emerald-600 dark:text-emerald-300 group-hover:text-red-500 transition-colors" />
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-500/40">
                    <Wallet className="w-3 h-3 text-emerald-600 dark:text-emerald-300" />
                    <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 tracking-wide">
                      {t[lang].connect}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Token Bar - Crypto Branding */}
            <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar">
              <span className="text-[8px] text-emerald-700 dark:text-emerald-400/60 font-bold shrink-0">Powered by:</span>
              <div className="flex items-center gap-1">
                <span className="px-2 py-0.5 rounded-full text-[8px] font-bold badge-celo shrink-0">CELO</span>
                <span className="px-2 py-0.5 rounded-full text-[8px] font-bold badge-gooddollar shrink-0">G$</span>
                <span className="px-2 py-0.5 rounded-full text-[8px] font-bold badge-usdm shrink-0">USDm</span>
                <span className="px-2 py-0.5 rounded-full text-[8px] font-bold badge-copm shrink-0">COPm</span>
                <span className="px-2 py-0.5 rounded-full text-[8px] font-bold badge-usdt shrink-0">USDT</span>
              </div>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar relative z-20">
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="flex-shrink-0 relative z-20">
          <div className="h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
          
          <div className="glass backdrop-blur-xl border-t-0 pb-safe bg-emerald-100/90 dark:bg-emerald-950/60 transition-theme">
            <div className="flex items-center justify-around px-2 py-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`
                      relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 touch-active
                      ${isActive 
                        ? "text-emerald-600 dark:text-emerald-300" 
                        : "text-gray-400 dark:text-gray-500 hover:text-emerald-500"
                      }
                    `}
                  >
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-400/25 animate-fade-in transition-theme" />
                    )}
                    
                    <div className="relative z-10">
                      <Icon className={`w-5 h-5 transition-all ${
                        isActive ? "drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" : ""
                      }`} />
                      
                      {isActive && (
                        <div className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-lg animate-pulse-dot" />
                      )}
                    </div>
                    
                    <span className="relative z-10 text-[9px] font-semibold">
                      {lang === "es" ? tab.labelEs : tab.labelEn}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </nav>
      </div>
    </div>
  )
}
