import { createPublicClient, createWalletClient, http, encodeFunctionData, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celo } from 'viem/chains';
import { ADDRESSES, BIOTA_CARBON_ABI, BIOTA_STAGE_ABI, ERC20_ABI } from '../contracts';
import { LabData, calculateBiologicalImpact, generateLabHash } from '../oracle';

/**
 * 🏃 Sprint 1: Ticket-003 - Motor Relayer del Agente (Refactor Nativo)
 * 
 * Este archivo se ejecuta SOLO en el servidor.
 * Utiliza la AGENT_PRIVATE_KEY local para máxima velocidad y descentralización.
 */

// Inicialización del Account usando la llave privada del Agente
const account = privateKeyToAccount(
  (process.env.AGENT_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000000') as `0x${string}`
);

const walletClient = createWalletClient({
  account,
  chain: celo,
  transport: http("https://forno.celo.org")
});

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

    console.log(`🔐 Firmando y enviando transacción con Viem (Local)...`);
    
    // 2. Ejecutar la firma de forma nativa
    const txHash = await walletClient.sendTransaction({
      to: UBISCHEME_ADDRESS as `0x${string}`,
      value: 0n,
      data: txData as `0x${string}`,
      nonce: nonce,
      gas: 200000n, // ~200k gas limit approx
      maxFeePerGas,
      maxPriorityFeePerGas,
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

    // [EVM] Buscamos la dirección del Agente.
    // Viem extrae automáticamente la dirección pública desde la llave privada.
    const agentAddress = account.address;

    // =========================================================================
    // 🧠 EL CEREBRO FINANCIERO (FALLBACK DE GAS CIP-64) - [CELOPEDIA]
    // =========================================================================
    // Le enseñamos al agente a revisar sus bolsillos antes de ir a pagar el peaje.
    // Regla de Celopedia: Si no mandas 'feeCurrency', se paga en CELO.
    // Si mandas 'feeCurrency' con el Adapter, se paga en esa stablecoin.
    
    let selectedFeeCurrency: `0x${string}` | undefined = undefined; // Por defecto: CELO

    console.log(`🔎 [CELOPEDIA] Verificando liquidez del Agente para pagar el Gas...`);
    const celoBalance = await publicClient.getBalance({ address: agentAddress });
    
    // Si tenemos menos de 0.001 CELO, entramos en pánico y usamos el Fallback.
    if (celoBalance < parseEther("0.001")) {
      console.log(`⚠️ CELO Nativo insuficiente. Activando Fallback a Stablecoins (CIP-64)...`);
      
      // Chequeamos si el agente tiene USDC (Mínimo 1 centavo: 10,000 wei de 6 decimales)
      const usdcBalance = await publicClient.readContract({
        address: ADDRESSES.USDC, abi: ERC20_ABI, functionName: 'balanceOf', args: [agentAddress]
      }) as bigint;

      if (usdcBalance > 10000n) {
        console.log(`💸 Pagando el Gas en USDC (Adapter: ${ADDRESSES.USDC_ADAPTER})`);
        selectedFeeCurrency = ADDRESSES.USDC_ADAPTER;
      } else {
        // Si no hay USDC, chequeamos USDT
        const usdtBalance = await publicClient.readContract({
          address: ADDRESSES.USDT, abi: ERC20_ABI, functionName: 'balanceOf', args: [agentAddress]
        }) as bigint;

        if (usdtBalance > 10000n) {
          console.log(`💸 Pagando el Gas en USDT (Adapter: ${ADDRESSES.USDT_ADAPTER})`);
          selectedFeeCurrency = ADDRESSES.USDT_ADAPTER;
        } else {
          console.warn(`🚨 ALERTA CRÍTICA: El Agente 8004 no tiene fondos para gas en CELO, USDC, ni USDT.`);
          // Si llega aquí, se intentará enviar en CELO pero probablemente falle si está en cero.
        }
      }
    } else {
      console.log(`🟢 Saldo CELO saludable. Pagando Gas en nativo.`);
    }
    // =========================================================================

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

    console.log(`🔐 Firmando y enviando transacciones localmente con Viem...`);

    // TRANSACCIÓN 1: BIOTA STAGE [REFI]
    const stageTxHash = await walletClient.sendTransaction({
      to: ADDRESSES.BIOTA_STAGE,
      value: 0n,
      data: txDataStage,
      nonce: nonce,
      gas: 300000n, // ~300k gas limit
      maxFeePerGas,
      maxPriorityFeePerGas,
      feeCurrency: selectedFeeCurrency // CIP-64 Gas Abstraction
    });

    console.log(`✅ ¡Éxito! Stage Hash: ${stageTxHash}`);

    // TRANSACCIÓN 2: BIOTA CARBON (Nonce + 1) [REFI]
    const carbonTxHash = await walletClient.sendTransaction({
      to: ADDRESSES.BIOTA_CARBON,
      value: 0n,
      data: txDataCarbon,
      nonce: nonce + 1, // Vital para orden en la blockchain
      gas: 300000n,
      maxFeePerGas,
      maxPriorityFeePerGas,
      feeCurrency: selectedFeeCurrency // CIP-64 Gas Abstraction
    });

    console.log(`✅ ¡Éxito! Carbon Hash: ${carbonTxHash}`);

    return { 
      success: true, 
      stageTx: stageTxHash, 
      carbonTx: carbonTxHash,
      kilos: bioResult.carbonoTotalKilos,
      hashCertificacion: labHash
    };

  } catch (error: any) {
    console.error('❌ Error en el Doble Minteo del Agente:', error.message || error);
    throw error;
  }
}
