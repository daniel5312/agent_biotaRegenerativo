"use client";

import { FichaTecnica } from "@/components/biota/FichaTecnica";
import { BadgeCheck, Leaf, ShieldCheck, Video } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function CertificacionesView() {
  return (
    <div className="p-4 pb-24 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-2">
        <BadgeCheck className="w-8 h-8 text-emerald-500" />
        <h1 className="text-3xl font-black text-white italic uppercase">
          Certificaciones
        </h1>
      </div>
      
      <p className="text-stone-400 text-sm">
        Sube aquí tu evidencia de trabajo (fotos, videos, producción de bioinsumos). 
        El Oráculo IA analizará tus reportes para validarlos en la blockchain.
      </p>

      {/* TAREAS / dMRV FASE 3 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-emerald-500/5 border-emerald-500/20 p-6 rounded-3xl">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Leaf className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="font-black text-white uppercase">Biopreparados</h3>
            <p className="text-xs text-stone-400">Registra abonos y evidencia de elaboración.</p>
          </div>
        </Card>

        <Card className="bg-stone-900 border-stone-800 p-6 rounded-3xl opacity-50 grayscale">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 rounded-full bg-stone-800 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-stone-500" />
            </div>
            <h3 className="font-black text-white uppercase">Cromatografías</h3>
            <p className="text-xs text-stone-500">Próximamente... requiere Sello de Transición.</p>
          </div>
        </Card>
      </div>

      <div className="pt-4 border-t border-white/10">
        <FichaTecnica />
      </div>
    </div>
  );
}
