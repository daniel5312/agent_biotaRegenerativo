import { createWalletClient, http, publicActions } from 'viem';
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

  // Por defecto se conecta a un Fork Local (Anvil) si está corriendo, si no falla o conecta a Forno.
  // En el ticket 301 configuraremos el Fork exacto. Por ahora apuntamos al RPC genérico o local.
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545';

  const client = createWalletClient({
    account,
    chain: celo,
    transport: http(rpcUrl),
  }).extend(publicActions); // Para poder leer contratos (readContract)

  return { client, account, isMainnet };
};
