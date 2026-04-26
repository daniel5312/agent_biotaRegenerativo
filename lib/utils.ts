import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generatePassportMetadata(data: {
  ubicacion: string;
  areaM2: number;
  estado: string;
  metodos: string;
  image?: string;
}) {
  const metadata = {
    name: `Pasaporte Biota: ${data.ubicacion}`,
    description: `Este pasaporte certifica la transición regenerativa en ${data.ubicacion}. Biota Protocol: Suelo Vivo.`,
    image: data.image || "ipfs://bafybeibiz3zxtlzzp7eon7jzw4tqf4scj2u2x6sc6p7u7p7p7p7p7p7p7p",
    attributes: [
      { trait_type: "Ubicación", value: data.ubicacion },
      { trait_type: "Área (m2)", value: data.areaM2 },
      { trait_type: "Estado Inicial", value: data.estado },
      { trait_type: "Métodos", value: data.metodos },
      { trait_type: "Protocolo", value: "Biota v1.0" }
    ]
  };

  const jsonString = JSON.stringify(metadata);
  const base64 = typeof btoa !== 'undefined' 
    ? btoa(jsonString) 
    : Buffer.from(jsonString).toString('base64');
    
  return `data:application/json;base64,${base64}`;
}
