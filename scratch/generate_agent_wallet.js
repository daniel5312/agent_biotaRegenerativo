const { generatePrivateKey, privateKeyToAccount } = require('viem/accounts');

const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);

console.log("=== NUEVA WALLET DEL AGENTE (Cajero) ===");
console.log("AGENT_PRIVATE_KEY=" + privateKey);
console.log("NEXT_PUBLIC_AGENT_WALLET=" + account.address);
console.log("========================================");
console.log("Por favor, guarda estos valores en tu archivo .env");
