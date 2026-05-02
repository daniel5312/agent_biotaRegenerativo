"use client";

import { useState } from "react";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useSendTransaction,
  useBalance,
} from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { parseEther, parseUnits, formatUnits } from "viem";
import Link from "next/link";
import {
  ArrowLeft,
  ShoppingCart,
  Leaf,
  Sprout,
  FlaskConical,
  Coins,
  CircleDollarSign,
  CreditCard,
  Loader2,
  Package,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ADDRESSES, ERC20_ABI, BIOTA_SPLITTER_ABI } from "@/lib/contracts";
import { useToast } from "@/hooks/use-toast";

// ── Tipos ─────────────────────────────────────────────────────────────────────
type Currency = "celo" | "gd" | "usdt" | "usdc";

interface CurrencyConfig {
  label: string;
  symbol: string;
  decimals: number;
  icon: any;
  activeClass: string;
  inactiveClass: string;
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
    activeClass: "bg-emerald-500/10 border-emerald-500/40 text-emerald-400",
    inactiveClass: "bg-white/5 border-white/10 text-stone-400 hover:border-white/20",
  },
  usdc: {
    label: "USDC", symbol: "USDC", decimals: 6, icon: CircleDollarSign,
    activeClass: "bg-sky-500/10 border-sky-500/40 text-sky-400",
    inactiveClass: "bg-white/5 border-white/10 text-stone-400 hover:border-white/20",
  },
};

interface Product {
  id: string;
  name: string;
  description: string;
  icon: any;
  prices: Record<Currency, string>;
  category: string;
}

const PRODUCTS: Product[] = [
  {
    id: "semilla-bocashi",
    name: "Kit Bocashi Biota",
    description: "Inóculo microbiano para activación de suelos regenerativos. 1kg.",
    icon: Sprout,
    prices: { celo: "0.01", gd: "10", usdt: "0.01", usdc: "0.01" },
    category: "Insumos",
  },
  {
    id: "analisis-lab",
    name: "Análisis de Suelo Básico",
    description: "pH, Materia Orgánica, N, P, K. Resultado digital en 7 días.",
    icon: FlaskConical,
    prices: { celo: "0.05", gd: "50", usdt: "0.05", usdc: "0.05" },
    category: "Servicios",
  },
  {
    id: "sello-refi",
    name: "Sello ReFi Medellín",
    description: "Certificado digital de agricultura regenerativa. Válido 1 año.",
    icon: Leaf,
    prices: { celo: "0.1", gd: "100", usdt: "0.1", usdc: "0.1" },
    category: "Certificados",
  },
  {
    id: "consultoria-biota",
    name: "Consultoría Agroecológica",
    description: "Sesión 1:1 con un técnico Biota. 60 minutos.",
    icon: Package,
    prices: { celo: "0.2", gd: "200", usdt: "0.2", usdc: "0.2" },
    category: "Servicios",
  },
];

// ── Componentes Internos ──────────────────────────────────────────────────────
function CurrencySelector({ value, onChange }: { value: Currency; onChange: (c: Currency) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.entries(CURRENCIES) as [Currency, CurrencyConfig][]).map(([key, cfg]) => {
        const Icon = cfg.icon;
        const isActive = value === key;
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
        );
      })}
    </div>
  );
}

