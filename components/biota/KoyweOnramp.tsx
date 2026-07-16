"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, X, ArrowDownToLine, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";

export function KoyweOnramp() {
  const [isOpen, setIsOpen] = useState(false);
  const [secureUrl, setSecureUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const { address } = useAccount();
  const [isMiniPay, setIsMiniPay] = useState(false);

  useEffect(() => {
    // Detectamos si el usuario está abriendo la dApp desde Opera MiniPay
    if (
      typeof window !== "undefined" &&
      window.ethereum &&
      (window.ethereum as any).isMiniPay
    ) {
      setIsMiniPay(true);
    }
  }, []);

  const handleOpenTransak = () => {
    // Transak bloqueó temporalmente tu IP local por los múltiples intentos de la API.
    // Usaremos Koywe, que es LA MEJOR pasarela para Latinoamérica (Colombia, Chile, México).
    const onrampUrl = `https://pay.koywe.com/?symbol=cUSD&network=celo&address=${address || ""}`;
    window.open(onrampUrl, "_blank");
  };

  // Si estamos en MiniPay, NO mostramos la pasarela, le decimos que use el botón nativo
  if (isMiniPay) {
    return (
      <div className="w-full bg-stone-900/50 border border-stone-800 rounded-xl p-4 text-center mt-4">
        <Wallet className="w-6 h-6 text-blue-500 mx-auto mb-2" />
        <p className="text-xs text-stone-300 font-bold mb-1">
          Estás en MiniPay
        </p>
        <p className="text-[10px] text-stone-500">
          Usa el botón nativo{" "}
          <span className="text-blue-400 font-bold">"Add"</span> en el menú
          inferior de tu billetera para recargar cUSD sin comisiones.
        </p>
      </div>
    );
  }

  // Si NO estamos en MiniPay (Navegador normal), abrimos Transak público
  return (
    <Button
      onClick={handleOpenTransak}
      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[10px] h-10 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 mt-4"
    >
      <ArrowDownToLine size={14} /> Recargar Pesos (Transak)
    </Button>
  );
}
