// components/biota/MiniPayDashboard.tsx
'use client'

import React from 'react'
import { 
  Zap, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  Camera, 
  ArrowRight,
  TrendingUp,
  Droplets,
  Sprout,
  Wallet,
  WalletCards,
  RefreshCcw
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useConnection, useReadContract } from 'wagmi'
import { ADDRESSES, ERC20_ABI } from '@/lib/contracts'
import { useGoodDollarIdentity } from '@/hooks/useGoodDollarIdentity'
import { useSuperfluidStream } from '@/hooks/useSuperfluidStream'
import { StreamingBalance } from './StreamingBalance'
import { formatUnits } from 'viem'
import { useMultiTokenBalances } from '@/hooks/useMultiTokenBalances'

export function MiniPayDashboard() {
  const { address: primaryAddress } = useConnection()
  const [viewAccount, setViewAccount] = React.useState<'primary' | 'ubi'>('primary')

  // 1. Datos de Identidad (Necesario para saber si hay wallet UBI)
  const identity = useGoodDollarIdentity(primaryAddress as `0x${string}`)

  // 2. Dirección Activa para lectura
  const activeAddress = viewAccount === 'ubi' && identity.whitelistedRoot 
    ? (identity.whitelistedRoot as `0x${string}`)
    : (primaryAddress as `0x${string}`)

  // 3. Multi-Token Balances
  const { balances, isLoading: loadingBalances } = useMultiTokenBalances(activeAddress)
  
  // 4. Datos de Streaming
  const stream = useSuperfluidStream(activeAddress)

  const isLoading = identity.isLoading || stream.isLoading || loadingBalances

  if (!primaryAddress) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] p-8 text-center space-y-4">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
          <Sprout className="w-10 h-10 text-emerald-600 animate-bounce" />
        </div>
        <h2 className="text-xl font-black text-emerald-950 uppercase tracking-tight">Conecta tu MiniPay</h2>
        <p className="text-sm text-emerald-700/70">Necesitamos tu wallet para empezar el goteo de G$.</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6 pb-24">
      {/* ── SELECTOR DE BILLETERA (DUAL STATE) ── */}
      <div className="flex bg-white/50 dark:bg-emerald-950/40 p-1 rounded-2xl border border-emerald-100 dark:border-emerald-800">
        <button 
          onClick={() => setViewAccount('primary')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            viewAccount === 'primary' ? "bg-emerald-600 text-white shadow-md" : "text-emerald-900/40 hover:text-emerald-900"
          }`}
        >
          <Wallet size={14} /> MiniPay
        </button>
        <button 
          disabled={!identity.whitelistedRoot}
          onClick={() => setViewAccount('ubi')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            !identity.whitelistedRoot ? "opacity-30 grayscale cursor-not-allowed" : ""
          } ${
            viewAccount === 'ubi' ? "bg-blue-600 text-white shadow-md" : "text-blue-900/40 hover:text-blue-900"
          }`}
        >
          <WalletCards size={14} /> Billetera UBI
        </button>
      </div>

      {/* ── SECCIÓN 1: EL RELOJ DE DINERO ── */}
      <Card className="glass-card bg-white/40 dark:bg-emerald-950/20 border-none shadow-none overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-50" />
        <CardContent className="pt-10 pb-6 text-center">
          <StreamingBalance 
            baseBalance={balances.gd} 
            flowRate={stream.flowRate}
            lastUpdateTimestamp={stream.lastUpdated}
          />
          <Badge variant="outline" className="mt-2 bg-white/50 border-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest px-3 py-1">
            G$ en {viewAccount === 'primary' ? 'MiniPay' : 'Cuenta UBI'}
          </Badge>
        </CardContent>
      </Card>

      {/* ── SECCIÓN 2: MULTI-TOKEN BALANCES (Mini-Billetera) ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/60 dark:bg-emerald-950/20 p-3 rounded-2xl border border-emerald-50/50 flex flex-col items-center">
          <span className="text-[8px] font-black text-emerald-900/30 uppercase tracking-[0.2em] mb-1">CELO</span>
          <span className="text-xs font-black text-emerald-950 dark:text-white">
            {parseFloat(formatUnits(balances.celo, 18)).toFixed(2)}
          </span>
        </div>
        <div className="bg-white/60 dark:bg-emerald-950/20 p-3 rounded-2xl border border-emerald-50/50 flex flex-col items-center">
          <span className="text-[8px] font-black text-emerald-900/30 uppercase tracking-[0.2em] mb-1">cUSD</span>
          <span className="text-xs font-black text-emerald-950 dark:text-white">
            {parseFloat(formatUnits(balances.cusd, 18)).toFixed(2)}
          </span>
        </div>
        <div className="bg-white/60 dark:bg-emerald-950/20 p-3 rounded-2xl border border-emerald-50/50 flex flex-col items-center">
          <span className="text-[8px] font-black text-emerald-900/30 uppercase tracking-[0.2em] mb-1">USDT</span>
          <span className="text-xs font-black text-emerald-950 dark:text-white">
            {parseFloat(formatUnits(balances.usdt, 6)).toFixed(2)}
          </span>
        </div>
        <div className="bg-white/60 dark:bg-emerald-950/20 p-3 rounded-2xl border border-emerald-50/50 flex flex-col items-center">
          <span className="text-[8px] font-black text-emerald-900/30 uppercase tracking-[0.2em] mb-1">USDC</span>
          <span className="text-xs font-black text-emerald-950 dark:text-white">
            {parseFloat(formatUnits(balances.usdc, 6)).toFixed(2)}
          </span>
        </div>
      </div>

      {/* ── SECCIÓN 2: ESTADO DE IDENTIDAD ── */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-black text-emerald-900/40 uppercase tracking-[0.3em] pl-2">
          Verificación de Humano
        </h4>
        <Card className={`border-2 transition-all duration-500 ${
          identity.hasValidIdentity 
            ? "bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-500/20" 
            : "bg-amber-50/50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-500/20"
        }`}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
              identity.hasValidIdentity ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"
            }`}>
              {identity.hasValidIdentity ? <ShieldCheck size={24} /> : <AlertCircle size={24} />}
            </div>
            <div className="flex-1">
              <p className="text-xs font-black uppercase text-emerald-950 dark:text-white">
                {identity.hasValidIdentity ? "Identidad Activa" : "Identidad Pendiente"}
              </p>
              <p className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70">
                {identity.hasValidIdentity 
                  ? "Verificación GoodDollar válida." 
                  : "Requerido para activar el sueldo."}
              </p>
            </div>
            {!identity.hasValidIdentity && (
              <Button 
                size="sm"
                variant="ghost"
                className="text-amber-600 font-black text-[10px] uppercase hover:bg-amber-100"
                onClick={() => window.open(identity.faceVerificationUrl, '_blank')}
              >
                Verificar <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── SECCIÓN 3: EL SUELDO REGENERATIVO ── */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-black text-emerald-900/40 uppercase tracking-[0.3em] pl-2">
          Sueldo Regenerativo
        </h4>
        
        {!stream.isActive ? (
          <Button 
            disabled={!identity.hasValidIdentity || stream.isPending}
            onClick={stream.startStream}
            className="w-full h-24 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2rem] shadow-xl shadow-emerald-500/20 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:grayscale"
          >
            {stream.isPending ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Zap className="w-6 h-6 fill-white" />
                  <span className="text-xl font-black uppercase tracking-tight">Activar Goteo</span>
                </div>
                <span className="text-[9px] font-bold opacity-80 uppercase tracking-widest text-center px-4">
                  1,000 G$ Mensuales en {viewAccount === 'ubi' ? 'Cuenta UBI' : 'MiniPay'}
                </span>
              </>
            )}
          </Button>
        ) : (
          <Button 
            variant="outline"
            disabled={stream.isPending}
            onClick={stream.stopStream}
            className="w-full h-20 border-2 border-emerald-100 dark:border-emerald-800 rounded-[2rem] bg-white/50 dark:bg-emerald-950/20 flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
          >
            {stream.isPending ? (
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            ) : (
              <>
                <div className="flex items-center gap-2 text-emerald-600">
                  <Droplets className="w-5 h-5 animate-pulse" />
                  <span className="text-lg font-black uppercase tracking-tight">Goteo en Curso</span>
                </div>
                <span className="text-[9px] font-bold text-emerald-600/60 uppercase tracking-widest">
                  Tasa: 380,517 wei/seg • Detener
                </span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* ── FOOTER LIGERO ── */}
      <div className="text-center pt-8">
        <p className="text-[8px] font-black text-emerald-900/20 uppercase tracking-[0.4em]">
          Powered by Biota & Superfluid
        </p>
      </div>
    </div>
  )
}
