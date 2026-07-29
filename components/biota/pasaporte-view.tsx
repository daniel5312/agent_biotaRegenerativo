"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Coins,
  CircleDollarSign,
  CreditCard,
  ExternalLink,
  Camera,
  Droplets,
  TreePine,
  ShoppingCart,
  Loader2,
  Sparkles,
  Zap,
  Sprout,
  MapPin,
  ShieldCheck,
  AlertCircle,
  Wallet,
  Send,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useReadContracts,
  useBalance,
} from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { formatUnits } from "viem";
import { ADDRESSES, BIOTA_PASSPORT_ABI, ERC20_ABI } from "@/lib/contracts";
import { useBiotaPass } from "@/hooks/useBiotaPass";
import { useToast } from "@/hooks/use-toast";
import { PrestamosAave } from "@/components/biota/prestamos-aave";

export function PasaporteView() {
  const { address } = useAccount();
  const { authenticated } = usePrivy();
  const { mintPassport, isMinting, tokenId, estadoBiologico } = useBiotaPass();
  const { writeContractAsync } = useWriteContract();
  const { toast } = useToast();


  const [paymentMethod, setPaymentMethod] = useState<"G$" | "CELO">("CELO");
  const [activeTab, setActiveTab] = useState<"pasaporte" | "billetera">("pasaporte");
  const [nombreProductor, setNombreProductor] = useState("");
  const [telefono, setTelefono] = useState("");
  const [finca, setFinca] = useState("");
  const [vereda, setVereda] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [area, setArea] = useState(1000);
  const [medidaTipo, setMedidaTipo] = useState<"m2" | "ha">("m2");
  const [selectedActions, setSelectedActions] = useState<string[]>([]);

  const { data: celoRes } = useBalance({
    address: address as `0x${string}`,
    query: { enabled: !!address },
  });
  const { data: balancesRaw } = useReadContracts({
    contracts: [
      { address: ADDRESSES.G$, abi: ERC20_ABI, functionName: "balanceOf", args: address ? [address] : undefined },
      { address: ADDRESSES.CUSD, abi: ERC20_ABI, functionName: "balanceOf", args: address ? [address] : undefined },
      { address: ADDRESSES.USDT, abi: ERC20_ABI, functionName: "balanceOf", args: address ? [address] : undefined },
      { address: ADDRESSES.USDC, abi: ERC20_ABI, functionName: "balanceOf", args: address ? [address] : undefined },
      { address: ADDRESSES.COPM, abi: ERC20_ABI, functionName: "balanceOf", args: address ? [address] : undefined },
    ],
    query: { enabled: !!address }
  });

  const { data: passportRaw } = useReadContract({
    chainId: 42220,
    address: ADDRESSES.BIOTA_PASSPORT,
    abi: BIOTA_PASSPORT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const effectiveHasPassport = useMemo(() => {
    if (typeof window !== "undefined" && localStorage.getItem('BIOTA_DEBUG') === 'true') {
      return true; // Bypass visual para pruebas de Playwright
    }
    return !!tokenId || (passportRaw ? BigInt(passportRaw.toString()) > 0n : false);
  }, [passportRaw, tokenId]);

  const celoBalanceNum = celoRes ? Number(formatUnits(celoRes.value, 18)) : 0;
  const gdBalanceNum = balancesRaw?.[0]?.status === "success" ? Number(formatUnits(balancesRaw[0].result as bigint, 18)) : 0;
  const cusdBalanceNum = balancesRaw?.[1]?.status === "success" ? Number(formatUnits(balancesRaw[1].result as bigint, 18)) : 0;
  const usdtBalanceNum = balancesRaw?.[2]?.status === "success" ? Number(formatUnits(balancesRaw[2].result as bigint, 6)) : 0;
  const usdcBalanceNum = balancesRaw?.[3]?.status === "success" ? Number(formatUnits(balancesRaw[3].result as bigint, 6)) : 0;
  const copmBalanceNum = balancesRaw?.[4]?.status === "success" ? Number(formatUnits(balancesRaw[4].result as bigint, 18)) : 0;

  const totalUsdEstimated = 
    (celoBalanceNum * 0.60) + 
    (gdBalanceNum * 0.00003) + 
    cusdBalanceNum + 
    usdtBalanceNum + 
    usdcBalanceNum + 
    (copmBalanceNum * 0.00024);

  const toggleAction = (id: string) =>
    setSelectedActions((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );

  const [isFauceting, setIsFauceting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("biota_farm_data");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.nombreProductor) setNombreProductor(data.nombreProductor);
        if (data.telefono) setTelefono(data.telefono);
        if (data.finca) setFinca(data.finca);
        if (data.vereda) setVereda(data.vereda);
        if (data.municipio) setMunicipio(data.municipio);
        if (data.area) setArea(data.area);
        if (data.medidaTipo) setMedidaTipo(data.medidaTipo);
      } catch(e) {}
    }
    setIsLoaded(true);
  }, []);

  // Auto-guardado en cada cambio para evitar pérdida de datos si navegan manualmente
  useEffect(() => {
    if (!isLoaded) return;
    const farmData = {
      nombreProductor,
      telefono,
      finca,
      vereda,
      municipio,
      area,
      medidaTipo
    };
    localStorage.setItem("biota_farm_data", JSON.stringify(farmData));
  }, [nombreProductor, telefono, finca, vereda, municipio, area, medidaTipo, isLoaded]);

  const handleMintWithFaucet = async () => {
    try {
      // 1. Verificamos si tiene saldo CELO para el gas. Si tiene muy poco, le enviamos un Faucet automático.
      if (celoBalanceNum < 0.1) {
        setIsFauceting(true);
        // Aquí llamaremos al Webhook de Fondeo (Paso 2)
        const res = await fetch("/api/faucet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        });
        if (!res.ok) throw new Error("Fallo en el Fondeo automático");
        // Pausa breve para esperar que la tx de gas pase en la red
        await new Promise(r => setTimeout(r, 3000));
      }

      // 2. Ejecutar Minteo del Pasaporte
      const areaCalculada = medidaTipo === "ha" ? BigInt(area) * 10000n : BigInt(area);
      
      mintPassport({
        tokenURI: "ipfs://biota",
        ubicacionGeografica: finca,
        areaM2: areaCalculada,
        cmSueloRecuperado: 0n,
        estadoBiologico: "Iniciado",
        hashAnalisisLab: "0x",
        ingredientesHash: nombreProductor,
        metodosAgricolas: "Regenerativo",
      }, "CELO");
    } catch (err) {
      console.error("Error en minteo patrocinado:", err);
    } finally {
      setIsFauceting(false);
    }
  };

  const handleSaveAndStart = async () => {
    if (!finca || !nombreProductor) {
      toast({ title: "Datos Incompletos", description: "Por favor llena al menos el nombre de la Finca y el Productor.", variant: "destructive" });
      return;
    }

    const farmData = {
      nombreProductor,
      telefono,
      finca,
      vereda,
      municipio,
      area,
      medidaTipo
    };
    localStorage.setItem("biota_farm_data", JSON.stringify(farmData));
    localStorage.setItem("biota_onboarding_step", "1"); 
    
    if (!address) {
      toast({ title: "Conecta tu billetera", description: "Necesitas tu billetera para recibir el Sello de Entrada.", variant: "destructive" });
      return;
    }

    if (!tokenId) {
      // Mintear el Sello de Entrada
      const areaCalculada = medidaTipo === "ha" ? BigInt(area) * 10000n : BigInt(area);
      await mintPassport({
        tokenURI: "ipfs://biota",
        ubicacionGeografica: finca,
        areaM2: areaCalculada,
        cmSueloRecuperado: 0n,
        estadoBiologico: "Iniciado",
        hashAnalisisLab: "0x",
        ingredientesHash: nombreProductor,
        metodosAgricolas: "Regenerativo",
      }, paymentMethod);
      // Nota: La redirección a 'asesoria' ocurrirá automáticamente en useBiotaPass.ts cuando se confirme el minteo on-chain
    } else {
      // Si ya tiene pasaporte, simplemente avanza
      window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'asesoria' }));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 pb-20">
      {!effectiveHasPassport ? (
        // === VISTA PRE-MINTEO (FORMULARIO) ===
        <div className="space-y-6 animate-in fade-in duration-500">
          <h1 className="text-4xl font-black text-white italic uppercase">
            Registro Biota
          </h1>
          <Card className="bg-white/5 border-white/10 p-8 rounded-3xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-stone-500">Nombre Productor</label>
                <Input onChange={(e) => setNombreProductor(e.target.value)} value={nombreProductor} className="bg-black/40 border-white/10 h-12 rounded-2xl" placeholder="Ej. Juan Pérez" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-stone-500">Teléfono</label>
                <Input onChange={(e) => setTelefono(e.target.value)} value={telefono} className="bg-black/40 border-white/10 h-12 rounded-2xl" placeholder="Ej. 310..." type="tel" />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black uppercase text-stone-500">Nombre del Predio (Finca)</label>
                <Input onChange={(e) => setFinca(e.target.value)} value={finca} className="bg-black/40 border-white/10 h-12 rounded-2xl" placeholder="Ej. El Edén" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-stone-500">Municipio - Vereda</label>
                <Input onChange={(e) => setMunicipio(e.target.value)} value={municipio} className="bg-black/40 border-white/10 h-12 rounded-2xl" placeholder="Ej. Marinilla - La Peña" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-stone-500">Medida</label>
                <div className="flex gap-2">
                  <Input onChange={(e) => setArea(Number(e.target.value))} value={area} className="bg-black/40 border-white/10 h-12 rounded-2xl flex-1" type="number" placeholder="Ej. 50" />
                  <select value={medidaTipo} onChange={(e) => setMedidaTipo(e.target.value as "m2" | "ha")} className="bg-black/40 border-white/10 h-12 rounded-2xl text-white px-3 outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="m2">m²</option>
                    <option value="ha">Ha</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <Button
                onClick={handleSaveAndStart}
                disabled={!finca || !nombreProductor || !telefono || isMinting}
                className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
              >
                {isMinting ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creando Sello...</>
                ) : (
                  <><Sparkles className="w-5 h-5 mr-2" /> Obtener Sello de Entrada</>
                )}
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        // === VISTA POST-MINTEO (DASHBOARD) ===
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-black text-white italic uppercase">
              Mi Finca
            </h1>
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
              <button 
                onClick={() => setActiveTab("pasaporte")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === "pasaporte" ? "bg-emerald-500 text-black shadow-lg" : "text-stone-400 hover:text-white"}`}
              >
                Pasaporte
              </button>
              <button 
                onClick={() => setActiveTab("billetera")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === "billetera" ? "bg-emerald-500 text-black shadow-lg" : "text-stone-400 hover:text-white"}`}
              >
                Billetera
              </button>
            </div>
          </div>

          {activeTab === "pasaporte" ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* 1. IDENTIDAD Y NFT */}
          <Card className="glass-card bg-emerald-500/5 border-emerald-500/20 p-6 rounded-3xl">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-emerald-500/30 relative shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <img 
                    src="/logo.png" 
                    alt="NFT Pasaporte" 
                    className="w-full h-full object-cover"
                    onError={(e) => (e.target as HTMLImageElement).src = "https://teal-tired-jay-275.mypinata.cloud/ipfs/QmeFhX3XG7U2mD5R4fRj4vR8e8kE3W7P4yJ3N2mE8T8b5K"}
                  />
                  <div className="absolute bottom-0 left-0 w-full bg-black/60 backdrop-blur-sm text-[10px] text-center font-mono py-1 text-emerald-400">
                    ID #{tokenId ? tokenId.toString() : "001"}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-stone-500 uppercase flex items-center gap-1 mb-1">
                    Productor <CheckCircle2 size={12} className="text-emerald-500" />
                  </p>
                  <p className="text-2xl font-black text-white font-mono leading-none">
                    {nombreProductor || "Verificado"}
                  </p>
                  <p className="text-sm text-emerald-400 mt-2 font-mono flex items-center gap-1">
                    <MapPin size={12} /> {finca || "Finca Biota"}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {municipio && <Badge className="bg-white/10 text-stone-300 border-none font-mono text-[9px]">{municipio}</Badge>}
                    {vereda && <Badge className="bg-white/10 text-stone-300 border-none font-mono text-[9px]">{vereda}</Badge>}
                    {area > 0 && <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-mono text-[9px]">{area} {medidaTipo}</Badge>}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 2. PROGRESO REGENERATIVO (SELLOS) */}
          <Card className="bg-white/5 border-white/10 p-6 rounded-3xl space-y-4">
            <h3 className="text-xs font-black uppercase text-emerald-500 flex items-center gap-2">
              <Sprout className="w-4 h-4" /> Progreso Regenerativo
            </h3>
            
            <div className="relative pt-4 pb-2">
              <div className="absolute top-10 left-[10%] right-[10%] h-1 bg-stone-800 rounded-full z-0" />
              <div className="absolute top-10 left-[10%] w-[30%] h-1 bg-emerald-500 rounded-full z-0 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />

              <div className="grid grid-cols-4 gap-2 relative z-10">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 border-black ${estadoBiologico === "Iniciado" || estadoBiologico === "Transición" || estadoBiologico === "Sostenibilidad" || estadoBiologico === "Certificación" ? "bg-emerald-500 shadow-lg shadow-emerald-500/40" : "bg-emerald-500"}`}>
                    <span className="text-black font-black text-lg">1</span>
                  </div>
                  <span className="text-[9px] font-black uppercase text-emerald-500">Iniciación</span>
                  <span className="text-[8px] text-stone-400">Sello de Entrada</span>
                </div>
                
                <div className="flex flex-col items-center text-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${estadoBiologico === "Transición" || estadoBiologico === "Sostenibilidad" || estadoBiologico === "Certificación" ? "bg-emerald-500 text-black border-black shadow-lg shadow-emerald-500/40" : "bg-stone-800 text-stone-400 border-stone-700 opacity-60"}`}>
                    <span className="font-black text-lg">2</span>
                  </div>
                  <span className={`text-[9px] font-black uppercase ${estadoBiologico === "Transición" || estadoBiologico === "Sostenibilidad" || estadoBiologico === "Certificación" ? "text-emerald-500" : "text-stone-500"}`}>Transición</span>
                  <span className="text-[8px] text-stone-600">En proceso...</span>
                </div>

                <div className="flex flex-col items-center text-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${estadoBiologico === "Sostenibilidad" || estadoBiologico === "Certificación" ? "bg-emerald-500 text-black border-black shadow-lg shadow-emerald-500/40" : "bg-stone-800 text-stone-400 border-stone-700 opacity-40"}`}>
                    <span className="font-black text-lg">3</span>
                  </div>
                  <span className={`text-[9px] font-black uppercase ${estadoBiologico === "Sostenibilidad" || estadoBiologico === "Certificación" ? "text-emerald-500" : "text-stone-600"}`}>Sostenibilidad</span>
                </div>

                <div className="flex flex-col items-center text-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${estadoBiologico === "Certificación" ? "bg-emerald-500 text-black border-black shadow-lg shadow-emerald-500/40" : "bg-stone-800 text-stone-400 border-stone-700 opacity-40"}`}>
                    <span className="font-black text-lg">4</span>
                  </div>
                  <span className={`text-[9px] font-black uppercase ${estadoBiologico === "Certificación" ? "text-emerald-500" : "text-stone-600"}`}>Certificación Total</span>
                </div>
              </div>
            </div>

            <Button 
              className="w-full bg-stone-800 hover:bg-stone-700 text-white font-black h-12 rounded-2xl flex items-center justify-center gap-2 mt-4"
              onClick={() => window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'asesoria' }))}
            >
              <Sparkles className="w-4 h-4 text-emerald-500" /> Ir al Diagnóstico para Avanzar
            </Button>
          </Card>

          {/* 3. FINANZAS / PATROCINIO (SPONSOR - AAVE) - Siempre visible en Pasaporte */}
          <div className="pt-2">
            <PrestamosAave />
          </div>
        </div>
      ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* SALDOS (NUEVO DISEÑO CON ESTIMADO USD) */}
              <div className="bg-black/20 rounded-3xl p-6 border border-white/5 space-y-4">
                <div className="flex flex-col items-center justify-center space-y-1">
                  <p className="text-[10px] uppercase font-black text-stone-400">Patrimonio Total Estimado</p>
                  <h2 className="text-4xl font-black font-mono text-emerald-400">
                    ${totalUsdEstimated.toFixed(2)} <span className="text-sm text-stone-500">USD</span>
                  </h2>
                </div>
                
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/5">
                  <div className="glass-card bg-emerald-500/5 border-emerald-500/20 p-2 rounded-2xl flex flex-col items-center text-center">
                    <p className="text-[9px] uppercase font-black text-stone-400">CELO</p>
                    <p className="text-xs font-mono font-black text-emerald-400">{celoBalanceNum.toFixed(2)}</p>
                  </div>
                  <div className="glass-card bg-emerald-500/5 border-emerald-500/20 p-2 rounded-2xl flex flex-col items-center text-center">
                    <p className="text-[9px] uppercase font-black text-stone-400">cUSD</p>
                    <p className="text-xs font-mono font-black text-emerald-400">{cusdBalanceNum.toFixed(2)}</p>
                  </div>
                  <div className="glass-card bg-emerald-500/5 border-emerald-500/20 p-2 rounded-2xl flex flex-col items-center text-center">
                    <p className="text-[9px] uppercase font-black text-stone-400">COPm</p>
                    <p className="text-xs font-mono font-black text-emerald-400">{copmBalanceNum.toFixed(0)}</p>
                  </div>
                  <div className="glass-card bg-emerald-500/5 border-emerald-500/20 p-2 rounded-2xl flex flex-col items-center text-center">
                    <p className="text-[9px] uppercase font-black text-stone-400">USDT</p>
                    <p className="text-xs font-mono font-black text-emerald-400">{usdtBalanceNum.toFixed(2)}</p>
                  </div>
                  <div className="glass-card bg-emerald-500/5 border-emerald-500/20 p-2 rounded-2xl flex flex-col items-center text-center">
                    <p className="text-[9px] uppercase font-black text-stone-400">USDC</p>
                    <p className="text-xs font-mono font-black text-emerald-400">{usdcBalanceNum.toFixed(2)}</p>
                  </div>
                  <div className="glass-card bg-emerald-500/5 border-emerald-500/20 p-2 rounded-2xl flex flex-col items-center text-center">
                    <p className="text-[9px] uppercase font-black text-stone-400">G$</p>
                    <p className="text-xs font-mono font-black text-emerald-400">{gdBalanceNum.toFixed(0)}</p>
                  </div>
                </div>
              </div>

              {/* 3. FINANZAS / PATROCINIO (SPONSOR - AAVE) */}
              <div className="pt-2">
                <PrestamosAave />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
