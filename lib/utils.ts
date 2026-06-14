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

export function compressImage(file: File, maxWidth: number = 800, quality: number = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scaleSize = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Failed to get canvas context'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}
