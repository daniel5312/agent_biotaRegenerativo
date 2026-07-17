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
import { useConnection, useReadContract, useWriteContract } from 'wagmi'
import { ADDRESSES, ERC20_ABI, UBI_SCHEME_ABI } from '@/lib/contracts'
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
  const stream = useSuperfluidStream(
    primaryAddress as `0x${string}`, 
    identity.whitelistedRoot as `0x${string}`
  )

  // 5. Reclamo Diario de GoodDollar (UBIScheme)
  const { data: entitlementRaw, refetch: refetchEntitlement } = useReadContract({
    address: ADDRESSES.UBI_SCHEME,
    abi: UBI_SCHEME_ABI,
    functionName: 'checkEntitlement',
    args: activeAddress ? [activeAddress] : undefined,
    query: { enabled: !!activeAddress && identity.hasValidIdentity }
  })
  const ubiToClaim = entitlementRaw ? BigInt(entitlementRaw.toString()) : 0n

  const { writeContract: claimUbi, isPending: isClaiming } = useWriteContract()

  const handleClaim = () => {
    claimUbi({
      address: ADDRESSES.UBI_SCHEME,
      abi: UBI_SCHEME_ABI,
      functionName: 'claim',
    }, {
      onSuccess: () => {
        alert("¡UBI reclamado con éxito! Se sumará a tu saldo en unos segundos.")
        refetchEntitlement()
      },
      onError: (err) => {
        console.error("Error al reclamar:", err)
        alert("Error al reclamar. Revisa si ya lo reclamaste hoy.")
      }
    })
  }

  const isLoading = identity.isLoading || stream.isLoading || loadingBalances

  if (!primaryAddress) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] p-8 text-center space-y-4">
        <div className="w-20 h-20 bg-stone-900 rounded-full flex items-center justify-center border border-stone-800">
          <Sprout className="w-10 h-10 text-emerald-500 animate-bounce" />
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-tight">Conecta tu MiniPay</h2>
        <p className="text-sm text-stone-400">Necesitamos tu wallet para empezar el goteo de G$.</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-8 pb-24">
      {/* ── BOLSILLO 1: BILLETERA OPERATIVA (MiniPay) ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-[10px] font-black text-stone-500 uppercase tracking-[0.3em]">
            Billetera Operativa
          </h4>
          <Badge variant="outline" className="bg-stone-900 text-stone-300 border-stone-800 text-[8px] font-bold">
            MINIPAY
          </Badge>
        </div>
        
        <Card className="bg-stone-900 border-stone-800 shadow-sm rounded-[2rem] overflow-hidden">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center border-r border-stone-800">
                <span className="text-[8px] font-black text-stone-500 uppercase tracking-widest mb-1">CELO</span>
                <span className="text-sm font-black text-amber-500">
                  {parseFloat(formatUnits(balances.celo, 18)).toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col items-center border-r border-stone-800">
                <span className="text-[8px] font-black text-stone-500 uppercase tracking-widest mb-1">cUSD</span>
                <span className="text-sm font-black text-emerald-500">
                  {parseFloat(formatUnits(balances.cusd, 18)).toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-black text-stone-500 uppercase tracking-widest mb-1">USDC</span>
                <span className="text-sm font-black text-blue-500">
                  {parseFloat(formatUnits(balances.usdc, 6)).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── BOLSILLO 2: CUENTA DE IMPACTO (GoodDollar) ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-[10px] font-black text-stone-500 uppercase tracking-[0.3em]">
            Bolsillo de Impacto
          </h4>
          <Badge className="bg-stone-800 text-stone-300 text-[8px] font-bold border border-stone-700">
            UBI G$
          </Badge>
        </div>

        <Card className="bg-stone-950 border-stone-800 shadow-2xl rounded-[2.5rem] overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-stone-700 to-transparent opacity-50" />
          <CardContent className="p-8 text-center space-y-6">
            {/* El Reloj de Dinero */}
            <div className="space-y-2">
               <StreamingBalance 
                baseBalance={balances.gd} 
                flowRate={stream.flowRate}
                lastUpdateTimestamp={stream.lastUpdated}
              />
              <div className="flex items-center justify-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${stream.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'}`} />
                <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest">
                  {stream.isActive ? 'Flujo de G$ Activo' : 'Grifo Cerrado'}
                </span>
              </div>
            </div>

            {/* Estado de Identidad */}
            <div className={`flex items-center gap-3 p-3 rounded-2xl border ${
              identity.hasValidIdentity ? "bg-stone-900 border-stone-800" : "bg-stone-900 border-amber-900/30"
            }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                identity.hasValidIdentity ? "bg-stone-800 text-emerald-500" : "bg-amber-950/30 text-amber-500"
              }`}>
                {identity.hasValidIdentity ? <ShieldCheck size={16} /> : <AlertCircle size={16} />}
              </div>
              <div className="text-left flex-1">
                <p className="text-[9px] font-black uppercase text-stone-300">
                  {identity.hasValidIdentity ? "Identidad Verificada" : "Acción Requerida"}
                </p>
                <p className="text-[8px] text-stone-500 uppercase font-bold tracking-tighter">
                  {identity.hasValidIdentity ? "Listo para recibir UBI" : "Verifica tu rostro para empezar"}
                </p>
              </div>
              {!identity.hasValidIdentity && (
                 <Button 
                    size="sm"
                    className="h-7 bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 text-[8px] font-black uppercase"
                    onClick={() => window.open(identity.faceVerificationUrl, '_blank')}
                  >
                    Verificar
                  </Button>
              )}
            </div>

            {/* BOTÓN NATIVO DE RECLAMO DIARIO (GOODDOLLAR) */}
            {identity.hasValidIdentity && ubiToClaim > 0n && (
              <div className="pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Button 
                  disabled={isClaiming}
                  onClick={handleClaim}
                  className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-between px-6 transition-all active:scale-95"
                >
                  <div className="flex items-center gap-2">
                    {isClaiming ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                    <span className="text-sm font-black uppercase tracking-widest">
                      {isClaiming ? "Reclamando..." : "Reclamar UBI Hoy"}
                    </span>
                  </div>
                  <span className="text-sm font-black bg-white/20 px-3 py-1 rounded-full">
                    +{parseFloat(formatUnits(ubiToClaim, 18)).toFixed(2)} G$
                  </span>
                </Button>
              </div>
            )}

            {/* El Grifo (Start/Stop) */}
            <div className="pt-2">
              {!stream.isActive ? (
                <Button 
                  disabled={!identity.hasValidIdentity || stream.isPending}
                  onClick={stream.startStream}
                  className="w-full h-16 bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600/20 text-emerald-500 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 disabled:grayscale"
                >
                  {stream.isPending ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        <span className="text-sm font-black uppercase">Activar Goteo</span>
                      </div>
                      <span className="text-[8px] font-bold opacity-70 uppercase tracking-widest">
                        +1,000 G$ Mensuales
                      </span>
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  disabled={stream.isPending}
                  onClick={stream.stopStream}
                  className="w-full h-16 border-2 border-stone-800 hover:border-stone-700 text-stone-400 hover:text-white hover:bg-stone-900 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95"
                >
                  {stream.isPending ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Droplets className="w-5 h-5 animate-pulse" />
                        <span className="text-sm font-black uppercase">Detener Goteo</span>
                      </div>
                      <span className="text-[8px] font-bold opacity-60 uppercase tracking-widest">
                        Cerrar grifo de Superfluid
                      </span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* FOOTER */}
      <div className="text-center pt-4">
        <p className="text-[8px] font-black text-stone-600 uppercase tracking-[0.4em]">
          BiotaScrow Protocol v2.0
        </p>
      </div>
    </div>
  )
}

