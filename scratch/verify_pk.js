const { privateKeyToAccount } = require('viem/accounts');
require('dotenv').config({ path: '../.env' });

// La PK que está en el .env del usuario
const pk = process.env.PRIVATE_KEY;

try {
    if (!pk) throw new Error("No hay PRIVATE_KEY en .env");
    const account = privateKeyToAccount(pk);
    console.log('--- DERIVACIÓN DE WALLET ---');
    console.log('Private Key (input):', pk.slice(0, 6) + '...');
    console.log('Public Address (derived):', account.address);
    console.log('---------------------------');
} catch (e) {
    console.error('Error derivando la llave:', e.message);
}
