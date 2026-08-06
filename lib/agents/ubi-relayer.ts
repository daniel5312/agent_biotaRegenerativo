import { PrivyClient } from '@privy-io/server-auth';
import { createPublicClient, http } from 'viem';
import { celo } from 'viem/chains';

/**
 * 🏃 Sprint 1: Ticket-003 - Motor Relayer del Agente
 * 
 * Este archivo se ejecuta SOLO en el servidor (Ej: Next.js API Routes / Cron Jobs).
 * Utiliza el PRIVY_APP_SECRET para autenticarse y utilizar las Session Keys delegadas.
 */

// Inicialización segura del cliente Privy
const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
  process.env.PRIVY_APP_SECRET || ''
);

const publicClient = createPublicClient({
  chain: celo,
  transport: http("https://forno.celo.org")
});

const UBISCHEME_ADDRESS = '0x43d72Ff17701B2DA814620735C39C620Ce0ea4A1';
// FAUCET_ADDRESS se usará en el Ticket-004
const FAUCET_ADDRESS = '0x4ea72dc7bc4790089e0eeefd54311893c50937da';

export async function agentExecuteDailyClaim(userAddress: string) {
  try {
    console.log(`🤖 Agente 8004 iniciando rutina para la billetera: ${userAddress}`);

    // 1. Preparar la llamada a claim() de GoodDollar
    // El signature hash de claim() es 0x4e71d92d
    const txData = '0x4e71d92d';

    console.log(`🔐 Solicitando firma delegada a Privy Server Wallets...`);
    
    // 2. Ejecutar la transacción usando la autorización delegada
    const { data: txHash } = await privy.walletApi.rpc({
      walletAddress: userAddress,
      method: 'eth_sendTransaction',
      caip2: 'eip155:42220', // Celo Mainnet
      params: {
        to: UBISCHEME_ADDRESS,
        value: 0,
        data: txData,
      }
    });

    console.log(`✅ ¡Éxito! El Agente 8004 completó el reclamo. Hash: ${txHash}`);
    return { success: true, hash: txHash };
    
  } catch (error: any) {
    console.error('❌ Error en el Relayer del Agente:', error.message || error);
    throw error;
  }
}
