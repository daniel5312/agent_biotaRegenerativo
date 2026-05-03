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
import { formatUnits } from 'viem'

interface IdentityActionProps {
  tokenId?: bigint
}

export function IdentityAction({ tokenId }: IdentityActionProps) {
  const { user } = usePrivy()
  const { toast } = useToast()
  
  // Estados Independientes Panel B
  const [ubiAddress, setUbiAddress] = React.useState<`0x${string}` | null>(null)
  const [ubiProvider, setUbiProvider] = React.useState<any>(null)
  
  // 1. Identificar Billetera A (Login - Privy)
  const primaryAddress = user?.wallet?.address as `0x${string}`

  // 2. Conexión Manual Panel B (WalletConnect - Independiente)
  const handleConnectUBI = async () => {
    try {
      const { UniversalProvider } = await import("@walletconnect/universal-provider")
      const { WalletConnectModal } = await import("@walletconnect/modal")

      const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || '3a8170812b3ec9103e334df568600109'
      
      const modal = new WalletConnectModal({
        projectId,
        chains: ["42220"],
        enableExplorer: false, // DESACTIVADO: Evita que intente descargar listas y rompa el objeto
      })

      const provider = await UniversalProvider.init({
        projectId,
        metadata: {
          name: "Biota Protocol",
          description: "Regenerative Finance Oracle",
          url: "https://biota.xyz",
          icons: ["https://biota.xyz/icon.png"],
        },
      })

      provider.on("display_uri", (uri: string) => {
        modal.openModal({ uri })
      })

      const session = await provider.connect({
        namespaces: {
          eip155: {
            methods: ["eth_sendTransaction", "eth_signTransaction", "eth_sign", "personal_sign", "eth_signTypedData"],
            chains: ["eip155:42220"],
            events: ["chainChanged", "accountsChanged"],
          },
        },
      })

      const address = session?.namespaces.eip155.accounts[0].split(":")[2] as `0x${string}`
      setUbiAddress(address)
      setUbiProvider(provider)
      modal.closeModal()

      toast({
        title: "✅ GoodWallet Vinculada",
        description: `Billetera de impacto conectada: ${address.slice(0,6)}...${address.slice(-4)}`,
      })
    } catch (e: any) {
      console.error("Error WalletConnect:", e)
      toast({
        title: "❌ Error de Conexión",
        description: e.message || "No se pudo conectar WalletConnect",
        variant: "destructive"
      })
    }
  }

  // 3. Datos de Identidad
  const identity = useGoodDollarIdentity(primaryAddress)
  
  // 4. DOBLE LECTURA DE SALDOS
  const { balances: primaryBalances } = useMultiTokenBalances(primaryAddress)
  const { balances: ubiBalances } = useMultiTokenBalances(ubiAddress || undefined)

  // 5. Hook de Superfluid — monitoreando flujo Panel B -> Panel A
  const stream = useSuperfluidStream(
    primaryAddress, 
    ubiAddress || undefined,
    ubiProvider // Pasamos el proveedor de WalletConnect para firmar
  )
  const isFlowActive = stream.isActive

  // 4. Hook de UBI Claim — checkEntitlement + claim real
  const {
    entitlementFormatted,
    canClaim,
    isClaiming,
    claimUBI,
    claimConfirmed,
    isLoading: loadingClaim,
    refetchEntitlement,
  } = useUBIClaim(identity.whitelistedRoot as `0x${string}`, identity.whitelistedRoot)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* ── BOLSILLO 1: BILLETERA OPERATIVA (MiniPay) ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-[10px] font-black text-emerald-900/40 dark:text-emerald-500/40 uppercase tracking-[0.3em]">
            Billetera Operativa (MiniPay)
          </h4>
          <div className="p-1.5 bg-emerald-500/10 rounded-lg">
            <Wallet size={12} className="text-emerald-500" />
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'CELO', val: primaryBalances.celo, dec: 18, icon: <Coins size={10} className="text-emerald-500" /> },
            { label: 'cUSD', val: primaryBalances.cusd, dec: 18, icon: <Zap size={10} className="text-blue-500" /> },
            { label: 'USDT', val: primaryBalances.usdt, dec: 6, icon: <TrendingUp size={10} className="text-green-500" /> },
            { label: 'USDC', val: primaryBalances.usdc, dec: 6, icon: <ShieldCheck size={10} className="text-blue-400" /> }
          ].map(tk => (
            <div key={tk.label} className="bg-white/40 dark:bg-emerald-950/20 p-3 rounded-2xl border border-emerald-500/10 flex flex-col items-center hover:bg-white/60 dark:hover:bg-emerald-900/30 transition-all">
              <div className="mb-1">{tk.icon}</div>
              <span className="text-[7px] font-black text-emerald-900/40 dark:text-emerald-400/40 uppercase mb-1">{tk.label}</span>
              <span className="text-[11px] font-black text-emerald-950 dark:text-white truncate w-full text-center">
                {parseFloat(formatUnits(tk.val, tk.dec)).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
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
              onClick={() => { setUbiAddress(null); setUbiProvider(null); }}
              className="text-[8px] font-black text-blue-500/40 hover:text-blue-500 uppercase tracking-widest cursor-pointer"
            >
              [ Desconectar ]
            </div>
          )}
        </div>

        <Card className="bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-900/10 dark:to-emerald-950/20 border-blue-100 dark:border-blue-500/20 shadow-xl shadow-blue-500/5 rounded-[2.5rem] overflow-hidden relative border-2">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50" />
          <CardContent className="p-8 text-center space-y-6">
            
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
                identity.hasValidIdentity ? "bg-white/60 dark:bg-blue-900/20 border-blue-100 dark:border-blue-500/20" : "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-500/20"
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  identity.hasValidIdentity ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"
                }`}>
                  {identity.hasValidIdentity ? <ShieldCheck size={16} /> : <AlertCircle size={16} />}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-[9px] font-black uppercase text-blue-950 dark:text-blue-100 truncate">
                    {identity.hasValidIdentity ? "Humano Verificado" : "Identidad Pendiente"}
                  </p>
                  <p className="text-[8px] text-blue-900/50 dark:text-blue-400/50 uppercase font-bold tracking-tighter">
                    {identity.hasValidIdentity ? "Acceso Total al UBI" : "Verifica tu rostro"}
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
                        {stream.canSign ? "1,000 G$ Mensuales • Superfluid" : "Cambia a tu UBI Wallet para activar"}
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
              {!identity.hasValidIdentity && (
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

