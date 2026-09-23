"use client";

import { useMemo } from "react";
import { Copy, Sprout, Send, Download } from "lucide-react";
import { formatUnits } from "viem";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { useUbiFlow } from "@/context/UbiFlowContext";
import { useSuperfluidStream } from "@/hooks/useSuperfluidStream";
import { useMultiTokenBalances } from "@/hooks/useMultiTokenBalances";

export function GlobalHeader() {
  const { user } = usePrivy();
  const { address: activeAddress } = useAccount();
  const { toast } = useToast();
  
  // 1. Identidad de Billetera
  const primaryAddress = (user?.wallet?.address || activeAddress) as `0x${string}`;

  // 2. Extraer contexto UBI global y saldos (Sin Hardcoding)
  const { ubiAddress } = useUbiFlow();
  const { balances: primaryBalances } = useMultiTokenBalances(primaryAddress);
  const { balances: ubiBalances } = useMultiTokenBalances(ubiAddress || undefined);

  // 3. Re-utilizamos tu hook real de Superfluid para calcular el flujo
  const stream = useSuperfluidStream(ubiAddress || primaryAddress);

  // Lógica Auxiliar de Copiar Billetera
  const handleCopy = (text: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(text);
      toast({ title: "✅ Billetera Copiada", description: "Pégala para recibir fondos." });
    }
  };

  // Cálculo de Saldo Dinámico (cUSD + USDT + USDC + CELO + G$)
  const totalUsdFixed = useMemo(() => {
    if (!primaryBalances) return "0.0000";
    const stables =
      Number(formatUnits(primaryBalances.cusd || 0n, 18)) +
      Number(formatUnits(primaryBalances.usdt || 0n, 6)) +
      Number(formatUnits(primaryBalances.usdc || 0n, 6));
    const celoInUsd = Number(formatUnits(primaryBalances.celo || 0n, 18)) * 0.8;
    const gdInUsd = ubiBalances ? Number(formatUnits(ubiBalances.gd || 0n, 18)) * 0.0001 : 0;
    
    return (stables + celoInUsd + gdInUsd).toFixed(4); // Fijo a 4 decimales
  }, [primaryBalances, ubiBalances]);

  // Conversión COP (Desde Env con fallback seguro a 4150)
  const copRate = Number(process.env.NEXT_PUBLIC_COP_CONVERSION_RATE || 4150);
  const valueCOP = (Number(totalUsdFixed) * copRate).toLocaleString("es-CO", { maximumFractionDigits: 0 });

  return (
    <div className="w-full bg-[#0D1B1A]/95 flex flex-col shrink-0 border-b border-emerald-900/50 p-4 shadow-xl z-30">
      <div className="flex items-center justify-between mb-3">
        {/* Identidad / Modulo Wallet Rápido */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex flex-col items-center justify-center p-1 cursor-pointer">
            <Sprout className="w-5 h-5 text-emerald-400" />
          </div>
          <div onClick={() => primaryAddress && handleCopy(primaryAddress)} className="cursor-pointer group">
            <p className="text-[10px] text-emerald-500/80 font-mono font-bold uppercase tracking-wider group-hover:text-emerald-400">
              Mi Billetera <Copy size={10} className="inline ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
            <p className="text-white text-sm font-bold flex items-center gap-1">
              {primaryAddress ? `${primaryAddress.slice(0, 6)}...${primaryAddress.slice(-4)}` : "No Conectado"}
            </p>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex gap-2">
          <button className="w-9 h-9 flex items-center justify-center rounded-full bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-md">
            <Download className="w-4 h-4" />
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-full bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-md">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Display Principal del Patrimonio */}
      <div 
        
        
        className="bg-gradient-to-br from-emerald-950/80 to-[#0a1413] rounded-2xl p-4 border border-emerald-500/20 relative overflow-hidden flex flex-col items-center justify-center"
      >
        {/* Glow animado indicativo de goteo si el stream está vivo */}
        {stream.isActive && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl animate-pulse" />
        )}
        
        <p className="text-[10px] flex items-center gap-1 text-emerald-400/80 font-black uppercase mb-1 drop-shadow-md">
          {stream.isActive && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />}
          Patrimonio Regenerativo
        </p>
        
        {/* Render USD Total Fijo */}
        <div className="flex items-baseline gap-1">
          <span className="text-xl text-emerald-400 font-bold">$</span>
          <span 
            key={totalUsdFixed} // Fuerza render sutil
            className="text-4xl font-black text-white tracking-widest font-mono drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]"
          >
            {totalUsdFixed}
          </span>
          <span className="text-[10px] font-bold text-emerald-500 ml-1 badge-usdm bg-emerald-500/10 px-1 py-0.5 rounded">USD</span>
        </div>

        {/* Render COP Conversion */}
        <p className="mt-1 text-sm font-mono text-stone-400 font-medium">
          ≈ <span className="text-stone-300">${valueCOP}</span> COP
        </p>
      </div>
    </div>
  );
}
