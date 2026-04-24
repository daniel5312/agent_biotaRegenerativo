import { createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { celoSepolia, celoMainnet } from '@/lib/contracts'

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
  chains: [celoMainnet, celoSepolia],
  transports: {
    [celoMainnet.id]: http('https://forno.celo.org'),
    [celoSepolia.id]: http('https://forno.celo-sepolia.celo-testnet.org'),
  },
  connectors: [
    miniPayConnector,
    injected({ shimDisconnect: true }),
  ],
  ssr: true,
})

export type WagmiConfig = typeof wagmiConfig
