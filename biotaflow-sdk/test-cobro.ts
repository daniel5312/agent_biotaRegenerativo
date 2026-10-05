import { BiotaFlowClient } from './core/BiotaFlowClient';
import * as fs from 'fs';
import * as path from 'path';

// 1. Leemos la llave privada secreta que generaste
const privateKeyPath = path.resolve(process.cwd(), './biotaflow-sdk/auth/private.pem');
const privateKeyString = fs.readFileSync(privateKeyPath, 'utf8');

// 2. Instanciamos tu SDK como si fueras a usarlo en tu servidor Next.js
const client = new BiotaFlowClient({
  // En Open Payments, para crear un recibo EN TU BILLETERA, usas TU URL como origen
  walletAddressUrl: 'https://ilp.interledger-test.dev/225f757', // Tu URL de Rafiki
  privateKey: privateKeyString,
  keyId: '88f97526-9b67-4703-9807-ddfeb16a7b21' // <-- ¡EL UUID REAL DE RAFIKI!
});

async function runTest() {
  console.log("🚀 Iniciando prueba de la Red Interledger...");
  
  try {
    // 3. Vamos a crear una factura/recibo por 5.00 EUR
    const invoiceUrl = await client.createChargeInvoice(
      'https://ilp.interledger-test.dev/225f757', // Tu URL de Rafiki
      {
        value: '500',       // 500 centavos = 5.00
        assetCode: 'EUR',   // Moneda de tu cuenta de Rafiki
        assetScale: 2       // 2 decimales
      }
    );

    console.log("🎉 ¡ÉXITO! Recibo creado y listo para ser pagado.");
    console.log("Puedes ver el JSON oficial de este recibo abriendo esta URL en tu navegador:");
    console.log(invoiceUrl);

  } catch (error) {
    console.error("🔥 Error en la prueba:", error);
  }
}

// Ejecutar
runTest();