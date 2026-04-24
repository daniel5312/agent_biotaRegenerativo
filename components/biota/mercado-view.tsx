"use client"

import { useState, useEffect } from "react"
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Wallet, 
  Check, 
  Star, 
  Leaf, 
  Zap, 
  Sprout, 
  Mountain, 
  Coffee, 
  Apple, 
  Flower2, 
  Coins, 
  Sparkles, 
  ShieldCheck,
  Loader2
} from "lucide-react"
import { 
  useAccount, 
  useWriteContract, 
  useSendTransaction, 
  useReadContract, 
  useWaitForTransactionReceipt 
} from "wagmi"
import { ADDRESSES, ERC20_ABI, BIOTA_SPLITTER_ABI, formatCUSD } from "@/lib/contracts"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { parseEther } from "viem"

const products = [
  { id: 1, name: "Cafe Organico", origin: "Biota Lab", price: 1, rating: 4.9, verified: true, stock: 99, icon: Coffee, category: "Granos", color: "from-amber-400 to-orange-500" },
  { id: 2, name: "Cacao Criollo", origin: "Biota Lab", price: 2, rating: 4.8, verified: true, stock: 99, icon: Leaf, category: "Cacao", color: "from-amber-600 to-yellow-700" },
  { id: 3, name: "Miel Nativa", origin: "Biota Lab", price: 3, rating: 4.7, verified: true, stock: 99, icon: Flower2, category: "Miel", color: "from-yellow-400 to-amber-500" },
  { id: 4, name: "Panela Organica", origin: "Biota Lab", price: 4, rating: 4.6, verified: false, stock: 99, icon: Mountain, category: "Panela", color: "from-orange-400 to-red-500" },
  { id: 5, name: "Aguacate Hass", origin: "Biota Lab", price: 5, rating: 4.8, verified: true, stock: 99, icon: Apple, category: "Frutas", color: "from-green-400 to-emerald-500" },
  { id: 6, name: "Platano Verde", origin: "Biota Lab", price: 6, rating: 4.5, verified: false, stock: 99, icon: Sprout, category: "Frutas", color: "from-lime-400 to-green-500" },
]

const currencies = [
  { id: 'cUSD', label: 'cUSD', icon: Coins, color: 'text-emerald-500' },
  { id: 'CELO', label: 'CELO', icon: Zap, color: 'text-yellow-500' },
  { id: 'G$', label: 'G$', icon: Sparkles, color: 'text-blue-500' },
  { id: 'USDT', label: 'USDT', icon: ShieldCheck, color: 'text-green-600' },
  { id: 'SDCM', label: 'SDCM', icon: Wallet, color: 'text-purple-500' },
]

