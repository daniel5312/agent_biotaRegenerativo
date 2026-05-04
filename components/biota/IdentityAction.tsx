"use client"
import React from 'react'
import { 
  Camera, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  Zap, 
  Clock, 
  Coins, 
  RefreshCw, 
  Wallet, 
  WalletCards,
  TrendingUp,
  Droplets,
  Sprout,
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAccount } from "wagmi"
import { usePrivy, useWallets } from "@privy-io/react-auth"
import { useGoodDollarIdentity } from "@/hooks/useGoodDollarIdentity"
import { ADDRESSES } from "@/lib/contracts"
import { useToast } from "@/hooks/use-toast"
import { useUBIClaim } from "@/hooks/useUBIClaim"
import { useSuperfluidStream } from "@/hooks/useSuperfluidStream"
import { StreamingBalance } from "./StreamingBalance"
import { useMultiTokenBalances } from '@/hooks/useMultiTokenBalances'
import { useUbiFlow } from "@/context/UbiFlowContext"
import { formatUnits } from 'viem'

// Función para mostrar precisión dinámica sin perder decimales importantes
const formatCrypto = (value: bigint, decimals: number) => {
  const num = Number(formatUnits(value, decimals));
  if (num === 0) return "0.00";
  if (num < 0.01) return num.toFixed(4);
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Función para estimar USD total (asumiendo stables = $1, CELO = $0.80, G$ = 0.0001)
const calculateTotalUSD = (balances: any, ubiBalances?: any) => {
  const stables = Number(formatUnits(balances.cusd, 18)) + 
                  Number(formatUnits(balances.usdt, 6)) + 
                  Number(formatUnits(balances.usdc, 6));
  const celoInUsd = Number(formatUnits(balances.celo, 18)) * 0.80;
  const gdInUsd = ubiBalances ? Number(formatUnits(ubiBalances.gd, 18)) * 0.0001 : 0;
  return (stables + celoInUsd + gdInUsd).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
};

interface IdentityActionProps {
  tokenId?: bigint
}

export function IdentityAction({ tokenId }: IdentityActionProps) {
  const { user } = usePrivy()
  const { address: activeAddress } = useAccount()
  const { toast } = useToast()
  
  // 1. Identificar Billetera A (Login - Dinámica)
  const primaryAddress = activeAddress as `0x${string}`

  // 2. Consumir el Estado Global (WalletConnect y Superfluid)
  const { 
    ubiAddress, 
    handleConnectUBI, 
    disconnectUBI, 
    stream, 
    isFlowActive 
  } = useUbiFlow();


  // 3. Datos de Identidad
  const identity = useGoodDollarIdentity(primaryAddress)
  
  // 4. DOBLE LECTURA DE SALDOS
  const { balances: primaryBalances } = useMultiTokenBalances(primaryAddress)
  const { balances: ubiBalances } = useMultiTokenBalances(ubiAddress || undefined)

  // 4.5 Lógica Inferida de Identidad y Liquidez
  const gdBalanceNum = Number(formatUnits(ubiBalances.gd, 18));
  const hasGoodDollarFunds = !!ubiAddress && ubiBalances.gd > 0n;
  const isHumanVerified = identity.hasValidIdentity || hasGoodDollarFunds;

  // 5. Hook de UBI Claim — checkEntitlement + claim real
  const {
    entitlementFormatted,
    canClaim,
    isClaiming,
    claimUBI,
    claimConfirmed,
    isLoading: loadingClaim,
    refetchEntitlement,
  } = useUBIClaim(identity.whitelistedRoot as `0x${string}`, identity.whitelistedRoot)

  // 6. Temporizador Simulado (24h) para UX de Reclamo
  const [timeLeft, setTimeLeft] = React.useState<number>(0);
  const [localCanClaim, setLocalCanClaim] = React.useState<boolean>(true);

  React.useEffect(() => {
    if (!localCanClaim) {
      const targetTime = Date.now() + 24 * 60 * 60 * 1000;
      const interval = setInterval(() => {
        const remaining = targetTime - Date.now();
        if (remaining <= 0) {
          setTimeLeft(0);
          setLocalCanClaim(true);
          clearInterval(interval);
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [localCanClaim]);

  const formatTime = (ms: number) => {
    if (ms <= 0) return "00:00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* ── BOLSILLO 1: BILLETERA OPERATIVA (MiniPay) ── */}
      <section className="space-y-3">
        <Card className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white shadow-xl shadow-emerald-900/20 rounded-[2.5rem] overflow-hidden border-emerald-800">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <Badge variant="outline" className="border-emerald-700/50 text-emerald-400 bg-emerald-950/50 uppercase tracking-widest text-[9px] font-black">
                MiniPay Operativa
              </Badge>
              <Wallet size={16} className="text-emerald-500" />
            </div>
            
            <div className="text-center mb-8">
              <p className="text-emerald-500/60 text-[10px] font-black uppercase tracking-widest mb-1">
                Saldo Total (Estimado)
              </p>
              <h2 className="text-4xl font-black tracking-tighter">
                {calculateTotalUSD(primaryBalances, ubiBalances)}
              </h2>
            </div>

            <div className="grid grid-cols-4 gap-2 p-3 bg-black/20 rounded-3xl">
              {[
                { label: 'CELO', val: primaryBalances.celo, dec: 18, icon: <Coins size={10} className="text-emerald-500" /> },
                { label: 'cUSD', val: primaryBalances.cusd, dec: 18, icon: <Zap size={10} className="text-blue-500" /> },
                { label: 'USDT', val: primaryBalances.usdt, dec: 6, icon: <TrendingUp size={10} className="text-green-500" /> },
                { label: 'USDC', val: primaryBalances.usdc, dec: 6, icon: <ShieldCheck size={10} className="text-blue-400" /> }
              ].map(tk => (
                <div key={tk.label} className="flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-white/5 transition-all">
                  <div className="mb-1 bg-white/10 p-1.5 rounded-full">{tk.icon}</div>
                  <span className="text-[8px] font-black text-emerald-500/60 uppercase mb-0.5">{tk.label}</span>
                  <span className="text-[10px] font-bold text-emerald-50 truncate w-full text-center">
                    {formatCrypto(tk.val, tk.dec)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── BOLSILLO 2: BOLSILLO DE IMPACTO (GoodDollar) ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex flex-col">
            <h4 className="text-[10px] font-black text-blue-900/40 dark:text-blue-400/40 uppercase tracking-[0.3em]">
              Bolsillo de Impacto (UBI)
            </h4>
            {ubiAddress && (
              <span className="text-[7px] text-blue-500 font-mono opacity-60">
                {ubiAddress.slice(0, 6)}...{ubiAddress.slice(-4)}
              </span>
            )}
          </div>
          {!ubiAddress ? (
            <Button 
              size="sm" 
              onClick={handleConnectUBI}
              className="bg-blue-600 hover:bg-blue-500 text-[9px] font-black uppercase h-7 px-3 rounded-lg shadow-lg shadow-blue-500/20"
            >
              Conectar GoodWallet
            </Button>
          ) : (
            <div 
              role="button"
              onClick={disconnectUBI}
              className="text-[8px] font-black text-blue-500/40 hover:text-blue-500 uppercase tracking-widest cursor-pointer"
            >
              [ Desconectar ]
            </div>
          )}
        </div>

        <Card className="bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-900/10 dark:to-emerald-950/20 border-blue-100 dark:border-blue-500/20 shadow-xl shadow-blue-500/5 rounded-[2.5rem] overflow-hidden relative border-2">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50" />
          <CardContent className="p-8 text-center space-y-6">

            {/* Saldo Estático de la GoodWallet */}
            <div className="flex flex-col items-center justify-center p-4 bg-blue-500/5 rounded-3xl border border-blue-500/10">
              <span className="text-[10px] font-black text-blue-900/40 dark:text-blue-400/60 uppercase tracking-widest mb-1">
                Fondo GoodDollar Disponible
              </span>
              <h2 className="text-3xl font-black text-blue-600 dark:text-blue-400">
                {formatCrypto(ubiBalances.gd, 18)} <span className="text-sm">G$</span>
              </h2>
            </div>
            
            {/* El Reloj de Dinero G$ */}
            <div className="space-y-2 relative">
               <StreamingBalance 
                baseBalance={ubiBalances.gd} 
                flowRate={stream.flowRate}
                lastUpdateTimestamp={stream.lastUpdated}
              />
              <div className="flex items-center justify-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isFlowActive ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'}`} />
                <span className="text-[9px] font-black text-blue-900/40 dark:text-blue-400/40 uppercase tracking-widest">
                  {isFlowActive ? 'Sueldo Regenerativo Activo' : 'Goteo Detenido'}
                </span>
              </div>
            </div>

            {/* Fila de Estado: Identidad + Refresh */}
            <div className="flex items-center gap-2">
              <div className={`flex-1 flex items-center gap-3 p-3 rounded-2xl border ${
                isHumanVerified ? "bg-white/60 dark:bg-blue-900/20 border-blue-100 dark:border-blue-500/20" : "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-500/20"
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isHumanVerified ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"
                }`}>
                  {isHumanVerified ? <ShieldCheck size={16} /> : <AlertCircle size={16} />}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-[9px] font-black uppercase text-blue-950 dark:text-blue-100 truncate">
                    {isHumanVerified ? "Humano Verificado" : "Identidad Pendiente"}
                  </p>
                  <p className="text-[8px] text-blue-900/50 dark:text-blue-400/50 uppercase font-bold tracking-tighter">
                    {isHumanVerified ? "Acceso Total al UBI" : "Verifica tu rostro"}
                  </p>
                </div>
              </div>
              
              {/* Botón de Refresh UBI */}
              <div 
                role="button"
                onClick={() => refetchEntitlement()}
                className="w-12 h-12 rounded-2xl bg-white dark:bg-emerald-950/40 border-2 border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-all active:scale-90 cursor-pointer"
              >
                <RefreshCw className={`w-5 h-5 ${loadingClaim ? 'animate-spin' : ''}`} />
              </div>
            </div>

            {/* Acciones: Claim UBI o Botón Superfluid */}
            <div className="space-y-3">

              {/* NUEVO: Botón Prominente de Reclamo UBI */}
              {isHumanVerified && (
                <Button
                  disabled={!localCanClaim}
                  onClick={() => {
                    console.log("Iniciando reclamo de UBI en GoodDollar...");
                    setLocalCanClaim(false);
                    setTimeLeft(24 * 60 * 60 * 1000);
                  }}
                  className={`w-full h-14 rounded-2xl text-white font-black uppercase tracking-widest shadow-lg transition-all ${
                    localCanClaim ? "bg-blue-600 hover:bg-blue-500 shadow-blue-500/30" : "bg-stone-300 dark:bg-stone-800 text-stone-500 cursor-not-allowed"
                  }`}
                >
                  {localCanClaim ? (
                    <>
                      <RefreshCw className="mr-2" size={16} /> Reclamar UBI Diario
                    </>
                  ) : (
                    <>
                      <Clock className="mr-2" size={16} /> Próximo UBI en: {formatTime(timeLeft)}
                    </>
                  )}
                </Button>
              )}
               
              {/* Alertas Preventivas de Liquidez */}
              {isFlowActive && gdBalanceNum <= 100 && (
                <div className={`p-3 rounded-xl border flex items-start gap-2 text-left animate-in fade-in zoom-in duration-500 ${
                  gdBalanceNum < 50 
                    ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400" 
                    : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                }`}>
                  <div className="mt-0.5 shrink-0">
                    {gdBalanceNum < 50 ? <AlertCircle size={14} /> : <Droplets size={14} />}
                  </div>
                  <div className="text-[10px] font-bold leading-snug">
                    {gdBalanceNum < 50 
                      ? "⚠️ Peligro de detención. Liquidez crítica, reclama tu UBI ahora."
                      : "💧 Tu grifo tiene poca liquidez. Reclama tu UBI pronto para mantener el flujo."}
                  </div>
                </div>
              )}

               {!isFlowActive ? (
                <div 
                  role="button"
                  onClick={() => { if (stream.canSign && !stream.isPending) stream.startStream() }}
                  className={`w-full h-16 rounded-2xl flex flex-col items-center justify-center shadow-lg transition-all active:scale-95 ${
                    !stream.canSign || stream.isPending ? "bg-stone-100 text-stone-400 cursor-not-allowed border-2 border-stone-200" : "bg-emerald-600 text-white cursor-pointer hover:bg-emerald-500"
                  }`}
                >
                  {stream.isPending ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                      <div className="flex items-center gap-2">
                        <Zap size={18} className={stream.canSign ? "fill-white" : "fill-stone-400"} />
                        <span className="font-black uppercase tracking-tight text-xs">
                          {stream.canSign ? "Activar Goteo G$" : "Bolsillo de Impacto"}
                        </span>
                      </div>
                      <span className="text-[8px] opacity-70 font-bold uppercase tracking-widest text-center px-4">
                        {stream.canSign ? "2,000 G$ Mensuales • Superfluid" : "Cambia a tu UBI Wallet para activar"}
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <div 
                  role="button"
                  onClick={() => { if (stream.canSign && !stream.isPending) stream.stopStream() }}
                  className={`w-full h-16 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 ${
                    !stream.canSign ? "border-stone-200 bg-stone-50 text-stone-400 cursor-not-allowed" : "border-amber-200 dark:border-amber-500/40 text-amber-600 dark:text-amber-500 cursor-pointer hover:bg-amber-50"
                  }`}
                >
                  {stream.isPending ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                      <div className="flex items-center gap-2">
                        <Clock size={18} />
                        <span className="font-black uppercase tracking-tight text-xs">
                          {stream.canSign ? "Detener Goteo" : "Goteo en Curso"}
                        </span>
                      </div>
                      <span className="text-[8px] opacity-60 uppercase font-bold tracking-widest text-center">
                        {stream.canSign ? "Cerrar tubería de streaming" : "Firmado desde UBI Wallet"}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Link de Verificación si falta */}
              {!isHumanVerified && (
                <div 
                  role="button"
                  onClick={() => window.open(identity.faceVerificationUrl, "_blank")}
                  className="text-amber-600 text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 animate-pulse cursor-pointer"
                >
                  Continuar Verificación <ArrowRight size={10} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

