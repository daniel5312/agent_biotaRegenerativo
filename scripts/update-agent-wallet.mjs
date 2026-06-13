import { createWalletClient, createPublicClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celo } from 'viem/chains';

// ── Constantes ──────────────────────────────────────────────────────────────
const REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';
const TOKEN_ID = 9180n;
const NEW_WALLET = '0x699AD5EF840764db8CEe62569455bBE6081aA6b8'; // La TBA
const AGENT_URI = 'https://raw.githubusercontent.com/daniel5312/agent_biotaRegenerativo/main/agent-metadata.json';

// Posibles firmas para actualizar la wallet o la URI
const REGISTRY_ABI = parseAbi([
  'function setAgentWallet(uint256 tokenId, address wallet) external',
  'function updateWallet(uint256 tokenId, address wallet) external',
  'function setAgentURI(uint256 tokenId, string calldata newURI) external',
  'function setTokenURI(uint256 tokenId, string calldata newURI) external'
]);

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  BIOTA PROTOCOL — Forzando Actualización On-Chain');
  console.log('═══════════════════════════════════════════════════════════\n');

  const privateKey = process.env.AGENT_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error('❌ Falta AGENT_PRIVATE_KEY en .env');

  const account = privateKeyToAccount(privateKey);
  const publicClient = createPublicClient({ chain: celo, transport: http('https://forno.celo.org') });
  const walletClient = createWalletClient({ account, chain: celo, transport: http('https://forno.celo.org') });

  console.log(`👤 Ejecutando como: ${account.address}`);
  console.log(`🎯 Intentando vincular TBA: ${NEW_WALLET} al Agent ID: ${TOKEN_ID}\n`);

  // Intentos de ejecución
  const attempts = [
    { name: 'setAgentWallet', args: [TOKEN_ID, NEW_WALLET] },
    { name: 'updateWallet', args: [TOKEN_ID, NEW_WALLET] },
    { name: 'setAgentURI', args: [TOKEN_ID, AGENT_URI] },
    { name: 'setTokenURI', args: [TOKEN_ID, AGENT_URI] }
  ];

  for (const attempt of attempts) {
    console.log(`🔄 Intentando función: ${attempt.name}...`);
    try {
      const hash = await walletClient.writeContract({
        address: REGISTRY,
        abi: REGISTRY_ABI,
        functionName: attempt.name,
        args: attempt.args,
      });
      
      console.log(`   ⏳ Tx enviada: ${hash}`);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log(`   ✅ ÉXITO! La función ${attempt.name} funcionó.`);
      console.log(`   📄 https://celoscan.io/tx/${hash}`);
      console.log('\n🎉 ¡Listo! El contrato ha sido actualizado exitosamente.');
      return; // Salir si tuvimos éxito
    } catch (e) {
      console.log(`   ❌ Falló o no existe: ${e.message.split('\n')[0]}`);
    }
  }

  console.log('\n⚠️ Ninguna de las funciones estándar funcionó.');
  console.log('Es posible que este contrato no permita cambiar la wallet después de mintear.');
}

main().catch(console.error);
