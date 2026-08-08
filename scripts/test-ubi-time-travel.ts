import { createTestClient, http } from 'viem';
import { celo } from 'viem/chains';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 🏃 Sprint 1: Ticket-003 - Script QA Viaje en el Tiempo (Anvil)
 * 
 * Este script asume que tienes Anvil corriendo localmente:
 * npm run test:fork
 */
async function main() {
  console.log("==========================================");
  console.log("🕰️ MÁQUINA DEL TIEMPO BIOTA (ANVIL QA)");
  console.log("==========================================");

  // 1. Conectarse al simulador local Anvil
  const testClient = createTestClient({
    chain: celo,
    mode: 'anvil',
    transport: http('http://127.0.0.1:8545'),
  });

  console.log("⏳ Adelantando el reloj blockchain por 24 horas (86400 segundos)...");

  // 2. Ejecutar comando especial de Anvil para avanzar en el tiempo
  await testClient.increaseTime({ seconds: 86400 });

  // 3. Minar un nuevo bloque para que los contratos registren el cambio de tiempo
  await testClient.mine({ blocks: 1 });

  console.log("✅ Viaje en el tiempo exitoso. ¡Estamos en el futuro!");

  console.log("\n🚀 Disparando la API del Despertador...");

  // Leer el secreto directamente del .env para evitar errores de tipeo
  const envPath = path.join(process.cwd(), '.env');
  const envFile = fs.readFileSync(envPath, 'utf-8');
  const cronSecretMatch = envFile.match(/CRON_SECRET=(.*)/);
  const cronSecret = cronSecretMatch ? cronSecretMatch[1].trim() : 'super_secret_biota_2026';

  // ATENCIÓN: Cambia esta dirección por tu billetera inteligente real con la que te logueaste
  // (La que empieza por 0x...)
  const testAddress = "0x27a7242ecA9725fc78776A5E3F362aFE2E730962";

  // 4. Llamar a nuestra API local
  const response = await fetch("http://localhost:3000/api/cron/ubi", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${cronSecret}`
    },
    body: JSON.stringify({
      addresses: [testAddress]
    })
  });

  const data = await response.json();
  console.log("\n📝 Resultado del Despertador:");
  console.dir(data, { depth: null });
  console.log("==========================================");
}

main().catch((error) => {
  console.error("❌ Error en el viaje en el tiempo:", error);
});
