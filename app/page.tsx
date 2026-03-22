"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { useTheme } from "next-themes";
import {
  Sun,
  Moon,
  Globe,
  LogIn,
  Leaf,
  Droplets,
  Coins,
  ArrowRight,
  Sprout,
} from "lucide-react";
import BiotaProtocol from "@/components/biotaProtocol";
//import ChatInterface from "@/components/chatInterface";

const translations = {
  es: {
    title: "Biota Protocol",
    subtitle: "Suelo Vivo · Agricultura de Procesos",
    heroDesc:
      "Empoderando a los campesinos con inteligencia artificial y tecnología Web3 para regenerar la tierra y acceder a una Renta Básica (UBI).",
    btnReady: "Ingresar a la App",
    btnLoading: "Cargando motor Web3...",
    feat1Title: "Microbioma Inteligente",
    feat1Desc:
      "Recetas guiadas de Microorganismos de Montaña (MM) para sanar tu suelo.",
    feat2Title: "Renta Básica (UBI)",
    feat2Desc:
      "Recibe incentivos directos en cUSD por cada acción regenerativa certificada.",
    feat3Title: "Tecnología Cero Fricción",
    feat3Desc:
      "Diseñado para funcionar desde Telegram, sin frases semilla ni complicaciones.",
    footer: "Construido sobre Celo Network",
  },
  en: {
    title: "Biota Protocol",
    subtitle: "Living Soil · Process Agriculture",
    heroDesc:
      "Empowering farmers with AI and Web3 technology to regenerate the land and access Universal Basic Income (UBI).",
    btnReady: "Enter App",
    btnLoading: "Loading Web3...",
    feat1Title: "Smart Microbiome",
    feat1Desc:
      "Guided recipes for Mountain Microorganisms (MM) to heal your soil.",
    feat2Title: "Universal Basic Income",
    feat2Desc:
      "Receive direct cUSD incentives for every certified regenerative action.",
    feat3Title: "Zero-Friction Tech",
    feat3Desc:
      "Designed to work from Telegram, no seed phrases or complications.",
    footer: "Built on Celo Network",
  },
};

// --- 1. LANDING PAGE Y LOGIN ---
function LandingPage() {
  const { login, ready } = usePrivy();
  const { theme, setTheme } = useTheme();
  const [lang, setLang] = useState<"es" | "en">("es");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const t = translations[lang];

  return (
    <div className="flex flex-col h-dvh bg-gray-50 dark:bg-[#050e06] max-w-107.5 mx-auto shadow-2xl border-x border-black/5 dark:border-white/5 relative overflow-hidden transition-colors duration-300">
      {/* Barra superior flotante */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-20 bg-linear-to-b from-gray-50 dark:from-[#050e06] to-transparent">
        <button
          onClick={() => setLang(lang === "es" ? "en" : "es")}
          className="flex items-center gap-2 text-[10px] font-bold text-gray-600 dark:text-gray-300 bg-gray-200/60 dark:bg-white/5 px-3 py-1.5 rounded-full hover:bg-gray-300/60 dark:hover:bg-white/10 transition backdrop-blur-md"
        >
          <Globe size={14} /> {lang === "es" ? "EN" : "ES"}
        </button>
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-1.5 text-gray-600 dark:text-gray-300 bg-gray-200/60 dark:bg-white/5 rounded-full hover:bg-gray-300/60 dark:hover:bg-white/10 transition backdrop-blur-md"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        )}
      </div>

      {/* Contenido scrolleable */}
      <div className="flex-1 overflow-y-auto pb-24 pt-16 px-6 scrollbar-hide">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mt-4 mb-10 relative">
          <div className="absolute -top-10 -left-10 size-40 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl -z-10" />
          <div className="text-6xl mb-4 animate-bounce-slow drop-shadow-xl">
            🌱
          </div>
          <h1 className="text-gray-900 dark:text-green-50 text-3xl font-extrabold mb-2 tracking-tight">
            {t.title}
          </h1>
          <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm mb-4">
            {t.subtitle}
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            {t.heroDesc}
          </p>
        </div>

        {/* Feature Cards */}
        <div className="space-y-4 mb-10">
          <FeatureCard
            icon={<Sprout className="text-emerald-500" />}
            title={t.feat1Title}
            desc={t.feat1Desc}
          />
          <FeatureCard
            icon={<Coins className="text-amber-500" />}
            title={t.feat2Title}
            desc={t.feat2Desc}
          />
          <FeatureCard
            icon={<Leaf className="text-teal-500" />}
            title={t.feat3Title}
            desc={t.feat3Desc}
          />
        </div>
      </div>

      {/* Footer / Login Button Fijo abajo */}
      <div className="absolute bottom-0 left-0 w-full p-6 bg-linear-to-t from-gray-50 via-gray-50 dark:from-[#050e06] dark:via-[#050e06] to-transparent pt-12">
        <button
          onClick={login}
          disabled={!ready}
          className="group relative flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-black border-none rounded-2xl py-4 px-6 text-[15px] font-bold cursor-pointer w-full transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20 active:scale-95"
        >
          {ready ? t.btnReady : t.btnLoading}
          <ArrowRight
            size={18}
            className="group-hover:translate-x-1 transition-transform"
          />
        </button>
        <p className="text-center text-gray-400 dark:text-emerald-400/30 text-[10px] mt-4 font-mono uppercase tracking-widest">
          {t.footer}
        </p>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 p-4 rounded-2xl flex items-start gap-4 shadow-sm dark:shadow-none transition-transform hover:scale-[1.02]">
      <div className="p-2.5 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5 shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-gray-900 dark:text-white text-sm font-bold mb-1">
          {title}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  );
}

// --- 2. APLICACIÓN PRINCIPAL ---
export default function Page() {
  const { ready, authenticated } = usePrivy();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const twa = (window as any).Telegram?.WebApp;
    if (twa) {
      twa.expand();
      twa.enableClosingConfirmation();
      twa.setBackgroundColor(
        twa.colorScheme === "dark" ? "#050e06" : "#f9fafb",
      );
      twa.setHeaderColor(twa.colorScheme === "dark" ? "#050e06" : "#f9fafb");
    }
  }, []);

  if (!ready) {
    return (
      <div className="h-dvh flex items-center justify-center bg-gray-50 dark:bg-[#050e06] max-w-107.5 mx-auto shadow-2xl border-x border-black/5 dark:border-white/5">
        <div className="animate-spin text-emerald-500 text-4xl">⚙️</div>
      </div>
    );
  }

  if (!authenticated) {
    return <LandingPage />;
  }

  return (
    <div className="h-dvh bg-gray-50 dark:bg-[#050e06] max-w-107.5 mx-auto shadow-2xl relative overflow-hidden flex flex-col border-x border-black/5 dark:border-white/10 transition-colors duration-300">
      <BiotaProtocol />
    </div>
  );
}
