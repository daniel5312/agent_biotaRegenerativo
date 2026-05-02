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
  Sprout
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useConnection } from "wagmi"
import { useGoodDollarIdentity } from "@/hooks/useGoodDollarIdentity"
import { useUBIClaim } from "@/hooks/useUBIClaim"
import { useSuperfluidStream } from "@/hooks/useSuperfluidStream"
import { StreamingBalance } from "./StreamingBalance"
import { useMultiTokenBalances } from '@/hooks/useMultiTokenBalances'
import { formatUnits } from 'viem'

interface IdentityActionProps {
  tokenId?: bigint
}

export function IdentityAction({ tokenId }: IdentityActionProps) {
  const { address: primaryAddress } = useConnection()
  const [viewAccount, setViewAccount] = React.useState<'primary' | 'ubi'>('primary')

  // 1. Datos de Identidad
  const identity = useGoodDollarIdentity(primaryAddress as `0x${string}` | undefined)
  
  // 2. Dirección Activa para lectura
  const activeAddress = viewAccount === 'ubi' && identity.whitelistedRoot 
    ? (identity.whitelistedRoot as `0x${string}`)
    : (primaryAddress as `0x${string}`)

  // 3. Multi-Token Balances
  const { balances } = useMultiTokenBalances(activeAddress)

  // 4. Hook de Superfluid — lee el estado del flujo de G$
  const stream = useSuperfluidStream(activeAddress)
  const isFlowActive = stream.isActive

  // 5. Hook de UBI Claim — checkEntitlement + claim real
  const {
    entitlementFormatted,
    canClaim,
    isClaiming,
    claimUBI,
    claimConfirmed,
    isLoading: loadingClaim,
    refetchEntitlement,
  } = useUBIClaim(activeAddress, identity.whitelistedRoot)

  return (
    <div className="space-y-4">
      {/* ── SELECTOR DE BILLETERA (DUAL STATE) ── */}
      <div className="flex bg-white/50 dark:bg-emerald-950/40 p-1 rounded-2xl border border-emerald-100 dark:border-emerald-800">
        <div 
          role="button"
          onClick={() => setViewAccount('primary')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            viewAccount === 'primary' ? "bg-emerald-600 text-white shadow-md" : "text-emerald-900/40 hover:text-emerald-900 cursor-pointer"
          }`}
        >
          <Wallet size={14} /> Billetera Principal
        </div>
        <div 
          role="button"
          onClick={() => { if(identity.whitelistedRoot) setViewAccount('ubi') }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            !identity.whitelistedRoot ? "opacity-30 grayscale cursor-not-allowed" : "cursor-pointer"
          } ${
            viewAccount === 'ubi' ? "bg-blue-600 text-white shadow-md" : "text-blue-900/40 hover:text-blue-900"
          }`}
        >
          <WalletCards size={14} /> Billetera UBI
        </div>
      </div>

      {/* ═══ 1. Tarjeta de Estado de Identidad GoodDollar ═══ */}
      <Card className={`glass-card overflow-hidden animate-slide-up ${
        identity.hasValidIdentity ? "bg-blue-50/50 dark:bg-blue-900/10" : "bg-amber-50/50 dark:bg-amber-900/10"
      }`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
              identity.hasValidIdentity ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"
            }`}>
              {identity.isLoading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : identity.hasValidIdentity ? (
                <ShieldCheck size={24} />
              ) : (
                <AlertCircle size={24} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-bold text-emerald-950 dark:text-white uppercase tracking-tight flex items-center gap-1.5">
                Identidad GoodDollar
                {identity.isBypassed && <span className="text-red-500 text-[9px]">(BYPASS)</span>}
              </h3>
              <p className="text-[10px] text-emerald-800/70 dark:text-emerald-400/70 leading-tight mt-0.5">
                {identity.hasValidIdentity 
                  ? "Identidad humana verificada." 
                  : "Verifica tu rostro para habilitar el UBI."}
              </p>
            </div>
            {!identity.hasValidIdentity && (
              <div 
                role="button"
                className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase h-8 px-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                onClick={() => window.open(identity.faceVerificationUrl, "_blank")}
              >
                <Camera className="w-3 h-3 mr-1" />
                Verificar
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── MULTI-TOKEN BALANCES ── */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'CELO', val: balances.celo, dec: 18 },
          { label: 'cUSD', val: balances.cusd, dec: 18 },
          { label: 'USDT', val: balances.usdt, dec: 6 },
          { label: 'USDC', val: balances.usdc, dec: 6 }
        ].map(tk => (
          <div key={tk.label} className="bg-white/40 dark:bg-emerald-950/20 p-2 rounded-xl border border-emerald-500/10 flex flex-col items-center">
            <span className="text-[7px] font-black text-emerald-900/40 uppercase mb-0.5">{tk.label}</span>
            <span className="text-[10px] font-black text-emerald-950 dark:text-white truncate w-full text-center">
              {parseFloat(formatUnits(tk.val, tk.dec)).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* ═══ 2. Superfluid Streaming Balance (El Contador) ═══ */}
      {isFlowActive && (
        <Card className="bg-emerald-500/5 border-emerald-500/20 border-2 overflow-hidden relative animate-in fade-in zoom-in">
          <CardContent className="py-4">
             <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  G$ fluyendo en {viewAccount === 'primary' ? 'Billetera Principal' : 'Billetera UBI'}
                </span>
             </div>
             <StreamingBalance 
               baseBalance={balances.gd} 
               flowRate={stream.flowRate}
               lastUpdateTimestamp={stream.lastUpdated}
             />
          </CardContent>
        </Card>
      )}

      {/* ═══ 3. Botón de Claim UBI ═══ */}
      <div 
        onClick={() => {
          if (!isClaiming && identity.hasValidIdentity && tokenId && !isFlowActive && canClaim) {
            claimUBI()
          }
        }} 
        className={`w-full bg-white dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-400 border-2 border-emerald-200 dark:border-emerald-500/20 h-20 rounded-3xl flex items-center justify-between px-6 shadow-sm transition-all group hover:border-emerald-500/40 ${
          (!identity.hasValidIdentity || !tokenId || isFlowActive || !canClaim) ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-95"
        }`}
      >
        <div className="text-left">
          <p className="font-black text-md uppercase tracking-tight">
            {claimConfirmed ? "✅ UBI Reclamado" : "Reclamar UBI"}
          </p>
          <p className="text-[10px] opacity-70 font-medium flex items-center gap-1">
            <Coins size={12} className="text-yellow-500" />
            {canClaim ? `${entitlementFormatted} G$ disponibles` : "Sin UBI hoy"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {identity.hasValidIdentity && (
            <div
              role="button"
              onClick={(e) => { e.stopPropagation(); refetchEntitlement(); }}
              className="p-2 rounded-xl bg-emerald-500/5 hover:bg-emerald-500/15 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 text-emerald-500 ${loadingClaim ? 'animate-spin' : ''}`} />
            </div>
          )}
          <div className="p-2 bg-emerald-500/10 rounded-2xl">
            <Zap className="text-emerald-600" size={20} />
          </div>
        </div>
      </div>

      {/* ═══ 4. Botón de Sueldo Regenerativo (Superfluid) ═══ */}
      {!isFlowActive ? (
        <div 
          role="button"
          onClick={() => { if (identity.hasValidIdentity && !stream.isPending) stream.startStream() }}
          className={`w-full h-14 rounded-2xl bg-emerald-600 text-white flex flex-col items-center justify-center shadow-lg transition-all active:scale-95 ${
            !identity.hasValidIdentity || stream.isPending ? "opacity-50 grayscale cursor-not-allowed" : "cursor-pointer hover:bg-emerald-500"
          }`}
        >
          {stream.isPending ? <Loader2 className="animate-spin" size={20} /> : (
            <>
              <div className="flex items-center gap-2">
                <Zap size={18} className="fill-white" />
                <span className="font-black uppercase tracking-tight text-xs">Activar Goteo G$</span>
              </div>
              <span className="text-[8px] opacity-70 font-bold uppercase tracking-widest">
                1,000 G$ Mensuales en {viewAccount === 'primary' ? 'MiniPay' : 'UBI'}
              </span>
            </>
          )}
        </div>
      ) : (
        <div 
          role="button"
          onClick={() => { if (!stream.isPending) stream.stopStream() }}
          className="w-full h-14 rounded-2xl border-2 border-emerald-500/20 text-emerald-600 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer hover:bg-emerald-50"
        >
          {stream.isPending ? <Loader2 className="animate-spin" size={20} /> : (
            <>
              <Clock size={18} />
              <span className="font-black uppercase tracking-tight text-xs">Detener Goteo</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}
