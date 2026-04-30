"use client"

import { useState, useMemo } from "react"
import { 
  Coins, CircleDollarSign, CreditCard, ExternalLink, Camera, 
  Droplets, TreePine, ShoppingCart, Loader2, Sparkles, Zap, 
  Sprout, MapPin, ShieldCheck, AlertCircle, Wallet, Send, CheckCircle2
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAccount, useWriteContract, useReadContract, useBalance } from "wagmi"
import { usePrivy } from "@privy-io/react-auth"
import { formatUnits } from "viem"
import { ADDRESSES, BIOTA_PASSPORT_ABI, ERC20_ABI } from "@/lib/contracts"
import { useBiotaPass } from "@/hooks/useBiotaPass"
import { useToast } from "@/hooks/use-toast"

export function PasaporteView() {
  const { address } = useAccount()
  const { authenticated } = usePrivy()
  const { mintPassport, isMinting } = useBiotaPass()
  const { writeContractAsync } = useWriteContract()

  const [activeTab, setActiveTab] = useState<"finca" | "wallet">("finca")
  const [paymentMethod, setPaymentMethod] = useState<"G$" | "CELO">("CELO")
  const [nombreProductor, setNombreProductor] = useState("")
  const [finca, setFinca] = useState("")
  const [vereda, setVereda] = useState("")
  const [municipio, setMunicipio] = useState("")
  const [area, setArea] = useState(1000)
  const [selectedActions, setSelectedActions] = useState<string[]>([])

  const { data: celoRes } = useBalance({ address: address as `0x${string}`, query: { enabled: !!address } })
  const { data: gdBalanceRaw } = useReadContract({ chainId: 42220, address: ADDRESSES.G$, abi: ERC20_ABI, functionName: "balanceOf", args: address ? [address] : undefined, query: { enabled: !!address } })
  const { data: passportRaw } = useReadContract({ chainId: 42220, address: ADDRESSES.BIOTA_PASSPORT, abi: BIOTA_PASSPORT_ABI, functionName: "balanceOf", args: address ? [address] : undefined, query: { enabled: !!address } })

  const effectiveHasPassport = useMemo(() => passportRaw ? BigInt(passportRaw.toString()) > 0n : false, [passportRaw])
  const gDollarBalance = gdBalanceRaw ? Number(formatUnits(BigInt(gdBalanceRaw.toString()), 18)).toFixed(0) : "0"
  const celoBalance = celoRes ? Number(formatUnits(celoRes.value, 18)).toFixed(2) : "0.00"

  const toggleAction = (id: string) => setSelectedActions(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id])

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 pb-20">
      <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
        <button onClick={() => setActiveTab("finca")} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === "finca" ? 'bg-emerald-500 text-black' : 'text-stone-500'}`}>🚜 Mi Finca</button>
        <button onClick={() => setActiveTab("wallet")} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === "wallet" ? 'bg-blue-600 text-white' : 'text-stone-500'}`}>💰 Mi Billetera</button>
      </div>

      {activeTab === "finca" ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          <h1 className="text-4xl font-black text-white italic uppercase">{effectiveHasPassport ? 'Mi Finca Biota' : 'Registro Biota'}</h1>
          
          {effectiveHasPassport ? (
            <Card className="glass-card bg-emerald-500/5 border-emerald-500/20 p-6 rounded-3xl">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500"><Sprout size={24} /></div>
                  <div><p className="text-[10px] font-black text-stone-500 uppercase">Impacto PoA</p><p className="text-2xl font-black text-white font-mono">1,250 cm²</p></div>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-500 text-[10px] font-black italic">VERIFICADO</Badge>
              </div>
            </Card>
          ) : (
            <Card className="bg-white/5 border-white/10 p-8 rounded-3xl space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1"><label className="text-[10px] font-black uppercase text-stone-500">Nombre Productor</label><Input onChange={(e)=>setNombreProductor(e.target.value)} className="bg-black/40 border-white/10 h-12 rounded-2xl" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black uppercase text-stone-500">Finca</label><Input onChange={(e)=>setFinca(e.target.value)} className="bg-black/40 border-white/10 h-12 rounded-2xl" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black uppercase text-stone-500">Municipio</label><Input onChange={(e)=>setMunicipio(e.target.value)} className="bg-black/40 border-white/10 h-12 rounded-2xl" /></div>
              </div>
              <Button onClick={() => mintPassport({tokenURI:"ipfs://biota", ubicacionGeografica: finca, areaM2: BigInt(area), cmSueloRecuperado:0n, estadoBiologico:"Iniciado", hashAnalisisLab:"0x", ingredientesHash: nombreProductor, metodosAgricolas:"Regenerativo"})} disabled={isMinting || !finca} className="w-full h-14 bg-emerald-500 text-black font-black uppercase rounded-2xl">
                {isMinting ? <Loader2 className="animate-spin" /> : `Mintear Pasaporte (0.01 CELO)`}
              </Button>
            </Card>
          )}

          <Card className="bg-white/5 border-white/10 p-6 rounded-3xl space-y-4">
            <h3 className="text-xs font-black uppercase text-emerald-500">Reportar Regeneración</h3>
            <div className="grid grid-cols-3 gap-2">
              {['Compost', 'pH', 'Árboles'].map(id => (
                <button key={id} onClick={() => toggleAction(id)} className={`p-4 rounded-xl border text-[10px] font-black uppercase transition-all ${selectedActions.includes(id) ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-black/20 border-white/5 text-stone-500'}`}>{id}</button>
              ))}
            </div>
          </Card>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Mi <span className="text-blue-500">Billetera</span></h1>
          <Card className="bg-blue-600/10 border-blue-500/20 p-8 rounded-3xl space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><CircleDollarSign size={80} className="text-blue-400" /></div>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div><Badge className="bg-blue-600 text-white text-[9px] font-black uppercase mb-2">GoodDollar UBI</Badge><p className="text-5xl font-black text-white font-mono tracking-tighter">{gDollarBalance}<span className="text-xl text-blue-400 ml-2">G$</span></p></div>
              <a href="https://wallet.gooddollar.org/" target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white h-12 px-8 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 shadow-xl shadow-blue-600/20">Reclamar UBI <ExternalLink className="w-4 h-4" /></a>
            </div>
          </Card>
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/5 border-white/5 p-6 rounded-3xl"><p className="text-[10px] font-black uppercase text-stone-500">CELO</p><p className="text-3xl font-black text-amber-500 font-mono">{celoBalance}</p></Card>
            <Card className="bg-white/5 border-white/5 p-6 rounded-3xl"><p className="text-[10px] font-black uppercase text-stone-500">Tokens</p><p className="text-3xl font-black text-emerald-500 font-mono">0.00</p></Card>
          </div>
        </div>
      )}
    </div>
  )
}
