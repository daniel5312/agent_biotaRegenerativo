import { calculateBiologicalImpact, generateLabHash, LabData } from '../lib/oracle';

async function main() {
  console.log('🍄 Iniciando prueba del Oráculo Biota Microbiológico (BIO-104)...\n');

  // 1. Simular un JSON recibido de la DApp (Fase 1: Híbrido Manual + Lab)
  const mockLabData: LabData = {
    laboratorio: "Laboratorios Agro-Suelo Colombia",
    fecha: new Date().toISOString(),
    ubicacionGeografica: "Finca El Roble, Vereda San Juan",
    areaM2: 10000, // 1 hectárea
    materiaOrganicaPorcentaje: 5.5, // 5.5% de M.O.
    hongosPorcentaje: 75, // 75% Hongos
    bacteriasPorcentaje: 25, // 25% Bacterias
    ufc: 2.5e8, // 250 Millones UFC/g
    
    // [FASE 1] Evidencia Manual Inyectada
    phSueloManual: 6.8,
    temperaturaAmbiente: 24.5,
    humedadPorcentaje: 65,
    ipfsCromaUrl: "ipfs://bafybeibiz3zxtlzzp7eon...",
    ipfsVideoUrl: "ipfs://bafybeicb7q3l3q2v2y...",
    
    metodosAgricolas: "Agroforestería sintrópica sin arado",
    verificadoPor: "Dr. Carlos Ruiz"
  };

  console.log('📄 Datos Híbridos Simulados (Fase 1):');
  console.log(JSON.stringify(mockLabData, null, 2));

  // 2. Probar la Función Matemática ReFi Premium
  console.log('\n🧮 1. Calculando Impacto Biológico y Burbuja de Vida...');
  const bioResult = calculateBiologicalImpact(mockLabData);
  
  console.log(`- 📊 Porcentaje Materia Orgánica: ${mockLabData.materiaOrganicaPorcentaje}%`);
  console.log(`- 🍄 Ratio Fungi:Bacteria (F:B): ${bioResult.ratioFB}`);
  console.log(`- 📈 Índice de Vida Biota: ${bioResult.indiceVida}/100`);
  console.log(`- 🌍 Calidad del Suelo: ${bioResult.calidadSuelo}`);
  
  console.log(`\n📦 RESULTADOS PARA TOKENIZACIÓN Y VENTA (TOUCAN)`);
  console.log(`- 🌳 Carbono Total Secuestrado: ${bioResult.carbonoTotalKilos} Kg`);
  console.log(`- 🦠 [PREMIUM] Carbono de Biomasa Microbiana (La Burbuja Viva): ${bioResult.carbonoBiomasaMicrobianaKg} Kg`);
  console.log(`- 🚀 [PREMIUM] Tasa de Secuestro Anual Estimada (Hongos): ${bioResult.tasaSecuestroAnualEstimadaKg} Kg/Año`);

  // 3. Probar la Función Criptográfica
  console.log('\n🔐 2. Generando Hash de Seguridad (Incluyendo Evidencia Manual y Fotos)...');
  const labHash = generateLabHash(mockLabData);
  console.log(`- Hash SHA-256 (bytes32 EVM):`);
  console.log(`  ${labHash}`);

}

main().catch(console.error);
