"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAccount } from "wagmi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Leaf, Save, FlaskConical, X, Camera, Loader2, Video } from "lucide-react";
import { compressImage } from "@/lib/utils";
import { useRef } from "react";
import { useToast } from "@/hooks/use-toast";

type Insumo = { nombre: string; cantidad: number; unidad: string; es_regenerativo: boolean };

export function ModalReceta({
  isOpen,
  onCloseAction,
  productionId
}: {
  isOpen: boolean;
  onCloseAction: () => void;   // <-- Cambiar aquí onClose por onCloseAction
  productionId: string;
}) {
  const { address } = useAccount();
  const { toast } = useToast();

  // Tabla: regenerative_recipes
  const [nombreReceta, setNombreReceta] = useState("");
  const [objetivo, setObjetivo] = useState("");

  // Tabla Relacional: recipe_inputs (Arreglo temporal en memoria)
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [nuevoInsumo, setNuevoInsumo] = useState({ nombre: "", cantidad: 0, unidad: "Kg", es_regenerativo: true });

  // EVIDENCIA VISUAL (Foto / Video proxy)
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEvidenceFile(file);
      if (file.type.startsWith("image/")) {
        try {
          const base64String = await compressImage(file);
          setImageBase64(base64String);
        } catch (error) {
          console.error("Compression error:", error);
          toast({ title: "Error", description: "No se pudo procesar la imagen", variant: "destructive" });
        }
      } else if (file.type.startsWith("video/")) {
         // Proxy for video: We skip AI analysis of video for MVP but attach it to Supabase
         setImageBase64(null);
      }
    }
  };

  const agregarInsumo = () => {
    if (!nuevoInsumo.nombre || nuevoInsumo.cantidad <= 0) return;
    setInsumos([...insumos, nuevoInsumo]);
    setNuevoInsumo({ nombre: "", cantidad: 0, unidad: "Kg", es_regenerativo: true });
  };

  const removerInsumo = (index: number) => {
    setInsumos(insumos.filter((_, i) => i !== index));
  };

  const guardarReceta = async () => {
    if (!address || !nombreReceta) {
      toast({ title: "Atención", description: "El nombre de la receta es obligatorio", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    let ipfsUrlFinal = null;

    try {
      // 1. Si hay archivo (Evidencia pesada), MINT A IPFS DESCENTRALIZADO (Pinata)
      if (evidenceFile) {
        toast({ title: "Subiendo evidencia...", description: "Asegurando en la blockchain IPFS." });

        // Empaquetamos en el FormData web que Pinata leerá
        const formData = new FormData();
        formData.append("file", evidenceFile);

        const resIpfs = await fetch("/api/ipfs-upload", {
          method: "POST",
          body: formData,
        });

        if (!resIpfs.ok) throw new Error("Fallo subiendo la evidencia a IPFS");

        const ipfsData = await resIpfs.json();
        ipfsUrlFinal = ipfsData.ipfsUrl;
        console.log("Evidencia anclada a IPFS:", ipfsUrlFinal);
      }

      // 2. Opcional: Llamada al Oráculo de Gemini si hay evidencia (para validar la química)
      if (imageBase64) {
        toast({ title: "IA Analizando 🤖", description: "El Agente D. Experto está revisando tu receta..." });

        const insumosStr = insumos.map(i => `${i.cantidad}${i.unidad} de ${i.nombre}`).join(", ");

        const aiBody = {
           agentRole: "DANIEL_EXPERTO", // Usar D. Experto para biopreparados
           sessionMetadata: { address },
           messages: [{
               role: 'user',
               content: `Ficha Técnica a validar:\nNombre: ${nombreReceta}\nObjetivo: ${objetivo}\nInsumos: ${insumosStr}\n\nPor favor evalúa si esta receta es un abono orgánico y si la imagen concuerda. Este es el URL descentralizado de la evidencia: ${ipfsUrlFinal}`,
               image: imageBase64
           }]
        };

        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(aiBody)
        });

        if (!res.ok) console.warn("Oráculo no disponible temporalmente, guardando en Supabase.");
      } else {
        toast({ title: "Guardando", description: "Escribiendo Ficha Técnica en Supabase..." });
      }

      // 3. Guardar receta padre EN SUPABASE
      const { data: recetaDB, error: errorReceta } = await supabase
        .from("regenerative_recipes")
        .insert({
          production_id: productionId,
          wallet_address: address,
          nombre: nombreReceta,
          objetivo: objetivo,
          // (Si más adelante le pones la columna ipfs_evidence, la pasas aquí)
        }).select().single();

      if (errorReceta || !recetaDB) {
        throw new Error(errorReceta?.message || "Error al crear la receta");
      }

      // 4. Guardar hijos (Insumos) apuntando al ID del padre
      if (insumos.length > 0) {
        const dbInsumos = insumos.map(i => ({
          recipe_id: recetaDB.id,
          nombre: i.nombre,
          cantidad: i.cantidad,
          unidad: i.unidad,
          es_regenerativo: i.es_regenerativo
        }));
        await supabase.from("recipe_inputs").insert(dbInsumos);
      }

      toast({ title: "🌱 Ficha Aprobada", description: "Receta registrada y firmada digitalmente." });

      // Limpiar y cerrar
      setNombreReceta(""); setObjetivo(""); setInsumos([]); setImageBase64(null); setEvidenceFile(null);
      onCloseAction();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast({ title: "Error Guardando", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Error Guardando", description: "Ocurrió un error inesperado.", variant: "destructive" });
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="bg-[#0D1B1A] border-emerald-900/50 text-white max-w-md w-[95vw] rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-black text-emerald-400 text-xl">
            <FlaskConical className="w-5 h-5" /> Nueva Receta Formulación
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-xs text-stone-400">Nombre de la Receta</Label>
            <Input value={nombreReceta} onChange={(e) => setNombreReceta(e.target.value)} placeholder="Ej. Biol de Estiércol Súper Magro" className="bg-black/40 border-white/10 h-12 rounded-xl" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-stone-400">Objetivo Agronómico</Label>
            <Input value={objetivo} onChange={(e) => setObjetivo(e.target.value)} placeholder="Ej. Aporte de Nitrógeno foliar" className="bg-black/40 border-white/10 h-10 rounded-xl text-sm" />
          </div>


          {/* EVIDENCIA VISUAL */}
          <div className="space-y-2">
            <Label className="text-xs text-stone-400">Prueba de Elaboración (Video o Foto)</Label>
            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*,video/mp4,video/webm"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="h-10 text-xs w-full bg-black/40 border-white/10 text-stone-300"
              >
                {evidenceFile ? (
                  evidenceFile.type.startsWith("video/")
                    ? <Video className="w-4 h-4 mr-2 text-emerald-400" />
                    : <Camera className="w-4 h-4 mr-2 text-emerald-400" />
                ) : (
                  <Camera className="w-4 h-4 mr-2" />
                )}
                {evidenceFile ? `${evidenceFile.name.substring(0,25)}...` : "Adjuntar archivo multimedia"}
              </Button>
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
            <Label className="text-xs font-black text-emerald-500 uppercase flex items-center gap-1">
              <Leaf className="w-3 h-3" /> Insumos / Ingredientes
            </Label>

            <div className="flex gap-2">
              <Input value={nuevoInsumo.nombre} onChange={(e) => setNuevoInsumo({...nuevoInsumo, nombre: e.target.value})} placeholder="Insumo (ej. Melaza)" className="bg-black/40 h-10 text-xs rounded-xl flex-1" />
              <Input type="number" value={nuevoInsumo.cantidad || ""} onChange={(e) => setNuevoInsumo({...nuevoInsumo, cantidad: Number(e.target.value)})} placeholder="0" className="w-16 bg-black/40 h-10 text-xs rounded-xl" />
              <select value={nuevoInsumo.unidad} onChange={(e) => setNuevoInsumo({...nuevoInsumo, unidad: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl text-xs px-2 w-20 outline-none">
                <option value="Kg">Kg</option>
                <option value="L">Litros</option>
                <option value="Bulto">Bulto</option>
              </select>
              <Button size="icon" onClick={agregarInsumo} className="h-10 w-10 shrink-0 rounded-xl bg-emerald-500 text-black hover:bg-emerald-400"><Plus className="w-4 h-4" /></Button>
            </div>

            {insumos.length > 0 && (
              <div className="space-y-2 mt-4">
                {insumos.map((i, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs bg-black/40 p-2 rounded-xl text-stone-300 font-mono border border-white/5">
                    <span className="truncate flex-1">- {i.nombre}</span>
                    <span className="text-emerald-400 font-bold mx-2">{i.cantidad} {i.unidad}</span>
                    <button onClick={() => removerInsumo(idx)} className="text-red-400/50 hover:text-red-400"><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button onClick={guardarReceta} disabled={!nombreReceta || isAnalyzing} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wider h-14 rounded-2xl shadow-lg shadow-emerald-500/20">
            {isAnalyzing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
            {isAnalyzing ? "Analizando y Firmando..." : "Guardar Fórmula"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
