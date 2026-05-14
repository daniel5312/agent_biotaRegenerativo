"use client";

import { useAccount, useReadContract } from "wagmi";
import { Droplet, Wallet, ShieldAlert, CheckCircle2 } from "lucide-react";
import { ADDRESSES, BIOTA_PASSPORT_ABI } from "@/lib/contracts";

export const BovedaPanel = () => {
  const { address, isConnected } = useAccount();
  
  // 1. Verificar si el usuario tiene un pasaporte
  const { data: balance, isLoading: balanceLoading } = useReadContract({
    address: ADDRESSES.BIOTA_PASSPORT,
    abi: BIOTA_PASSPORT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  });

  const ownsPassport = balance ? Number(balance) > 0 : false;
  const tokenId = 0n; // Hardcoded to 0 for simplicity, ideally we would fetch the tokenOfOwnerByIndex if it was ERC721Enumerable

  // 2. Leer estado del lote
  const { data: loteData, isLoading: loteLoading } = useReadContract({
    address: ADDRESSES.BIOTA_PASSPORT,
    abi: BIOTA_PASSPORT_ABI,
    functionName: "lotePasaporte",
    args: ownsPassport ? [tokenId] : undefined,
    query: {
      enabled: ownsPassport,
    }
  });

  const isVerified = loteData ? loteData[1] : false; // esVerificado is the second returned value (index 1)
  
  // Para el flujo UBI (ahora manejado diferente en la nueva arquitectura, lo simulamos activo si está verificado por ahora)
  const isFlowActive = isVerified;

  const loading = balanceLoading || (ownsPassport && loteLoading);

  if (!isConnected || !address) return null;
  if (loading) return <div className="animate-pulse bg-white/5 h-32 rounded-3xl" />;

  return (
    <div className="bg-gradient-to-br from-emerald-900/40 to-[#0a0a0a] border border-emerald-500/20 p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
      <div className="absolute -top-10 -right-10 opacity-5">
        <Droplet size={200} />
      </div>
      
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black italic uppercase text-white flex items-center gap-3">
            <Wallet className="text-emerald-500" /> Mi Bóveda ReFi
          </h2>
          <p className="text-stone-400 text-sm mt-1">
            Conectado: <span className="font-mono text-emerald-400">{address.slice(0,6)}...{address.slice(-4)}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border ${ownsPassport ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            {ownsPassport ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {ownsPassport ? "Pasaporte Activo" : "Sin Pasaporte"}
            </span>
          </div>

          {ownsPassport && (
            <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border ${isVerified ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-orange-500/10 border-orange-500/30 text-orange-400'}`}>
              <span className="text-[10px] font-black uppercase tracking-widest">
                Impacto: {isVerified ? "Verificado" : "Pendiente de Auditoría"}
              </span>
            </div>
          )}

          {isVerified && (
            <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border ${isFlowActive ? 'bg-green-500/20 border-green-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] text-green-400' : 'bg-stone-800 border-stone-700 text-stone-500'}`}>
              <Droplet size={16} className={isFlowActive ? "animate-bounce" : ""} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Stream UBI: {isFlowActive ? "Goteando G$" : "Detenido"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
