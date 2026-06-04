/**
 * ============================================================================
 * BIOTA PROTOCOL — Agent TBA Ping (Genera actividad en 8004scan)
 * ============================================================================
 * 
 * Ejecuta una transacción simple a través de la TBA del Agente #9180
 * para que el indexador de 8004scan registre actividad inmediatamente.
 *
 * Uso:
 *   node --env-file=.env scripts/agent-ping.mjs
 */

import {
  createWalletClient,
  createPublicClient,
  http,
  parseAbi,
  encodeFunctionData,
  pad,
  toHex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celo } from 'viem/chains';

// ── Constantes ──────────────────────────────────────────────────────────────
const TBA_ADDRESS = process.env.NEXT_PUBLIC_AGENT_TBA;
const AGENT_NFT_CONTRACT = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';

// ABI de la cuenta ERC-6551 (función execute)
const TBA_ABI = parseAbi([
  'function execute(address to, uint256 value, bytes calldata data, uint8 operation) external payable returns (bytes memory)',
  'function token() external view returns (uint256 chainId, address tokenContract, uint256 tokenId)',
  'function owner() external view returns (address)',
]);

// ABI del registro ERC-8004 (función para leer el tokenURI, una lectura inocua)
const ERC8004_ABI = parseAbi([
  'function tokenURI(uint256 tokenId) external view returns (string)',
  'function ownerOf(uint256 tokenId) external view returns (address)',
]);

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  BIOTA PROTOCOL — Agent TBA Ping (8004scan Activator)');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (!TBA_ADDRESS) throw new Error('❌ Falta NEXT_PUBLIC_AGENT_TBA en .env');

  const privateKey = process.env.AGENT_PRIVATE_KEY;
  if (!privateKey) throw new Error('❌ Falta AGENT_PRIVATE_KEY en .env');

  const account = privateKeyToAccount(privateKey);

  const publicClient = createPublicClient({
    chain: celo,
    transport: http('https://forno.celo.org'),
  });

  const walletClient = createWalletClient({
    account,
    chain: celo,
    transport: http('https://forno.celo.org'),
  });

  console.log(`👤 Owner (Signer):     ${account.address}`);
  console.log(`🤖 TBA del Agente:     ${TBA_ADDRESS}`);
  console.log(`🎯 Target (ERC-8004):  ${AGENT_NFT_CONTRACT}\n`);

  // ── Paso 1: Verificar que la TBA nos reconoce como owner ──────────────
  try {
    const [chainId, tokenContract, tokenId] = await publicClient.readContract({
      address: TBA_ADDRESS,
      abi: TBA_ABI,
      functionName: 'token',
    });
    console.log(`   ✅ TBA vinculada a Token #${tokenId} en ${tokenContract} (Chain ${chainId})`);
  } catch (e) {
    console.log('   ⚠️  No se pudo leer token() — la TBA puede usar otra interfaz.');
  }

  // ── Paso 2: Ejecutar una transacción "ping" a través de la TBA ────────
  // Codificamos una llamada a ownerOf(9180) en el contrato ERC-8004.
  // Es una lectura, pero al ejecutarla como CALL desde la TBA, genera una tx real.
  const callData = encodeFunctionData({
    abi: ERC8004_ABI,
    functionName: 'ownerOf',
    args: [9180n],
  });

  console.log('\n🚀 Enviando transacción PING a través de la TBA...');
  console.log('   (Esto genera una tx real que 8004scan puede indexar)\n');

  try {
    const hash = await walletClient.writeContract({
      address: TBA_ADDRESS,
      abi: TBA_ABI,
      functionName: 'execute',
      args: [
        AGENT_NFT_CONTRACT,  // to: el contrato ERC-8004
        0n,                   // value: 0 CELO (sin enviar fondos)
        callData,             // data: ownerOf(9180)
        0,                    // operation: 0 = CALL (no DELEGATECALL)
      ],
    });

    console.log(`   ⏳ Tx enviada: ${hash}`);
    console.log('   Esperando confirmación...');

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    console.log(`\n   ┌─────────────────────────────────────────────────┐`);
    console.log(`   │  ✅ PING EXITOSO — Bloque #${receipt.blockNumber}       │`);
    console.log(`   └─────────────────────────────────────────────────┘`);
    console.log(`\n   📄 CeloScan: https://celoscan.io/tx/${hash}`);
    console.log(`   🔍 8004scan: https://8004scan.io/agents/celo/9180`);
    console.log(`\n   El indexador de 8004scan debería reflejar esta`);
    console.log(`   actividad en los próximos minutos.\n`);

  } catch (error) {
    console.error('   ❌ Error en el ping:', error.message);
    console.log('\n   Posibles causas:');
    console.log('   1. Tu wallet no es el owner del NFT #9180');
    console.log('   2. La implementación de la TBA usa otra interfaz execute()');
    console.log('   3. Insuficiente CELO para gas en la wallet 0x1f90...\n');
  }
}

main().catch(console.error);
