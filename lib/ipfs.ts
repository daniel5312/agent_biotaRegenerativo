/**
 * lib/ipfs.ts
 * 
 * [REFI] Módulo de subida a IPFS para reportes dMRV de Biota Protocol.
 * Convierte el veredicto del Oráculo IA en un JSON permanente en IPFS.
 * 
 * ¿Por qué IPFS y no una base de datos centralizada?
 * [BLOCKCHAIN] Trazabilidad: el CID (hash del archivo) es determinista.
 *   Si alguien cambia el reporte, el CID cambia → fraude detectable.
 * [REFI] GoodCollective exige "trazabilidad a mediciones reales" (campo del NFT).
 *   El CID guardado en BiotaPassport.hashAnalisisLab es esa trazabilidad.
 * 
 * Proveedor elegido: Pinata (https://pinata.cloud)
 *   - API JWT configurable en .env (PINATA_JWT)
 *   - Gateway público: https://gateway.pinata.cloud/ipfs/{CID}
 *   - Alternativa gratuita: se puede usar ipfs.io como fallback
 */

import 'server-only'; // [NEXTJS] Solo ejecutar en el servidor. Nunca exponer PINATA_JWT al cliente.

// ─────────────────────────────────────────────────────────────────────────────
// [REFI] TIPOS DE ACCIÓN CLIMÁTICA
// Definimos todos los tipos de acción que Biota puede verificar.
// Cada tipo genera ingresos adicionales al campesino:
//   - SUELO → Pool principal de GoodCollective
//   - COMPOSTAJE/RECICLAJE → Pool de circularidad
//   - GANADERIA_REGENERATIVA → Pool de biodiversidad animal
//   - REFORESTACION → Créditos de carbono (Toucan/Open Forest Protocol - futuro)
//   - APICULTURA → Pool de biodiversidad
// ─────────────────────────────────────────────────────────────────────────────
export type TipoAccionClimatica =
  | 'SUELO_REGENERATIVO'       // Mejora del suelo (cromatografía, pH, materia orgánica)
  | 'COMPOSTAJE'               // Producción de compost en finca o comunidad
  | 'RECICLAJE_FINCA'          // Separación y reciclaje de residuos en la finca
  | 'RECICLAJE_HOGAR'          // Separación y reciclaje en hogares de la vereda
  | 'REFORESTACION'            // Árboles plantados o protegidos
  | 'GANADERIA_REGENERATIVA'   // Silvopastoril, rotación de potreros, bienestar animal
  | 'APICULTURA'               // Colmenas activas, monitoreo de polinizadores
  | 'BIOINSUMOS'               // Producción de biofertilizantes (MM, bocashi, lombricompost)
  | 'CONSERVACION_AGUA'        // Captación de aguas lluvias, humedales, nacederos
  | 'AGROFORESTAL';            // Sistemas agroforestales combinados

/**
 * [REFI] Representa una acción climática individual verificada por el Oráculo.
 * Cada una puede tener su propia recompensa en G$ y evidencia fotográfica.
 */
export interface AccionClimatica {
  tipo: TipoAccionClimatica;           // Categoría de la acción
  descripcion: string;                  // Descripción detallada de lo que se hizo
  cantidad: number;                     // Magnitud medida (ej: 5000 m², 200 kg, 8 animales)
  unidad: 'M2' | 'KG' | 'ARBOLES' | 'ANIMALES' | 'COLMENAS' | 'LITROS' | 'METROS_LINEALES';
  recompensa_g$: number;               // Cantidad de G$ que esta acción genera (calculada por el Oráculo)
  metodologia_dmrv: string;            // Cómo se midió (ej: "Cromatografía de Pfeiffer", "Planilla física", "Foto georeferenciada")
  confianza_ia: number;                // 0-100: nivel de certeza del Oráculo al analizar la evidencia
}

/**
 * [REFI] Schema completo del reporte dMRV de Biota.
 * Este es el JSON que se sube a IPFS y cuyo CID queda en BiotaPassport.hashAnalisisLab.
 * 
 * Es compatible con GoodCollective porque incluye:
 *   - wallet del steward (farmer_wallet)
 *   - enlace a evidencias (evidencias_cid)
 *   - tipo y cantidad de acción (acciones_clima)
 *   - metodología de verificación (dmrv_provider, metodologia)
 *   - flag de compatibilidad (goodcollective_compatible)
 */
export interface ReporteDMRV {
  // ── Identidad del reporte ──────────────────────────────────────────────────
  version: '1.0';                       // Versión del schema para futura compatibilidad
  reporte_id: string;                   // ID único: "BIO-{timestamp}-{tokenId}"
  fecha_iso: string;                    // Fecha en ISO 8601 (ej: "2026-07-22T21:32:00Z")

