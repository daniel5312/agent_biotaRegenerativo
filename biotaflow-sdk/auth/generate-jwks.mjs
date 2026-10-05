import fs from 'fs';
import crypto from 'crypto';

// 1. Leer la llave pública generada por OpenSSL
const publicKeyPem = fs.readFileSync('./biotaflow-sdk/auth/public.pem', 'utf8');

// 2. Convertir de formato PEM a JWK usando Node nativo
const publicKey = crypto.createPublicKey(publicKeyPem);
const jwk = publicKey.export({ format: 'jwk' });

// 3. Ensamblar la estructura exacta que exige la documentación de Open Payments
const openPaymentsJwks = {
  keys: [
    {
      kid: "biotaflow-key-1", // El ID único que usaremos para firmar
      alg: "EdDSA",
      kty: jwk.kty,
      crv: jwk.crv,
      x: jwk.x
    }
  ]
};

// 4. Guardar el archivo JSON resultante
fs.writeFileSync('./biotaflow-sdk/auth/jwks.json', JSON.stringify(openPaymentsJwks, null, 2));
console.log("✅ jwks.json generado exitosamente para BiotaFlow!");
