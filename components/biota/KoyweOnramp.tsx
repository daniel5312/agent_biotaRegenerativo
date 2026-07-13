"use client";

import React, { useState, useEffect } from 'react';
import { CreditCard, X, ArrowDownToLine, Wallet } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useAccount } from 'wagmi';

export function KoyweOnramp() {
  const [isOpen, setIsOpen] = useState(false);
  const { address } = useAccount();
  const [isMiniPay, setIsMiniPay] = useState(false);

  useEffect(() => {
    // Detectamos si el usuario está abriendo la dApp desde Opera MiniPay
    if (typeof window !== 'undefined' && window.ethereum && (window.ethereum as any).isMiniPay) {
      setIsMiniPay(true);
    }
  }, []);

  // Si estamos en MiniPay, NO mostramos la pasarela, le decimos que use el botón nativo
  if (isMiniPay) {
    return (
      <div className="w-full bg-stone-900/50 border border-stone-800 rounded-xl p-4 text-center mt-4">
        <Wallet className="w-6 h-6 text-blue-500 mx-auto mb-2" />
        <p className="text-xs text-stone-300 font-bold mb-1">Estás en MiniPay</p>
        <p className="text-[10px] text-stone-500">
          Usa el botón nativo <span className="text-blue-400 font-bold">"Add"</span> en el menú inferior de tu billetera para recargar cUSD sin comisiones.
        </p>
      </div>
    );
  }

  // Si NO estamos en MiniPay (Navegador normal, Chrome, Safari, etc) mostramos Transak en un Iframe Nativo (Cero Bugs de NPM)
  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[10px] h-10 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 mt-4"
      >
        <ArrowDownToLine size={14} /> Recargar Pesos (Transak)
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-stone-900 rounded-3xl w-full max-w-md overflow-hidden border border-white/10 shadow-2xl relative flex flex-col animate-in zoom-in-95 duration-300 h-[85vh] max-h-[750px]">
            
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-stone-950">
              <div className="flex items-center gap-2 text-white">
                <CreditCard size={18} className="text-blue-500" />
                <span className="font-black uppercase tracking-widest text-xs">Transak - Comprar cUSD</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Iframe Nativo de Transak (A prueba de balas) */}
            <div className="flex-1 w-full h-full bg-white">
              <iframe 
                src={`https://global-stg.transak.com/?apiKey=1dfcc7a1-ff51-4148-be26-5b48ce105d15&environment=STAGING&cryptoCurrencyCode=CUSD&fiatCurrency=COP&network=celo&walletAddress=${address || ''}&themeColor=10b981`}
                className="w-full h-full border-0"
                allow="camera; microphone; payment"
              />
            </div>

          </div>
        </div>
      )}
    </>
  );
}
