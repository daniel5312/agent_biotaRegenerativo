"use client";

import { useState, useMemo } from "react";
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
  useBalance,
} from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { formatUnits } from "viem";
import { ADDRESSES, BIOTA_PASSPORT_ABI, ERC20_ABI } from "@/lib/contracts";
import { useBiotaPass } from "@/hooks/useBiotaPass";
import { useToast } from "@/hooks/use-toast";
import { IdentityAction } from "@/components/biota/IdentityAction";

export function PasaporteView() {
  const { address } = useAccount();
  const { authenticated } = usePrivy();
  const { mintPassport, isMinting, tokenId } = useBiotaPass();
  const { writeContractAsync } = useWriteContract();

  const [activeTab, setActiveTab] = useState<"finca" | "wallet">("finca");
  const [paymentMethod, setPaymentMethod] = useState<"G$" | "CELO">("CELO");
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
  const { data: gdBalanceRaw } = useReadContract({
    chainId: 42220,
    address: ADDRESSES.G$,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  const { data: passportRaw } = useReadContract({
    chainId: 42220,
    address: ADDRESSES.BIOTA_PASSPORT,
    abi: BIOTA_PASSPORT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const effectiveHasPassport = useMemo(
    () => (passportRaw ? BigInt(passportRaw.toString()) > 0n : false),
    [passportRaw],
  );
  const gDollarBalance = gdBalanceRaw
    ? Number(formatUnits(BigInt(gdBalanceRaw.toString()), 18)).toFixed(0)
    : "0";
  const celoBalance = celoRes
    ? Number(formatUnits(celoRes.value, 18)).toFixed(2)
    : "0.00";

  const toggleAction = (id: string) =>
    setSelectedActions((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );

  const [isFauceting, setIsFauceting] = useState(false);

  const handleMintWithFaucet = async () => {
    try {
      // 1. Verificamos si tiene saldo CELO para el gas. Si tiene muy poco, le enviamos un Faucet automático.
      if (Number(celoBalance) < 0.1) {
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 pb-20">
      <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
        <button
          onClick={() => setActiveTab("finca")}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === "finca" ? "bg-emerald-500 text-black" : "text-stone-500"}`}
        >
          🚜 Mi Finca
        </button>
        <button
          onClick={() => setActiveTab("wallet")}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === "wallet" ? "bg-blue-600 text-white" : "text-stone-500"}`}
        >
          💰 Mi Billetera
        </button>
      </div>

      {activeTab === "finca" ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          <h1 className="text-4xl font-black text-white italic uppercase">
            {effectiveHasPassport ? "Mi Finca Biota" : "Registro Biota"}
          </h1>

          {effectiveHasPassport ? (
            <Card className="glass-card bg-emerald-500/5 border-emerald-500/20 p-6 rounded-3xl">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4 pb-4 border-b border-white/5">
                  {/* Imagen del NFT */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-emerald-500/30 relative shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <img 
                      src="/logo.png" 
                      alt="NFT Pasaporte Biota" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback si no existe logo.png
                        (e.target as HTMLImageElement).src = "https://teal-tired-jay-275.mypinata.cloud/ipfs/QmeFhX3XG7U2mD5R4fRj4vR8e8kE3W7P4yJ3N2mE8T8b5K"; 
                      }}
                    />
                    <div className="absolute bottom-0 left-0 w-full bg-black/60 backdrop-blur-sm text-[8px] text-center font-mono py-0.5 text-emerald-400">
                      ID #{tokenId ? tokenId.toString() : "001"}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-stone-500 uppercase flex items-center gap-1">
                      Pasaporte Activo <CheckCircle2 size={10} className="text-emerald-500" />
                    </p>
                    <p className="text-xl font-black text-white font-mono leading-none mt-1">
                      {finca || "Finca Biota"}
                    </p>
                    <p className="text-[9px] text-stone-400 mt-1 uppercase font-mono">
                      Productor: {nombreProductor || "Verificado"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-blue-600/10 p-2 rounded-2xl border border-blue-500/20">
                    <IdentityAction tokenId={tokenId ?? undefined} />
                  </div>
                  
                  <Button 
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black h-14 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                    onClick={() => window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'impacto' }))}
                  >
                    <Droplets className="w-6 h-6" /> Empezar Goteo (Superfluid)
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="bg-white/5 border-white/10 p-8 rounded-3xl space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-500">
                    Nombre Productor
                  </label>
                  <Input
                    onChange={(e) => setNombreProductor(e.target.value)}
                    className="bg-black/40 border-white/10 h-12 rounded-2xl"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-500">
                    Teléfono
                  </label>
                  <Input
                    onChange={(e) => setTelefono(e.target.value)}
                    className="bg-black/40 border-white/10 h-12 rounded-2xl"
                    placeholder="Ej. 310..."
                    type="tel"
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-500">
                    Nombre del Predio (Finca)
                  </label>
                  <Input
                    onChange={(e) => setFinca(e.target.value)}
                    className="bg-black/40 border-white/10 h-12 rounded-2xl"
                    placeholder="Ej. El Edén"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-500">
                    Municipio - Vereda
                  </label>
                  <Input
                    onChange={(e) => setMunicipio(e.target.value)}
                    className="bg-black/40 border-white/10 h-12 rounded-2xl"
                    placeholder="Ej. Marinilla - La Peña"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-500">
                    Medida
                  </label>
                  <div className="flex gap-2">
                    <Input
                      onChange={(e) => setArea(Number(e.target.value))}
                      className="bg-black/40 border-white/10 h-12 rounded-2xl flex-1"
                      type="number"
                      placeholder="Ej. 50"
                    />
                    <select
                      value={medidaTipo}
                      onChange={(e) => setMedidaTipo(e.target.value as "m2" | "ha")}
                      className="bg-black/40 border-white/10 h-12 rounded-2xl text-white px-3 outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="m2">m²</option>
                      <option value="ha">Ha</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <Button
                  onClick={handleMintWithFaucet}
                  disabled={isMinting || isFauceting || !finca || !nombreProductor || !telefono}
                  className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
                >
                  {isMinting || isFauceting ? (
                    <><Loader2 className="animate-spin w-5 h-5 mr-2" /> {isFauceting ? "Fondeando Gas..." : "Minteando..."}</>
                  ) : (
                    "Mintear Formulario"
                  )}
                </Button>
              </div>
            </Card>
          )}

          <Card className="bg-white/5 border-white/10 p-6 rounded-3xl space-y-4">
            <h3 className="text-xs font-black uppercase text-emerald-500">
              Reportar Regeneración
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {["Compost", "pH", "Árboles"].map((id) => (
                <button
                  key={id}
                  onClick={() => toggleAction(id)}
                  className={`p-4 rounded-xl border text-[10px] font-black uppercase transition-all ${selectedActions.includes(id) ? "bg-emerald-500 text-black border-emerald-500" : "bg-black/20 border-white/5 text-stone-500"}`}
                >
                  {id}
                </button>
              ))}
            </div>
          </Card>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">
            Mi <span className="text-blue-500">Billetera</span>
          </h1>
          <Card className="bg-blue-600/10 border-blue-500/20 p-8 rounded-3xl space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <CircleDollarSign size={80} className="text-blue-400" />
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <Badge className="bg-blue-600 text-white text-[9px] font-black uppercase mb-2">
                  GoodDollar UBI
                </Badge>
                <p className="text-5xl font-black text-white font-mono tracking-tighter">
                  {gDollarBalance}
                  <span className="text-xl text-blue-400 ml-2">G$</span>
                </p>
              </div>
              <a
                href="https://wallet.gooddollar.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 text-white h-12 px-8 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 shadow-xl shadow-blue-600/20"
              >
                Reclamar UBI <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </Card>
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/5 border-white/5 p-6 rounded-3xl">
              <p className="text-[10px] font-black uppercase text-stone-500">
                CELO
              </p>
              <p className="text-3xl font-black text-amber-500 font-mono">
                {celoBalance}
              </p>
            </Card>
            <Card className="bg-white/5 border-white/5 p-6 rounded-3xl">
              <p className="text-[10px] font-black uppercase text-stone-500">
                Tokens
              </p>
              <p className="text-3xl font-black text-emerald-500 font-mono">
                0.00
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
