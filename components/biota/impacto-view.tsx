"use client";

import { useMemo, useState } from "react";
import { useConnection, useReadContract } from "wagmi";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { IdentityAction } from "@/components/biota/IdentityAction";
import { BovedaInversor } from "@/components/biota/boveda-inversor";
import { PrestamosAave } from "@/components/biota/prestamos-aave";
import { RetiroFiat } from "@/components/biota/retiro-fiat";
import { useBiotaPass } from "@/hooks/useBiotaPass";

export function ImpactoView() {
  const { address } = useConnection();
  const { tokenId } = useBiotaPass();
  
  const [userRole, setUserRole] = useState<"PRODUCER" | "INVESTOR" | null>(null);
  
  useMemo(() => {
    if (typeof window !== "undefined") {
      setUserRole(localStorage.getItem("BIOTA_ROLE") as "PRODUCER" | "INVESTOR" | null);
    }
  }, []);

  return (
    <div className="px-4 py-4 space-y-4 mb-nav">
      {/* VISTA DEL INVERSOR */}
      {userRole === "INVESTOR" && (
        <BovedaInversor />
      )}

      {/* VISTA DEL PRODUCTOR: DEFI HUB */}
      {userRole === "PRODUCER" && (
        <>
          {/* ================================================================
              IDENTITY & UBI ACTIONS (SUPERFLUID + GRANTS)
              ================================================================ */}
          <div className="animate-slide-up delay-75">
            <IdentityAction tokenId={tokenId ?? undefined} />
          </div>

          {/* ================================================================
              DEFI HUB: AHORRO, CRÉDITO Y RETIRO FIAT
              ================================================================ */}
          <div className="space-y-4 pt-2 animate-slide-up delay-150">
            <h2 className="text-sm font-black text-stone-800 dark:text-stone-300 uppercase tracking-widest pl-2 border-l-4 border-blue-500">
              Corazón Financiero (DeFi)
            </h2>
            
            {/* Yield y Préstamos */}
            <PrestamosAave />
            
            {/* Rampas de salida */}
            <RetiroFiat />
          </div>
        </>
      )}
    </div>
  );
}
