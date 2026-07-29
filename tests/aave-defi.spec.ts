import { test, expect } from '@playwright/test';
import { getQASigner } from './utils/web3-signer';
import { parseUnits, parseAbi } from 'viem';

// ABI minimalista para ERC20
const ERC20_ABI = parseAbi([
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)'
]);

const CUSD_ADDRESS = '0x765DE816845861e75A25fCA122bb6898B8B1282a';
// Una billetera rica en CUSD en Celo (Mento Reserve u otro contrato grande)
const CUSD_WHALE = '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1';

test.describe('DeFi: Fondo de Recompensas (Aave) - Integración Headless', () => {

  test('God Mode: Inyectar cUSD y verificar lectura del Pool de Aave', async () => {
    const { client, account, isMainnet } = getQASigner();

    // Solo ejecutamos los Poderes de Dios si estamos en el clon de Anvil (Local)
    if (!isMainnet) {
      console.log('🤖 MODO DIOS ACTIVADO: Inyectando cUSD mágico al bot de pruebas...');
      
      // 1. Nos disfrazamos de la ballena millonaria
      await client.impersonateAccount({ address: CUSD_WHALE });

      // 2. Le inyectamos CELO a la ballena por si no tiene gas
      await client.setBalance({
        address: CUSD_WHALE,
        value: parseUnits('10', 18)
      });

      // 3. La ballena nos transfiere 100 cUSD (ya que descubrimos que solo tenía 230 cUSD en la snapshot actual)
      const tx = await client.writeContract({
        address: CUSD_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [account.address, parseUnits('100', 18)],
        account: CUSD_WHALE,
        chain: client.chain,
      });

      // Dejamos de ser la ballena
      await client.stopImpersonatingAccount({ address: CUSD_WHALE });

      // 4. Forzamos a Anvil a minar un bloque instantáneamente para que la transacción se confirme
      await client.mine({ blocks: 1 });
      
      console.log('✅ cUSD inyectado con éxito en el tx:', tx);
    }

    // 4. Verificamos que nuestro bot realmente tiene el dinero
    const balance = await client.readContract({
      address: CUSD_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [account.address],
    });

    console.log(`💰 Saldo actual del Robot: ${balance.toString()} cUSD (en wei)`);
    
    // Si estamos en Local y se inyectó, el saldo debe ser mayor a 0
    if (!isMainnet) {
      expect(balance > 0n).toBeTruthy();
    }
  });

});
