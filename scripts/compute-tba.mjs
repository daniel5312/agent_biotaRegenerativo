/**
 * ============================================================================
 * BIOTA PROTOCOL — Compute & Create Token Bound Account (ERC-6551)
 * ============================================================================
 * 
 * Este script hace 2 cosas:
 * 1. CALCULA la dirección determinística de la TBA para el Agent NFT #9180
 * 2. CREA la cuenta on-chain llamando createAccount() en el registro ERC-6551
 *
 * Uso:
 *   node --env-file=.env scripts/compute-tba.mjs
 * 
 * Requiere: viem (ya está en package.json)
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  encodePacked,
  keccak256,
  getContractAddress,
  pad,
  toHex,
  parseAbi,
  concat,
  encodeAbiParameters,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celo } from 'viem/chains';

// ── Constantes ERC-6551 ─────────────────────────────────────────────────────
// Registro canónico ERC-6551 (misma dirección en TODAS las cadenas EVM)
const ERC6551_REGISTRY = '0x000000006551c19487814612e58FE06813775758';

// Implementación de referencia oficial de la cuenta ERC-6551
// (La más común desplegada junto al registro)
const ERC6551_ACCOUNT_IMPL = '0x55266d75D1a14E4572138116aF39863Ed6596E7F';

// ── Datos de Nuestro Agente ─────────────────────────────────────────────────
const AGENT_NFT_CONTRACT = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432'; // Contrato ERC-8004 Identity
const AGENT_TOKEN_ID = 9180n;
const CHAIN_ID = 42220n; // Celo Mainnet
const SALT = 0n; // Salt por defecto (0)

// ── ABI del Registro ERC-6551 ───────────────────────────────────────────────
const registryAbi = parseAbi([
  'function createAccount(address implementation, bytes32 salt, uint256 chainId, address tokenContract, uint256 tokenId) external returns (address)',
  'function account(address implementation, bytes32 salt, uint256 chainId, address tokenContract, uint256 tokenId) external view returns (address)',
]);

// ── Función para calcular la dirección TBA localmente (sin RPC) ─────────────
function computeTBAAddress(implementation, salt, chainId, tokenContract, tokenId) {
  // El bytecode de inicialización del proxy ERC-6551
  // Ref: https://eips.ethereum.org/EIPS/eip-6551#registry
  const creationCode = concat([
    '0x3d60ad80600a3d3981f3363d3d373d3d3d363d73',
    implementation,
    '0x5af43d82803e903d91602b57fd5bf3',
    encodeAbiParameters(
      [
        { type: 'bytes32' },
        { type: 'uint256' },
        { type: 'address' },
        { type: 'uint256' },
      ],
      [pad(toHex(salt), { size: 32 }), chainId, tokenContract, tokenId]
    ),
  ]);

  const saltHash = keccak256(
    encodePacked(
      ['bytes32', 'uint256', 'address', 'uint256'],
      [pad(toHex(salt), { size: 32 }), chainId, tokenContract, tokenId]
    )
  );

  return getContractAddress({
    bytecode: creationCode,
    from: ERC6551_REGISTRY,
    opcode: 'CREATE2',
    salt: saltHash,
  });
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  BIOTA PROTOCOL — ERC-6551 Token Bound Account Resolver');
  console.log('═══════════════════════════════════════════════════════════\n');

  const privateKey = process.env.AGENT_PRIVATE_KEY;
  if (!privateKey) throw new Error('❌ Falta AGENT_PRIVATE_KEY en .env');

  const account = privateKeyToAccount(privateKey);
  console.log(`👤 Owner/Signer (tu wallet):  ${account.address}`);
  console.log(`🆔 Agent Token ID:            ${AGENT_TOKEN_ID}`);
  console.log(`📜 NFT Contract (ERC-8004):   ${AGENT_NFT_CONTRACT}`);
  console.log(`🔗 Cadena:                    Celo Mainnet (${CHAIN_ID})`);
  console.log(`📦 ERC-6551 Registry:         ${ERC6551_REGISTRY}`);
  console.log(`🧱 Account Implementation:    ${ERC6551_ACCOUNT_IMPL}\n`);

  // ── Paso 1: Calcular la dirección TBA (off-chain, pura matemática) ──────
  const publicClient = createPublicClient({
    chain: celo,
    transport: http('https://forno.celo.org'),
  });

  // Opción A: Consultar al registro on-chain (más fiable)
  let tbaAddress;
  try {
    tbaAddress = await publicClient.readContract({
      address: ERC6551_REGISTRY,
      abi: registryAbi,
      functionName: 'account',
      args: [
        ERC6551_ACCOUNT_IMPL,
        pad(toHex(SALT), { size: 32 }),
        CHAIN_ID,
        AGENT_NFT_CONTRACT,
        AGENT_TOKEN_ID,
      ],
    });
    console.log('📍 Dirección TBA calculada (vía Registry on-chain):');
  } catch {
    // Opción B: Cálculo local si el read falla
    tbaAddress = computeTBAAddress(
      ERC6551_ACCOUNT_IMPL,
      SALT,
      CHAIN_ID,
      AGENT_NFT_CONTRACT,
      AGENT_TOKEN_ID
    );
    console.log('📍 Dirección TBA calculada (vía CREATE2 local):');
  }

  console.log(`\n   ┌─────────────────────────────────────────────────┐`);
  console.log(`   │  🤖 TBA DEL AGENTE: ${tbaAddress}  │`);
  console.log(`   └─────────────────────────────────────────────────┘\n`);

  // ── Paso 2: Verificar si la TBA ya existe (tiene código desplegado) ─────
  const code = await publicClient.getCode({ address: tbaAddress });
  const tbaExists = code && code !== '0x';

  if (tbaExists) {
    console.log('✅ La TBA YA EXISTE on-chain. No necesitas crear nada.');
    console.log('   Solo actualiza tu .env con la dirección de arriba.\n');
  } else {
    console.log('⚠️  La TBA aún NO existe on-chain. Necesitamos crearla.');
    console.log('   Ejecutando createAccount() en el registro ERC-6551...\n');

    const walletClient = createWalletClient({
      account,
      chain: celo,
      transport: http('https://forno.celo.org'),
    });

    try {
      const hash = await walletClient.writeContract({
        address: ERC6551_REGISTRY,
        abi: registryAbi,
        functionName: 'createAccount',
        args: [
          ERC6551_ACCOUNT_IMPL,
          pad(toHex(SALT), { size: 32 }),
          CHAIN_ID,
          AGENT_NFT_CONTRACT,
          AGENT_TOKEN_ID,
        ],
      });

      console.log(`   ⏳ Tx enviada: ${hash}`);
      console.log('   Esperando confirmación...');

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log(`   ✅ TBA CREADA EXITOSAMENTE en bloque #${receipt.blockNumber}`);
      console.log(`   📄 CeloScan: https://celoscan.io/tx/${hash}\n`);
    } catch (error) {
      console.error('   ❌ Error al crear TBA:', error.message);
      console.log('\n   Si falla, intenta con otra implementación de cuenta.');
      console.log('   Puedes buscar implementaciones verificadas en:');
      console.log('   https://tokenbound.org/contracts/deployments\n');
    }
  }

  // ── Instrucciones Finales ───────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  📋 PRÓXIMOS PASOS:');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  1. Actualiza tu .env:`);
  console.log(`     NEXT_PUBLIC_AGENT_TBA=${tbaAddress}`);
  console.log(`  2. A partir de ahora, todas las transacciones del agente`);
  console.log(`     deben ejecutarse DESDE esta dirección TBA.`);
  console.log(`  3. El indexador de 8004scan detectará automáticamente`);
  console.log(`     cualquier transacción ejecutada desde esta TBA.`);
  console.log('═══════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
