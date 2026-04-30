"use client";

import { useState } from "react";
import { useConnection } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { useMiniPay } from "@/hooks/useMiniPay";
import { useBiotaPass } from "@/hooks/useBiotaPass";
import { useAdminBypass } from "@/hooks/useAdminBypass"; // NUEVO HOOK
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

// COMPONENTES REALES WAGMI
import { ImpactoView } from "@/components/biota/impacto-view";
import { AsesoriaView } from "@/components/biota/asesoria-view";

type TabType = "dashboard" | "recetario" | "escaner" | "tesoreria" | "chat";

export default function BiotaProtocol() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const { logout } = usePrivy();
  const { isBypassed } = useAdminBypass(); // MODO DIOS

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId],
    );
  };

  return (
    <div className="flex flex-col h-dvh bg-linear-to-b from-[#0a1a14] via-[#0d1f1a] to-[#081210]">
      {isBypassed && (
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse z-[100]" />
      )}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        {isBypassed && (
          <span className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-2 py-1 rounded border border-red-500/30">
            God Mode
          </span>
        )}
        <button
          onClick={logout}
          className="p-2 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500/20 backdrop-blur-md"
        >
          <LogOut size={18} />
        </button>
      </div>

      <main className="flex-1 overflow-y-auto pb-24">
        {/* COMPONENTES REALES CONECTADOS A WAGMI */}
        {activeTab === "dashboard" && <ImpactoView />}
        {activeTab === "chat" && <AsesoriaView />}
        
        {/* COMPONENTES SECUNDARIOS */}
        {activeTab === "recetario" && (
          <RecetarioView
            completedTasks={completedTasks}
            toggleTask={toggleTask}
          />
        )}
        {activeTab === "escaner" && <EscanerView />}
        {activeTab === "tesoreria" && <TesoreriaView />}
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

function TesoreriaView() {
  const { formattedBalance, isLoadingBalance } = useMiniPay();
  const { address } = useConnection();

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
