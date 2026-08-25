import { createHash } from 'crypto';
import { parseEther } from 'viem';

/**
 * @title Biota Oracle Math (Advanced Microbiology & Hybrid Evidence)
 * @notice Librería pura para cálculos científicos y criptográficos (Ticket BIO-104).
 * @dev Diseñado para aceptar datos manuales/básicos en Fase 1, y sensores IoT en Fase 2.
 */

export interface LabData {
  laboratorio: string;
  fecha: string;
  ubicacionGeografica: string;
  areaM2: number;
  materiaOrganicaPorcentaje: number;
  hongosPorcentaje: number;
  bacteriasPorcentaje: number;
  ufc: number; // Unidades Formadoras de Colonias por gramo
  
  // [EVIDENCIA HÍBRIDA FASE 1]
  phSueloManual?: number; // Lectura de PHMetro básico
  temperaturaAmbiente?: number; // Termómetro estándar
  humedadPorcentaje?: number; 
  ipfsCromaUrl?: string; // Foto de la cromatografía
  ipfsVideoUrl?: string; // Video de la finca/proceso
  
  metodosAgricolas: string;
  verificadoPor: string;
  [key: string]: any; // Soporta inyección futura de sensores IoT automáticos
}

export interface BiologicalResult {
  carbonoTotalKilos: number;
  carbonoTotalWei: bigint;
  
  // [LA BURBUJA VIVA]
  carbonoBiomasaMicrobianaKg: number; // Kilos de carbono DENTRO de los hongos/bacterias
  tasaSecuestroAnualEstimadaKg: number; // Kilos extra generados por la glomalina
  
  ratioFB: number;
  indiceVida: number; // 0 a 100
  calidadSuelo: "Degradado" | "Transición" | "Bosque Regenerado" | "Excelente";
}

/**
 * Convierte el Porcentaje de Materia Orgánica y la vida microbiana en métricas ReFi Premium.
 */
export function calculateBiologicalImpact(data: LabData): BiologicalResult {
  // --- 1. CÁLCULO DE CARBONO TOTAL (Suelo) ---
  const factorVanBemmelen = 1.724;
  const densidadAparente = 1.2; // ton/m3
  const profundidadM = 0.3; // 30 cm

  const cosPorcentaje = data.materiaOrganicaPorcentaje / factorVanBemmelen;
  const masaTotalTon = (data.areaM2 * profundidadM) * densidadAparente;
  const toneladasCarbono = masaTotalTon * (cosPorcentaje / 100);
  const carbonoTotalKilos = Math.round(toneladasCarbono * 1000 * 100) / 100;
  const carbonoTotalWei = parseEther(carbonoTotalKilos.toString());

  // --- 2. CÁLCULO MICROBIOLÓGICO (F:B RATIO) ---
  const ratioFB = data.hongosPorcentaje / (data.bacteriasPorcentaje || 1);

  // --- 3. ÍNDICE DE VIDA (0 a 100) ---
  let indiceVida = 0;
  if (data.ufc > 1e8) indiceVida += 40;
  else if (data.ufc > 1e6) indiceVida += 20;

  if (ratioFB >= 1.0) indiceVida += 60;
  else if (ratioFB >= 0.5) indiceVida += 40;
  else if (ratioFB >= 0.1) indiceVida += 10;

  if (data.materiaOrganicaPorcentaje < 2.0) indiceVida -= 20;
  indiceVida = Math.max(0, Math.min(100, indiceVida));

  // --- 4. CLASIFICACIÓN DEL SUELO ---
  let calidadSuelo: BiologicalResult["calidadSuelo"] = "Degradado";
  if (indiceVida >= 80) calidadSuelo = "Excelente";
  else if (indiceVida >= 60) calidadSuelo = "Bosque Regenerado";
  else if (indiceVida >= 30) calidadSuelo = "Transición";

  // --- 5. LA BURBUJA VIVA (MBC - Microbial Biomass Carbon) ---
  // Representa el % del carbono total que está literalmente vivo.
  // Un suelo con Indice de Vida 100, tiene ~3% de carbono vivo.
  const porcentajeVivo = (indiceVida / 100) * 0.03; 
  const carbonoBiomasaMicrobianaKg = Math.round((carbonoTotalKilos * porcentajeVivo) * 100) / 100;

  // --- 6. TASA DE SECUESTRO (Glomalina) ---
  // Hongos altos = Alta creación futura de suelo.
  // Un bosque regenerado secuestra ~10 toneladas (10,000 Kg) por hectárea al año.
  const baseSecuestroHectarea = 10000; 
  const hectareas = data.areaM2 / 10000;
  const factorFungico = Math.min(ratioFB, 5) / 5; // Normalizar hasta ratio 5
  const tasaSecuestroAnualEstimadaKg = Math.round((baseSecuestroHectarea * hectareas * factorFungico) * 100) / 100;

  return {
    carbonoTotalKilos,
    carbonoTotalWei,
    carbonoBiomasaMicrobianaKg,
    tasaSecuestroAnualEstimadaKg,
    ratioFB: Math.round(ratioFB * 100) / 100,
    indiceVida,
    calidadSuelo
  };
}

/**
 * Genera el Hash criptográfico (Huella Dactilar) de TODOS los datos (Fotos, Sensores Básicos, Microbiología).
 */
export function generateLabHash(labData: LabData): `0x${string}` {
  const sortedKeys = Object.keys(labData).sort();
  const sortedData: any = {};
  
  sortedKeys.forEach(key => {
    sortedData[key] = labData[key];
  });

  const jsonString = JSON.stringify(sortedData);
  const hash = createHash('sha256').update(jsonString).digest('hex');

  return `0x${hash}` as `0x${string}`;
}
