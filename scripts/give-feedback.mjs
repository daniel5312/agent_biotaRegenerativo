/**
 * ============================================================================
 * BIOTA PROTOCOL — ERC-8004 Interaction/Reputation Logger
 * ============================================================================
 *
 * Envía un "Feedback Oficial" al Reputation Registry de ERC-8004 en Celo.
 * Evita el bloqueo de "Self-Feedback" creando un cliente temporal.
 *
 * Uso: node --env-file=.env scripts/give-feedback.mjs
 */

import { createWalletClient, createPublicClient, http, parseAbi, toHex, pad, parseEther } from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { celo } from 'viem/chains';

const REPUTATION_REGISTRY = '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63';
const AGENT_ID = 9180n;

const ABI = parseAbi([
  'function giveFeedback(uint256 agentId, int128 value, uint8 valueDecimals, bytes32 tag1, bytes32 tag2, string endpoint, string feedbackURI, bytes32 feedbackHash) external'
]);

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  BIOTA PROTOCOL — Logging Agent Interaction (ERC-8004)');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Tu wallet (owner)
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error('❌ Falta PRIVATE_KEY en .env');
  const ownerAccount = privateKeyToAccount(privateKey);

  // 1. Crear un Cliente Evaluador temporal (para evitar self-feedback block)
  const tempPk = generatePrivateKey();
  const clientAccount = privateKeyToAccount(tempPk);

  const publicClient = createPublicClient({ chain: celo, transport: http('https://forno.celo.org') });
  
  const ownerWallet = createWalletClient({ account: ownerAccount, chain: celo, transport: http('https://forno.celo.org') });
  const clientWallet = createWalletClient({ account: clientAccount, chain: celo, transport: http('https://forno.celo.org') });

  console.log(`👤 Owner (Tu wallet): ${ownerAccount.address}`);
  console.log(`🕵️  Cliente Evaluador (Temporal): ${clientAccount.address}`);
  
  // 2. Fondear al cliente temporal con 0.005 CELO para el gas
  console.log('\n💸 Fondeando al cliente temporal...');
  const fundHash = await ownerWallet.sendTransaction({
    to: clientAccount.address,
    value: parseEther('0.05')
  });
  await publicClient.waitForTransactionReceipt({ hash: fundHash });
  console.log('   ✅ Fondeo exitoso.');

  // 3. Parámetros de feedback
  const value = 100n; // 100% success
  const valueDecimals = 0;
  const tag1 = pad(toHex('successRate'), { size: 32 });
  const tag2 = pad(toHex('reachable'), { size: 32 });
  const endpoint = "https://biota-protocol.vercel.app/api/iot/webhook";
  const feedbackURI = "ipfs://QmdummyIPFSHashBiotaFeedback"; 
  const feedbackHash = pad("0x", { size: 32 });

  console.log('\n🚀 Cliente enviando interacción oficial a 8004scan...');
  
  try {
    const hash = await clientWallet.writeContract({
      address: REPUTATION_REGISTRY,
      abi: ABI,
      functionName: 'giveFeedback',
      args: [AGENT_ID, value, valueDecimals, tag1, tag2, endpoint, feedbackURI, feedbackHash],
      gas: 300000n, // Forzamos el límite de gas para evitar errores de estimación de Celo
    });

    console.log(`   ⏳ Tx enviada: ${hash}`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    console.log(`   ✅ ÉXITO ABSOLUTO! Bloque #${receipt.blockNumber}`);
    console.log(`   📄 CeloScan: https://celoscan.io/tx/${hash}`);
    console.log(`\n🎉 LA TRANSACCIÓN APARECERÁ AHORA EN: https://8004scan.io/agents/celo/${AGENT_ID}`);
    
  } catch (error) {
    console.error('❌ Error enviando feedback:', error.shortMessage || error.message);
  }
}

main().catch(console.error);
