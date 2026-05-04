"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useAccount } from "wagmi"
import { useToast } from "@/hooks/use-toast"
import { useSuperfluidStream } from "@/hooks/useSuperfluidStream"

interface UbiFlowContextType {
  ubiAddress: `0x${string}` | null;
  ubiProvider: any;
  handleConnectUBI: () => Promise<void>;
  disconnectUBI: () => void;
  stream: ReturnType<typeof useSuperfluidStream>;
  isFlowActive: boolean;
}

const UbiFlowContext = createContext<UbiFlowContextType | undefined>(undefined)

export function UbiFlowProvider({ children }: { children: ReactNode }) {
  const { address: activeAddress } = useAccount()
  const primaryAddress = activeAddress as `0x${string}`
  const { toast } = useToast()

  const [ubiAddress, setUbiAddress] = useState<`0x${string}` | null>(null)
  const [ubiProvider, setUbiProvider] = useState<any>(null)
  const [isMounted, setIsMounted] = useState(false)

  // 1. Restaurar sesión desde localStorage SIN errores de hidratación
  useEffect(() => {
    setIsMounted(true)
    const stored = localStorage.getItem('biota_ubi_address')
    if (stored) {
      setUbiAddress(stored as `0x${string}`)
      // Recuperamos la dirección visualmente. 
      // Si el usuario quiere detener el flujo, el provider se pedirá conectar de nuevo.
    }
  }, [])

  // 2. Lógica de WalletConnect extraída del componente
  const handleConnectUBI = async () => {
    try {
      const { UniversalProvider } = await import("@walletconnect/universal-provider")
      const { WalletConnectModal } = await import("@walletconnect/modal")

      const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || '3a8170812b3ec9103e334df568600109'
      
      const modal = new WalletConnectModal({
        projectId,
        chains: ["42220"],
        enableExplorer: false,
      })

      const provider = await UniversalProvider.init({
        projectId,
        metadata: {
          name: "Biota Protocol",
          description: "Regenerative Finance Oracle",
          url: "https://biota.xyz",
          icons: ["https://biota.xyz/icon.png"],
        },
      })

      provider.on("display_uri", (uri: string) => {
        modal.openModal({ uri })
      })

      const session = await provider.connect({
        namespaces: {
          eip155: {
            methods: ["eth_sendTransaction", "eth_signTransaction", "eth_sign", "personal_sign", "eth_signTypedData"],
            chains: ["eip155:42220"],
            events: ["chainChanged", "accountsChanged"],
          },
        },
        optionalNamespaces: {
          eip155: {
            methods: ["eth_sendTransaction", "eth_signTransaction", "eth_sign", "personal_sign", "eth_signTypedData"],
            chains: ["eip155:42220"],
            events: ["chainChanged", "accountsChanged"],
          }
        }
      })

      const address = session?.namespaces.eip155.accounts[0].split(":")[2] as `0x${string}`
      
      setUbiAddress(address)
      setUbiProvider(provider)
      localStorage.setItem('biota_ubi_address', address)
      modal.closeModal()

      toast({
        title: "✅ GoodWallet Vinculada",
        description: `Billetera conectada: ${address.slice(0,6)}...${address.slice(-4)}`,
      })
    } catch (e: any) {
      toast({
        title: "❌ Error de Conexión",
        description: e.message || "No se pudo conectar WalletConnect",
        variant: "destructive"
      })
    }
  }

  const disconnectUBI = () => {
    setUbiAddress(null)
    setUbiProvider(null)
    localStorage.removeItem('biota_ubi_address')
  }

  // 3. Hook de Superfluid instanciado a nivel global
  const stream = useSuperfluidStream(
    primaryAddress, 
    ubiAddress || undefined,
    ubiProvider
  )
  const isFlowActive = stream.isActive

  // Prevenir renderizado servidor (SSR) hasta montar el cliente para evitar mismatch
  if (!isMounted) return null

  return (
    <UbiFlowContext.Provider value={{ ubiAddress, ubiProvider, handleConnectUBI, disconnectUBI, stream, isFlowActive }}>
      {children}
    </UbiFlowContext.Provider>
  )
}

export function useUbiFlow() {
  const context = useContext(UbiFlowContext)
  if (context === undefined) {
    throw new Error('useUbiFlow must be used within a UbiFlowProvider')
  }
  return context
}
