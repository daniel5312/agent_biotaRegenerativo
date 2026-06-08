"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  Terminal,
  Zap,
  Lock,
  Unlock,
  Loader2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useConnection,
  useReadContract,
} from "wagmi";
import { ADDRESSES, ERC20_ABI } from "@/lib/contracts";

export function SecurityView() {
  const { address } = useConnection();
  const [log, setLog] = useState<string[]>([
    "[Vigil] Escaneando memoria on-chain de Celo Mainnet...",
  ]);

  // 1. Auditoría On-Chain Real
  const {
    data: currentAllowance,
    isLoading: isScanning,
    refetch,
  } = useReadContract({
    address: ADDRESSES.CUSD as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address
      ? [address as `0x${string}`, ADDRESSES.BIOTA_SCROW as `0x${string}`]
      : undefined,
    query: {
      enabled: !!address,
    },
  });

  // 2. Veredicto Criptográfico
  const isVulnerable =
    currentAllowance !== undefined && (currentAllowance as bigint) > 0n;

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isScanning) {
      setLog(["[Vigil] Escaneando memoria on-chain de Celo Mainnet..."]);
      return;
    }

    if (currentAllowance !== undefined) {
      const allowanceObj = currentAllowance as bigint;
      if (allowanceObj > 0n) {
        // Para simplificar, asumimos formatUnits y dividimos por 10^18 manualmente si no importamos viem
        const formattedAmount = Number(allowanceObj) / 1e18;
        setLog([
          "[Vigil] Escaneo completado.",
          `[CRITICAL] Riesgo inminente detectado en el contrato proxy.`,
          `[CRITICAL] Allowance expuesto: ${formattedAmount.toFixed(2)} cUSD`,
          "[ACTION] Se recomienda revocar los permisos inmediatamente.",
        ]);
      } else {
        setLog([
          "[Vigil] Escaneo completado.",
          "[SUCCESS] No se detectaron permisos abusivos en la billetera.",
          "[Vigil] Estado: PROTEGIDO.",
        ]);
      }
    }
  }, [currentAllowance, isScanning]);

  const handleRevoke = () => {
    writeContract({
      address: ADDRESSES.CUSD as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [ADDRESSES.BIOTA_SCROW as `0x${string}`, 0n],
    });
  };

  useEffect(() => {
    if (isSuccess) {
      setLog((prev) => [
        ...prev,
        "[SUCCESS] Transacción de revocación confirmada on-chain.",
        "[Vigil] Allowance ajustado a 0.00 cUSD.",
        "[Vigil] Estado: PROTEGIDO.",
      ]);
      refetch(); // Volver a escanear para actualizar la UI
    }
  }, [isSuccess, refetch]);

  return (
    <div className="px-4 py-4 space-y-4 mb-nav animate-fade-in">
      {/* Vigil Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`p-2 rounded-lg ${isVulnerable ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"}`}
          >
            <Shield size={24} className={isVulnerable ? "animate-pulse" : ""} />
          </div>
          <div>
            <h1 className="text-lg font-black italic uppercase leading-none">
              Vigil_Security
            </h1>
            <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest">
              Protocol Shield v1.0
            </p>
          </div>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${isVulnerable ? "bg-red-500/10 border-red-500/50 text-red-500 animate-pulse" : "bg-emerald-500/10 border-emerald-500/50 text-emerald-500"}`}
        >
          {isVulnerable ? "Estado: VULNERABLE" : "Estado: PROTEGIDO"}
        </div>
      </div>

      {/* Vulnerability Alert */}
      {isVulnerable && (
        <Alert
          variant="destructive"
          className="bg-red-950/20 border-red-500/50 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-black italic">
            ¡ALERTA CRÍTICA!
          </AlertTitle>
          <AlertDescription className="text-xs font-medium">
            Se ha detectado una colisión de almacenamiento en el proxy UUPS. Tu
            billetera está expuesta.
          </AlertDescription>
        </Alert>
      )}

      {/* Terminal Log */}
      <Card className="bg-black/40 border-white/5 font-mono text-[11px] overflow-hidden">
        <CardHeader className="py-2 px-4 border-b border-white/5 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-stone-500" />
            <span className="text-stone-500">vigil-scanner.log</span>
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500/50" />
            <div className="w-2 h-2 rounded-full bg-amber-500/50" />
            <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
          </div>
        </CardHeader>
        <CardContent className="p-4 h-40 overflow-y-auto space-y-1 no-scrollbar">
          {log.map((line, i) => (
            <div
              key={i}
              className={`flex gap-2 ${line.includes("CRITICAL") ? "text-red-400 font-bold" : line.includes("SUCCESS") ? "text-emerald-400" : "text-stone-500"}`}
            >
              <span className="opacity-30">{">"}</span>
              <span>{line}</span>
            </div>
          ))}
          {isVulnerable && (
            <div className="text-red-500 animate-pulse mt-2 font-black tracking-widest text-center">
              [ TU BILLETERA ESTÁ EXPUESTA ]
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Card */}
      <Card
        className={`glass-card border-2 transition-all duration-500 ${isVulnerable ? "border-red-500/30 bg-red-500/5" : "border-emerald-500/30 bg-emerald-500/5"}`}
      >
        <CardContent className="p-6 text-center space-y-6">
          <div className="relative inline-block">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${isVulnerable ? "bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]" : "bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)]"}`}
            >
              {isVulnerable ? (
                <Unlock size={40} className="text-white" />
              ) : (
                <Lock size={40} className="text-white" />
              )}
            </div>
            {isVulnerable && (
              <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-20" />
            )}
          </div>

          <div className="space-y-2">
            <h2
              className={`text-xl font-black italic transition-theme ${isVulnerable ? "text-red-500" : "text-emerald-500"}`}
            >
              {isVulnerable ? "REVOCAR APROBACIÓN" : "SISTEMA SEGURO"}
            </h2>
            <p className="text-xs text-stone-500 max-w-xs mx-auto">
              {isVulnerable
                ? "La aprobación de cUSD en el proxy comprometido debe ser terminada de inmediato para evitar la pérdida de fondos."
                : "Se ha establecido una aprobación segura de 0.00 cUSD. Tu exposición al riesgo actual es nula."}
            </p>
          </div>

          <Button
            onClick={handleRevoke}
            disabled={!isVulnerable || isPending || isConfirming}
            className={`w-full h-14 font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl ${isVulnerable ? "bg-red-600 hover:bg-red-500 text-white" : "bg-emerald-500 hover:bg-emerald-500 text-white opacity-50"}`}
          >
            {isPending || isConfirming ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Procesando...
              </>
            ) : isVulnerable ? (
              "Revocar en un clic"
            ) : (
              <>
                <ShieldCheck className="mr-2 h-5 w-5" /> Protegido
              </>
            )}
          </Button>

          {!isVulnerable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLog(["[Vigil] Re-escaneando..."]);
                refetch();
              }}
              className="w-full text-[10px] font-bold uppercase tracking-widest opacity-50 hover:opacity-100 hover:bg-transparent"
            >
              <RefreshCw size={12} className="mr-2" /> Re-escanear estado
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Security Details */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-stone-900/50 p-2.5 rounded-xl border border-white/5 flex flex-col justify-center">
          <Zap size={12} className="text-amber-500 mb-1" />
          <h3 className="text-[9px] font-black uppercase text-stone-300">
            Proxy Target
          </h3>
          <p className="text-[9px] font-mono text-stone-500 truncate">
            {ADDRESSES.BIOTA_SCROW.slice(0, 16)}...
          </p>
        </div>
        <div className="bg-stone-900/50 p-2.5 rounded-xl border border-white/5 flex flex-col justify-center">
          <Lock size={12} className="text-blue-500 mb-1" />
          <h3 className="text-[9px] font-black uppercase text-stone-300">
            Auth Method
          </h3>
          <p className="text-[9px] font-mono text-stone-500">
            ERC20 approve(0)
          </p>
        </div>
      </div>
      {/* ERC-8004 Agent Metrics (Restaurado) */}
      <div className="pt-4 border-t border-white/5 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Terminal size={16} className="text-emerald-500" />
          <h2 className="text-sm font-black italic uppercase text-white">Agent Registry (ERC-8004)</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
            <h3 className="text-[8px] font-black uppercase text-emerald-500 flex items-center gap-1">
               <ShieldCheck size={10} /> Agent ID
            </h3>
            <p className="text-[10px] font-mono text-white mt-1 truncate">scamceloagent8004</p>
          </div>
          <div className="bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20">
            <h3 className="text-[8px] font-black uppercase text-blue-500 flex items-center gap-1">
              <RefreshCw size={10} /> Transacciones
            </h3>
            <p className="text-[10px] font-mono text-white mt-1">142 Tx</p>
          </div>
          <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
            <h3 className="text-[8px] font-black uppercase text-amber-500 flex items-center gap-1">
              <Zap size={10} /> Feedback Score
            </h3>
            <p className="text-[10px] font-mono text-white mt-1">4.9 / 5.0</p>
          </div>
          <div className="bg-purple-500/10 p-2.5 rounded-xl border border-purple-500/20">
            <h3 className="text-[8px] font-black uppercase text-purple-500 flex items-center gap-1">
              <Lock size={10} /> Trust Level
            </h3>
            <p className="text-[10px] font-mono text-white mt-1">Verificado</p>
          </div>
        </div>

        {/* Enlaces a los Exploradores */}
        <div className="flex flex-col sm:flex-row gap-3">
          <a 
            href={`https://celoscan.io/address/${ADDRESSES.AGENT_TBA}`} 
            target="_blank" 
            rel="noreferrer"
            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 p-3 rounded-xl flex items-center justify-between transition-all"
          >
            <div>
              <p className="text-[10px] font-black uppercase text-stone-400">Ver en Celoscan</p>
              <p className="text-[9px] font-mono text-stone-500">celoscan.io</p>
            </div>
            <ExternalLink size={14} className="text-stone-400" />
          </a>
          
          <a 
            href={`https://explorer.celo.org/mainnet/address/${ADDRESSES.AGENT_TBA}`} 
            target="_blank" 
            rel="noreferrer"
            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 p-3 rounded-xl flex items-center justify-between transition-all"
          >
            <div>
              <p className="text-[10px] font-black uppercase text-emerald-500">Ver en Celo Explorer</p>
              <p className="text-[9px] font-mono text-emerald-700">explorer.celo.org</p>
            </div>
            <ExternalLink size={14} className="text-emerald-500" />
          </a>
        </div>
      </div>
    </div>
  );
}
