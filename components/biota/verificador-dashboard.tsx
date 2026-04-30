"use client";

import { useState, useMemo } from "react";
import { 
  ShieldCheck, Search, CheckCircle2, AlertCircle, Loader2, 
  MapPin, FlaskConical, MessageCircle, ArrowLeft, Leaf
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useReadContract } from "wagmi";
import { ADDRESSES, BIOTA_PASSPORT_ABI } from "@/lib/contracts";

export function VerificadorDashboard() {
  const [searchId, setSearchId] = useState("");

  const { data: passport, isLoading, refetch } = useReadContract({
    chainId: 42220,
    address: ADDRESSES.BIOTA_PASSPORT,
    abi: BIOTA_PASSPORT_ABI,
    functionName: "lotePasaporte",
    args: searchId ? [BigInt(searchId)] : undefined,
    query: { enabled: !!searchId },
  });

  const fincaData = useMemo(() => {
    if (!passport || !Array.isArray(passport) || passport[0] === "0x0000000000000000000000000000000000000000") return null;
    return {
      verificador: passport[0],
      esVerificado: passport[1],
      isHumanVerified: passport[2],
      areaM2: passport[3],
      cmSuelo: passport[4],
      fecha: passport[5],
      ubicacion: passport[7] || "No especificada",
      estado: passport[8] || "N/A",
      contacto: passport[10] || "—",
      metodos: passport[11] || "—"
    };
  }, [passport]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-8">
      <div className="space-y-1">
        <Link href="/" className="text-[9px] font-black text-stone-500 uppercase flex items-center gap-1.5 mb-2 hover:text-white transition-colors">
          <ArrowLeft className="w-3 h-3" /> Panel Biota
        </Link>
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">🔎 Auditoría <span className="text-emerald-500">Blockchain</span></h1>
      </div>

      <Card className="bg-white/5 border-white/10 p-6 rounded-3xl shadow-2xl">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">ID del Pasaporte</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <Input 
                placeholder="ID (1, 2, 3...)" 
                className="bg-black/40 border-white/10 h-14 pl-12 text-lg font-black text-white rounded-2xl focus:border-emerald-500"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={() => refetch()} className="h-14 px-8 bg-emerald-600 hover:bg-emerald-500 text-black font-black uppercase rounded-2xl">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Consultar"}
          </Button>
        </div>
      </Card>

      {fincaData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="lg:col-span-2 bg-[#0a0a0a] border-white/5 p-8 rounded-3xl space-y-8">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20"><MapPin size={32} /></div>
                <div>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] font-black uppercase mb-1">
                    {fincaData.esVerificado ? "Verificado" : "Pendiente"}
                  </Badge>
                  <h2 className="text-2xl font-black text-white italic uppercase">{fincaData.ubicacion}</h2>
                </div>
              </div>
              <p className="text-4xl font-black text-white/20 font-mono">#{searchId}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div><p className="text-[10px] font-black text-stone-600 uppercase">Productor</p><p className="text-sm font-bold text-white flex items-center gap-2"><MessageCircle className="w-4 h-4 text-blue-400" /> {fincaData.contacto}</p></div>
              <div><p className="text-[10px] font-black text-stone-600 uppercase">Área Registrada</p><p className="text-lg font-black text-white">{fincaData.areaM2.toLocaleString()} m²</p></div>
              <div><p className="text-[10px] font-black text-stone-600 uppercase">Suelo Recuperado</p><p className="text-lg font-black text-emerald-500">{fincaData.cmSuelo.toLocaleString()} cm²</p></div>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5"><p className="text-[9px] font-black text-stone-500 uppercase mb-2 tracking-[0.2em]">Métodos Agrícolas</p><p className="text-xs text-stone-300 italic">{fincaData.metodos}</p></div>
          </Card>

          <div className="space-y-6">
            <Card className="bg-emerald-600/10 border-emerald-500/20 p-6 rounded-3xl text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mx-auto shadow-glow-sm"><ShieldCheck size={32} /></div>
              <h3 className="font-black text-white uppercase italic">Validar Impacto</h3>
              <p className="text-[10px] text-stone-400 leading-relaxed uppercase">Confirma la regeneración de este lote para activar recompensas.</p>
              <Button className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase rounded-xl h-12">Emitir Certificado</Button>
            </Card>
          </div>
        </div>
      ) : searchId && !isLoading && (
        <div className="p-12 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
          <AlertCircle className="w-12 h-12 text-stone-700 mx-auto mb-4" />
          <p className="text-stone-500 font-black uppercase text-xs tracking-widest">No se encontró información para el ID #{searchId}</p>
        </div>
      )}
    </div>
  );
}