function ProductCard({ product, currency, onBuy, isBuying }: { product: Product; currency: Currency; onBuy: (p: Product) => void; isBuying: boolean }) {
  const Icon = product.icon;
  const cfg = CURRENCIES[currency];
  const price = product.prices[currency];

  return (
    <Card className="bg-[#0a0a0a] border-white/5 overflow-hidden hover:border-emerald-500/20 transition-all group rounded-2xl">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <Badge className="bg-white/5 border-white/10 text-stone-500 text-[9px] font-bold uppercase mb-1">{product.category}</Badge>
            <h3 className="text-white font-black text-base">{product.name}</h3>
          </div>
        </div>
        <p className="text-stone-500 text-xs leading-relaxed">{product.description}</p>
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div>
            <p className="text-[8px] font-black text-stone-600 uppercase">Inversión</p>
            <p className="text-xl font-black text-white font-mono">{price} <span className="text-xs text-emerald-500">{cfg.symbol}</span></p>
          </div>
          <Button onClick={() => onBuy(product)} disabled={isBuying} className="bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] uppercase rounded-xl h-10 px-6">
            {isBuying ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShoppingCart className="w-3.5 h-3.5 mr-2" /> Pagar</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Componente Principal ──────────────────────────────────────────────────────
export function TiendaMultipago() {
  const { address } = useAccount();
  const { authenticated } = usePrivy();
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();
  const { toast } = useToast();
  const [currency, setCurrency] = useState<Currency>("gd");
  const [buyingId, setBuyingId] = useState<string | null>(null);

  // Balances
  const { data: celoRes } = useBalance({ address: address as `0x${string}`, query: { enabled: !!address } });
  const { data: gdBal } = useReadContract({ chainId: 42220, address: ADDRESSES.G$, abi: ERC20_ABI, functionName: "balanceOf", args: address ? [address] : undefined, query: { enabled: !!address } });
  const { data: usdtBal } = useReadContract({ chainId: 42220, address: ADDRESSES.USDT, abi: ERC20_ABI, functionName: "balanceOf", args: address ? [address] : undefined, query: { enabled: !!address } });
  const { data: usdcBal } = useReadContract({ chainId: 42220, address: ADDRESSES.USDC, abi: ERC20_ABI, functionName: "balanceOf", args: address ? [address] : undefined, query: { enabled: !!address } });

  const formatB = (raw: any, dec: number) => {
    if (!raw) return "0.00";
    const val = typeof raw === "object" && "value" in raw ? raw.value : BigInt(raw);
    return Number(formatUnits(val, dec)).toFixed(2);
  };

  const handleBuy = async (product: Product) => {
    if (!authenticated || !address) {
      toast({ title: "Error", description: "Conecta tu wallet.", variant: "destructive" });
      return;
    }
    setBuyingId(product.id);
    const price = product.prices[currency];
    const cfg = CURRENCIES[currency];
    const amountWei = parseUnits(price, cfg.decimals);

    try {
      if (currency === "celo") {
        await sendTransactionAsync({ to: ADDRESSES.REFI_MEDELLIN, value: amountWei, chainId: 42220 });
      } else {
        const tokenAddr = currency === "gd" ? ADDRESSES.G$ : currency === "usdt" ? ADDRESSES.USDT : ADDRESSES.USDC;
        
        // 1. Approve BiotaSplitter
        toast({ title: "Autorizando...", description: `Firma la autorización de ${cfg.symbol} para el Splitter` });
        await writeContractAsync({
          chainId: 42220,
          address: tokenAddr as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [ADDRESSES.BIOTA_SPLITTER as `0x${string}`, amountWei],
        });

        // 2. payWithSplit
        toast({ title: "Procesando División...", description: "Enrutando fondos (94/3/3)..." });
        await writeContractAsync({
          chainId: 42220,
          address: ADDRESSES.BIOTA_SPLITTER as `0x${string}`,
          abi: BIOTA_SPLITTER_ABI,
          functionName: 'payWithSplit',
          args: [
            tokenAddr as `0x${string}`, 
            amountWei,
            ADDRESSES.REFI_MEDELLIN,    // Biota (94%)
            ADDRESSES.COLLECTIVE_MUJERES, // Mujeres (3%)
            ADDRESSES.BIOTA_SCROW       // Biota Regenerativa (3%)
          ]
        });
      }
      toast({ title: "✅ Éxito", description: "Pago procesado y dividido correctamente." });
    } catch (e: any) {
      toast({ title: "Error", description: e.shortMessage || "Error en el pago", variant: "destructive" });
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Link href="/" className="text-[9px] font-black text-stone-500 uppercase tracking-widest flex items-center gap-1.5 mb-4 hover:text-white transition-colors">
            <ArrowLeft className="w-3 h-3" /> Panel Biota
          </Link>
          <h1 className="text-4xl font-black text-white italic uppercase italic">🌿 Tienda <span className="text-emerald-500">Biota</span></h1>
        </div>
        <div className="grid grid-cols-2 gap-2 bg-white/5 p-3 rounded-2xl border border-white/5">
          <div className="px-2 border-r border-white/5"><p className="text-[7px] font-black text-stone-600 uppercase">CELO</p><p className="text-xs font-black text-amber-500">{formatB(celoRes, 18)}</p></div>
          <div className="px-2"><p className="text-[7px] font-black text-stone-600 uppercase">G$</p><p className="text-xs font-black text-blue-500">{formatB(gdBal, 18)}</p></div>
          <div className="px-2 border-r border-white/5"><p className="text-[7px] font-black text-stone-600 uppercase">USDT</p><p className="text-xs font-black text-emerald-500">{formatB(usdtBal, 6)}</p></div>
          <div className="px-2"><p className="text-[7px] font-black text-stone-600 uppercase">USDC</p><p className="text-xs font-black text-sky-500">{formatB(usdcBal, 6)}</p></div>
        </div>
      </div>

      <Card className="bg-white/5 border-white/10 rounded-2xl overflow-hidden">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500"><CircleDollarSign size={20} /></div>
            <div><h2 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Divisa de Pago</h2><p className="text-[9px] text-stone-600 font-bold">Celo Mainnet (42220)</p></div>
          </div>
          <CurrencySelector value={currency} onChange={setCurrency} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {PRODUCTS.map((p) => <ProductCard key={p.id} product={p} currency={currency} onBuy={handleBuy} isBuying={buyingId === p.id} />)}
      </div>
    </div>
  );
}
