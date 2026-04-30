// lib/privy.config.ts
import type { PrivyClientConfig } from '@privy-io/react-auth'
import { celo } from '@wagmi/core/chains'

const activeChain = celo;

export const privyConfig: PrivyClientConfig = {
  loginMethods: ['email', 'sms', 'wallet', 'telegram', 'twitter', 'google'],
  embeddedWallets: {
    ethereum: {
      createOnLogin: 'users-without-wallets',
    },
  },
  defaultChain: activeChain,
  supportedChains: [celo],
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