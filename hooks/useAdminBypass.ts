import { useState, useEffect } from "react";
import { useConnection } from "wagmi";

const ADMIN_WALLET = "0xB3224aEf960A5B138d799a58Eb0F8ef1b0808094".toLowerCase();

export function useAdminBypass() {
  const { address } = useConnection();
  const [isBypassed, setIsBypassed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const isDebug = localStorage.getItem("BIOTA_DEBUG") === "true";
    const isAdmin = address?.toLowerCase() === ADMIN_WALLET;
    
    if (isAdmin || isDebug) {
      console.log("🚨 [MODO DIOS] Protecciones Web3 Bypassadas 🚨");
      setIsBypassed(true);
    } else {
      setIsBypassed(false);
    }
  }, [address]);

  return { isBypassed };
}