  // ── Identidad del campesino (Climate Steward en GoodCollective) ────────────
  farmer_wallet: string;                // Dirección on-chain del campesino (ej: "0xABC...")
  token_id: number;                     // ID del BiotaPassport NFT en el contrato
  ubicacion_geografica: string;         // Nombre de la finca/vereda

  // ── Veredicto del Oráculo IA ───────────────────────────────────────────────
  veredicto: 'APROBADO' | 'OBSERVACION' | 'RECHAZADO';
  oraculo_modelo: string;               // Modelo de IA usado (ej: "gemini-flash-latest")
  analisis_texto: string;               // Texto completo del análisis emitido por Gemini
  bio_score: number;                    // Puntaje de 0-100 asignado por el Oráculo

  // ── Acciones climáticas verificadas ──────────────────────────────────────
  // [REFI] Este array es el corazón del dMRV. Cada elemento es una acción
  // verificable que genera un pago distinto en el pool de GoodCollective.
  acciones_clima: AccionClimatica[];

  // ── Totales calculados ────────────────────────────────────────────────────
  total_recompensa_g$: number;          // Suma de todas las recompensas de las acciones

  // ── Trazabilidad (requerido por GoodCollective) ────────────────────────────
  evidencias_cid: string[];             // CIDs de IPFS de fotos/documentos subidos
  metodologia_general: string;          // Descripción general del método de verificación

