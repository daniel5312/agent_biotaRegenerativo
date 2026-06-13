import { createPublicClient, http, parseAbi, stringToHex, pad, toHex, keccak256 } from 'viem';
import { celo } from 'viem/chains';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';

const REPUTATION_REGISTRY = '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63';
const AGENT_ID = 9180n;

const ABI = parseAbi([
  'function giveFeedback(uint256 agentId, int128 value, uint8 valueDecimals, bytes32 tag1, bytes32 tag2, string endpoint, string feedbackURI, bytes32 feedbackHash) external'
]);

async function main() {
  console.log('🔍 Iniciando simulación de diagnóstico...');

  const publicClient = createPublicClient({ chain: celo, transport: http('https://forno.celo.org') });
  
  // Usamos la wallet ADMIN como cliente (tiene fondos pero NO es la dueña del agente)
  const clientPrivateKey = process.env.ADMIN_PRIVATE_KEY;
  if (!clientPrivateKey) throw new Error('Falta ADMIN_PRIVATE_KEY');
  const clientAccount = privateKeyToAccount(clientPrivateKey);

  const value = 100n;
  const valueDecimals = 0;
  // En Solidity, los bytes32 son strings right-padded. stringToHex hace el right-padding automático.
  const tag1 = stringToHex('successRate', { size: 32 });
  const tag2 = stringToHex('reachable', { size: 32 });
  const endpoint = "https://biota-protocol.vercel.app/api/iot/webhook";
  const feedbackURI = "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"; 
  const feedbackHash = pad('0x0', { size: 32 });

  try {
    console.log('Simulando giveFeedback...');
    const { request } = await publicClient.simulateContract({
      account: clientAccount.address,
      address: REPUTATION_REGISTRY,
      abi: ABI,
      functionName: 'giveFeedback',
      args: [
        9180n,                                // agentId
        85n,                                  // value (score 0-100, according to docs)
        0,                                    // valueDecimals
        pad(toHex('starred'), { size: 32, dir: 'right' }), // tag1: category
        pad('0x0', { size: 32 }),             // tag2: empty according to docs
        'https://biota-protocol.vercel.app/api/iot/webhook', // endpoint
        'ipfs://QmDetailedFeedback',          // feedbackURI (from docs example)
        keccak256(toHex('{}'))                // feedbackHash (must be keccak256)
      ],
    });
    console.log('✅ La simulación fue EXITOSA. La transacción no debería fallar.');
  } catch (error) {
    console.error('❌ SIMULACIÓN FALLIDA. Motivo exacto:');
    console.error(error.shortMessage || error.message);
    if (error.metaMessages) {
      console.error(error.metaMessages.join('\n'));
    }
  }
}

main().catch(console.error);
