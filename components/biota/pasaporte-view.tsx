"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { useConnection, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi"
import { useWallets, usePrivy } from "@privy-io/react-auth"
import { ADDRESSES, BIOTA_SCROW_ABI, BIOTA_UBI_ABI, ERC20_ABI, IDENTITY_ABI, UBI_SCHEME_ABI, formatCUSD, type LoteData } from "@/lib/contracts"
import { useBiotaPass } from "@/hooks/useBiotaPass"
import { usePoA } from "@/hooks/usePoA"
import { useAgent } from "@/context/agentProvider"
import { useToast } from "@/hooks/use-toast"

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export function PasaporteView() {
  const { address } = useConnection()
  const { wallets } = useWallets()
  const { authenticated } = usePrivy()
  const { agentAction } = useAgent()
  const { 
    hasPassport, 
    tokenId, 
    bioScore, 
    isLoading: loadingPassport,
    cmRecuperados,
    loteData,
    mintPassport,
    isMinting,
    mintConfirmed,
    gDollarBalance,
    paymentMethod,
    setPaymentMethod
  } = useBiotaPass()
  const { certificarPoA, isCertifying } = usePoA()
  const { toast } = useToast()

  const [selectedActions, setSelectedActions] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  
  // Estados para el formulario de registro (UX Completa)
  const [finca, setFinca] = useState("")
  const [vereda, setVereda] = useState("")
  const [municipio, setMunicipio] = useState("")
  const [departamento, setDepartamento] = useState("")
  const [nombreProductor, setNombreProductor] = useState("")
  const [area, setArea] = useState(0)
  const [ingredientes, setIngredientes] = useState("")
  const [hashLab, setHashLab] = useState("")
  
  // Cache en localStorage para evitar parpadeos y "vuelo" de la página
  const [cachedData, setCachedData] = useState<any>(() => {
    if (typeof window === 'undefined') return null
    const saved = localStorage.getItem(`biota_cache_${address}`)
    return saved ? JSON.parse(saved) : null
  })

  useEffect(() => {
    if (loteData && address) {
      localStorage.setItem(`biota_cache_${address}`, JSON.stringify({ loteData, tokenId: tokenId?.toString(), bioScore }))
      setCachedData({ loteData, tokenId: tokenId?.toString(), bioScore })
    }
  }, [loteData, address, tokenId, bioScore])


  const { data: isWhitelisted } = useReadContract({
    chainId: 42220,
    address: ADDRESSES.IDENTITY,
    abi: IDENTITY_ABI,
    functionName: "isWhitelisted",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: entitlement } = useReadContract({
    chainId: 42220,
    address: ADDRESSES.BIOTA_UBI as `0x${string}`,
    abi: UBI_SCHEME_ABI,
    functionName: "checkEntitlement",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30_000 },
  });

  const canClaim = (entitlement as bigint || 0n) > 0n;

  const { writeContractAsync, isPending: isClaimingUBI } = useWriteContract();

  // Escuchar transacciones del Agente (Onboarding)
  const { isLoading: isAgentMintingLoading, isSuccess: isAgentMintSuccess } = useWaitForTransactionReceipt({
    hash: agentAction?.txHash as `0x${string}`,
    query: { enabled: !!agentAction?.txHash }
  })

  const isActuallyMinting = isMinting || (agentAction?.isMinting && !isAgentMintSuccess);

  const handleClaimUBI = useCallback(async () => {
    if (!wallets[0] || !address || !tokenId) return;
    try {
      toast({ title: "Activando goteo de UBI...", description: "Firma la transacción para iniciar el flujo." })
      const hashTx = await writeContractAsync({
        chainId: 42220,
        address: ADDRESSES.BIOTA_UBI as `0x${string}`,
        abi: BIOTA_UBI_ABI,
        functionName: "iniciarFlujoUBI",
        args: [tokenId as bigint, BigInt("3858024691358")],
      });
      toast({ title: "¡Flujo Iniciado!", description: "El UBI está fluyendo a tu billetera." })
    } catch (error: any) {
      toast({ title: "Error", description: error?.message?.slice(0,100) || "Error desconocido", variant: "destructive" })
    }
  }, [address, wallets, writeContractAsync, tokenId, toast]);

  const formattedBalance = "— cUSD"; // cUSD no es prioritario para el minteo ahora

  const formattedGBalance = `${gDollarBalance} G$`;

  const toggleAction = (actionId: string) => {
    setSelectedActions(prev => 
      prev.includes(actionId) 
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId]
    )
  }

  const handleOracleSubmit = async () => {
    if (selectedActions.length === 0 || !tokenId) return
    const action = actions.find(a => selectedActions.includes(a.id))
    try {
      await certificarPoA({
        tokenId: tokenId,
        nuevoCmSuelo: cmRecuperados + 10,
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

  const actions = [
    { id: "photo", icon: Camera, label: "Foto Compostaje", reward: "+2.5 cUSD", color: "from-cyan-500 to-teal-500" },
    { id: "ph", icon: Droplets, label: "Ingresar pH", reward: "+5.0 cUSD", color: "from-blue-500 to-cyan-500" },
    { id: "trees", icon: TreePine, label: "Registrar Arboles", reward: "+12.0 cUSD", color: "from-emerald-500 to-green-500" },
  ]

  const timeline = [
    { status: "pending", title: "Foto de compostaje enviada", detail: "En revision por oraculo", time: "Hace 2 horas", icon: Sprout },
    { status: "approved", title: "Registro de pH aprobado", detail: "+5.0 cUSD", time: "Ayer, 14:30", icon: Droplets },
    { status: "approved", title: "Reforestacion verificada", detail: "+12.0 cUSD", time: "Hace 3 dias", icon: TreePine },
  ]

  // Estado de carga inteligente: usa cache si existe mientras carga de la red
  const effectiveLoading = loadingPassport && !cachedData;
  const effectiveHasPassport = hasPassport || !!cachedData?.tokenId;
  const effectiveTokenId = tokenId?.toString() || cachedData?.tokenId;
  const effectiveUbicacion = loteData?.ubicacionGeografica || cachedData?.loteData?.ubicacionGeografica || "Finca Suelo Vivo, Celo";

  return (
    <div className="px-4 py-4 space-y-4 mb-nav">
      <div className="space-y-3 animate-slide-up">
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
                    Productor Biota {DEV_MODE && "(Dev)"}
                  </h1>
                  <span className="text-[9px] text-teal-700 dark:text-emerald-400/60 font-mono font-semibold bg-teal-100 dark:bg-transparent px-1.5 py-0.5 rounded">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>
                <p className="text-xs text-emerald-800 dark:text-emerald-300/80 flex items-center gap-1 font-semibold transition-theme">
                  <Mountain className="w-3 h-3 text-amber-600" />
                  {effectiveUbicacion}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              {effectiveLoading || isActuallyMinting ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-2.5 py-1 animate-pulse">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Sincronizando Pasaporte...
                </Badge>
              ) : effectiveHasPassport ? (
                <Badge className="bg-gradient-to-r from-emerald-500/20 to-teal-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40 hover:bg-emerald-500/25 px-2.5 py-1 transition-theme">
                  <Sparkles className="w-3 h-3 mr-1 text-yellow-500" />
                  BiotaPass: #{effectiveTokenId}
                </Badge>
              ) : (
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <p className="text-[10px] text-amber-600 font-bold uppercase">Selecciona método de pago para el Pasaporte:</p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setPaymentMethod('G$')}
                      variant={paymentMethod === 'G$' ? 'default' : 'outline'}
                      className={`h-8 text-[10px] font-black uppercase rounded-xl flex-1 ${paymentMethod === 'G$' ? 'bg-blue-600' : 'border-blue-500/30 text-blue-500'}`}
                    >
                      <Zap className="w-3 h-3 mr-1" /> 50 G$
                    </Button>
                    <Button 
                      onClick={() => setPaymentMethod('CELO')}
                      variant={paymentMethod === 'CELO' ? 'default' : 'outline'}
                      className={`h-8 text-[10px] font-black uppercase rounded-xl flex-1 ${paymentMethod === 'CELO' ? 'bg-emerald-600' : 'border-emerald-500/30 text-emerald-500'}`}
                    >
                      <Coins className="w-3 h-3 mr-1" /> 0.25 CELO
                    </Button>
                  </div>
                  <p className="text-[9px] text-stone-500 italic mt-1 text-center sm:text-left">
                    * El registro se realiza mediante el Agente IA de Biota.
                  </p>
                </div>
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

        {/* Balance Cards & UBI (Solo si tiene pasaporte) */}
        {effectiveHasPassport && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card className="glass-card metric-card overflow-hidden bg-emerald-100/80 dark:bg-emerald-900/30">
              <CardContent className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                    <Coins size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-stone-500">Balance G$</p>
                    <p className="text-xl font-black text-blue-600 font-mono">{gDollarBalance}</p>
                  </div>
                </div>
                <Button 
                  onClick={handleClaimUBI} 
                  disabled={isClaimingUBI || !canClaim}
                  size="sm"
                  className={`font-black text-[10px] uppercase rounded-full shadow-lg transition-all ${canClaim ? 'bg-emerald-500 hover:bg-emerald-400 text-black glow-sm' : 'bg-stone-800 text-stone-500'}`}
                >
                  {isClaimingUBI ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Sprout className="w-3 h-3 mr-1" /> {canClaim ? 'Cosechar UBI' : 'Sin Entitlement'}</>}
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-card metric-card overflow-hidden bg-emerald-100/80 dark:bg-emerald-900/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-md">
                    <CreditCard className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[9px] text-blue-800 dark:text-emerald-400/80 uppercase tracking-wider font-bold">
                    Credito Campo
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-blue-900 dark:text-white font-mono transition-size">
                    {cmRecuperados || 0}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold badge-usdm">cm2</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Formulario de Registro (Solo si NO tiene pasaporte) */}
        {!effectiveHasPassport && (
          <Card className="glass-card bg-white/5 border-white/10 overflow-hidden shadow-2xl">
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <CardContent className="p-6 space-y-6">
              <div className="space-y-1">
                <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> Datos del Productor Biota
                </h3>
                <p className="text-[10px] text-stone-500 italic">Información oficial para el Pasaporte de Carbono.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-stone-500">Nombre del Productor / Razón Social</label>
                  <Input 
                    placeholder="Ej: Asociación de Cafeteros del Carmen" 
                    className="bg-black/20 border-white/10 text-white h-11 rounded-xl focus:border-emerald-500 transition-all"
                    onChange={(e) => setNombreProductor(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-stone-500">Nombre de la Finca</label>
                  <Input 
                    placeholder="Ej: Finca La Esperanza" 
                    className="bg-black/20 border-white/10 text-white h-11 rounded-xl"
                    onChange={(e) => setFinca(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-stone-500">Vereda</label>
                  <Input 
                    placeholder="Ej: Vereda La Linda" 
                    className="bg-black/20 border-white/10 text-white h-11 rounded-xl"
                    onChange={(e) => setVereda(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-stone-500">Municipio</label>
                  <Input 
                    placeholder="Ej: El Carmen de Viboral" 
                    className="bg-black/20 border-white/10 text-white h-11 rounded-xl"
                    onChange={(e) => setMunicipio(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-stone-500">Departamento</label>
                  <Input 
                    placeholder="Ej: Antioquia" 
                    className="bg-black/20 border-white/10 text-white h-11 rounded-xl"
                    onChange={(e) => setDepartamento(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-stone-500">Área (m2)</label>
                  <Input 
                    type="number" 
                    placeholder="1000" 
                    className="bg-black/20 border-white/10 text-white h-11 rounded-xl"
                    onChange={(e) => setArea(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-stone-500">Telegram / Contacto</label>
                  <Input 
                    placeholder="@usuario" 
                    className="bg-black/20 border-white/10 text-white h-11 rounded-xl"
                    onChange={(e) => setIngredientes(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-stone-500">Hash de Laboratorio / Suelo</label>
                  <Input 
                    placeholder="0x..." 
                    className="bg-black/20 border-white/10 text-white h-11 font-mono rounded-xl"
                    onChange={(e) => setHashLab(e.target.value)}
                  />
                </div>
              </div>

              <Button 
                onClick={() => {
                  const combinedUbicacion = `${finca} | ${vereda} | ${municipio} | ${departamento} | Productor: ${nombreProductor}`;
                  mintPassport({
                    tokenURI: "https://biota.earth/passport/metadata",
                    ubicacionGeografica: combinedUbicacion,
                    areaM2: BigInt(area),
                    cmSueloRecuperado: 0n,
                    estadoBiologico: "Transición Agroecológica",
                    hashAnalisisLab: hashLab || "Sin Hash",
                    ingredientesHash: ingredientes || "No especificado",
                    metodosAgricolas: "Prácticas Regenerativas Biota"
                  })
                }} 
                disabled={isActuallyMinting || !finca || !nombreProductor || area <= 0}
                className="w-full h-16 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl glow-sm text-sm group"
              >
                {isActuallyMinting ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2 group-hover:animate-pulse" />}
                {isActuallyMinting ? "Minteando..." : `Mintear con ${paymentMethod}`}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="glass-card overflow-hidden animate-slide-up delay-75 bg-emerald-100/80 dark:bg-emerald-900/30">
        <div className="h-1 bg-gradient-to-r from-cyan-400 via-emerald-400 to-green-400 animate-shimmer" />
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-600 animate-leaf-sway" />
              <h2 className="text-sm font-bold text-emerald-950 dark:text-white transition-theme">Reportar Regeneracion</h2>
            </div>
            <span className="text-[9px] bg-teal-100 dark:bg-emerald-900/50 text-teal-800 dark:text-emerald-300 px-2.5 py-1 rounded-full font-mono font-bold border border-teal-300 dark:border-emerald-500/30 flex items-center gap-1 shadow-sm transition-theme">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse-dot" />
              ORACLE
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {actions.map((action) => {
              const Icon = action.icon
              const isSelected = selectedActions.includes(action.id)
              return (
                <button
                  key={action.id}
                  onClick={() => toggleAction(action.id)}
                  className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-300 border touch-active ${isSelected ? `bg-gradient-to-br ${action.color} border-white/30 shadow-lg` : "bg-white dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-600/30 hover:border-emerald-500 shadow-sm"}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isSelected ? "bg-white/25 shadow-inner" : "bg-white dark:bg-emerald-800/50"}`}>
                    <Icon className={`w-5 h-5 ${isSelected ? "text-white" : "text-emerald-600 dark:text-emerald-400"}`} />
                  </div>
                  <span className={`text-[9px] font-semibold text-center leading-tight ${isSelected ? "text-white" : "text-emerald-900 dark:text-emerald-300"}`}>{action.label}</span>
                  <span className={`text-[8px] font-mono font-bold ${isSelected ? "text-white/90" : "text-green-700 dark:text-emerald-400"}`}>{action.reward}</span>
                </button>
              )
            })}
          </div>

          <Button
            onClick={handleOracleSubmit}
            disabled={selectedActions.length === 0 || isCertifying || submitted || !effectiveHasPassport}
            className={`w-full h-12 font-bold text-sm transition-all cyber-btn ${submitted ? "bg-green-500 hover:bg-green-500" : selectedActions.length > 0 && effectiveHasPassport ? "bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-400 via-green-400 to-teal-400 glow-md" : "bg-gray-200 dark:bg-emerald-900/30 text-gray-500 dark:text-emerald-600"}`}
          >
            {submitted ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Enviado al Oraculo</> : isCertifying ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Certificando On-Chain...</> : !effectiveHasPassport ? <><AlertCircle className="w-4 h-4 mr-2" /> Requiere Pasaporte</> : <><Send className="w-4 h-4 mr-2" /> Enviar Evidencia</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
