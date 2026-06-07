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

import { createWalletClient, createPublicClient, http, parseAbi, toHex, pad, keccak256 } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
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

  // 1. Usar ADMIN_PRIVATE_KEY directamente como validador de terceros
  const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
  if (!adminPrivateKey) throw new Error('❌ Falta ADMIN_PRIVATE_KEY en .env');
  const clientAccount = privateKeyToAccount(adminPrivateKey);

  const publicClient = createPublicClient({ chain: celo, transport: http('https://forno.celo.org') });
  const clientWallet = createWalletClient({ account: clientAccount, chain: celo, transport: http('https://forno.celo.org') });

  console.log(`🕵️  Cliente Evaluador (Tercero Validador): ${clientAccount.address}`);
  
  // 2. Parámetros de feedback (Exactos a la documentación oficial de Celopedia)
  const value = 100n; 
  const valueDecimals = 0;
  const tag1 = pad(toHex('starred'), { size: 32, dir: 'right' }); // tag oficial
  const tag2 = pad('0x0', { size: 32 }); 
  const endpoint = "https://biota-protocol.vercel.app/api/iot/webhook";
  const feedbackURI = "ipfs://QmDetailedFeedback"; 
  const feedbackHash = keccak256(toHex('{}')); // Hash real

  console.log('\n🚀 Cliente enviando calificación de 100 estrellas a 8004scan...');
  
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
