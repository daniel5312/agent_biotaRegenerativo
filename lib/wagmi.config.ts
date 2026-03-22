// lib/wagmi.config.ts
import { createConfig, http } from 'wagmi'
import { celoAlfajores } from '@/lib/contracts'
import { injected, walletConnect, metaMask } from 'wagmi/connectors'

const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? ''
const CELO_RPC = process.env.NEXT_PUBLIC_CELO_RPC_URL ?? 'https://alfajores-forno.celo-testnet.org'

// Conector MiniPay: detecta window.ethereum.isMiniPay
const miniPayConnector = injected({
  target() {
    return {
      id: 'miniPay',
      name: 'MiniPay',
      provider: typeof window !== 'undefined' ? (window as any).ethereum : undefined,
    }
  },
})

export const wagmiConfig = createConfig({
  chains: [celoAlfajores],
  transports: {
    [celoAlfajores.id]: http(CELO_RPC, {
      batch: { batchSize: 512 },
      retryCount: 3,
    }),
  },
  connectors: [
    metaMask(),
    walletConnect({
      projectId: WC_PROJECT_ID || "14a2dd0ed7b26291d999ac751ebbb539",
      metadata: {
        name: 'Biota Protocol',
        description: 'Suelo Vivo — Agricultura de Procesos',
        url: 'https://biota.protocol',
        icons: ['https://biota.protocol/icon.png'],
      },
      showQrModal: true,
    }),
    miniPayConnector,
    injected({ shimDisconnect: true }),
  ],
  ssr: true,
})

export type WagmiConfig = typeof wagmiConfig
