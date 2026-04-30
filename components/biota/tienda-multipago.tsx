"use client"

import { useState } from "react"
import { useConnection, useWriteContract, useReadContract, useSendTransaction } from "wagmi"
import { usePrivy } from "@privy-io/react-auth"
import { parseEther, parseUnits } from "viem"
import Link from "next/link"
import {
  ArrowLeft, ShoppingCart, Leaf, Sprout, FlaskConical,
  Coins, CircleDollarSign, CreditCard, Loader2, Package
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ADDRESSES, ERC20_ABI } from "@/lib/contracts"
import { useToast } from "@/hooks/use-toast"

// ── Tipos ─────────────────────────────────────────────────────────────────────
type Currency = "celo" | "gd" | "usdt"

interface CurrencyConfig {
  label: string
  symbol: string
  decimals: number
  icon: React.FC<{ className?: string }>
  activeClass: string // clases estáticas para que Tailwind no las purgue
  inactiveClass: string
}

const CURRENCIES: Record<Currency, CurrencyConfig> = {
  celo: {
    label: "CELO", symbol: "CELO", decimals: 18, icon: Coins,
    activeClass: "bg-amber-500/10 border-amber-500/40 text-amber-400",
    inactiveClass: "bg-white/5 border-white/10 text-stone-400 hover:border-white/20",
  },
  gd: {
    label: "G$", symbol: "G$", decimals: 18, icon: CircleDollarSign,
    activeClass: "bg-blue-500/10 border-blue-500/40 text-blue-400",
    inactiveClass: "bg-white/5 border-white/10 text-stone-400 hover:border-white/20",
  },
  usdt: {
    label: "USDT", symbol: "USDT", decimals: 6, icon: CreditCard,
    activeClass: "bg-green-500/10 border-green-500/40 text-green-400",
    inactiveClass: "bg-white/5 border-white/10 text-stone-400 hover:border-white/20",
  },
}

// ── Catálogo de productos ─────────────────────────────────────────────────────
interface Product {
  id: string
  name: string
  description: string
  icon: React.FC<{ className?: string }>
  prices: Record<Currency, string>
  category: string
}

const PRODUCTS: Product[] = [
  {
    id: "semilla-bocashi",
    name: "Kit Bocashi Biota",
    description: "Inóculo microbiano para activación de suelos regenerativos. 1kg.",
    icon: Sprout,
    prices: { celo: "0.01", gd: "1", usdt: "0.01" },
    category: "Insumos",
  },
  {
    id: "analisis-lab",
    name: "Análisis de Suelo Básico",
    description: "pH, Materia Orgánica, N, P, K. Resultado digital en 7 días.",
    icon: FlaskConical,
    prices: { celo: "0.01", gd: "1", usdt: "0.01" },
    category: "Servicios",
  },
  {
    id: "sello-refi",
    name: "Sello ReFi Medellín",
    description: "Certificado digital de agricultura regenerativa. Válido 1 año.",
    icon: Leaf,
    prices: { celo: "0.01", gd: "1", usdt: "0.01" },
    category: "Certificados",
  },
  {
    id: "consultoria-biota",
    name: "Consultoría Agroecológica",
    description: "Sesión 1:1 con un técnico Biota. 60 minutos.",
    icon: Package,
    prices: { celo: "0.01", gd: "1", usdt: "0.01" },
    category: "Servicios",
  },
]

