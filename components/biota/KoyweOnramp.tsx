"use client";

import React, { useState, useEffect } from 'react';
import { CreditCard, X, ArrowDownToLine, Wallet } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useAccount } from 'wagmi';

export function KoyweOnramp() {
  const [isOpen, setIsOpen] = useState(false);
  const [secureUrl, setSecureUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const { address } = useAccount();
  const [isMiniPay, setIsMiniPay] = useState(false);

  useEffect(() => {
    // Detectamos si el usuario está abriendo la dApp desde Opera MiniPay
    if (typeof window !== 'undefined' && window.ethereum && (window.ethereum as any).isMiniPay) {
      setIsMiniPay(true);
    }
  }, []);

  const handleOpenFiat = () => {
    // Agregador global de pasarelas (Tarjetas/Bancos)
    const onrampUrl = `https://buy.onramper.com/?defaultCrypto=CUSD&networkWallets=CELO:${address || ''}`;
    window.open(onrampUrl, '_blank');
  };

  const handleOpenSquid = () => {
    // Intercambio Web3 puro (Cross-chain)
    const squidUrl = `https://app.squidrouter.com/?chains=137%2C42220`;
    window.open(squidUrl, '_blank');
  };

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

  // Si NO estamos en MiniPay, mostramos ambas opciones (Fiat y Web3)
  return (
    <div className="grid grid-cols-2 gap-2 mt-4">
      <Button 
        onClick={handleOpenFiat}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-tighter text-[9px] h-10 rounded-xl flex items-center justify-center gap-1 shadow-lg shadow-blue-500/20"
      >
        <CreditCard size={12} /> Comprar (Tarjeta)
      </Button>

      <Button 
        onClick={handleOpenSquid}
        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-tighter text-[9px] h-10 rounded-xl flex items-center justify-center gap-1 shadow-lg shadow-purple-500/20"
      >
        <ArrowDownToLine size={12} /> Traer Cripto (Web3)
      </Button>
    </div>
  );
}
