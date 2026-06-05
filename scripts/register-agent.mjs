import { createWalletClient, createPublicClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celo } from 'viem/chains';

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error("❌ Falta PRIVATE_KEY en el archivo .env. Añade la llave de la wallet 0x1f90...");

  const account = privateKeyToAccount(privateKey);
  console.log(`🤖 Billetera del Agente: ${account.address}`);

  const publicClient = createPublicClient({
    chain: celo,
    transport: http(process.env.NEXT_PUBLIC_RPC_URL || "https://forno.celo.org")
  });

  const walletClient = createWalletClient({
    account,
    chain: celo,
    transport: http(process.env.NEXT_PUBLIC_RPC_URL || "https://forno.celo.org")
  });

  // Dirección oficial del contrato ERC-8004 en Celo Mainnet
  const registryAddress = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";
  
  // ABI con las firmas que necesitamos para registrar y leer el ID
  const abi = parseAbi([
    'function register(string agentURI) external returns (uint256)',
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
  ]);

  // URI que apunta al archivo JSON en tu repositorio de GitHub (debe estar en main)
  const agentURI = "https://raw.githubusercontent.com/daniel5312/agent_biotaRegenerativo/main/agent-metadata.json";
  console.log(`📝 Registrando con Agent URI: ${agentURI}`);

  console.log("🌐 Enviando transacción a Celo Mainnet...");
  try {
    const hash = await walletClient.writeContract({
      address: registryAddress,
      abi: abi,
      functionName: 'register',
      args: [agentURI]
    });

    console.log(`⏳ Transacción enviada. Hash: ${hash}`);
    console.log("Esperando confirmación de la red...");

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    // Buscar el evento Transfer para extraer el Agent ID (tokenId)
    const transferEvent = receipt.logs.find(log => 
      // keccak256("Transfer(address,address,uint256)")
      log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' 
    );

    if (transferEvent && transferEvent.topics[3]) {
      const tokenId = BigInt(transferEvent.topics[3]).toString();
      console.log("\n✅ ¡REGISTRO EXITOSO!");
      console.log("-------------------------------------------------");
      console.log(`🎯 TU AGENT ID ES: ${tokenId}`);
      console.log("-------------------------------------------------");
      console.log(`👉 Acción Requerida: Copia este ID y agrégalo a tu .env como:`);
      console.log(`   NEXT_PUBLIC_SELF_AGENT_ID=${tokenId}`);
    } else {
      console.log("⚠️ Transacción exitosa, pero no se pudo extraer el Token ID. Revisa el Hash en Celoscan.");
    }

  } catch (error) {
    console.error("❌ Error durante el registro del agente:", error);
  }
}

main();
