import { createPublicClient, http, parseEther } from 'viem'
import { celo } from 'viem/chains'

const client = createPublicClient({
  chain: celo,
  transport: http()
})

const abi = [
  {
    "type": "function",
    "name": "mintPasaporte",
    "inputs": [
      { "name": "tokenURI", "type": "string" },
      { "name": "_ubicacionGeografica", "type": "string" },
      { "name": "_areaM2", "type": "uint32" },
      { "name": "_cmSueloRecuperado", "type": "uint32" },
      { "name": "_estadoBiologico", "type": "string" },
      { "name": "_hashAnalisisLab", "type": "string" },
      { "name": "_ingredientesHash", "type": "string" },
      { "name": "_metodosAgricolas", "type": "string" }
    ],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "payable"
  }
]

async function main() {
  try {
    const { request } = await client.simulateContract({
      address: '0x89Bd1517b6feE42f0DC3Cb7C5c4453b4Ca3d0442',
      abi: abi,
      functionName: 'mintPasaporte',
      args: [
        'ipfs://biota',
        'chocho 2',
        1000,
        0,
        'Iniciado',
        '0x',
        'juan jose vargas',
        'Regenerativo'
      ],
      value: parseEther('0.01'),
      account: '0xB3224aEf960A5B138d799a58Eb0F8ef1b0808094'
    })
    console.log("Success! Simulation passed.")
  } catch (error) {
    console.error("Simulation failed with:")
    console.error(error.message)
  }
}

main()
