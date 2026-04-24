"use client";

import React, { useMemo, useCallback, useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { ADDRESSES, BIOTA_SCROW_ABI, ERC20_ABI, formatCUSD } from "@/lib/contracts";
import { useAgent } from "@/context/agentProvider";
import {
  Loader2,
  Sprout,
  Wallet,
  ShieldCheck,
  Camera,
  Sparkles,
} from "lucide-react";

export default function MiniPayDashboard() {
  const { authenticated } = usePrivy();
  const { address } = useAccount();
  const { wallets } = useWallets();
  const { messages, isLoading: isAgentLoading } = useAgent();

  const [isMiniPay, setIsMiniPay] = useState(false);

  useEffect(() => {
    if (window.ethereum && (window.ethereum as any).isMiniPay) {
      setIsMiniPay(true);
    }
  }, []);

  const { data: balanceValue } = useReadContract({
    address: ADDRESSES.CUSD,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { writeContract, isPending: isDeploying } = useWriteContract();

  const handleClaimUBI = useCallback(async () => {
    if (!wallets[0]) return;
    try {
      const provider = await wallets[0].getEthereumProvider();
      console.log("[GOODDOLLAR-VIEM] Validando Entitlement...");

      writeContract({
        address: ADDRESSES.BIOTA_SCROW,
        abi: BIOTA_SCROW_ABI,
        functionName: "executeDoubleTrigger",
        args: [BigInt(Date.now()), address!, 100],
      });
    } catch (error) {
      console.error("Error en Reclamo JIT:", error);
    }
  }, [address, wallets, writeContract]);

  const formattedBalance = useMemo(() => {
    return balanceValue !== undefined ? `${formatCUSD(balanceValue as bigint)} cUSD` : "0.00 cUSD";
  }, [balanceValue]);

  return (
    <div className="flex flex-col p-4 font-sans max-w-md mx-auto">
      {/* [REFI-UI] Feed del Oráculo IA */}
      {messages.length > 0 && (
        <section className="mb-6 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {messages.slice(-2).map((msg, i) => (
            <div
              key={i}
              className={`p-4 rounded-2xl text-sm font-medium border shadow-sm ${
                msg.role === "user"
                  ? "bg-emerald-100/50 border-emerald-200 text-emerald-900 ml-8"
                  : "bg-white dark:bg-zinc-900 border-emerald-500/20 text-zinc-800 dark:text-zinc-200 mr-8"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {msg.role === "assistant" && (
                  <Sparkles size={14} className="text-emerald-500" />
                )}
                <span className="text-[10px] uppercase font-black tracking-widest opacity-50">
                  {msg.role === "assistant" ? "Oráculo" : "Tú"}
                </span>
              </div>
              {msg.content}
            </div>
          ))}
        </section>
      )}

      {/* Card de Saldo */}
      <section className="bg-emerald-600 rounded-3xl p-8 shadow-xl text-white mb-6 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-emerald-100 text-sm font-medium uppercase tracking-wider mb-2">
            Incentivo Disponible
          </p>
          <p className="text-4xl font-black mb-4 tracking-tight">
            {formattedBalance}
          </p>
          <div className="flex items-center gap-2 bg-emerald-700/50 w-fit px-3 py-1 rounded-full text-xs font-mono">
            <Wallet size={14} />
            <span>
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </div>
        </div>
        <Sprout className="absolute -bottom-4 -right-4 text-emerald-500/30 w-32 h-32 rotate-12" />
      </section>

      {/* Botones de Acción */}
      <main className="flex flex-col gap-4">
        <button
          onClick={handleClaimUBI}
          disabled={isDeploying || !authenticated}
          className="w-full bg-white dark:bg-zinc-900 text-emerald-900 dark:text-emerald-400 border-2 border-emerald-200 dark:border-emerald-500/20 h-24 rounded-3xl flex items-center justify-between px-8 shadow-sm active:scale-95 transition-all disabled:opacity-50"
        >
          <div className="text-left">
            <p className="font-black text-xl">Reclamar UBI</p>
            <p className="text-sm opacity-70 italic">Verificación JIT Activa</p>
          </div>
          {isDeploying ? (
            <Loader2 className="animate-spin text-emerald-600" size={32} />
          ) : (
            <Camera className="text-emerald-600" size={32} />
          )}
        </button>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-500/10 flex flex-col items-center gap-2">
            <ShieldCheck className="text-emerald-500" size={28} />
            <p className="font-bold text-emerald-900 dark:text-zinc-400 text-sm">
              Bio-Score
            </p>
            <p className="text-2xl font-black text-emerald-600">100%</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-500/10 flex flex-col items-center gap-2">
            <Sprout className="text-emerald-500" size={28} />
            <p className="font-bold text-emerald-900 dark:text-zinc-400 text-sm">
              Hectáreas
            </p>
            <p className="text-2xl font-black text-emerald-600">2.5</p>
          </div>
        </div>
      </main>

      {/* Status Footer */}
      <footer className="mt-8 text-center">
        {isMiniPay ? (
          <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest animate-pulse">
            ✨ Optimizada para MiniPay
          </p>
        ) : (
          <p className="text-[10px] text-emerald-400 font-medium italic opacity-50 uppercase tracking-tighter">
            Conexión Web3 Segura
          </p>
        )}
      </footer>
    </div>
  );
}
