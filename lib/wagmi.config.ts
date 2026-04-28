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

export const wagmiConfig = createConfig({
  chains: [celo],
  transports: {
    [celo.id]: http('https://forno.celo.org'),
  },
  connectors: [
    miniPayConnector,
    injected({ shimDisconnect: true }),
  ],
  ssr: true,
})

export type WagmiConfig = typeof wagmiConfig
