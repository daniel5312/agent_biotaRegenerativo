import { test, expect } from '@playwright/test';
import { getQASigner } from './utils/web3-signer';

test.describe('Flujos de Usuario: BiotaScrow QA', () => {

  // Antes de cada prueba, inyectamos el flag de Debug para saltarnos la pantalla de Landing
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('BIOTA_DEBUG', 'true');
      localStorage.setItem('BIOTA_ROLE', 'PRODUCER'); // Para que entre a Pasaporte directamente
    });
  });

  test('La aplicación carga correctamente (Prueba de Humo)', async ({ page }) => {
    await page.goto('/');
    
    // Verificamos que el título de la página exista
    const pageTitle = await page.title();
    expect(pageTitle).toBeDefined();
  });

  // ¡Le quitamos el test.skip porque ahora el robot tiene permiso de entrar!
  test('Navegación entre Pasaporte y Billetera', async ({ page }) => {
    await page.goto('/');

    // DEBUG: Imprimir el texto de la página para ver si estamos en la Landing o en el Dashboard
    const bodyText = await page.innerHTML('body');
    console.log('HTML DE LA PÁGINA:', bodyText.substring(0, 1000));
    await page.screenshot({ path: 'playwright-debug.png' });

    // Hacemos clic en el botón interno de "Billetera" (que es el tab de navegación interno de PasaporteView)
    // Usamos un selector más flexible que no dependa del rol exacto si la UI cambia
    const billeteraBtn = page.locator('button:has-text("Billetera")').first();
    
    // Asegurarse de que el botón esté visible antes de hacer clic
    await expect(billeteraBtn).toBeVisible({ timeout: 15000 });
    await billeteraBtn.click();

    // Verificamos que se renderice el componente de Inversor/Billetera
    await expect(page.locator('text=Patrimonio Total Estimado')).toBeVisible({ timeout: 10000 });
  });

});
