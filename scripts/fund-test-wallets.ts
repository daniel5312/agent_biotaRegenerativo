// scripts/fund-test-wallets.ts
// Este script inyecta cUSD, USDT y G$ a tus billeteras de prueba en Anvil.
// Impersona a las "Ballenas" (Whales) de Celo Mainnet para robarles fondos en tu entorno local.

import { createTestClient, createPublicClient, createWalletClient, http, parseUnits, parseEther, custom } from 'viem';
import { celo } from 'viem/chains';
import { ADDRESSES, ERC20_ABI } from '../lib/contracts'; // Asegúrate de que las rutas sean correctas

// Billetera que quieres fondear (Reemplaza con tu llave pública de Anvil/MetaMask)
const MY_TEST_WALLET = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; 

// Direcciones de las Ballenas en Celo Mainnet (Tienen millones de tokens)
const WHALES = {
  CUSD: "0x8D6677192144292870907E3Fa8A5527fE55A7ff6", // Mento Reserve u otra ballena de cUSD
  USDT: "0x8D6677192144292870907E3Fa8A5527fE55A7ff6", // Ballena USDT
  G$:   "0x43d72Ff17701B2DA814620735C39C620Ce0ea4A1"  // GoodDollar UBI Scheme (Tiene millones de G$)
};

async function main() {
  console.log(`[ANVIL GOD MODE] Iniciando fondeo a la billetera: ${MY_TEST_WALLET}`);

  // Cliente de pruebas conectado a tu nodo local (Anvil)
  const testClient = createTestClient({
    chain: celo,
    mode: 'anvil',
    transport: http('http://127.0.0.1:8545'),
  });

  const publicClient = createPublicClient({
    chain: celo,
    transport: http('http://127.0.0.1:8545'),
  });

  // Función genérica para robar tokens de una ballena
  async function robWhale(tokenName: string, tokenAddress: `0x${string}`, whaleAddress: `0x${string}`, amountStr: string, decimals: number) {
    console.log(`\n🦸‍♂️ Impersonando a la ballena de ${tokenName} (${whaleAddress})...`);
    
    // 1. Darle CELO a la ballena para que pueda pagar el gas de la transferencia
    await testClient.setBalance({
      address: whaleAddress,
      value: parseEther("10")
    });

    // 2. Impersonar a la ballena
    await testClient.impersonateAccount({
      address: whaleAddress,
    });

    // 3. Crear cliente de wallet actuando como la ballena
    const whaleWallet = createWalletClient({
      account: whaleAddress,
      chain: celo,
      transport: http('http://127.0.0.1:8545'),
    });

    const amount = parseUnits(amountStr, decimals);

    // 4. Transferir los tokens a tu billetera
    console.log(`💸 Transfiriendo ${amountStr} ${tokenName} a tu billetera...`);
    const hash = await whaleWallet.writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [MY_TEST_WALLET as `0x${string}`, amount],
    });

    await publicClient.waitForTransactionReceipt({ hash });
    
    // 5. Dejar de impersonar
    await testClient.stopImpersonatingAccount({
      address: whaleAddress,
    });
    
    console.log(`✅ ¡Éxito! Robaste ${amountStr} ${tokenName} de la ballena.`);
  }

  try {
    // Robar 10,000 cUSD (18 decimales)
    await robWhale("cUSD", ADDRESSES.CUSD as `0x${string}`, WHALES.CUSD as `0x${string}`, "10000", 18);
    
    // Robar 10,000 USDT (6 decimales)
    await robWhale("USDT", ADDRESSES.USDT as `0x${string}`, WHALES.USDT as `0x${string}`, "10000", 6);
    
    // Robar 500,000 G$ (2 decimales)
    await robWhale("G$", ADDRESSES["G$"] as `0x${string}`, WHALES.G$ as `0x${string}`, "500000", 2);

    console.log(`\n🎉 Fondeo completado. Tu billetera ${MY_TEST_WALLET} ahora es millonaria en Anvil.`);
  } catch (error) {
    console.error("❌ Error en el fondeo:", error);
  }
}

main();