export function MercadoView() {
  const { address } = useAccount()
  const [cart, setCart] = useState<Record<number, number>>({})
  const [selectedCurrency, setSelectedCurrency] = useState('cUSD')
  const [paid, setPaid] = useState(false)

  // 1. Configuración de Pago (Wagmi Hooks)
  const { writeContract: writeSplitter, isPending: isTokenPaying, data: payHash } = useWriteContract()
  const { sendTransaction, isPending: isNativePaying, data: nativeHash } = useSendTransaction()
  const { writeContract: writeApprove, isPending: isApprovePending, data: approveHash } = useWriteContract()

  // 2. Esperar Recibos (UX Mejorada)
  const { isLoading: isConfirmingApprove, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash })
  const { isLoading: isConfirmingPay, isSuccess: isPaySuccess } = useWaitForTransactionReceipt({ hash: payHash || nativeHash })

  // 3. Lógica de Allowance (Permisos de Gasto)
  const tokenAddress = selectedCurrency === 'CELO' ? undefined : ADDRESSES[selectedCurrency as keyof typeof ADDRESSES] as `0x${string}`
  
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address!, ADDRESSES.BIOTA_SPLITTER],
    query: { enabled: !!address && !!tokenAddress && selectedCurrency !== 'CELO' }
  })

  // Refrescar permiso tras transacción exitosa
  useEffect(() => {
    if (isApproveSuccess) refetchAllowance()
  }, [isApproveSuccess, refetchAllowance])

  const isPaying = isTokenPaying || isNativePaying || isApprovePending || isConfirmingApprove || isConfirmingPay

  const addToCart = (id: number) => setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }))
  const removeFromCart = (id: number) => {
    setCart((prev) => {
      const newCart = { ...prev }
      if (newCart[id] > 1) newCart[id]--
      else delete newCart[id]
      return newCart
    })
  }

  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const product = products.find((p) => p.id === Number(id))
    return sum + (product?.price || 0) * qty
  }, 0)
  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0)

  // Direcciones de Impacto (Desde el centro de mando en lib/contracts.ts)
  const MERCHANT_ADDRESS = (process.env.NEXT_PUBLIC_PERSONAL_WALLET || "0x6D4763715bf9cDe401FD4AaC9a6254CeB4382c9b") as `0x${string}`
  const COLLECTIVE_MUJERES = ADDRESSES.COLLECTIVE_MUJERES as `0x${string}`
  const BIOTA_POOL = ADDRESSES.BIOTA_POOL as `0x${string}`

  const totalAmount = BigInt(cartTotal) * BigInt(10**15)
  const needsApproval = selectedCurrency !== 'CELO' && (allowance === undefined || allowance < totalAmount)

  const handleAction = async () => {
    if (!address) return;

    if (needsApproval && tokenAddress) {
      writeApprove({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [ADDRESSES.BIOTA_SPLITTER, totalAmount * BigInt(10)], // Aprobamos 10x para evitar re-aprobación constante
      })
      return
    }

    try {
      if (selectedCurrency === 'CELO') {
        sendTransaction({
          to: MERCHANT_ADDRESS as `0x${string}`,
          value: totalAmount,
        })
      } else {
        writeSplitter({
          address: ADDRESSES.BIOTA_SPLITTER as `0x${string}`,
          abi: BIOTA_SPLITTER_ABI,
          functionName: "payWithSplit",
          args: [
            tokenAddress as `0x${string}`,
            totalAmount,
            MERCHANT_ADDRESS as `0x${string}`,
            COLLECTIVE_MUJERES as `0x${string}`,
            BIOTA_POOL as `0x${string}`
          ],
        })
      }
    } catch (error) {
      console.error("Error en la transacción:", error)
    }
  }

  // Limpiar carrito y mostrar éxito tras confirmación en blockchain
  useEffect(() => {
    if (isPaySuccess) {
      setPaid(true)
      setTimeout(() => { 
        setPaid(false)
        setCart({}) 
      }, 3000)
    }
  }, [isPaySuccess])

  return (
    <div className="px-4 py-4 space-y-4 mb-nav">
      {/* Header */}
      <div className="animate-slide-up">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-emerald-950 dark:text-white flex items-center gap-2 transition-theme">
              <Sprout className="w-5 h-5 text-emerald-600 animate-leaf-sway" />
              Mercado Campesino
            </h1>
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400/60 font-semibold transition-theme">
              Directo del campo a tu mesa
            </p>
          </div>
          {cartCount > 0 && (
            <div className="relative animate-grow-in">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center transition-theme">
                <ShoppingCart className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
              </div>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white shadow-lg">
                {cartCount}
              </span>
            </div>
          )}
        </div>

        {/* Currency Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {currencies.map((curr) => (
            <button
              key={curr.id}
              onClick={() => setSelectedCurrency(curr.id)}
              className={`
                flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-[10px] font-bold
                ${selectedCurrency === curr.id 
                  ? "bg-emerald-500 border-emerald-400 text-white shadow-md scale-105" 
                  : "bg-white dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-600/30 text-emerald-800 dark:text-emerald-400"
                }
              `}
            >
              <curr.icon className={`w-3 h-3 ${selectedCurrency === curr.id ? "text-white" : curr.color}`} />
              {curr.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 gap-3">
        {products.map((product, index) => {
          const qty = cart[product.id] || 0
          const ProductIcon = product.icon
          return (
            <Card 
              key={product.id} 
              className="glass-card overflow-hidden animate-slide-up group bg-emerald-100/80 dark:bg-emerald-900/30"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-0">
                <div className="h-24 relative overflow-hidden bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/20">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${product.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                      <ProductIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  {product.verified && (
                    <Badge className="absolute top-2 right-2 bg-emerald-500/90 text-white text-[7px] px-1.5 py-0.5">
                      <Leaf className="w-2 h-2 mr-0.5" /> Verificado
                    </Badge>
                  )}
                </div>

                <div className="p-3 space-y-2">
                  <h3 className="text-xs font-bold text-emerald-950 dark:text-white leading-tight">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-emerald-950 dark:text-white font-mono">
                      {product.price} <span className="text-[7px] badge-copm">COPm</span>
                    </span>
                  </div>

                  {qty === 0 ? (
                    <Button
                      onClick={() => addToCart(product.id)}
                      size="sm"
                      className="w-full h-8 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Agregar
                    </Button>
                  ) : (
                    <div className="flex items-center justify-between bg-emerald-100 dark:bg-emerald-900/40 rounded-lg p-1 border border-emerald-200">
                      <button onClick={() => removeFromCart(product.id)} className="w-7 h-7 rounded-md bg-white text-emerald-600 flex items-center justify-center transition-all"><Minus size={14}/></button>
                      <span className="text-sm font-bold">{qty}</span>
                      <button onClick={() => addToCart(product.id)} className="w-7 h-7 rounded-md bg-emerald-500 text-white flex items-center justify-center transition-all"><Plus size={14}/></button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Floating Cart */}
      {cartCount > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[calc(448px-2rem)] z-40 animate-slide-up">
          <Card className="glass-card border-emerald-400/70 shadow-2xl overflow-hidden bg-emerald-100/95 dark:bg-emerald-900/80">
            <div className="h-1 bg-gradient-to-r from-[#FCFF52] via-emerald-400 to-[#00B0A0]" />
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex flex-col">
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-widest">Total en {selectedCurrency}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-emerald-950 dark:text-white font-mono">
                      {(cartTotal * 0.001).toFixed(3)}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600">{selectedCurrency}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-emerald-600/60 uppercase font-bold">Resumen Impacto (4%)</p>
                  <p className="text-[9px] font-bold text-teal-600 dark:text-emerald-400">Mujeres del Carmen + Pool Biota</p>
                  <p className="text-xs font-bold text-emerald-950 dark:text-white">{cartCount} items</p>
                </div>
              </div>
              
              <Button
                onClick={handleAction}
                disabled={isPaying || paid}
                className="w-full h-11 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white font-bold shadow-lg cyber-btn"
              >
                {paid ? (
                  <><Check className="w-4 h-4 mr-2" /> Pago Realizado</>
                ) : isConfirmingApprove || isConfirmingPay ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Confirmando en Red...</>
                ) : isApprovePending || isTokenPaying || isNativePaying ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Firma en Billetera...</>
                ) : needsApproval ? (
                  <><ShieldCheck className="w-4 h-4 mr-2" /> Aprobar {selectedCurrency}</>
                ) : (
                  <><Wallet className="w-4 h-4 mr-2" /> Pagar con {selectedCurrency}</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
