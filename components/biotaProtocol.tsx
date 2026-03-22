"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { useMiniPay } from "@/hooks/useMiniPay";
import { useBiotaPass } from "@/hooks/useBiotaPass";
import {
  LayoutDashboard,
  ClipboardList,
  Camera,
  Wallet,
  AlertTriangle,
  AlertCircle,
  Leaf,
  Play,
  Check,
  MapPin,
  Clock,
  Share2,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Droplets,
  Sun,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import ChatInterface from "@/components/chatInterface";

type TabType = "dashboard" | "recetario" | "escaner" | "tesoreria" | "chat";

export default function BiotaProtocol() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const { logout } = usePrivy();

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId],
    );
  };

  return (
    <div className="flex flex-col h-dvh bg-linear-to-b from-[#0a1a14] via-[#0d1f1a] to-[#081210]">
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={logout}
          className="p-2 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500/20 backdrop-blur-md"
        >
          <LogOut size={18} />
        </button>
      </div>

      <main className="flex-1 overflow-y-auto pb-24">
        {activeTab === "dashboard" && <DashboardView />}
        {activeTab === "recetario" && (
          <RecetarioView
            completedTasks={completedTasks}
            toggleTask={toggleTask}
          />
        )}
        {activeTab === "escaner" && <EscanerView />}
        {activeTab === "tesoreria" && <TesoreriaView />}

        {/* NUEVA VISTA DE CHAT */}
        {activeTab === "chat" && (
          <div className="px-5 pt-14 pb-10">
            <header className="mb-6">
              <p className="text-emerald-400/80 text-sm font-medium tracking-wide">
                Inteligencia Biota
              </p>
              <h1 className="text-2xl font-bold text-white mt-1">
                Asesor Multi-Agente
              </h1>
            </header>
            <ChatInterface />
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-107.5 mx-auto bg-linear-to-t from-[#0a1510]/98 via-[#0a1510]/95 to-transparent backdrop-blur-2xl border-t border-white/5 pb-safe">
        <div className="flex items-center justify-around h-20 px-2">
          <NavButton
            icon={<LayoutDashboard className="size-6" />}
            label="Inicio"
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
          />
          <NavButton
            icon={<ClipboardList className="size-6" />}
            label="Plan"
            active={activeTab === "recetario"}
            onClick={() => setActiveTab("recetario")}
          />
          {/* BOTÓN CENTRAL DE IA */}
          <NavButton
            icon={
              <Sparkles
                size={24}
                className={activeTab === "chat" ? "text-emerald-400" : ""}
              />
            }
            label="IA"
            active={activeTab === "chat"}
            onClick={() => setActiveTab("chat")}
          />
          <NavButton
            icon={<Camera className="size-6" />}
            label="Captura"
            active={activeTab === "escaner"}
            onClick={() => setActiveTab("escaner")}
          />
          <NavButton
            icon={<Wallet className="size-6" />}
            label="Wallet"
            active={activeTab === "tesoreria"}
            onClick={() => setActiveTab("tesoreria")}
          />
        </div>
      </nav>
    </div>
  );
}

function NavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-5 py-2 rounded-2xl transition-all duration-300 ${active ? "text-emerald-400" : "text-white/40 hover:text-white/60"}`}
    >
      <div
        className={`transition-transform duration-300 ${active ? "scale-110" : ""}`}
      >
        {icon}
      </div>
      <span
        className={`text-[10px] font-semibold tracking-wide ${active ? "text-emerald-400" : ""}`}
      >
        {label}
      </span>
      {active && (
        <div className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-400" />
      )}
    </button>
  );
}

function DashboardView() {
  const { bioScore, hasPassport, isLoading } = useBiotaPass();
  const displayScore = isLoading ? 0 : hasPassport ? bioScore : 0;

  return (
    <div className="px-5 pt-14 space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-emerald-400/80 text-sm font-medium tracking-wide">
            Buenos dias
          </p>
          <h1 className="text-2xl font-bold text-white mt-1">Finca El Cateo</h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
          <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-xs font-semibold">
            {hasPassport ? "Pasaporte Activo" : "Sin Registro"}
          </span>
        </div>
      </header>

      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-white/8 to-white/2 border border-white/10 p-5">
        <div className="absolute -top-20 -right-20 size-40 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 size-32 bg-cyan-500/15 rounded-full blur-2xl" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="size-5 text-emerald-400" />
            <span className="text-white/80 text-sm font-medium">
              Score Biológico On-Chain
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative size-32 shrink-0">
              <svg className="size-32 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-white/5"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="url(#scoreGradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${displayScore * 2.64} 264`}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient
                    id="scoreGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-white">
                  {isLoading ? "..." : displayScore}
                </span>
                <span className="text-xs text-white/50 font-medium">/100</span>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <MetricRow
                icon={<Droplets className="size-4" />}
                label="Biodiversidad"
                value={32}
                color="from-cyan-400 to-emerald-400"
              />
              <MetricRow
                icon={<Sun className="size-4" />}
                label="Enzimas"
                value={58}
                color="from-amber-400 to-orange-400"
              />
              <MetricRow
                icon={<TrendingUp className="size-4" />}
                label="Micorrizas"
                value={25}
                color="from-emerald-400 to-teal-400"
              />
            </div>
          </div>
        </div>
      </div>
      <Button
        size="lg"
        className="w-full h-14 text-base font-bold rounded-2xl bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/25 border-0"
      >
        <Leaf className="size-5 mr-2" /> Ver Plan de Rescate
      </Button>
    </div>
  );
}

