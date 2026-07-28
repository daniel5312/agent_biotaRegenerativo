import { createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { celo } from 'wagmi/chains'

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

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://forno.celo.org'

export const wagmiConfig = createConfig({
  chains: [celo],
  transports: {
    [celo.id]: http(rpcUrl),
  },
  connectors: [
    miniPayConnector,
    injected({ shimDisconnect: true }),
  ],
  ssr: true,
})

export type WagmiConfig = typeof wagmiConfig