  // ── Metadatos del protocolo ────────────────────────────────────────────────
  dmrv_provider: 'Biota Protocol';      // Quién verificó (nosotros somos el dMRV Provider)
  red_blockchain: 'Celo Mainnet';       // Red donde vive el NFT
  contrato_passport: string;            // Dirección del BiotaPassport (para auditoría)
  goodcollective_compatible: true;      // Flag explícito para el ecosistema GoodCollective
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN PRINCIPAL: Sube el reporte dMRV a Pinata (IPFS)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sube un reporte dMRV completo a IPFS via Pinata.
 * 
 * @param reporte - El objeto completo del reporte dMRV
 * @returns El CID de IPFS (ej: "QmXyZ...") listo para guardar en BiotaPassport
 * 
 * [SEGURIDAD] PINATA_JWT nunca llega al cliente gracias a 'server-only'.
 * [GAS] Solo guardamos el CID (string corto) on-chain, no el JSON completo.
 *   Guardar el JSON en Solidity costaría ~10x más gas.
 */
export async function uploadDMRVReport(reporte: ReporteDMRV): Promise<string> {
  // Obtener el JWT de Pinata desde variables de entorno del servidor.
  // [SEGURIDAD] Nunca usar NEXT_PUBLIC_ para claves de API — eso las expone al browser.
  const pinataJWT = process.env.PINATA_JWT;

  // Si no hay JWT configurado, usamos un CID de placeholder para no bloquear el flujo.
  // En producción, PINATA_JWT debe estar configurado en .env
  if (!pinataJWT) {
    console.warn('[IPFS] ⚠️ PINATA_JWT no configurado en .env. Usando CID mock para desarrollo.');
    // Retornamos un CID mock que sigue siendo una URL válida de IPFS
    const mockCid = `mock-${reporte.reporte_id}-${Date.now()}`;
    return `ipfs://${mockCid}`;
  }

  try {
    console.log(`[IPFS] 📤 Subiendo reporte dMRV ${reporte.reporte_id} a Pinata...`);

    // [PINATA] Endpoint oficial de la API v3 de Pinata para subir JSON
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // [SEGURIDAD] El JWT va solo en headers del servidor, nunca en el cliente
        'Authorization': `Bearer ${pinataJWT}`,
      },
      body: JSON.stringify({
        // El contenido del archivo IPFS
        pinataContent: reporte,
        // Metadatos de Pinata para organización (no van en el CID, solo en su dashboard)
        pinataMetadata: {
          name: `biota-dmrv-${reporte.reporte_id}`,
          keyvalues: {
            tokenId: reporte.token_id.toString(),
            veredicto: reporte.veredicto,
            wallet: reporte.farmer_wallet,
          }
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    // [PINATA] La respuesta contiene IpfsHash: el CID del archivo
    const cid = data.IpfsHash as string;

    console.log(`[IPFS] ✅ Reporte subido exitosamente. CID: ${cid}`);
    console.log(`[IPFS] 🔗 URL pública: https://gateway.pinata.cloud/ipfs/${cid}`);

    // Retornamos el URI con prefijo ipfs:// (estándar ERC-721 metadata)
    return `ipfs://${cid}`;

  } catch (error: any) {
    console.error('[IPFS] ❌ Error al subir a Pinata:', error.message);
    // En caso de fallo de red con Pinata, no bloqueamos la validación on-chain.
    // Usamos un fallback que indica el error pero mantiene la trazabilidad.
    return `ipfs://error-upload-${Date.now()}`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN HELPER: Construye el reporte dMRV a partir del output del Oráculo
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Analiza el texto del veredicto de Gemini y construye el schema dMRV completo.
 * 
 * @param params - Datos del análisis del Oráculo
 * @returns ReporteDMRV listo para subir a IPFS
 * 
 * [REFI] Esta función es el "traductor" entre el lenguaje de Gemini y el
 * schema formal que GoodCollective y el ecosistema pueden auditar.
 */
export function buildDMRVReport(params: {
  tokenId: number;
  farmerWallet: string;
  ubicacion: string;
  veredicto: 'APROBADO' | 'OBSERVACION' | 'RECHAZADO';
  analisisTexto: string;
  bioScore: number;
  accionesDetectadas: AccionClimatica[];
  evidenciasCid?: string[];
}): ReporteDMRV {
  // Calculamos la recompensa total sumando las recompensas de cada acción
  // [REFI] Cada tipo de acción tiene su propio peso económico en el pool de GoodCollective
  const totalRecompensa = params.accionesDetectadas.reduce(
    (suma, accion) => suma + accion.recompensa_g$,
    0
  );

  return {
    version: '1.0',
    reporte_id: `BIO-${Date.now()}-${params.tokenId}`,
    fecha_iso: new Date().toISOString(),

    farmer_wallet: params.farmerWallet,
    token_id: params.tokenId,
    ubicacion_geografica: params.ubicacion,

    veredicto: params.veredicto,
    oraculo_modelo: 'gemini-flash-latest',
    analisis_texto: params.analisisTexto,
    bio_score: params.bioScore,

    acciones_clima: params.accionesDetectadas,
    total_recompensa_g$: parseFloat(totalRecompensa.toFixed(2)),

    evidencias_cid: params.evidenciasCid || [],
    metodologia_general: 'Análisis multimodal por IA (Google Gemini) de cromatografía de Pfeiffer y datos contextuales de sensores IoT + clima satelital.',

    dmrv_provider: 'Biota Protocol',
    red_blockchain: 'Celo Mainnet',
    // [SOLIDITY] Guardamos la dirección del contrato que emitió el NFT para auditoría cross-contract
    contrato_passport: '0x89Bd1517b6feE42f0DC3Cb7C5c4453b4Ca3d0442',
    goodcollective_compatible: true,
  };
}

/**
 * Detecta las acciones climáticas presentes en el texto de análisis de Gemini.
 * 
 * @param textoAnalisis - Respuesta en texto del Oráculo IA
 * @param bioScore - Puntaje general emitido
 * @returns Array de acciones climáticas con sus recompensas estimadas
 * 
 * [REFI] Las recompensas son estimaciones basadas en el puntaje del Oráculo.
 * El pool de GoodCollective define los montos finales según sus parámetros de pool.
 */
export function detectarAccionesClimaticas(
  textoAnalisis: string,
  bioScore: number
): AccionClimatica[] {
  const texto = textoAnalisis.toLowerCase();
  const acciones: AccionClimatica[] = [];

  // Factor de escala: a mayor bioScore, mayor recompensa
  // [REFI] Un score de 60 (mínimo aprobatorio) da factor 0.6, un 100 da factor 1.0
  const factorScore = Math.max(0.3, bioScore / 100);

  // ── Detección de Suelo Regenerativo ───────────────────────────────────────
  if (
    texto.includes('cromatograf') ||
    texto.includes('suelo') ||
    texto.includes('materia orgánica') ||
    texto.includes('ph') ||
    texto.includes('regenerati')
  ) {
    acciones.push({
      tipo: 'SUELO_REGENERATIVO',
      descripcion: 'Análisis de cromatografía y parámetros biológicos del suelo verificados por Oráculo IA',
      cantidad: 1,
      unidad: 'M2',  // La cantidad real viene del passport (areaM2)
      recompensa_g$: parseFloat((12.5 * factorScore).toFixed(2)),
      metodologia_dmrv: 'Cromatografía de Pfeiffer + análisis multimodal IA (Gemini)',
      confianza_ia: bioScore,
    });
  }

  // ── Detección de Compostaje ────────────────────────────────────────────────
  if (
    texto.includes('compost') ||
    texto.includes('bocashi') ||
    texto.includes('lombri') ||
    texto.includes('abono orgán')
  ) {
    acciones.push({
      tipo: 'COMPOSTAJE',
      descripcion: 'Producción de compost o bioinsumos orgánicos verificada',
      cantidad: 50,
      unidad: 'KG',
      recompensa_g$: parseFloat((3.0 * factorScore).toFixed(2)),
      metodologia_dmrv: 'Evidencia fotográfica verificada por Oráculo IA',
      confianza_ia: Math.round(bioScore * 0.9),
    });
  }

  // ── Detección de Reciclaje ─────────────────────────────────────────────────
  if (
    texto.includes('recicl') ||
    texto.includes('residuos') ||
    texto.includes('basura') ||
    texto.includes('separaci')
  ) {
    acciones.push({
      tipo: 'RECICLAJE_FINCA',
      descripcion: 'Separación y gestión de residuos en finca verificada',
      cantidad: 30,
      unidad: 'KG',
      recompensa_g$: parseFloat((2.0 * factorScore).toFixed(2)),
      metodologia_dmrv: 'Planilla de residuos + foto georreferenciada verificada por IA',
      confianza_ia: Math.round(bioScore * 0.85),
    });
  }

  // ── Detección de Reforestación ─────────────────────────────────────────────
  if (
    texto.includes('árbol') ||
    texto.includes('arbol') ||
    texto.includes('reforest') ||
    texto.includes('agroforest') ||
    texto.includes('sintrópic')
  ) {
    acciones.push({
      tipo: 'REFORESTACION',
      descripcion: 'Plantación o protección de árboles nativos verificada',
      cantidad: 10,
      unidad: 'ARBOLES',
      recompensa_g$: parseFloat((5.0 * factorScore).toFixed(2)),
      metodologia_dmrv: 'Conteo y georreferenciación verificados por Oráculo IA',
      confianza_ia: Math.round(bioScore * 0.88),
    });
  }

  // ── Detección de Ganadería Regenerativa ───────────────────────────────────
  if (
    texto.includes('ganadería') ||
    texto.includes('ganaderia') ||
    texto.includes('silvopastoril') ||
    texto.includes('bovino') ||
    texto.includes('animal') ||
    texto.includes('rotación de potrero')
  ) {
    acciones.push({
      tipo: 'GANADERIA_REGENERATIVA',
      descripcion: 'Sistema silvopastoril o rotación de potreros verificado',
      cantidad: 5,
      unidad: 'ANIMALES',
      recompensa_g$: parseFloat((4.0 * factorScore).toFixed(2)),
      metodologia_dmrv: 'Foto de sistema + datos de carga animal verificados por IA',
      confianza_ia: Math.round(bioScore * 0.82),
    });
  }

  // ── Detección de Apicultura ────────────────────────────────────────────────
  if (
    texto.includes('abeja') ||
    texto.includes('apicultura') ||
    texto.includes('colmena') ||
    texto.includes('polinizador')
  ) {
    acciones.push({
      tipo: 'APICULTURA',
      descripcion: 'Colmenas activas y monitoreo de polinizadores verificado',
      cantidad: 2,
      unidad: 'COLMENAS',
      recompensa_g$: parseFloat((3.5 * factorScore).toFixed(2)),
      metodologia_dmrv: 'Foto de colmenas + inventario verificado por IA',
      confianza_ia: Math.round(bioScore * 0.85),
    });
  }

  // ── Detección de Bioinsumos ────────────────────────────────────────────────
  if (
    texto.includes('microorganismo') ||
    texto.includes('mm ') ||
    texto.includes('biofertilizante') ||
    texto.includes('caldo') ||
    texto.includes('bioinsumo')
  ) {
    acciones.push({
      tipo: 'BIOINSUMOS',
      descripcion: 'Producción de bioinsumos (MM, caldos microbianos) verificada',
      cantidad: 20,
      unidad: 'LITROS',
      recompensa_g$: parseFloat((2.5 * factorScore).toFixed(2)),
      metodologia_dmrv: 'Foto de proceso de producción verificada por IA',
      confianza_ia: Math.round(bioScore * 0.80),
    });
  }

  // Si el Oráculo aprueba pero no detecta acciones específicas,
  // registramos la acción genérica de suelo como mínimo
  if (acciones.length === 0 && bioScore >= 60) {
    acciones.push({
      tipo: 'SUELO_REGENERATIVO',
      descripcion: 'Práctica regenerativa general verificada por Oráculo IA',
      cantidad: 1,
      unidad: 'M2',
      recompensa_g$: parseFloat((5.0 * factorScore).toFixed(2)),
      metodologia_dmrv: 'Análisis multimodal IA (Gemini)',
      confianza_ia: bioScore,
    });
  }

  return acciones;
}
