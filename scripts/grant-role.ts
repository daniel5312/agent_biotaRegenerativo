import { createWalletClient, createPublicClient, http, encodeFunctionData, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celo } from 'viem/chains';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

const BIOTA_CARBON_ADDRESS = '0xB537CFb2F3ef9821e68462C4C6FB3763Cd682B47';
const AGENT_ADDRESS = '0x1f90a029013609246573f8B3519C8e352333AB0C';
const MINTER_ROLE = '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6';

const BIOTA_CARBON_ABI = [
  {
    "inputs": [
      { "internalType": "bytes32", "name": "role", "type": "bytes32" },
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "grantRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

async function main() {
  if (!process.env.ADMIN_PRIVATE_KEY) {
    console.error("❌ ERROR: Falta ADMIN_PRIVATE_KEY en el .env");
    process.exit(1);
  }

  const account = privateKeyToAccount(process.env.ADMIN_PRIVATE_KEY as `0x${string}`);
  
  const publicClient = createPublicClient({
    chain: celo,
    transport: http()
  });

  const walletClient = createWalletClient({
    account,
    chain: celo,
    transport: http()
  });

  console.log(`🔐 Autenticado como Admin: ${account.address}`);
  console.log(`⏳ Otorgando MINTER_ROLE al Agente ${AGENT_ADDRESS}...`);

  try {
    const { request } = await publicClient.simulateContract({
      account,
      address: BIOTA_CARBON_ADDRESS,
      abi: BIOTA_CARBON_ABI,
      functionName: 'grantRole',
      args: [MINTER_ROLE, AGENT_ADDRESS],
    });

    const txHash = await walletClient.writeContract(request);
    
    console.log(`✅ ¡ÉXITO! Transacción enviada.`);
    console.log(`🔗 Hash: https://celoscan.io/tx/${txHash}`);
    console.log(`\n🎉 Tu Agente ya tiene permiso permanente para mintear carbono.`);
    console.log(`⚠️ RECUERDA: Ya puedes borrar ADMIN_PRIVATE_KEY de tu .env por seguridad.`);

  } catch (error) {
    console.error("❌ Falló la transacción:", error);
  }
}

main();
