"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  TreePine,
  Loader2,
  Sparkles,
  Zap,
  Sprout,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Clock,
  Copy,
  Plus
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  useAccount,
  useWriteContract,
  useReadContract,
} from "wagmi";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { supabase } from "@/lib/supabase";
import { ADDRESSES, BIOTA_PASSPORT_ABI } from "@/lib/contracts";
import { useBiotaPass } from "@/hooks/useBiotaPass";
import { useToast } from "@/hooks/use-toast";
import { useGoodDollarIdentity } from "@/hooks/useGoodDollarIdentity";
import { useUBIClaim } from "@/hooks/useUBIClaim";
import { useUbiFlow } from "@/context/UbiFlowContext";
import { StreamingBalance } from "./StreamingBalance";
import { IdentityAction } from "./IdentityAction";
import { useSuperfluidStream } from "@/hooks/useSuperfluidStream";
import { useMultiTokenBalances } from "@/hooks/useMultiTokenBalances";

export function PasaporteView() {
  const { address } = useAccount();
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { mintPassport, isMinting, tokenId, estadoBiologico } = useBiotaPass();
  const { toast } = useToast();

  const primaryAddress = (user?.wallet?.address || address) as `0x${string}`;
  const identity = useGoodDollarIdentity(primaryAddress);

  const { ubiAddress, ubiProvider, disconnectUBI } = useUbiFlow();
  const stream = useSuperfluidStream(ubiAddress || primaryAddress);
  const { balances: ubiBalances } = useMultiTokenBalances(ubiAddress || undefined);

  // Hook UBI
  const {
    entitlementFormatted,
    canClaim,
    isLoading: loadingClaim,
    refetchEntitlement,
  } = useUBIClaim(
    ubiAddress || (identity.whitelistedRoot as `0x${string}`),
    identity.whitelistedRoot
  );

  const [paymentMethod, setPaymentMethod] = useState<"G$" | "CELO">("CELO");
  const [nombreProductor, setNombreProductor] = useState("");
  const [telefono, setTelefono] = useState("");
  const [finca, setFinca] = useState("");
  const [vereda, setVereda] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [area, setArea] = useState(1000);
  const [medidaTipo, setMedidaTipo] = useState<"m2" | "ha">("m2");

  const [isAutoClaimEnabled, setIsAutoClaimEnabled] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const { data: passportRaw } = useReadContract({
    chainId: 42220,
    address: ADDRESSES.BIOTA_PASSPORT,
    abi: BIOTA_PASSPORT_ABI,
    functionName: "balanceOf",
    args: primaryAddress ? [primaryAddress] : undefined,
    query: { enabled: !!primaryAddress },
  });

  const effectiveHasPassport = useMemo(() => {
    if (typeof window !== "undefined" && localStorage.getItem('BIOTA_DEBUG') === 'true') return true;
    return !!tokenId || (passportRaw ? BigInt(passportRaw.toString()) > 0n : false);
  }, [passportRaw, tokenId]);

  useEffect(() => {
    const stored = localStorage.getItem("biota_farm_data");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.nombreProductor) setNombreProductor(data.nombreProductor);
        if (data.finca) setFinca(data.finca);
        if (data.municipio) setMunicipio(data.municipio);
        if (data.area) setArea(data.area);
        if (data.medidaTipo) setMedidaTipo(data.medidaTipo);
      } catch(e) {}
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && primaryAddress) {
      const stored = localStorage.getItem(`biota_autoclaim_${primaryAddress.toLowerCase()}`);
      if (stored === 'true') setIsAutoClaimEnabled(true);
    }
  }, [primaryAddress]);

  useEffect(() => {
    if (!isLoaded) return;
    const farmData = { nombreProductor, telefono, finca, vereda, municipio, area, medidaTipo };
    localStorage.setItem("biota_farm_data", JSON.stringify(farmData));
  }, [nombreProductor, telefono, finca, vereda, municipio, area, medidaTipo, isLoaded]);

  // Contador de Claim UBI
  useEffect(() => {
    if (!canClaim) {
      const getMs = () => {
        const now = new Date();
        const nextCycle = new Date(now);
        nextCycle.setUTCHours(12, 0, 0, 0);
        if (now.getTime() >= nextCycle.getTime()) nextCycle.setUTCDate(nextCycle.getUTCDate() + 1);
        return nextCycle.getTime() - now.getTime();
      };
      setTimeLeft(getMs());
      const interval = setInterval(() => {
        const remaining = getMs();
        if (remaining <= 0) refetchEntitlement();
        setTimeLeft(remaining);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [canClaim, refetchEntitlement]);

  const handleClaimUBI = useCallback(async () => {
    if (!ubiAddress || !ubiProvider) {
      toast({ title: "❌ GoodWallet no conectada", variant: "destructive" });
      return;
    }
    
    try {
      setIsClaiming(true);
      toast({ title: "🌱 Reclamando UBI...", description: "Firma en tu GoodWallet." });
      const txHash = await ubiProvider.request({
        method: "eth_sendTransaction",
        params: [{
          from: ubiAddress,
          to: "0x43d72Ff17701B2DA814620735C39C620Ce0ea4A1",
          data: "0x4e71d92d",
          chainId: "0xa4ec",
        }],
      });
      toast({ title: "🎉 Reclamo Confirmado", description: "En minutos se reflejarán tus tokens." });
      setTimeout(() => refetchEntitlement(), 5000);
    } catch (error: any) {
      toast({ title: "❌ Error", description: error.message, variant: "destructive" });
    } finally {
      setIsClaiming(false);
    }
  }, [ubiAddress, ubiProvider, refetchEntitlement, toast]);

  const handleSaveAndStart = async () => {
    if (!finca || !nombreProductor) {
      toast({ title: "Datos Incompletos", variant: "destructive" });
      return;
    }
    if (!tokenId) {
      const areaCalculada = medidaTipo === "ha" ? BigInt(area) * 10000n : BigInt(area);
      await mintPassport({
        tokenURI: "ipfs://biota", ubicacionGeografica: finca,
        areaM2: areaCalculada, cmSueloRecuperado: 0n, estadoBiologico: "Iniciado",
        hashAnalisisLab: "0x", ingredientesHash: nombreProductor, metodosAgricolas: "Regenerativo",
      }, paymentMethod);
    } else {
      window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'asesoria' }));
    }
  };

  const handleToggleAutoClaim = async (enabled: boolean) => {
    try {
      const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');
      if (enabled && embeddedWallet) {
        toast({ title: "⏳ Autorizando Agente..." });
        
        // Simulación de interacción privy signers para TEE request:
        const { error } = await supabase.from('ubi_subscriptions').upsert({ wallet_address: embeddedWallet.address, is_active: true });
        
        if (!error) {
          localStorage.setItem(`biota_autoclaim_${embeddedWallet.address.toLowerCase()}`, 'true');
          setIsAutoClaimEnabled(true);
          toast({ title: "✅ Automatización Lista", description: "El Agente reclamará diario por ti." });
        }
      } else if (!enabled) {
        if (embeddedWallet) {
          await supabase.from('ubi_subscriptions').upsert({ wallet_address: embeddedWallet.address, is_active: false });
          localStorage.removeItem(`biota_autoclaim_${embeddedWallet.address.toLowerCase()}`);
        }
        setIsAutoClaimEnabled(false);
        toast({ title: "🛑 Automatización Detenida" });
      }
    } catch (e: any) {
      setIsAutoClaimEnabled(!enabled);
    }
  };

  const formatHoursMinutes = (ms: number) => {
    if (ms <= 0) return "¡Ciclo Listo!";
    const totalMins = Math.floor(ms / 60000);
    const hrs = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${hrs}h ${m}m restantes`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 pb-24">
      
      {!effectiveHasPassport ? (
        // === VISTA FORMULARIO ===
        <div className="space-y-6 animate-in fade-in duration-500">
          <h1 className="text-4xl font-black text-white italic uppercase">Registro Biota</h1>
          <Card className="bg-white/5 border-white/10 p-8 rounded-3xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1"><label className="text-[10px] font-black uppercase text-stone-500">Nombre Productor</label><Input onChange={(e) => setNombreProductor(e.target.value)} value={nombreProductor} className="bg-black/40 border-white/10 h-12 rounded-2xl" placeholder="Ej. Juan Pérez" /></div>
              <div className="md:col-span-2 space-y-1"><label className="text-[10px] font-black uppercase text-stone-500">Nombre de Finca</label><Input onChange={(e) => setFinca(e.target.value)} value={finca} className="bg-black/40 border-white/10 h-12 rounded-2xl" placeholder="Ej. El Edén" /></div>
              <div className="space-y-1"><label className="text-[10px] font-black uppercase text-stone-500">Municipio</label><Input onChange={(e) => setMunicipio(e.target.value)} value={municipio} className="bg-black/40 border-white/10 h-12 rounded-2xl" placeholder="Ej. Marinilla - La Peña" /></div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-stone-500">Medida</label>
                <div className="flex gap-2">
                  <Input onChange={(e) => setArea(Number(e.target.value))} value={area} className="bg-black/40 border-white/10 h-12 rounded-2xl flex-1" type="number" />
                  <select value={medidaTipo} onChange={(e) => setMedidaTipo(e.target.value as "m2" | "ha")} className="bg-black/40 border-white/10 h-12 rounded-2xl text-white px-3 outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="m2">m²</option><option value="ha">Ha</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-white/5">
              <Button onClick={handleSaveAndStart} disabled={!finca || !nombreProductor || isMinting} className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase rounded-2xl transition-all shadow-lg shadow-emerald-500/20">
                {isMinting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creando Sello...</> : <><Sparkles className="w-5 h-5 mr-2" /> Obtener Sello de Entrada</>}
              </Button>
            </div>
          </Card>
        </div>
      ) : (

        // === VISTA POST-MINTEO ===
        <div className="space-y-6 animate-in fade-in duration-500">
          <h1 className="text-4xl font-black text-white italic uppercase">Mi Perfil</h1>

          {/* 1. IDENTIDAD Y NFT PASAPORTE */}
          <Card className="glass-card bg-emerald-500/5 border-emerald-500/20 p-6 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <Badge variant="outline" className="border-emerald-500 text-emerald-400 bg-emerald-950/50 uppercase tracking-widest text-[9px] font-black shadow-[0_0_10px_rgba(16,185,129,0.2)]">NFT Activo</Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-emerald-500/30 relative shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <img src="/logo.png" alt="Pasaporte" className="w-full h-full object-cover" onError={(e) => (e.target as HTMLImageElement).src = "https://teal-tired-jay-275.mypinata.cloud/ipfs/QmeFhX3XG7U2mD5R4fRj4vR8e8kE3W7P4yJ3N2mE8T8b5K"} />
                <div className="absolute bottom-0 left-0 w-full bg-black/60 text-[10px] text-center font-mono py-1 text-emerald-400">
                  ID #{tokenId ? tokenId.toString() : "001"}
                </div>
              </div>
              <div className="flex-1 mt-3">
                <p className="text-xs font-black text-stone-500 uppercase flex items-center gap-1 mb-1">
                  Productor <CheckCircle2 size={12} className="text-emerald-500" />
                </p>
                <p className="text-2xl font-black text-white font-mono leading-none">{nombreProductor || "Verificado"}</p>
                <p className="text-sm text-emerald-400 mt-2 font-mono flex items-center gap-1"><MapPin size={12} /> {finca || "Finca Biota"}</p>
              </div>
            </div>
          </Card>

          {/* 2. UBI Y GOTEO (Componente Idéntico al Principal) */}
          <div className="w-full">
            <IdentityAction tokenId={tokenId ? BigInt(tokenId) : undefined} />
          </div>

          {/* 3. CERTIFICACIONES (NFTs Hijos) */}
          <section className="space-y-4 pt-4">
            <div className="flex justify-between items-end">
              <h3 className="text-xl font-black text-white uppercase italic">Certificaciones</h3>
              <span className="bg-stone-800 text-stone-400 px-2 py-0.5 rounded text-[9px] uppercase font-bold">NFTs de Impacto</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl p-4 flex flex-col items-center text-center gap-2">
                 <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center"><CheckCircle2 className="text-emerald-400" /></div>
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Sello Biota Inicial</h4>
                 <p className="text-[9px] text-stone-400 font-medium leading-tight">Otorgado al crear tu perfil forestal.</p>
              </div>

              {[
                { name: "Transición", locked: estadoBiologico !== "Transición" && estadoBiologico !== "Sostenibilidad" && estadoBiologico !== "Certificación" },
                { name: "Sostenible", locked: estadoBiologico !== "Sostenibilidad" && estadoBiologico !== "Certificación" },
                { name: "Orgánico Dmrv", locked: estadoBiologico !== "Certificación" },
              ].map((cert) => (
                <div key={cert.name} className={`border-2 rounded-2xl p-4 flex flex-col items-center text-center gap-2 ${cert.locked ? 'bg-stone-900/50 border-stone-800' : 'bg-green-500/10 border-green-500/30'}`}>
                   <div className={`w-12 h-12 rounded-full flex items-center justify-center ${cert.locked ? 'bg-stone-800 text-stone-600' : 'bg-green-500/20 text-green-400'}`}>
                     {cert.locked ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                   </div>
                   <h4 className={`text-[10px] font-black uppercase tracking-widest ${cert.locked ? 'text-stone-500' : 'text-green-400'}`}>{cert.name}</h4>
                   {cert.locked && <span className="text-[8px] bg-stone-800 text-stone-400 px-2 py-0.5 rounded-full">Bloqueado</span>}
                </div>
              ))}
            </div>

            <Button 
               onClick={() => window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'impacto' }))}
               className="w-full mt-2 h-14 bg-stone-800 hover:bg-stone-700 text-white shadow-lg border-t border-stone-700 rounded-2xl font-black uppercase tracking-widest"
            >
               <Plus className="mr-2" size={16} /> Aplicar a Certificaciones DMRV
            </Button>
          </section>

        </div>
      )}
    </div>
  );
}
