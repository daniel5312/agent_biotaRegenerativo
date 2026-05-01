"use client"

import { useState, useMemo, useCallback } from "react"
import { 
  Coins, 
  CreditCard,
  Camera, 
  Droplets,
  TreePine,
  Send,
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
  Wallet,
  Zap,
  Sprout,
  Mountain,
  Leaf,
  BadgeCheck,
  ShieldCheck,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useConnection, useReadContract } from "wagmi"
import { useWallets, usePrivy } from "@privy-io/react-auth"
import { ADDRESSES, ERC20_ABI, IDENTITY_ABI, formatCUSD } from "@/lib/contracts"
import { useBiotaPass } from "@/hooks/useBiotaPass"
import { usePoA } from "@/hooks/usePoA"
import { IdentityAction } from "@/components/biota/IdentityAction"

export function ImpactoView() {
  const { address } = useConnection()
  const { wallets } = useWallets()
  const { authenticated } = usePrivy()
  const { 
    hasPassport, 
    tokenId, 
    bioScore, 
    isLoading: loadingPassport,
    cmRecuperados,
    estadoBiologico,
    loteData,
    mintPassport,
    isMinting,
    mintConfirmed
  } = useBiotaPass()
  const { certificarPoA, isCertifying } = usePoA()

  const [selectedActions, setSelectedActions] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [creditAmount, setCreditAmount] = useState("")
  const [requestingCredit, setRequestingCredit] = useState(false)

  // --- Lógica de Smart Contracts ---
  const { data: balanceValue } = useReadContract({
    chainId: 42220,
    address: ADDRESSES.CUSD,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { data: gBalanceValue } = useReadContract({
    chainId: 42220,
    address: ADDRESSES.G$,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    chainId: 42220,
    address: ADDRESSES.CUSD,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address!, ADDRESSES.BIOTA_SCROW],
    query: { enabled: !!address }
  }) as { data: bigint | undefined, refetch: any };

  const { data: isWhitelisted } = useReadContract({
    chainId: 42220,
    address: ADDRESSES.IDENTITY,
    abi: IDENTITY_ABI,
    functionName: "isWhitelisted",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });


  const formattedBalance = useMemo(() => {
    if (balanceValue === undefined) return "0.00";
    return formatCUSD(balanceValue as bigint);
  }, [balanceValue]);

  const formattedGBalance = useMemo(() => {
    if (gBalanceValue === undefined) return "0.00";
    return formatCUSD(gBalanceValue as bigint);
  }, [gBalanceValue]);

  // --- Lógica UI v0 ---
  const toggleAction = (actionId: string) => {
    setSelectedActions(prev => 
      prev.includes(actionId) 
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId]
    )
  }

  const handleOracleSubmit = async () => {
    if (selectedActions.length === 0 || !tokenId) return
    
    // Simplificación para la demo: usamos el primer ID seleccionado
    const action = actions.find(a => selectedActions.includes(a.id))
    
    try {
      await certificarPoA({
        tokenId: tokenId,
        nuevoCmSuelo: cmRecuperados + 10, // Incremento simulado
        nuevoEstado: `Verificado: ${action?.label}`,
        nuevosMetodos: "Bio-Insumos Biota",
      })
      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setSelectedActions([])
      }, 2500)
    } catch (error) {
      console.error("Error al certificar PoA:", error)
    }
  }

  const handleMintPassport = async () => {
    try {
      await mintPassport({
        tokenURI: "ipfs://mock-passport-uri",
        ubicacionGeografica: "Celo, Colombia",
        areaM2: 5000n,
        cmSueloRecuperado: 0n,
        estadoBiologico: "Pendiente",
        hashAnalisisLab: "n/a",
        ingredientesHash: "n/a",
        metodosAgricolas: "Regenerativo",
      })
    } catch (error) {
      console.error("Error al solicitar pasaporte:", error)
    }
  }

  const handleCreditRequest = () => {
    if (!creditAmount || parseInt(creditAmount) < 1000) return
    setRequestingCredit(true)
    setTimeout(() => {
      setRequestingCredit(false)
      setCreditAmount("")
    }, 2000)
  }

  const actions = [
    { id: "photo", icon: Camera, label: "Foto Compostaje", reward: "+2.5 cUSD", color: "from-cyan-500 to-teal-500" },
    { id: "ph", icon: Droplets, label: "Ingresar pH", reward: "+5.0 cUSD", color: "from-blue-500 to-cyan-500" },
    { id: "trees", icon: TreePine, label: "Registrar Arboles", reward: "+12.0 cUSD", color: "from-emerald-500 to-green-500" },
  ]

  const timeline = [
    { 
      status: "pending", 
      title: "Foto de compostaje enviada", 
      detail: "En revision por oraculo",
      time: "Hace 2 horas",
      icon: Sprout
    },
    { 
      status: "approved", 
      title: "Registro de pH aprobado", 
      detail: "+5.0 cUSD",
      time: "Ayer, 14:30",
      icon: Droplets
    },
    { 
      status: "approved", 
      title: "Reforestacion verificada", 
      detail: "+12.0 cUSD",
      time: "Hace 3 dias",
      icon: TreePine
    },
  ]

  return (
    <div className="px-4 py-4 space-y-4 mb-nav">
      {/* ================================================================
          FARMER HEADER
          ================================================================ */}
      <div className="space-y-3 animate-slide-up">
        {/* Producer Card */}
        <Card className="glass-card overflow-hidden bg-emerald-100/80 dark:bg-emerald-900/30">
          <div className="h-1.5 bg-gradient-to-r from-[#FCFF52] via-emerald-400 to-[#00B0A0]" />
          
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 flex items-center justify-center shadow-lg glow-sm animate-float">
                  <Sprout className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center border-2 border-white dark:border-emerald-950 shadow-md">
                  <BadgeCheck className="w-3 h-3 text-white" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-base font-bold text-emerald-950 dark:text-white truncate transition-theme">
                    Productor Biota
                  </h1>
                  <span className="text-[9px] text-teal-700 dark:text-emerald-400/60 font-mono font-semibold bg-teal-100 dark:bg-transparent px-1.5 py-0.5 rounded">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>
                <p className="text-xs text-emerald-800 dark:text-emerald-300/80 flex items-center gap-1 font-semibold transition-theme">
                  <Mountain className="w-3 h-3 text-amber-600" />
                  {hasPassport ? loteData?.ubicacionGeografica : "Finca Suelo Vivo, Celo"}
                </p>
                <p className="text-[10px] text-teal-700 dark:text-teal-400/60 font-mono font-medium mt-0.5 transition-theme">
                  Zona Regenerativa - Celo Mainnet
                </p>
              </div>
            </div>

            {/* BiotaPass Badge & Identity */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {hasPassport ? (
                <Badge className="bg-gradient-to-r from-emerald-500/20 to-teal-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40 hover:bg-emerald-500/25 px-2.5 py-1 transition-theme">
                  <Sparkles className="w-3 h-3 mr-1 text-yellow-500" />
                  BiotaPass: #{tokenId?.toString()}
                </Badge>
              ) : (
                <Button 
                  onClick={handleMintPassport}
                  disabled={isMinting || mintConfirmed}
                  size="sm"
                  className="h-8 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-xl animate-pulse"
                >
                  {isMinting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                  Solicitar Pasaporte
                </Button>
              )}
              
              {isWhitelisted ? (
                <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 px-2.5 py-1 flex items-center gap-1">
                  <ShieldCheck size={12} /> Humano Verificado
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/20 px-2.5 py-1 flex items-center gap-1">
                  <AlertCircle size={12} /> Verificación Pendiente
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Balance Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* UBI Balance (cUSD & G$) */}
          <Card className="glass-card metric-card overflow-hidden bg-emerald-100/80 dark:bg-emerald-900/30">
            <CardContent className="p-3 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-md">
                  <Coins className="w-4 h-4 text-white" />
                </div>
                <span className="text-[9px] text-emerald-800 dark:text-emerald-400/80 uppercase tracking-wider font-bold transition-theme">
                  Mis Balances
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-emerald-950 dark:text-white font-mono truncate">
                    {formattedBalance}
                  </span>
                  <span className="text-[8px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">cUSD</span>
                </div>
                <div className="flex items-baseline justify-between relative">
                  <span className="text-sm font-bold text-blue-900 dark:text-blue-300 font-mono truncate">
                    {formattedGBalance}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] font-bold text-blue-600 bg-blue-500/10 px-1.5 py-0.5 rounded">G$</span>
                    <Zap size={10} className="text-blue-400/20" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credit Power */}
          <Card className="glass-card metric-card overflow-hidden bg-emerald-100/80 dark:bg-emerald-900/30">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-md">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <span className="text-[9px] text-blue-800 dark:text-emerald-400/80 uppercase tracking-wider font-bold transition-theme">
                  Credito Campo
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-blue-900 dark:text-white font-mono transition-theme">
                  {hasPassport ? cmRecuperados : 0}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold badge-usdm">cm2</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-[9px] text-blue-700 dark:text-cyan-500/70 font-medium">
                <Zap className="w-3 h-3 text-blue-600" />
                <span>Disponible</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ================================================================
          IDENTITY & UBI ACTIONS (Full Width)
          ================================================================ */}
      <div className="animate-slide-up delay-75">
        <IdentityAction tokenId={tokenId ?? undefined} />
      </div>

      {/* ================================================================
          REGENERATION ORACLE
          ================================================================ */}
      <Card className="glass-card overflow-hidden animate-slide-up delay-75 bg-emerald-100/80 dark:bg-emerald-900/30">
        <div className="h-1 bg-gradient-to-r from-cyan-400 via-emerald-400 to-green-400 animate-shimmer" />
        
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-600 animate-leaf-sway" />
              <h2 className="text-sm font-bold text-emerald-950 dark:text-white transition-theme">
                Reportar Regeneracion
              </h2>
            </div>
            <span className="text-[9px] bg-teal-100 dark:bg-emerald-900/50 text-teal-800 dark:text-emerald-300 px-2.5 py-1 rounded-full font-mono font-bold border border-teal-300 dark:border-emerald-500/30 flex items-center gap-1 shadow-sm transition-theme">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse-dot" />
              ORACLE
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {actions.map((action) => {
              const Icon = action.icon
              const isSelected = selectedActions.includes(action.id)
              return (
                <button
                  key={action.id}
                  onClick={() => toggleAction(action.id)}
                  className={`
                    relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-300 touch-active border
                    ${isSelected 
                      ? `bg-gradient-to-br ${action.color} border-white/30 shadow-lg` 
                      : "bg-white dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-600/30 hover:border-emerald-500 shadow-sm"
                    }
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center transition-all
                    ${isSelected 
                      ? "bg-white/25 shadow-inner" 
                      : "bg-white dark:bg-emerald-800/50"
                    }
                  `}>
                    <Icon className={`w-5 h-5 ${isSelected ? "text-white" : "text-emerald-600 dark:text-emerald-400"}`} />
                  </div>
                  <span className={`text-[9px] font-semibold text-center leading-tight ${
                    isSelected ? "text-white" : "text-emerald-900 dark:text-emerald-300"
                  }`}>
                    {action.label}
                  </span>
                  <span className={`text-[8px] font-mono font-bold ${
                    isSelected ? "text-white/90" : "text-green-700 dark:text-emerald-400"
                  }`}>
                    {action.reward}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleOracleSubmit}
            disabled={selectedActions.length === 0 || isCertifying || submitted || !hasPassport}
            className={`
              w-full h-12 font-bold text-sm transition-all cyber-btn
              ${submitted 
                ? "bg-green-500 hover:bg-green-500" 
                : selectedActions.length > 0 && hasPassport
                  ? "bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-400 hover:via-green-400 hover:to-teal-400 glow-md"
                  : "bg-gray-200 dark:bg-emerald-900/30 text-gray-500 dark:text-emerald-600"
              }
            `}
          >
            {submitted ? (
              <><CheckCircle2 className="w-4 h-4 mr-2" /> Enviado al Oraculo</>
            ) : isCertifying ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Certificando On-Chain...</>
            ) : !hasPassport ? (
              <><AlertCircle className="w-4 h-4 mr-2" /> Requiere Pasaporte</>
            ) : (
              <><Send className="w-4 h-4 mr-2" /> Enviar Evidencia</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* ================================================================
          MICRO-LENDING POOL
          ================================================================ */}
      <Card className="glass-card overflow-hidden animate-slide-up delay-150 bg-emerald-100/80 dark:bg-emerald-900/30">
        <div className="h-1 bg-gradient-to-r from-[#1C7EF0] via-[#00B0A0] to-emerald-400" />
        
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-emerald-950 dark:text-white transition-theme">
                Credito Agricola
              </h2>
            </div>
            <div className="flex items-center gap-1 bg-green-100 dark:bg-transparent px-2 py-0.5 rounded-full border border-green-300 dark:border-transparent">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] text-green-800 dark:text-emerald-300 font-mono font-bold">POOL ACTIVO</span>
            </div>
          </div>

          {/* Pool Display */}
          <div className="bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-3 border border-blue-300 dark:border-blue-500/25 shadow-sm transition-theme">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg animate-float">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-[9px] text-blue-800 dark:text-cyan-400/80 uppercase tracking-wider block font-bold">
                  Pool Comunitario
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-blue-950 dark:text-white font-mono transition-theme">12.5M</span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold badge-usdm">USDm</span>
                </div>
              </div>
            </div>
            <p className="text-[9px] text-blue-700 dark:text-cyan-400/60 mt-2 flex items-center gap-1 font-medium">
              <Leaf className="w-3 h-3 text-blue-600" />
              423 productores financiados
            </p>
          </div>

          {/* Credit Form */}
          <div className="space-y-2">
            <div className="relative">
              <Input
                type="number"
                placeholder="Monto para tu siembra"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                className="h-11 pr-14 bg-white dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-600/30 font-mono focus:border-blue-400 transition-theme"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[8px] font-bold badge-usdm">
                USDm
              </span>
            </div>

            <Button
              onClick={handleCreditRequest}
              disabled={!creditAmount || parseInt(creditAmount) < 1000 || requestingCredit}
              className="w-full h-11 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-bold cyber-btn"
            >
              {requestingCredit ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</>
              ) : (
                <><Sprout className="w-4 h-4 mr-2" /> Solicitar Credito</>
              )}
            </Button>

            <p className="text-[9px] text-emerald-600/60 dark:text-emerald-500/50 text-center">
              Tasa solidaria del <span className="font-bold text-blue-600 dark:text-cyan-400">3%</span> anual
            </p>
          </div>
        </CardContent>
      </Card>

      {/* El componente IdentityAction ya incluye el estado de GoodDollar arriba */}

      {/* ================================================================
          ACTIVITY TIMELINE
          ================================================================ */}
      <Card className="glass-card overflow-hidden animate-slide-up delay-225 bg-emerald-100/80 dark:bg-emerald-900/30">
        <div className="h-1 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400" />
        
        <CardContent className="p-4">
          <h2 className="text-sm font-bold text-emerald-950 dark:text-white mb-3 flex items-center gap-2 transition-theme">
            <Clock className="w-4 h-4 text-emerald-600" />
            Actividad Reciente
          </h2>

          <div className="space-y-3">
            {timeline.map((item, index) => {
              const Icon = item.icon
              const isPending = item.status === "pending"
              return (
                <div key={index} className="flex items-start gap-3">
                  <div className="relative flex flex-col items-center">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center
                      ${isPending 
                        ? "bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-300 dark:border-amber-500/50" 
                        : "bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-300 dark:border-emerald-500/50"
                      }
                    `}>
                      <Icon className={`w-4 h-4 ${isPending ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`} />
                    </div>
                    {index < timeline.length - 1 && (
                      <div className="w-0.5 h-8 bg-gradient-to-b from-emerald-300 dark:from-emerald-600 to-transparent mt-1" />
                    )}
                  </div>
                  
                  <div className="flex-1 pt-1">
                    <p className="text-xs font-semibold text-emerald-950 dark:text-white transition-theme">
                      {item.title}
                    </p>
                    <p className={`text-[10px] font-bold ${
                      isPending 
                        ? "text-amber-700 dark:text-amber-400" 
                        : "text-green-700 dark:text-emerald-400"
                    }`}>
                      {item.detail}
                    </p>
                    <p className="text-[9px] text-emerald-700/60 dark:text-emerald-500/50 mt-0.5 font-medium">
                      {item.time}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
