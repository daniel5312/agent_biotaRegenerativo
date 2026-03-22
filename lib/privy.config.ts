// lib/privy.config.ts
import type { PrivyClientConfig } from '@privy-io/react-auth'
import { celoAlfajores } from '@/lib/contracts'

export const privyConfig: PrivyClientConfig = {
  loginMethods: ['email', 'sms', 'wallet', 'telegram'],
  embeddedWallets: {
    createOnLogin:               'users-without-wallets',
    requireUserPasswordOnCreate: false,
    noPromptOnSignature:         true,
  },
  defaultChain:    celoAlfajores,
  supportedChains: [celoAlfajores],
  appearance: {
    theme:                'dark',
    accentColor:          '#10b981',
    landingHeader:        'Biota Protocol',
    loginMessage:         'Accede con tu correo o Telegram para gestionar tu pasaporte biológico',
    showWalletLoginFirst: false,
    walletList:           ['metamask', 'wallet_connect'],
  },
  legal: {
    termsAndConditionsUrl: 'https://biota.protocol/terms',
    privacyPolicyUrl:      'https://biota.protocol/privacy',
  },
}
