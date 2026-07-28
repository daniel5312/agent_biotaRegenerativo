import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  /* Ejecutar tests en paralelo */
  fullyParallel: true,
  /* Fallar el build de CI si hay un 'test.only' olvidado en el código */
  forbidOnly: !!process.env.CI,
  /* Reintentos automáticos */
  retries: process.env.CI ? 2 : 0,
  /* Workers */
  workers: process.env.CI ? 1 : undefined,
  /* Reportero de resultados */
  reporter: 'html',
  
  use: {
    /* La URL base de la app Next.js local */
    baseURL: 'http://localhost:3000',
    /* Trazas para depuración si el test falla */
    trace: 'on-first-retry',
  },

  /* Solo usamos Chromium para pruebas rápidas y eficientes Web3 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Arrancar el servidor Next.js antes de las pruebas de forma automática */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
