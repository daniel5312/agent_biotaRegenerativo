import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
import { privateKeyToAccount } from 'viem/accounts';

async function main() {
  if (!process.env.AGENT_PRIVATE_KEY) throw new Error("Falta AGENT_PRIVATE_KEY");
  const account = privateKeyToAccount(process.env.AGENT_PRIVATE_KEY as `0x${string}`);
  
  console.log("\n===============================================");
  console.log("🤖 IDENTIDAD DEL AGENTE BIOTA 8004");
  console.log("===============================================");
  console.log("Dirección Pública:", account.address);
  console.log("Hash MINTER_ROLE: 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6");
  console.log("===============================================\n");
}
main();
