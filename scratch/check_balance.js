const { createPublicClient, http, formatEther } = require('viem');
const { celo } = require('viem/chains');

async function checkBalance() {
  const client = createPublicClient({
    chain: celo,
    transport: http('https://forno.celo.org')
  });

  const address = '0x6D4763715bf9cDe401FD4AaC9a6254CeB4382c9b'; // From .env NEXT_PUBLIC_PERSONAL_WALLET
  const balance = await client.getBalance({ address });
  console.log(`Balance of ${address}: ${formatEther(balance)} CELO`);
  
  // Also check the wallet from the PRIVATE_KEY
  const privateKey = '0xdda8394c4d4687debd5223b2463434214b8ccf22470a9812c64ca01d173789d9';
  // We need to derive address from PK. Let's use viem's privateKeyToAccount
  const { privateKeyToAccount } = require('viem/accounts');
  const account = privateKeyToAccount(privateKey);
  const balancePK = await client.getBalance({ address: account.address });
  console.log(`Balance of Agent Wallet (${account.address}): ${formatEther(balancePK)} CELO`);
}

checkBalance().catch(console.error);
