"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Globe, Zap } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth"; // [PRIVY-CORE]
import { useConnection } from "wagmi";

/**
 * [REFI-UI] Header optimizado para Privy.
 */
export default function Header() {
  const { theme, setTheme } = useTheme();
  const { login, logout, authenticated } = usePrivy();
  const { address } = useConnection();
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState("ES");

  // [UX-ANIMATIONS] Evita errores de hidratación asegurando que el componente esté montado.
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-20" />; // Placeholder para evitar salto de layout.

  return (
    <header className="sticky top-0 z-50 w-full px-4 py-3">
      <nav className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-white/10 dark:bg-black/20 backdrop-blur-xl shadow-2xl flex items-center justify-between px-5 py-3 transition-all duration-500">
        
        {/* Branding Sutil */}
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500 p-1.5 rounded-xl shadow-lg shadow-emerald-500/20">
            <Zap size={18} className="text-black" />
          </div>
          <span className="font-black text-sm tracking-tighter text-emerald-900 dark:text-emerald-400 uppercase">
            Biota
          </span>
        </div>

        {/* Controles Centrales */}
        <div className="flex items-center gap-3">
          {/* Toggle Idioma */}
          <button 
            onClick={() => setLang(lang === "ES" ? "EN" : "ES")}
            className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2.5 py-1.5 rounded-full hover:bg-emerald-500/20 transition-colors"
          >
            <Globe size={12} /> {lang}
          </button>

          {/* Toggle Tema Animado */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full bg-white/5 border border-white/5 text-emerald-600 dark:text-yellow-400 hover:scale-110 active:rotate-45 transition-all"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Botón Connect Optimizado para Privy */}
        <button
          onClick={authenticated ? logout : login}
          className={`px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg ${
            authenticated 
            ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
            : "bg-emerald-500 text-black hover:bg-emerald-400 active:scale-95 shadow-emerald-500/20"
          }`}
        >
          {authenticated ? `${address?.slice(0, 4)}...${address?.slice(-4)}` : "Ingresar"}
        </button>
      </nav>
    </header>
  );
}
