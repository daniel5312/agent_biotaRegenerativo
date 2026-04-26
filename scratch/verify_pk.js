const { privateKeyToAccount } = require('viem/accounts');

// La PK que está en el .env del usuario
const pk = '0xdda8394c4d4687debd5223b2463434214b8ccf22470a9812c64ca01d173789d9';

try {
    const account = privateKeyToAccount(pk);
    console.log('--- DERIVACIÓN DE WALLET ---');
    console.log('Private Key (input):', pk.slice(0, 6) + '...');
    console.log('Public Address (derived):', account.address);
    console.log('---------------------------');
} catch (e) {
    console.error('Error derivando la llave:', e.message);
}
