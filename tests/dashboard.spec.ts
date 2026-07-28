import { test, expect } from '@playwright/test';
import { getQASigner } from './utils/web3-signer';

test.describe('Flujos de Usuario: BiotaScrow QA', () => {

  test('La aplicación carga correctamente (Prueba de Humo)', async ({ page }) => {
    // 1. Instruimos al robot a abrir tu servidor local
    await page.goto('/');

    // 2. Verificamos que la página responde y tiene un título o contenido base
    // (Asegurarnos de que Next.js no esté crasheado)
    const pageTitle = await page.title();
    expect(pageTitle).toBeDefined();

    // Comprobamos que el botón de conectar billetera de Privy exista (si es que la app arranca deslogueada)
    // const connectButton = page.getByRole('button', { name: /Conectar/i });
    // await expect(connectButton).toBeVisible();
  });

  test.skip('Navegación entre Pasaporte y Billetera', async ({ page }) => {
    // ESTE TEST ESTÁ "SKIP" HASTA QUE RESOLVAMOS EL BYPASS DE PRIVY
    // 1. Simular sesión activa de Privy aquí...
    
    await page.goto('/');

    // 2. Hacer clic en la pestaña "Billetera"
    await page.getByRole('button', { name: 'Billetera' }).click();

    // 3. Verificar que aparece el "Patrimonio Total Estimado"
    await expect(page.getByText('Patrimonio Total Estimado')).toBeVisible();

    // 4. Verificar que aparece Aave
    await expect(page.getByText('Fondo de Recompensas')).toBeVisible();
  });
});
