import { createWalletClient, http, publicActions, testActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celo } from 'viem/chains';

/**
 * Cliente Web3 "Fantasma" para el Robot de QA.
 * Usa la llave privada del .env para simular transacciones reales o en el Fork local.
 */
export const getQASigner = () => {
  // Leemos si estamos apuntando a Forno (Mainnet) o al Espejo (Local)
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545';
  const isMainnet = rpcUrl.includes('forno.celo.org') || rpcUrl.includes('mainnet');

  // Si es Mainnet usa tu llave de Rabby, si es Local usa la llave de Anvil
  const pk = isMainnet ? process.env.QA_PRIVATE_KEY_MAINNET : process.env.QA_PRIVATE_KEY_LOCAL;
  
  if (!pk) {
    throw new Error(`⚠️ Faltal: No se encontró la llave privada para el entorno ${isMainnet ? 'MAINNET' : 'LOCAL'}. Revisa tu .env`);
  }

  // Aseguramos que tenga formato hex
  const formattedPk = pk.startsWith('0x') ? (pk as `0x${string}`) : (`0x${pk}` as `0x${string}`);
  
  const account = privateKeyToAccount(formattedPk);


  const client = createWalletClient({
    account,
    chain: celo,
    transport: http(rpcUrl),
  })
    .extend(publicActions)
    .extend(testActions({ mode: 'anvil' })); // Habilita los Poderes de Dios en Anvil

  return { client, account, isMainnet };
};
