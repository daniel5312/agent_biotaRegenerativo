import { PrivyClient } from '@privy-io/server-auth';
import { createPublicClient, http, encodeFunctionData } from 'viem';
import { celo } from 'viem/chains';
import { ADDRESSES, BIOTA_CARBON_ABI, BIOTA_STAGE_ABI } from '../contracts';
import { LabData, calculateBiologicalImpact, generateLabHash } from '../oracle';
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

/**
 * 🍄 Ticket BIO-205: Orquestación del Doble Minteo (Carbono Premium + Etapa)
 * @notice El Agente 8004 recibe los datos del laboratorio, usa el Oráculo para 
 *         calcular la biología, y emite 2 transacciones hacia la TBA del productor.
 */
export async function agentExecuteDoubleMint(tbaAddress: `0x${string}`, labData: LabData) {
  try {
    console.log(`🤖 Agente 8004 iniciando Doble Minteo para la TBA: ${tbaAddress}`);

    // 1. EL CEREBRO: Calcular Matemáticas y Criptografía
    console.log(`🧮 Consultando al Oráculo Matemático...`);
    const bioResult = calculateBiologicalImpact(labData);
    const labHash = generateLabHash(labData);
    
    console.log(`- Carbono Premium (Biomasa Viva): ${bioResult.carbonoBiomasaMicrobianaKg} Kg`);
    console.log(`- Carbono Total a Mintear: ${bioResult.carbonoTotalKilos} Kg`);
    console.log(`- Hash de Certificación: ${labHash}`);

    // La dirección base del agente (quien firma la transacción)
    // Extraída del Privy Auth Key o una llave privada del servidor configurada en .env
    // Privy server no expone la dirección pública de la llave de autorización directamente,
    // así que necesitamos que el Agente use una cuenta delegada o que asuma los fees.
    // Asumiremos que process.env.AGENT_ADDRESS tiene la dirección pública del agente.
    const agentAddress = (process.env.NEXT_PUBLIC_AGENT_ADDRESS || '0x699AD5EF840764db8CEe62569455bBE6081aA6b8') as `0x${string}`;

    const nonce = await publicClient.getTransactionCount({
      address: agentAddress,
    });

    const { maxFeePerGas, maxPriorityFeePerGas } = await publicClient.estimateFeesPerGas();

    // 2. PREPARAR TRANSACCIONES
    const txDataStage = encodeFunctionData({
      abi: BIOTA_STAGE_ABI,
      functionName: 'mintStage',
      args: [tbaAddress, labHash]
    });

    const txDataCarbon = encodeFunctionData({
      abi: BIOTA_CARBON_ABI,
      functionName: 'mintCarbon',
      args: [tbaAddress, bioResult.carbonoTotalWei]
    });

    console.log(`🔐 Solicitando 2 firmas delegadas a Privy Server Wallets (TEE)...`);

    // TRANSACCIÓN 1: BIOTA STAGE
    const stageResponse = await privy.walletApi.rpc({
      address: agentAddress,
      chainType: 'ethereum',
      method: 'eth_signTransaction',
      params: {
        transaction: {
          to: ADDRESSES.BIOTA_STAGE,
          value: "0x0",
          data: txDataStage,
          chainId: 42220,
          nonce: nonce,
          gasLimit: '0x493E0', // ~300k gas limit
          maxFeePerGas: `0x${maxFeePerGas.toString(16)}`,
          maxPriorityFeePerGas: `0x${maxPriorityFeePerGas.toString(16)}`,
        }
      }
    });

    if ('error' in stageResponse) throw new Error(`Privy Error Stage: ${(stageResponse.error as any).message}`);

    // TRANSACCIÓN 2: BIOTA CARBON (Nonce + 1)
    const carbonResponse = await privy.walletApi.rpc({
      address: agentAddress,
      chainType: 'ethereum',
      method: 'eth_signTransaction',
      params: {
        transaction: {
          to: ADDRESSES.BIOTA_CARBON,
          value: "0x0",
          data: txDataCarbon,
          chainId: 42220,
          nonce: nonce + 1,
          gasLimit: '0x493E0', // ~300k gas limit
          maxFeePerGas: `0x${maxFeePerGas.toString(16)}`,
          maxPriorityFeePerGas: `0x${maxPriorityFeePerGas.toString(16)}`,
        }
      }
    });

    if ('error' in carbonResponse) throw new Error(`Privy Error Carbon: ${(carbonResponse.error as any).message}`);

    // 3. TRANSMITIR A LA RED
    console.log(`📡 Transmitiendo transacciones a Celo Mainnet...`);
    const txHashStage = await publicClient.sendRawTransaction({ 
      serializedTransaction: stageResponse.data.signedTransaction as `0x${string}`
    });
    
    const txHashCarbon = await publicClient.sendRawTransaction({ 
      serializedTransaction: carbonResponse.data.signedTransaction as `0x${string}`
    });

    console.log(`✅ ¡Éxito! Stage Hash: ${txHashStage}`);
    console.log(`✅ ¡Éxito! Carbon Hash: ${txHashCarbon}`);

    return { 
      success: true, 
      stageTx: txHashStage, 
      carbonTx: txHashCarbon,
      kilos: bioResult.carbonoTotalKilos,
      hashCertificacion: labHash
    };

  } catch (error: any) {
    console.error('❌ Error en el Doble Minteo del Agente:', error.message || error);
    throw error;
  }
}
