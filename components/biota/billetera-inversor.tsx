"use client";

import { useAccount, useReadContract, useBalance } from "wagmi";
import {
  CircleDollarSign,
  ExternalLink,
  Droplets,
  Coins
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatUnits } from "viem";
import { ADDRESSES, ERC20_ABI } from "@/lib/contracts";
import { IdentityAction } from "./IdentityAction";
import { BovedaInversor } from "./boveda-inversor";
import { PrestamosAave } from "./prestamos-aave";

export function BilleteraInversor() {
  const { address } = useAccount();

  // 1. Fetch CELO Balance
  const { data: celoRes } = useBalance({
    address: address ? (address as `0x${string}`) : undefined,
    query: { enabled: !!address, refetchInterval: 10000 },
  });

  // 2. Fetch G$ Balance
  const { data: gdBalanceRaw } = useReadContract({
    chainId: 42220,
    address: ADDRESSES.G$,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10000 },
  });

  // 3. Fetch cUSD Balance
  const { data: cUSDBalanceRaw } = useReadContract({
    chainId: 42220,
    address: ADDRESSES.CUSD,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10000 },
  });

  // Formato de Saldos
  const gDollarBalance = gdBalanceRaw
    ? Number(formatUnits(BigInt(gdBalanceRaw.toString()), 18)).toFixed(0)
    : "0";
    
  const celoBalance = celoRes
    ? Number(formatUnits(celoRes.value, 18)).toFixed(2)
    : "0.00";

  const cUSDBalance = cUSDBalanceRaw
    ? Number(formatUnits(BigInt(cUSDBalanceRaw.toString()), 18)).toFixed(2)
    : "0.00";

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 pb-20">
      
      {/* HEADER PRINCIPAL */}
      <div className="animate-in fade-in duration-500">
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">
          Mi <span className="text-blue-500">Billetera</span>
        </h1>
      </div>

      {/* SALDOS DE TOKENS (Saldos Reales - Como en Productor) DE PRIMERO */}
      <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-500 delay-100">
        <Card className="bg-white/5 border-white/5 p-6 rounded-3xl">
          <p className="text-[10px] font-black uppercase text-stone-500">
            CELO
          </p>
          <p className="text-3xl font-black text-amber-500 font-mono">
            {celoBalance}
          </p>
        </Card>
        <Card className="bg-white/5 border-white/5 p-6 rounded-3xl">
          <p className="text-[10px] font-black uppercase text-stone-500 flex items-center gap-1">
            <Coins className="w-3 h-3" /> cUSD
          </p>
          <p className="text-3xl font-black text-emerald-500 font-mono">
            {cUSDBalance}
          </p>
        </Card>
      </div>

      {/* GOODDOLLAR UBI + IDENTIDAD + SUPERFLUID (Idéntico al productor) */}
      <div className="space-y-6 animate-in fade-in duration-500 delay-200">
        <Card className="bg-blue-600/10 border-blue-500/20 p-8 rounded-3xl space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <CircleDollarSign size={80} className="text-blue-400" />
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
            <div>
              <Badge className="bg-blue-600 text-white text-[9px] font-black uppercase mb-2">
                GoodDollar UBI
              </Badge>
              <p className="text-5xl font-black text-white font-mono tracking-tighter">
                {gDollarBalance}
                <span className="text-xl text-blue-400 ml-2">G$</span>
              </p>
            </div>
            <a
              href="https://wallet.gooddollar.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 text-white h-12 px-8 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 shadow-xl shadow-blue-600/20"
            >
              Reclamar UBI <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          
          <div className="space-y-3 pt-4 border-t border-blue-500/20 relative z-10">
            <div className="bg-blue-600/20 p-2 rounded-2xl border border-blue-500/30">
              <IdentityAction />
            </div>
            
            <Button 
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black h-14 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              onClick={() => window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'impacto' }))}
            >
              <Droplets className="w-6 h-6" /> Empezar Goteo (Superfluid)
            </Button>
          </div>
        </Card>
      </div>

      {/* AAVE V3 YIELD - BÓVEDA DE INVERSOR */}
      <div className="pt-4 animate-in fade-in duration-500 delay-300">
        <h3 className="text-xs font-black text-stone-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          DeFi Aave V3
        </h3>
        <BovedaInversor />
        <PrestamosAave />
      </div>

    </div>
  );
}
