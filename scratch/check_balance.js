// scratch/check_balance.js
require('dotenv').config({ path: '../.env' }); // Cargar variables de forma segura
const { createPublicClient, http, formatEther } = require('viem');
const { celo } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');

async function checkBalance() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error("Falta PRIVATE_KEY en .env");

  const account = privateKeyToAccount(privateKey);
  
  const client = createPublicClient({
    chain: celo,
    transport: http('https://forno.celo.org')
  });

  const balancePK = await client.getBalance({ address: account.address });
  console.log(`Balance de la Wallet: ${formatEther(balancePK)} CELO`);
}
checkBalance().catch(console.error);
