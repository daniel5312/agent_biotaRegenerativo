import { createWalletClient, createPublicClient, http, parseAbi, parseEther } from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { celo } from 'viem/chains';

const IDENTITY_REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';

const ABI = parseAbi([
  'function register(string agentURI) external returns (uint256)'
]);

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  BIOTA PROTOCOL — Desplegando Agente Dedicado (Plan B)');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Tu wallet ADMIN que tiene los fondos
  const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
  if (!adminPrivateKey) throw new Error('❌ Falta ADMIN_PRIVATE_KEY en .env');
  const adminAccount = privateKeyToAccount(adminPrivateKey);

  // 1. Generar la Billetera Dedicada del Agente
  const agentPrivateKey = generatePrivateKey();
  const agentAccount = privateKeyToAccount(agentPrivateKey);

  const publicClient = createPublicClient({ chain: celo, transport: http('https://forno.celo.org') });
  const adminWallet = createWalletClient({ account: adminAccount, chain: celo, transport: http('https://forno.celo.org') });
  const agentWallet = createWalletClient({ account: agentAccount, chain: celo, transport: http('https://forno.celo.org') });

  console.log(`👤 Tu MetaMask: ${adminAccount.address}`);
  console.log(`🤖 NUEVA Wallet del Agente: ${agentAccount.address}`);
  console.log(`🔑 NUEVA Private Key del Agente: ${agentPrivateKey}\n`);
  console.log('⚠️ GUARDA ESTA PRIVATE KEY. LA PONDRÁS EN TU .ENV COMO AGENT_PRIVATE_KEY ⚠️\n');

  // 2. Fondear la nueva wallet del Agente
  console.log('💸 Fondeando al Agente con 0.02 CELO para el registro...');
  const fundHash = await adminWallet.sendTransaction({
    to: agentAccount.address,
    value: parseEther('0.02')
  });
  await publicClient.waitForTransactionReceipt({ hash: fundHash });
  console.log('   ✅ Fondeo exitoso.\n');

  // 3. Registrar el Agente usando la nueva wallet
  console.log('🚀 Registrando el nuevo Agente en ERC-8004 Identity Registry...');
  // Usamos el URI del JSON que ya arreglamos y validamos ayer!
  const agentURI = "https://raw.githubusercontent.com/daniel5312/agent_biotaRegenerativo/main/agent-metadata.json";

  try {
    const txHash = await agentWallet.writeContract({
      address: IDENTITY_REGISTRY,
      abi: ABI,
      functionName: 'register',
      args: [agentURI],
    });

    console.log(`   ⏳ Tx enviada: ${txHash}`);
    
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    
    // Obtener el Agent ID del evento (el token ID minteado)
    const logs = receipt.logs;
    // Asumiendo que el Transfer event es el primero y el topic 3 es el tokenId
    const agentIdHex = logs[0].topics[3];
    const newAgentId = BigInt(agentIdHex).toString();

    console.log(`   ✅ ÉXITO ABSOLUTO! Bloque #${receipt.blockNumber}`);
    console.log(`   📄 CeloScan: https://celoscan.io/tx/${txHash}`);
    console.log(`\n🎉 NUEVO AGENT ID: ${newAgentId}`);
    console.log(`🌐 Míralo en: https://8004scan.io/agents/celo/${newAgentId}`);
    
  } catch (error) {
    console.error('❌ Error registrando el agente:', error.shortMessage || error.message);
  }
}

main().catch(console.error);
