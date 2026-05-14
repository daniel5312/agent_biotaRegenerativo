"use client";

import { useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { createWalletClient, custom } from "viem";
import { celo } from "viem/chains";
import {
  MapPin,
  User,
  Smartphone,
  Maximize,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export const RegistroProductor = () => {
  const [step, setStep] = useState(1);
  const { wallets } = useWallets();
  const wallet = wallets[0]; // TuCOP wallet conectada via Privy

  const handleFinalizar = async () => {
    if (!wallet) {
      alert("Por favor conecta tu wallet primero.");
      return;
    }

    try {
      // 1. Obtener el Ethers Provider inyectado por Privy y usar Viem
      const ethereumProvider = await wallet.getEthereumProvider();
      const walletClient = createWalletClient({
        chain: celo,
        transport: custom(ethereumProvider),
      });
      const [address] = await walletClient.getAddresses();
      
      // 2. Crear un mensaje seguro vinculando la identidad
      const message = `Solicito a Biota Protocol iniciar mi proceso de transición regenerativa en Celo.\nWallet: ${wallet.address}\nFecha: ${new Date().toISOString()}`;
      
      // 3. Firmar el mensaje off-chain (No gasta gas)
      console.log("Solicitando firma al productor...");
      const signature = await walletClient.signMessage({
        account: address,
        message,
      });
      
      console.log("Firma generada exitosamente:", signature);
      // Aquí el Backend (Ej. Supabase) guardaría los datos + firma para que el Admin luego mintee el pasaporte
      
      setStep(3);
    } catch (error) {
      console.error("Error al firmar:", error);
      alert("Hubo un error al generar tu Identidad Biota. ¿Rechazaste la transacción?");
    }
  };

  return (
    <section
      id="form"
      className="max-w-4xl mx-auto bg-[#0a0a0a] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl"
    >
      {/* HEADER DEL FORMULARIO */}
      <div className="bg-emerald-600 p-8 flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black italic uppercase text-white leading-none">
            Registro de Predio
          </h3>
          <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest mt-2">
            Paso {step} de 3 • Creando Identidad Biota
          </p>
        </div>
        <ShieldCheck size={40} className="text-white/40" />
      </div>

      <div className="p-10">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 transition-all">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-stone-500 ml-2">
                  Nombre del Propietario
                </label>
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-2xl focus-within:border-emerald-500 transition-all">
                  <User size={18} className="text-stone-500" />
                  <input
                    type="text"
                    placeholder="Ej. Juan Pérez"
                    className="bg-transparent border-none outline-none w-full text-sm text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-stone-500 ml-2">
                  Celular (Para TuCOP Wallet)
                </label>
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-2xl focus-within:border-emerald-500 transition-all">
                  <Smartphone size={18} className="text-stone-500" />
                  <input
                    type="text"
                    placeholder="300 000 0000"
                    className="bg-transparent border-none outline-none w-full text-sm text-white"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-2 hover:bg-emerald-500 transition-all"
            >
              Siguiente Paso <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 transition-all">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-stone-500 ml-2">
                  Departamento / Municipio
                </label>
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-2xl">
                  <MapPin size={18} className="text-stone-500" />
                  <input
                    type="text"
                    placeholder="Antioquia, Envigado"
                    className="bg-transparent border-none outline-none w-full text-sm text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-stone-500 ml-2">
                  Hectáreas Totales
                </label>
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-2xl">
                  <Maximize size={18} className="text-stone-500" />
                  <input
                    type="number"
                    placeholder="0"
                    className="bg-transparent border-none outline-none w-full text-sm text-white"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 border border-white/10 py-4 rounded-2xl font-black uppercase text-xs text-white"
              >
                Atrás
              </button>
              <button
                onClick={handleFinalizar}
                className="w-2/3 bg-white text-black py-4 rounded-2xl font-black uppercase text-sm hover:bg-emerald-500 hover:text-white transition-all"
              >
                Firmar y Finalizar Diagnóstico
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-8 animate-in zoom-in-95 transition-all">
            <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={48} className="text-emerald-500" />
            </div>
            <div>
              <h4 className="text-2xl font-black italic uppercase text-white">
                Firma Exitosa
              </h4>
              <p className="text-stone-500 text-sm mt-2 max-w-sm mx-auto">
                Tu identidad está asegurada. El equipo técnico de Biota hará la verificación física de tu predio para mintear tu Pasaporte en la Blockchain.
              </p>
            </div>
            <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl">
              <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">
                Estado del Pasaporte:
              </p>
              <p className="font-mono text-xs mt-1 text-emerald-200/50">
                ESPERANDO_AUDITORIA_ORACULO...
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