function MetricRow({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/60">
          {icon}
          <span className="text-xs font-medium">{label}</span>
        </div>
        <span className="text-xs font-bold text-white">{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full bg-linear-to-r ${color} transition-all duration-700`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function TesoreriaView() {
  const { formattedBalance, isLoadingBalance } = useMiniPay();
  const { address } = useAccount();

  return (
    <div className="px-5 pt-14 space-y-6 pb-28">
      <header>
        <p className="text-emerald-400/80 text-sm font-medium tracking-wide">
          Tu Wallet
        </p>
        <h1 className="text-2xl font-bold text-white mt-1">Tesoreria ReFi</h1>
      </header>

      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-500/20 via-teal-500/15 to-cyan-500/10 border border-emerald-500/20 p-6">
        <div className="absolute -top-16 -right-16 size-32 bg-emerald-500/30 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-12 rounded-2xl bg-linear-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Wallet className="size-6 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-medium">
                Billetera Celo
              </p>
              <p className="text-emerald-400 text-xs font-semibold">
                {address
                  ? `${address.slice(0, 6)}...${address.slice(-4)}`
                  : "No conectada"}
              </p>
            </div>
          </div>
          <div className="mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-white">
                {isLoadingBalance ? "..." : formattedBalance}
              </span>
              <span className="text-xl font-semibold text-emerald-400">
                cUSD
              </span>
            </div>
            <p className="text-white/40 text-xs mt-1">Saldo On-Chain</p>
          </div>
          <div className="flex gap-3 mt-4">
            <Button className="flex-1 h-12 rounded-2xl bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold border-0">
              Retirar a Banco
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecetarioView({ completedTasks, toggleTask }: any) {
  const tasks = [
    {
      id: "task-1",
      title: "Aporte de Bio-Sustrato",
      description: "Aplicar 310 Bultos de Bocashi Premium.",
      dosage: "310 Bultos / Hectarea",
      frequency: "Aplicacion unica",
      icon: <Leaf className="size-5" />,
    },
    {
      id: "task-2",
      title: "Inoculacion Masiva",
      description: "Preparar 100 Kilos de Cepa Madre MM Solidos.",
      dosage: "100 kg Cepa Madre MM",
      frequency: "Drench cada 15 dias",
      icon: <Droplets className="size-5" />,
    },
  ];
  const progress = (completedTasks.length / tasks.length) * 100;

  return (
    <div className="px-5 pt-14 space-y-6">
      <header>
        <div className="flex items-center gap-3 mb-3">
          <div className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
            <span className="text-emerald-400 text-xs font-bold">Fase 1</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white">Plan de Intervencion</h1>
      </header>
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-500/20 p-4">
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-linear-to-r from-emerald-500 to-teal-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <Accordion type="single" collapsible className="space-y-3">
        {tasks.map((task) => (
          <AccordionItem
            key={task.id}
            value={task.id}
            className="border-0 rounded-2xl bg-white/3 data-[state=open]:bg-white/6 overflow-hidden transition-colors"
          >
            <AccordionTrigger className="hover:no-underline px-4 py-4">
              <span className="text-white">{task.title}</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <p className="text-white/60 text-sm leading-relaxed">
                {task.description}
              </p>
              <div className="flex items-center gap-2 mt-4">
                <Checkbox
                  id={task.id}
                  checked={completedTasks.includes(task.id)}
                  onCheckedChange={() => toggleTask(task.id)}
                  className="border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                />
                <label
                  htmlFor={task.id}
                  className="text-sm text-white/70 cursor-pointer"
                >
                  Completada
                </label>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

function EscanerView() {
  return (
    <div className="flex flex-col h-dvh">
      <div className="relative flex-1 bg-black overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-full max-w-70 aspect-square border-2 border-emerald-400 rounded-3xl flex items-center justify-center text-emerald-400">
            Cámara Biológica
          </div>
        </div>
      </div>
    </div>
  );
}
