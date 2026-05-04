// lib/superfluid-utils.ts
// Utilidades para cálculos de Superfluid y Money Streaming
// Basado en el estándar de 365 días para máxima precisión.

/**
 * Convierte un monto mensual (en unidades enteras, ej: 1000 G$) 
 * a la tasa de wei por segundo requerida por Superfluid.
 * 
 * Fórmula: (Monto * 10^Decimals) / ((365/12) * 24 * 60 * 60)
 */
export function calculateFlowRate(monthlyAmount: number, decimals: number = 18): bigint {
  if (monthlyAmount <= 0) return 0n;

  const secondsInMonth = (365 * 24 * 60 * 60) / 12; // 2,628,000 segundos
  const totalWei = BigInt(monthlyAmount) * BigInt(10 ** decimals);
  
  return totalWei / BigInt(Math.floor(secondsInMonth));
}

/**
 * Calcula cuánto se ha acumulado desde una fecha base dada una tasa de flujo.
 * Útil para el "Reloj de Saldo" en movimiento en la UI.
 */
export function calculateAccumulated(flowRate: bigint, lastUpdateTimestamp: number): bigint {
  const now = Math.floor(Date.now() / 1000);
  const elapsed = BigInt(now - lastUpdateTimestamp);
  
  if (elapsed < 0n) return 0n;
  return flowRate * elapsed;
}

// Constante pre-calculada para el Sueldo Regenerativo de 2,000 G$
// (2000 * 10^18) / 2,628,000
export const REGENERATIVE_SALARY_FLOWRATE = calculateFlowRate(2000); 
