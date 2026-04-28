"use client"

import { useState } from "react"
import { Camera, ShieldCheck, AlertCircle, Loader2, Sprout, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useConnection, useWriteContract, useReadContract } from "wagmi"
import { useWallets, usePrivy } from "@privy-io/react-auth"
import { ADDRESSES, BIOTA_SCROW_ABI, IDENTITY_ABI, BIOTA_UBI_ABI } from "@/lib/contracts"
import { useAdminBypass } from "@/hooks/useAdminBypass"

interface IdentityActionProps {
  tokenId?: bigint
}

export function IdentityAction({ tokenId }: IdentityActionProps) {
  const { address } = useConnection()
  const { authenticated } = usePrivy()
  const { wallets } = useWallets()
  const { isBypassed } = useAdminBypass()
  
  const { data: contractIsWhitelisted } = useReadContract({
    chainId: 42220,
    address: ADDRESSES.IDENTITY,
    abi: IDENTITY_ABI,
    functionName: "isWhitelisted",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && ADDRESSES.IDENTITY !== '0x0000000000000000000000000000000000000000',
    },
  })

  const isWhitelisted = contractIsWhitelisted || isBypassed

  // 2. Estado del Flujo de Superfluid (UBI)
  const { data: isFlowActive, refetch: refetchFlow } = useReadContract({
    chainId: 42220,
    address: ADDRESSES.BIOTA_UBI,
    abi: BIOTA_UBI_ABI,
    functionName: "isFlowActive",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined && ADDRESSES.BIOTA_UBI !== '0x0000000000000000000000000000000000000000',
    },
  })

  const { writeContractAsync, isPending: isClaimingUBI } = useWriteContract()

  const handleClaimUBI = async () => {
    if (!wallets[0] || !address || !tokenId) return
    try {
      // Ahora el reclamo activa el flujo de Superfluid en el contrato BiotaUBI
      const hashTx = await writeContractAsync({
        chainId: 42220,
        address: ADDRESSES.BIOTA_UBI,
        abi: BIOTA_UBI_ABI,
        functionName: "iniciarFlujoUbi", // Aseguramos que sea 'iniciarFlujoUbi' y no 'iniciarFlujoUBI' (case sensitive)
        args: [tokenId],
      })
      console.log("¡Transacción enviada! Hash:", hashTx);
    } catch (error) {
      console.error("Error al iniciar UBI Streaming (rechazado o fallido):", error)
    }
  }

  return (
    <div className="space-y-4">
      {/* 1. Facial Recognition / GoodDollar Status */}
      <Card className={`glass-card overflow-hidden animate-slide-up ${
        isWhitelisted ? "bg-blue-50/50 dark:bg-blue-900/10" : "bg-amber-50/50 dark:bg-amber-900/10"
      }`}>
        <CardContent className="p-4 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
            isWhitelisted ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"
          }`}>
            {isWhitelisted ? <ShieldCheck size={24} /> : <AlertCircle size={24} />}
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-bold text-emerald-950 dark:text-white uppercase tracking-tight">
              Identidad GoodDollar {isBypassed && <span className="text-red-500">(BYPASS)</span>}
            </h3>
            <p className="text-[10px] text-emerald-800/70 dark:text-emerald-400/70 leading-tight mt-0.5">
              {isWhitelisted 
                ? "Tu identidad humana está verificada. Recibes UBI completo." 
                : "Verifica tu rostro para habilitar el reclamo de GoodDollars."}
            </p>
          </div>
          {!isWhitelisted && (
            <Button 
              size="sm" 
              className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase h-8 px-4 rounded-xl shadow-lg transition-all active:scale-95 animate-pulse-slow"
              onClick={() => window.open("https://wallet.gooddollar.org?id=biota", "_blank")}
            >
              <Camera className="w-3 h-3 mr-1" />
              Verificar Rostro
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 2. Superfluid Streaming Status Badge */}
      {isFlowActive && (
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-fade-in">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            Streaming G$ Activo (Superfluid)
          </span>
        </div>
      )}

      {/* 2. Reclamar UBI Button */}
      <button 
        onClick={handleClaimUBI} 
        disabled={isClaimingUBI || !isWhitelisted || !authenticated || isFlowActive || !tokenId}
        className="w-full bg-white dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-400 border-2 border-emerald-200 dark:border-emerald-500/20 h-24 rounded-3xl flex items-center justify-between px-8 shadow-sm active:scale-95 transition-all disabled:opacity-50 group hover:border-emerald-500/40"
      >
        <div className="text-left">
          <p className="font-black text-xl uppercase tracking-tight">
            {isFlowActive ? "UBI Activo" : "Activar UBI"}
          </p>
          <p className="text-sm opacity-70 italic font-medium flex items-center gap-1">
            <Zap size={14} className={isFlowActive ? "text-blue-500 animate-pulse" : "text-emerald-500"} />
            {isFlowActive ? "Goteo continuo (Superfluid)" : "Verificación JIT Activa"}
          </p>
        </div>
        {isClaimingUBI ? (
          <Loader2 className="animate-spin text-emerald-600" size={32} />
        ) : (
          <div className="p-3 bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-500/20 transition-colors">
            <Camera className="text-emerald-600" size={32} />
          </div>
        )}
      </button>
    </div>
  )
}
