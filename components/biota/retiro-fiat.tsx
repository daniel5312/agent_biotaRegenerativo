"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, ArrowRightLeft, Landmark, Loader2, CheckCircle2, ShieldCheck, Banknote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function RetiroFiat() {
  const [bankType, setBankType] = useState<"NEQUI" | "BANCOLOMBIA">("NEQUI");
  const [accountNumber, setAccountNumber] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [liquidationData, setLiquidationData] = useState<any>(null);
  const { toast } = useToast();

  const handleWithdraw = () => {
    if (!accountNumber || parseFloat(withdrawAmount) <= 0) {
      toast({ title: "Datos incompletos", description: "Ingresa tu número de cuenta y el monto a retirar.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);

    // [CELOPEDIA/BRIDGE] Simulando el flujo Off-Ramp B2C
    // 1. POST /v0/customers/<id>/external_accounts (Registramos Nequi/Bancolombia)
    // 2. POST /v0/customers/<id>/liquidation_addresses (Generamos la wallet destino en Celo)
    setTimeout(() => {
      setLiquidationData({
        liquidationAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", // Dirección Bridge en Celo
        fiatAmount: (parseFloat(withdrawAmount) * 4150).toLocaleString("es-CO"), // TRM COP Estimada
        bankName: bankType
      });
      setIsProcessing(false);
      toast({ title: "Riel de Liquidación Listo", description: "Envía tus USDT para recibir Pesos." });
    }, 2000);
  };

  return (
    <Card className="glass-card border-none bg-gradient-to-br from-emerald-950 via-stone-900 to-emerald-900 text-white shadow-2xl relative overflow-hidden mt-3">
      <CardContent className="p-4 relative z-10 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase font-black tracking-widest mb-2 inline-block">
              Off-Ramp Bridge (Stripe)
            </span>
            <h2 className="text-xl font-black flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-400" /> Retirar a Banco Local
            </h2>
          </div>
        </div>

        <p className="text-[10px] text-stone-400 leading-tight">
          Tus USDT se liquidarán automáticamente en Celo y recibirás Pesos Colombianos (COP) en tu cuenta.
        </p>

        <div className="space-y-3 bg-black/20 p-3 rounded-2xl border border-white/5">
          <div className="flex gap-2">
            <Button 
              variant={bankType === "NEQUI" ? "default" : "outline"}
              onClick={() => setBankType("NEQUI")}
              className={`flex-1 h-10 rounded-xl text-xs font-bold ${bankType === "NEQUI" ? "bg-purple-600 hover:bg-purple-500 text-white border-none" : "bg-transparent border-white/10 text-stone-400 hover:text-white"}`}
            >
              Nequi
            </Button>
            <Button 
              variant={bankType === "BANCOLOMBIA" ? "default" : "outline"}
              onClick={() => setBankType("BANCOLOMBIA")}
              className={`flex-1 h-10 rounded-xl text-xs font-bold ${bankType === "BANCOLOMBIA" ? "bg-yellow-500 hover:bg-yellow-400 text-black border-none" : "bg-transparent border-white/10 text-stone-400 hover:text-white"}`}
            >
              Bancolombia
            </Button>
          </div>

          <Input 
            placeholder="Número de Cuenta / Celular"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="h-12 bg-black/40 border-white/10 rounded-xl text-sm font-mono text-center"
          />

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">USDT</span>
            <Input 
              type="number"
              placeholder="Monto a retirar"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="h-12 bg-black/40 border-white/10 rounded-xl text-lg font-mono text-center pl-14"
            />
          </div>

          {!liquidationData ? (
            <Button 
              onClick={handleWithdraw}
              disabled={isProcessing}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-sm shadow-[0_0_20px_rgba(5,150,105,0.4)] transition-all"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowRightLeft className="w-4 h-4 mr-2" /> Generar Liquidación Fiat</>}
            </Button>
          ) : (
            <div className="bg-emerald-950/50 p-4 rounded-xl border border-emerald-500/30 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-xs font-black uppercase">Riel Generado Exitosamente</span>
              </div>
              <p className="text-[10px] text-stone-300 mb-1">Recibirás aprox: <b className="text-emerald-400 text-sm">${liquidationData.fiatAmount} COP</b> en {liquidationData.bankName}.</p>
              
              <div className="mt-3">
                <p className="text-[9px] uppercase text-stone-500 font-black mb-1">Dirección Liquidadora (Celo Mainnet)</p>
                <div className="bg-black/60 p-2 rounded-lg flex items-center justify-between border border-white/5">
                  <span className="text-[10px] font-mono text-stone-300 break-all">{liquidationData.liquidationAddress}</span>
                </div>
              </div>

              <Button className="w-full h-10 mt-3 bg-white text-emerald-950 hover:bg-stone-200 rounded-lg text-xs font-bold">
                <ShieldCheck className="w-4 h-4 mr-1" /> Aprobar y Enviar USDT
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
