"use client";

import { ReactNode, useState } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi"; // [PRIVY-CORE] Integración nativa
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { privyConfig } from "@/lib/privy.config";
import { wagmiConfig } from "@/lib/wagmi.config"; // Volvemos a nuestra config limpia

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || "cmkaovw5x04nxl50cxdi4kbyv"}
      config={privyConfig}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
