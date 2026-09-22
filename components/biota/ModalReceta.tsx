"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAccount } from "wagmi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Leaf, Save, FlaskConical, X } from "lucide-react";
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

    // 1. Guardar receta padre
    const { data: recetaDB, error: errorReceta } = await supabase
      .from("regenerative_recipes")
      .insert({
        production_id: productionId,
        wallet_address: address,
        nombre: nombreReceta,
        objetivo: objetivo,
      }).select().single();

    if (errorReceta || !recetaDB) {
      console.error("DB Error:", errorReceta);
      return toast({ title: "Error RLS Supabase", description: errorReceta?.message, variant: "destructive" });
    }

    // 2. Guardar hijos (Insumos) apuntando al ID del padre
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

    toast({ title: "Fórmula Guardada", description: "Tu receta regenerativa está on-chain." });
    // Limpiar y cerrar
    setNombreReceta(""); setObjetivo(""); setInsumos([]);
    onCloseAction();
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

          <Button onClick={guardarReceta} disabled={!nombreReceta} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wider h-14 rounded-2xl shadow-lg shadow-emerald-500/20">
            <Save className="w-5 h-5 mr-2" /> Guardar Fórmula
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
