"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Sprout, ClipboardList, Hammer, FlaskConical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Types
type Production = { id: string; nombre_proceso: string; cultivo_producto: string; estado: string; creado_en: string };

export function FichaTecnica() {
  const { address } = useAccount();
  const { toast } = useToast();
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Forms state
  const [showNewProd, setShowNewProd] = useState(false);
  const [newProdName, setNewProdName] = useState("");
  const [newProdCrop, setNewProdCrop] = useState("");

  const fetchProductions = async () => {
    if (!address) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("production_records")
      .select("*")
      .eq("wallet_address", address)
      .order("creado_en", { ascending: false });

    if (!error && data) setProductions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProductions();
  }, [address]);

  const handleCreateProduction = async () => {
    if (!address || !newProdName) return;
    const { data, error } = await supabase.from("production_records").insert({
      wallet_address: address,
      nombre_proceso: newProdName,
      cultivo_producto: newProdCrop,
      estado: "EN_CURSO"
    }).select().single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Creado", description: "Ficha de producción creada" });
      setShowNewProd(false);
      setNewProdName("");
      setNewProdCrop("");
      fetchProductions();
    }
  };

  if (loading) return <div className="p-4 text-center"><Loader2 className="animate-spin inline mr-2" /> Cargando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-emerald-400 flex items-center gap-2">
          <ClipboardList className="w-5 h-5" />
          Fichas de Producción
        </h2>
        <Button size="sm" onClick={() => setShowNewProd(!showNewProd)} className="bg-emerald-500 text-black font-black">
          <Plus className="w-4 h-4 mr-1" /> Nueva
        </Button>
      </div>

      {showNewProd && (
        <Card className="p-4 bg-emerald-900/20 border-emerald-500/30 space-y-3">
          <Input placeholder="Nombre del proceso (ej. Compostaje)" value={newProdName} onChange={(e) => setNewProdName(e.target.value)} className="bg-black/40 border-white/10" />
          <Input placeholder="Cultivo / Producto" value={newProdCrop} onChange={(e) => setNewProdCrop(e.target.value)} className="bg-black/40 border-white/10" />
          <Button onClick={handleCreateProduction} className="w-full bg-emerald-500 text-black">Guardar Ficha</Button>
        </Card>
      )}

      {productions.length === 0 && !showNewProd ? (
        <p className="text-stone-400 text-sm italic">No tienes fichas de producción activas.</p>
      ) : (
        <div className="space-y-3">
          {productions.map(prod => (
            <Card key={prod.id} className="p-4 bg-white/5 border-white/10">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-bold text-white uppercase text-sm">{prod.nombre_proceso}</h3>
                  <p className="text-xs text-stone-400 flex items-center gap-1 mt-1">
                    <Sprout className="w-3 h-3 text-emerald-500" /> {prod.cultivo_producto}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full font-mono">
                    {prod.estado}
                  </span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" className="text-[10px] h-8 border-white/10 bg-black/40 flex gap-1">
                  <FlaskConical className="w-3 h-3 text-purple-400" /> Recetas
                </Button>
                <Button variant="outline" size="sm" className="text-[10px] h-8 border-white/10 bg-black/40 flex gap-1">
                  <Hammer className="w-3 h-3 text-orange-400" /> Tareas
                </Button>
                <Button variant="outline" size="sm" className="text-[10px] h-8 border-white/10 bg-black/40 flex gap-1">
                  <Plus className="w-3 h-3 text-emerald-400" /> Evidencia
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
