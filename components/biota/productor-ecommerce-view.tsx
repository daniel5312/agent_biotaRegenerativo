"use client";

import { useState, useEffect } from "react";
import {
  HeartHandshake,
  MapPin,
  Sprout,
  ShieldCheck,
  Coins,
  Zap,
  Sparkles,
  Wallet,
  Loader2,
  TreePine,
  Droplets,
  ExternalLink
} from "lucide-react";
import {
  useConnection,
  useWriteContract,
  useSendTransaction,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  ADDRESSES,
  ERC20_ABI,
  BIOTA_SPLITTER_ABI,
} from "@/lib/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { parseUnits } from "viem";
import { useToast } from "@/hooks/use-toast";

const DEMO_PRODUCERS = [
  {
    id: 1,
    tokenId: "8004",
    name: "Arturo Gómez",
    finca: "La Nube",
    municipio: "Pitalito",
    vereda: "El Cedro",
    area: 5000,
    tipoCultivo: "Café Especial",
    estadoBiologico: "Transición Orgánica",
    avatarColor: "from-emerald-500 to-green-700",
    verified: true,
    wallet: "0x6178B5B1447B2E48E0283cd19f0D8eEF2e7C8C1E",
    impactScore: 92,
    image: "https://images.unsplash.com/photo-1595858386121-50e5015e1281?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  },
  {
    id: 2,
    tokenId: "8005",
    name: "María López",
    finca: "El Edén",
    municipio: "San Agustín",
    vereda: "Las Piedras",
    area: 12000,
    tipoCultivo: "Cacao y Plátano",
    estadoBiologico: "Agroecológico",
    avatarColor: "from-amber-500 to-orange-700",
    verified: true,
    wallet: "0xD9c10131d92f50335569a48A4b58d74f1865Da01",
    impactScore: 88,
    image: "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  },
  {
    id: 3,
    tokenId: "8006",
    name: "Carlos Rivera",
    finca: "Brisas del Río",
    municipio: "Garzón",
    vereda: "San Miguel",
    area: 8000,
    tipoCultivo: "Frutales",
    estadoBiologico: "Convencional",
    avatarColor: "from-blue-500 to-indigo-700",
    verified: false,
    wallet: "0x211ee91C9c02945f9E3e69465185BbfED64AeF64",
    impactScore: 65,
    image: "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  },
  {
    id: 4,
    tokenId: "8007",
    name: "Elena Suárez",
    finca: "La Esperanza",
    municipio: "Neiva",
    vereda: "Río Blanco",
    area: 15000,
    tipoCultivo: "Hortalizas",
    estadoBiologico: "Orgánico Certificado",
    avatarColor: "from-purple-500 to-fuchsia-700",
    verified: true,
    wallet: "0x9bc43f955ce11948e4fD6EAC28d46875Fba9f5F9",
    impactScore: 98,
    image: "https://images.unsplash.com/photo-1592419044706-39796d40f98c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  }
];

const CURRENCIES = [
  { id: "cUSD", label: "cUSD", icon: Coins, color: "text-emerald-500", decimals: 18 },
  { id: "CELO", label: "CELO", icon: Zap, color: "text-yellow-500", decimals: 18 },
  { id: "G$", label: "G$", icon: Sparkles, color: "text-blue-500", decimals: 18 },
  { id: "USDT", label: "USDT", icon: ShieldCheck, color: "text-green-600", decimals: 6 },
  { id: "COPM", label: "COPM", icon: Wallet, color: "text-purple-500", decimals: 18 },
];

export function ProductorEcommerceView() {
  const { address } = useConnection();
  const { toast } = useToast();
  
  const [selectedCurrency, setSelectedCurrency] = useState("G$");
  const [supportAmount, setSupportAmount] = useState("");
  const [fundingTarget, setFundingTarget] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Wagmi Hooks para pagos
  const { mutate: writeSplitter, isPending: isTokenPaying, data: payHash } = useWriteContract();
  const { sendTransaction, isPending: isNativePaying, data: nativeHash } = useSendTransaction();
  const { mutate: writeApprove, isPending: isApprovePending, data: approveHash } = useWriteContract();

  const { isLoading: isConfirmingApprove, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isConfirmingPay, isSuccess: isPaySuccess } = useWaitForTransactionReceipt({ hash: payHash || nativeHash });

  // Configuración de Token Actual
  const currentCurrencyConfig = CURRENCIES.find(c => c.id === selectedCurrency)!;
  const tokenAddress = selectedCurrency === "CELO" ? undefined : (ADDRESSES[selectedCurrency as keyof typeof ADDRESSES] as `0x${string}`);
  
  const amountToFund = parseUnits(supportAmount === "" ? "0" : supportAmount, currentCurrencyConfig.decimals);

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && tokenAddress ? [address, ADDRESSES.BIOTA_SPLITTER] : undefined,
    query: { enabled: !!address && !!tokenAddress },
  });

  useEffect(() => {
    if (isApproveSuccess) refetchAllowance();
  }, [isApproveSuccess, refetchAllowance]);

  useEffect(() => {
    if (isPaySuccess) {
      toast({
        title: "¡Apoyo enviado!",
        description: `Has inyectado liquidez al productor exitosamente.`,
      });
      setIsModalOpen(false); // Cerrar modal al éxito
      setSupportAmount("");
    }
  }, [isPaySuccess, toast]);

  const needsApproval = selectedCurrency !== "CELO" && (!allowance || (allowance as bigint) < amountToFund);
  const isTransacting = isTokenPaying || isNativePaying || isApprovePending || isConfirmingApprove || isConfirmingPay;

  const handleSupport = () => {
    if (!address) {
      toast({ title: "Billetera no conectada", variant: "destructive" });
      return;
    }
    
    if (parseFloat(supportAmount) <= 0) {
      toast({ title: "Ingresa un monto válido", variant: "destructive" });
      return;
    }

    if (needsApproval && tokenAddress) {
      writeApprove({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [ADDRESSES.BIOTA_SPLITTER, amountToFund * 10n],
      });
      return;
    }

    executePayment();
  };

  const executePayment = () => {
    if (selectedCurrency === "CELO") {
      sendTransaction({
        to: ADDRESSES.BIOTA_SCROW as `0x${string}`,
        value: amountToFund,
      });
    } else {
      writeSplitter({
        address: ADDRESSES.BIOTA_SPLITTER as `0x${string}`,
        abi: BIOTA_SPLITTER_ABI,
        functionName: "payWithSplit",
        args: [
          tokenAddress as `0x${string}`,
          amountToFund,
          ADDRESSES.DAPP_BIOTA as `0x${string}`,
          ADDRESSES.COLLECTIVE_MUJERES as `0x${string}`,
          ADDRESSES.BIOTA_SCROW as `0x${string}`,
        ],
      });
    }
  };

  useEffect(() => {
    if (isApproveSuccess && fundingTarget && !needsApproval) {
      executePayment();
    }
  }, [isApproveSuccess, needsApproval]);

  return (
    <div className="px-4 py-4 space-y-4 mb-nav animate-in fade-in duration-500">
      {/* HEADER */}
      <div>
        <h1 className="text-xl font-bold text-emerald-950 dark:text-white flex items-center gap-2">
          <HeartHandshake className="w-6 h-6 text-emerald-600" />
          Productores ReFi
        </h1>
        <p className="text-[10px] text-emerald-700 dark:text-emerald-400/80 mt-1 font-semibold">
          Conecta directamente con agricultores regenerativos. Tu apoyo va a su bóveda inteligente.
        </p>
      </div>

      {/* SELECTOR MULTIMONEDA SUPERIOR */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CURRENCIES.map((curr) => (
          <button
            key={curr.id}
            onClick={() => setSelectedCurrency(curr.id)}
            className={`
              flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-xs font-bold
              ${
                selectedCurrency === curr.id
                  ? "bg-emerald-500 border-emerald-400 text-black shadow-md scale-105"
                  : "bg-white dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-600/30 text-emerald-800 dark:text-emerald-400"
              }
            `}
          >
            <curr.icon
              className={`w-3 h-3 ${selectedCurrency === curr.id ? "text-black" : curr.color}`}
            />
            {curr.label}
          </button>
        ))}
      </div>

      {/* GRID DE PRODUCTORES (TIPO E-COMMERCE) */}
      <div className="grid grid-cols-2 gap-3">
        {DEMO_PRODUCERS.map((producer, index) => (
          <Dialog key={producer.id} open={isModalOpen && fundingTarget === producer.id} onOpenChange={(open) => {
            setIsModalOpen(open);
            if (open) setFundingTarget(producer.id);
            else setFundingTarget(null);
          }}>
            <DialogTrigger asChild>
              <Card 
                className="glass-card overflow-hidden animate-slide-up group cursor-pointer hover:shadow-xl hover:border-emerald-400 transition-all bg-emerald-50/80 dark:bg-emerald-900/20"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-0">
                  <div className="h-28 relative overflow-hidden">
                    <img 
                      src={producer.image} 
                      alt={producer.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* Badge Verificado Flotante */}
                    {producer.verified && (
                      <Badge className="absolute top-2 right-2 bg-emerald-500 text-black border-0 text-[8px] px-1.5 py-0.5">
                        <ShieldCheck className="w-2.5 h-2.5 mr-0.5" /> Verificado
                      </Badge>
                    )}
                    
                    {/* Nombre y Ubicación sobre la imagen */}
                    <div className="absolute bottom-2 left-2 right-2">
                      <h3 className="text-white font-black text-sm leading-tight drop-shadow-md">
                        {producer.name}
                      </h3>
                      <p className="text-emerald-300 text-[9px] font-bold flex items-center gap-0.5 drop-shadow-md">
                        <MapPin className="w-2.5 h-2.5" /> {producer.finca}
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-1.5 py-0.5 rounded-sm">
                        Token #{producer.tokenId}
                      </span>
                      <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                        <Sprout className="w-2.5 h-2.5" /> Score: {producer.impactScore}
                      </span>
                    </div>
                    <Button 
                      size="sm"
                      className="w-full h-7 bg-emerald-100 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold group-hover:bg-emerald-500 group-hover:text-black transition-colors"
                    >
                      <HeartHandshake className="w-3 h-3 mr-1" /> Apoyar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>

            {/* MODAL (VENTANA DE DETALLE Y PAGO) */}
            <DialogContent className="max-w-[90vw] sm:max-w-md w-full rounded-3xl bg-[#f8fafc] dark:bg-[#0a0a0a] border-emerald-200 dark:border-emerald-800 p-0 overflow-hidden">
              {/* Header del Modal con Imagen */}
              <div className="h-40 relative">
                <img 
                  src={producer.image} 
                  alt={producer.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#f8fafc] dark:from-[#0a0a0a] via-black/40 to-black/20" />
                
                <div className="absolute top-4 right-4 flex gap-2">
                  <Badge className="bg-black/40 text-white backdrop-blur-md border-0 text-[10px] font-mono">
                    NFT #{producer.tokenId}
                  </Badge>
                </div>

                <div className="absolute bottom-4 left-4">
                  <DialogTitle className="text-2xl font-black text-emerald-950 dark:text-white drop-shadow-lg">
                    {producer.name}
                  </DialogTitle>
                  <p className="text-emerald-700 dark:text-emerald-400 text-sm font-bold flex items-center gap-1 drop-shadow-md">
                    <MapPin className="w-3.5 h-3.5" /> {producer.municipio} • {producer.vereda}
                  </p>
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Metadatos Enriquecidos */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                    <span className="block text-[10px] text-emerald-600 dark:text-emerald-400/80 uppercase font-black mb-1">
                      Área y Cultivo
                    </span>
                    <span className="text-sm font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-1.5 leading-tight">
                      <TreePine className="w-4 h-4 text-emerald-500" /> 
                      {producer.area} m²<br/>{producer.tipoCultivo}
                    </span>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                    <span className="block text-[10px] text-emerald-600 dark:text-emerald-400/80 uppercase font-black mb-1">
                      Estado Biológico
                    </span>
                    <span className="text-sm font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-1.5 leading-tight">
                      <Droplets className="w-4 h-4 text-blue-500" /> 
                      {producer.estadoBiologico}
                    </span>
                  </div>
                </div>

                {/* Info de Trazabilidad */}
                <div className="flex items-center justify-between px-3 py-2 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/50">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-[10px] font-black uppercase text-blue-800 dark:text-blue-400">Trazabilidad TBA</p>
                      <p className="text-[9px] font-mono text-blue-600/70 dark:text-blue-300/70">{producer.wallet.slice(0, 12)}...</p>
                    </div>
                  </div>
                  <a href={`https://celoscan.io/address/${producer.wallet}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="w-4 h-4 text-blue-500 hover:text-blue-700" />
                  </a>
                </div>

                {/* Zona de Fondeo */}
                <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-400">
                      Monto de Inversión
                    </label>
                    <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full text-emerald-700 dark:text-emerald-300">
                      Usando {selectedCurrency}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input 
                        type="number"
                        placeholder="Ej. 50"
                        value={supportAmount}
                        onChange={(e) => setSupportAmount(e.target.value)}
                        className="h-12 bg-white dark:bg-[#111] border-emerald-200 dark:border-emerald-800 rounded-xl text-lg font-mono pl-10"
                      />
                      <currentCurrencyConfig.icon className={`absolute left-3 top-3.5 w-5 h-5 ${currentCurrencyConfig.color}`} />
                    </div>
                    <Button 
                      onClick={handleSupport}
                      disabled={isTransacting}
                      className="h-12 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-[0_0_20px_rgba(5,150,105,0.4)] transition-all font-bold text-sm"
                    >
                      {isTransacting ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> ...</>
                      ) : needsApproval ? (
                        <><ShieldCheck className="w-5 h-5 mr-2" /> Aprobar</>
                      ) : (
                        <><Zap className="w-5 h-5 mr-2" /> Enviar</>
                      )}
                    </Button>
                  </div>
                  <p className="text-[9px] text-center text-slate-500 dark:text-slate-400 font-medium">
                    El 100% de esta transacción es inmutable y rastreable en Celo Network.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  );
}
