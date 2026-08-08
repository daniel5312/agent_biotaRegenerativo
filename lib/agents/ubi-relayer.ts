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
  process.env.PRIVY_APP_SECRET || '',
  {
    walletApi: {
      authorizationPrivateKey: process.env.PRIVY_AUTHORIZATION_KEY || '',
    },
  }
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

    console.log(`⛽ Calculando Gas y Nonce en la red...`);
    const nonce = await publicClient.getTransactionCount({
      address: userAddress as `0x${string}`,
    });

    // En Celo, los fees suelen ser estables, pero usamos viem para ser precisos
    const { maxFeePerGas, maxPriorityFeePerGas } = await publicClient.estimateFeesPerGas();

    console.log(`🔐 Solicitando firma delegada a Privy Server Wallets...`);
    
    // 2. Ejecutar la firma usando la autorización delegada (TEE)
    const response = await privy.walletApi.rpc({
      address: userAddress,
      chainType: 'ethereum',
      method: 'eth_signTransaction',
      params: {
        transaction: {
          to: UBISCHEME_ADDRESS as `0x${string}`,
          value: "0x0",
          data: txData as `0x${string}`,
          chainId: 42220,
          nonce: nonce,
          gasLimit: '0x30d40', // 200,000 gas limit approx para GoodDollar
          maxFeePerGas: `0x${maxFeePerGas.toString(16)}`,
          maxPriorityFeePerGas: `0x${maxPriorityFeePerGas.toString(16)}`,
        }
      }
    });

    if ('error' in response) {
      throw new Error(`Privy RPC Error: ${(response.error as any).message}`);
    }

    const signedTx = response.data.signedTransaction;
    
    console.log(`📡 Transmitiendo la transacción firmada a la red...`);
    // 3. Nosotros transmitimos la transacción a la red que queramos (Celo o Anvil)
    const txHash = await publicClient.sendRawTransaction({ 
      serializedTransaction: signedTx as `0x${string}`
    });

    console.log(`✅ ¡Éxito! El Agente 8004 completó el reclamo. Hash: ${txHash}`);
    return { success: true, hash: txHash };
    
  } catch (error: any) {
    console.error('❌ Error en el Relayer del Agente:', error.message || error);
    throw error;
  }
}
