"use client"

import { Camera, ShieldCheck, AlertCircle, Loader2, Zap, Clock, Coins, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useConnection } from "wagmi"
import { useGoodDollarIdentity } from "@/hooks/useGoodDollarIdentity"
import { useUBIClaim } from "@/hooks/useUBIClaim"

interface IdentityActionProps {
  tokenId?: bigint
}

export function IdentityAction({ tokenId }: IdentityActionProps) {
  const { address } = useConnection()

  // Hook de Identity GoodDollar — lee whitelist, root, expiración, DID
  const {
    isWhitelisted,
    whitelistedRoot,
    hasValidIdentity,
    expiry,
    isBlacklisted,
    isLoading: loadingIdentity,
    faceVerificationUrl,
    isBypassed,
  } = useGoodDollarIdentity(address as `0x${string}` | undefined)

  // Hook de UBI Claim — checkEntitlement + claim real
  const {
    entitlementFormatted,
    canClaim,
    isClaiming,
    claimUBI,
    claimConfirmed,
    isLoading: loadingClaim,
    refetchEntitlement,
  } = useUBIClaim(address as `0x${string}` | undefined, whitelistedRoot)

  // TODO (Sprint 2): Reactivar con getFlowInfo real del CFAv1Forwarder
  const isFlowActive = false

  return (
    <div className="space-y-3">
      {/* ═══ 1. Tarjeta de Estado de Identidad GoodDollar ═══ */}
      <Card className={`glass-card overflow-hidden animate-slide-up ${
        hasValidIdentity ? "bg-blue-50/50 dark:bg-blue-900/10" : "bg-amber-50/50 dark:bg-amber-900/10"
      }`}>
        <CardContent className="p-4 space-y-3">
          {/* Header: Estado principal */}
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
              hasValidIdentity ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"
            }`}>
              {loadingIdentity ? (
                <Loader2 size={24} className="animate-spin" />
              ) : hasValidIdentity ? (
                <ShieldCheck size={24} />
              ) : (
                <AlertCircle size={24} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-bold text-emerald-950 dark:text-white uppercase tracking-tight flex items-center gap-1.5">
                Identidad GoodDollar
                {isBypassed && <span className="text-red-500 text-[9px]">(BYPASS)</span>}
                {isBlacklisted && <span className="text-red-500 text-[9px]">(BLACKLISTED)</span>}
              </h3>
              <p className="text-[10px] text-emerald-800/70 dark:text-emerald-400/70 leading-tight mt-0.5">
                {hasValidIdentity 
                  ? "Identidad humana verificada. Puedes reclamar UBI diario." 
                  : "Verifica tu rostro para habilitar el reclamo de GoodDollars."}
              </p>
            </div>
            {!hasValidIdentity && (
              <Button 
                size="sm" 
                className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase h-8 px-4 rounded-xl shadow-lg transition-all active:scale-95 animate-pulse-slow"
                onClick={() => window.open(faceVerificationUrl, "_blank")}
              >
                <Camera className="w-3 h-3 mr-1" />
                Verificar
              </Button>
            )}
          </div>

          {/* Expiry info — solo si está verificado */}
          {hasValidIdentity && expiry && (
            <div className="flex items-center gap-2 text-[9px] px-3 py-1.5 bg-blue-100/50 dark:bg-blue-900/20 rounded-xl border border-blue-200/50 dark:border-blue-500/20">
              <Clock size={12} className={expiry.daysRemaining < 7 ? "text-amber-500" : "text-blue-500"} />
              <span className="text-blue-800 dark:text-blue-300 font-semibold">
                {expiry.isExpired
                  ? "⚠️ Identidad expirada — re-verifica tu rostro"
                  : `Verificación válida por ${expiry.daysRemaining} días`}
              </span>
              {whitelistedRoot && whitelistedRoot.toLowerCase() !== address?.toLowerCase() && (
                <Badge className="bg-blue-500/10 text-blue-600 text-[8px] ml-auto px-1.5 py-0.5">
                  Wallet Conectada
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ 2. Superfluid Streaming Badge ═══ */}
      {isFlowActive && (
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-fade-in">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            Streaming G$ Activo (Superfluid)
          </span>
        </div>
      )}

      {/* ═══ 3. Botón de Claim UBI ═══ */}
      <button 
        onClick={claimUBI} 
        disabled={isClaiming || !hasValidIdentity || !tokenId || isFlowActive || !canClaim}
        className="w-full bg-white dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-400 border-2 border-emerald-200 dark:border-emerald-500/20 h-24 rounded-3xl flex items-center justify-between px-6 shadow-sm active:scale-95 transition-all disabled:opacity-50 group hover:border-emerald-500/40"
      >
        <div className="text-left">
          <p className="font-black text-lg uppercase tracking-tight">
            {claimConfirmed ? "✅ UBI Reclamado" : isFlowActive ? "UBI Activo" : "Reclamar UBI"}
          </p>
          <p className="text-xs opacity-70 font-medium flex items-center gap-1">
            <Coins size={14} className="text-yellow-500" />
            {canClaim
              ? `${entitlementFormatted} G$ disponibles hoy`
              : hasValidIdentity
                ? "Sin UBI disponible — vuelve mañana"
                : "Verifica tu identidad primero"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Botón de refresh */}
          {hasValidIdentity && (
            <button
              onClick={(e) => { e.stopPropagation(); refetchEntitlement(); }}
              className="p-2 rounded-xl bg-emerald-500/5 hover:bg-emerald-500/15 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-500 ${loadingClaim ? 'animate-spin' : ''}`} />
            </button>
          )}
          {isClaiming ? (
            <Loader2 className="animate-spin text-emerald-600" size={28} />
          ) : (
            <div className="p-3 bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-500/20 transition-colors">
              <Zap className="text-emerald-600" size={28} />
            </div>
          )}
        </div>
      </button>
    </div>
  )
}