// ── Selector de Moneda ────────────────────────────────────────────────────────
function CurrencySelector({ value, onChange }: { value: Currency; onChange: (c: Currency) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.entries(CURRENCIES) as [Currency, CurrencyConfig][]).map(([key, cfg]) => {
        const Icon = cfg.icon
        const isActive = value === key
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-bold ${
              isActive ? cfg.activeClass : cfg.inactiveClass
            }`}
          >
            <Icon className="w-4 h-4" />
            {cfg.symbol}
          </button>
        )
      })}
    </div>
  )
}

// ── Producto Card ─────────────────────────────────────────────────────────────
function ProductCard({
  product,
  currency,
  onBuy,
  isBuying,
}: {
  product: Product
  currency: Currency
  onBuy: (product: Product) => void
  isBuying: boolean
}) {
  const Icon = product.icon
  const cfg = CURRENCIES[currency]
  const price = product.prices[currency]

  return (
    <Card className="bg-[#0a0a0a] border-white/5 overflow-hidden hover:border-emerald-500/20 transition-all group rounded-2xl">
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500" />
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
            <Icon className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <Badge className="bg-white/5 border-white/10 text-stone-500 text-[9px] font-bold uppercase mb-1">
              {product.category}
            </Badge>
            <h3 className="text-white font-black text-base leading-tight">{product.name}</h3>
          </div>
        </div>

        <p className="text-stone-500 text-sm leading-relaxed">{product.description}</p>

        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div>
            <p className="text-[9px] font-bold text-stone-600 uppercase tracking-widest">Precio</p>
            <p className="text-xl font-black text-white font-mono">
              {price}{" "}
              <span className="text-sm font-bold text-emerald-400">{cfg.symbol}</span>
            </p>
          </div>
          <Button
            onClick={() => onBuy(product)}
            disabled={isBuying}
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase rounded-xl h-10 px-5 transition-all shadow-lg shadow-emerald-500/20"
          >
            {isBuying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                Comprar
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Componente Principal ──────────────────────────────────────────────────────
export function TiendaMultipago() {
  const { address } = useConnection()
  const { authenticated } = usePrivy()
  const { writeContractAsync } = useWriteContract()
  const { sendTransactionAsync } = useSendTransaction()
  const { toast } = useToast()
  const [currency, setCurrency] = useState<Currency>("gd")
  const [buyingId, setBuyingId] = useState<string | null>(null)

  // Balances en vivo desde ERC20
  const { data: gdBalance } = useReadContract({
    chainId: 42220,
    address: ADDRESSES.G$,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const { data: usdtBalance } = useReadContract({
    chainId: 42220,
    address: ADDRESSES.USDT,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const formatBal = (raw: bigint | undefined, decimals: number): string => {
    if (!raw) return "0"
    const div = BigInt(10 ** decimals)
    return (raw / div).toString()
  }

  const handleBuy = async (product: Product) => {
    if (!authenticated || !address) {
      toast({ title: "Wallet no conectada", description: "Conecta tu wallet para comprar.", variant: "destructive" })
      return
    }
    setBuyingId(product.id)
    try {
      const price = product.prices[currency]
      const cfg = CURRENCIES[currency]

      if (currency === "celo") {
        // Pago CELO nativo: sendTransaction al treasury
        toast({ title: `Comprando con ${price} CELO...`, description: "Firma la transacción nativa." })
        await sendTransactionAsync({
          to: ADDRESSES.TREASURY,
          value: parseEther(price),
          chainId: 42220,
        })
        toast({ title: "✅ ¡Compra realizada!", description: `${product.name} — ${price} CELO enviados.` })
      } else {
        // Pago ERC20 (G$ o USDT): approve monto exacto al treasury
        const tokenAddress = currency === "gd" ? ADDRESSES.G$ : ADDRESSES.USDT
        const amount = parseUnits(price, cfg.decimals)

        toast({ title: `Aprobando ${price} ${cfg.symbol}...`, description: "Monto exacto." })
        await writeContractAsync({
          chainId: 42220,
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [ADDRESSES.TREASURY, amount],
        })
        toast({
          title: "✅ ¡Compra realizada!",
          description: `${product.name} — ${price} ${cfg.symbol} aprobados para el treasury Biota.`,
        })
      }
    } catch (err: any) {
      toast({
        title: "Error al comprar",
        description: err?.message?.slice(0, 100) || "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setBuyingId(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/"
          className="text-[10px] font-bold text-stone-500 hover:text-white uppercase tracking-widest flex items-center gap-1.5 mb-4 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Volver al Inicio
        </Link>
        <h1 className="text-3xl font-black text-white italic uppercase">
          🌿 Tienda <span className="text-emerald-400">Biota</span>
        </h1>
        <p className="text-stone-400 text-sm mt-1">Productos regenerativos — paga con CELO, G$ o USDT</p>
      </div>

      {/* Selector de moneda + balances en vivo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-white/[0.03] border border-white/5 rounded-2xl">
        <div>
          <p className="text-[9px] font-bold text-stone-600 uppercase tracking-widest mb-2">Pagar con</p>
          <CurrencySelector value={currency} onChange={setCurrency} />
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <p className="text-[9px] text-stone-600 font-bold uppercase">G$</p>
            <p className="text-base font-black text-blue-400 font-mono">
              {formatBal(gdBalance as bigint | undefined, 18)}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-stone-600 font-bold uppercase">USDT</p>
            <p className="text-base font-black text-green-400 font-mono">
              {formatBal(usdtBalance as bigint | undefined, 6)}
            </p>
          </div>
        </div>
      </div>

      {/* Grid de productos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {PRODUCTS.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            currency={currency}
            onBuy={handleBuy}
            isBuying={buyingId === product.id}
          />
        ))}
      </div>

      <p className="text-center text-[10px] text-stone-700 font-mono">
        Precios de prueba | Celo Mainnet (42220) | Gas optimizado
      </p>
    </div>
  )
}
