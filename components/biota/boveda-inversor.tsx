"use client";

import { useMemo } from "react";
import { Wallet, TrendingUp, Leaf, Sprout, ArrowRightLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  ADDRESSES,
  ERC20_ABI,
  BIOTA_RWA_ABI,
  formatCUSD,
} from "@/lib/contracts";
import { Button } from "@/components/ui/button";

export function BovedaInversor() {
  const { address, isConnected } = useAccount();

  // [DEFI] Leer el saldo directamente de la estrategia Aave V3
  const { data: mcUSDBalance } = useReadContract({
    chainId: 42220,
    address: "0x20715fe5e81cdeb6ed4be84403a1a6d7c67d4997", // AaveStrategy address
    abi: [
      {
        inputs: [
          { internalType: "address", name: "", type: "address" },
          { internalType: "address", name: "user", type: "address" },
        ],
        name: "getBalance",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "getBalance",
    args: address
      ? ["0x765DE816845861e75A25fCA122bb6898B8B1282a", address]
      : undefined, // cUSD address
    query: {
      enabled: !!address,
      refetchInterval: 10000, // refrescar cada 10s para ver crecer el yield
    },
  });

  // [FRONTEND] Simulamos la tasa de cambio COP/USD
  const TASA_COP = 4100;

  const displayCUSD = mcUSDBalance ? Number(formatCUSD(mcUSDBalance)) : 0;
  const displayCOP = displayCUSD * TASA_COP;
  const yieldMensualCOP = (displayCOP * 0.05) / 12; // 5% APY estimado

  // [TICKET-103] Lógica de Retiro (Withdraw)
  const {
    mutate: writeWithdraw,
    data: withdrawHash,
    isPending: isWithdrawing,
  } = useWriteContract();
  const { isLoading: isConfirmingWithdraw, isSuccess: isWithdrawSuccess } =
    useWaitForTransactionReceipt({ hash: withdrawHash });

  const handleWithdraw = () => {
    writeWithdraw({
      address: ADDRESSES.BIOTA_RWA,
      abi: BIOTA_RWA_ABI,
      functionName: "withdrawYield",
      args: [ADDRESSES.CUSD, typeMaxUint256], // Pasamos max uint256 para retirar todo
    });
  };

  const typeMaxUint256 =
    115792089237316195423570985008687907853269984665640564039457584007913129639935n;

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-stone-500">
        <Wallet className="w-12 h-12 mb-4 opacity-50" />
        <p>Conecta tu billetera para ver tu bóveda DeFi</p>
      </div>
    );
  }

  return (
    <>
      {/* TARJETA PRINCIPAL: BÓVEDA DEFI */}
      <Card className="glass-card overflow-hidden relative animate-slide-up mb-3">
        <div className="h-1 bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400" />

        <CardContent className="p-3 relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-emerald-950 dark:text-white uppercase tracking-wider">
                Tu Bóveda DeFi
              </h2>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400/80 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Rendimiento actual: ~5% APY respaldado por Aave V3
              </p>
            </div>

            <div className="ml-auto">
              <Button
                size="sm"
                onClick={handleWithdraw}
                disabled={displayCUSD === 0 || isWithdrawing || isConfirmingWithdraw}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                {isWithdrawing || isConfirmingWithdraw
                  ? "Reclamando..."
                  : "Reclamar Recompensa"}
              </Button>
            </div>
          </div>

          {/* SADOS COP y USD */}
          <div className="mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-black text-emerald-950 dark:text-white font-mono tracking-tight">
                $
                {displayCOP.toLocaleString("es-CO", {
                  maximumFractionDigits: 0,
                })}
              </span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                COP
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-stone-500 dark:text-stone-400 font-mono text-sm">
              <ArrowRightLeft className="w-3 h-3" />≈ {displayCUSD.toFixed(2)}{" "}
              cUSD
            </div>
          </div>

          {/* MÉTRICAS DE IMPACTO Y YIELD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white/50 dark:bg-[#0a0a0a]/50 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase">
                  Ganando
                </p>
                <p className="text-sm font-bold text-green-700 dark:text-green-400 font-mono">
                  +$
                  {yieldMensualCOP.toLocaleString("es-CO", {
                    maximumFractionDigits: 0,
                  })}{" "}
                  COP/mes
                </p>
              </div>
            </div>

            <div className="bg-white/50 dark:bg-[#0a0a0a]/50 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase">
                  Financiaste
                </p>
                <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                  Café Finca La Nube
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
