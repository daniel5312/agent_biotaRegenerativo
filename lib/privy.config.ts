// lib/privy.config.ts
import type { PrivyClientConfig } from '@privy-io/react-auth'
import { celo, celoSepolia } from '@wagmi/core/chains'

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 42220);
const activeChain = chainId === 42220 ? celo : celoSepolia;

export const privyConfig: PrivyClientConfig = {
  loginMethods: ['email', 'sms', 'wallet', 'telegram'],
  embeddedWallets: {
    ethereum: {
      createOnLogin: 'users-without-wallets',
    },
  },
  defaultChain: activeChain,
  supportedChains: [celo, celoSepolia],
  appearance: {
    theme: 'dark',
    accentColor: '#10b981',
    landingHeader: 'Biota Protocol',
    logo: 'https://biota.protocol/logo.png',
    loginMessage: 'Accede para gestionar tu pasaporte biológico y regenerativo',
    showWalletLoginFirst: false,
  },
  legal: {
    termsAndConditionsUrl: 'https://biota.protocol/terms',
    privacyPolicyUrl: 'https://biota.protocol/privacy',
  },
}