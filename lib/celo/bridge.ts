/**
 * [CELOPEDIA] stablecoin-orchestration.md
 * Módulo Core: Orquestador Fiat ↔ Cripto usando Bridge (adquirido por Stripe).
 * 
 * [REFI] Propósito: Habilitar "Web3 Invisible". Permitir que Sponsors fondeen el ecosistema 
 * con tarjetas/bancos (On-Ramp) y que los Campesinos retiren a sus bancos locales (Off-Ramp) 
 * sin salir de la red Celo, sin pagar gas (gracias a Fee Abstraction) y sin usar exchanges.
 */

// [NODE.JS] Usamos crypto nativo para generar Idempotency Keys (requeridas por Bridge)
import { randomUUID } from "crypto";

// [EVM/CELO] Aseguramos que la clave de API exista en el entorno
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY || "";

// [CELOPEDIA] Base URL de la API de Bridge en Producción
const BRIDGE_BASE_URL = "https://api.bridge.xyz/v0";

/**
 * Función Auxiliar para hacer peticiones a la API de Bridge.
 * @param endpoint Ruta del API (ej. /customers)
 * @param method Método HTTP (POST, GET)
 * @param body Cuerpo de la petición en formato JSON
 */
async function fetchBridge(endpoint: string, method: string = "POST", body?: any) {
  const headers: Record<string, string> = {
    "Api-Key": BRIDGE_API_KEY,
    "Content-Type": "application/json",
  };

  // [CELOPEDIA] "Idempotency keys are required on most mutating endpoints. Generate a UUID per request."
  // Protege contra transacciones duplicadas si la red falla.
  if (method !== "GET") {
    headers["Idempotency-Key"] = randomUUID();
  }

  const response = await fetch(`${BRIDGE_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error("[BRIDGE ERROR]", data);
    throw new Error(data.message || "Error en la API de Bridge");
  }

  return data;
}

/**
 * 1. [CELOPEDIA] Entidad: Customers
 * Registra a un Sponsor o Campesino en Bridge. Es el primer paso obligatorio.
 * @param fullName Nombre completo del usuario
 * @param email Correo electrónico
 * @param type "individual" o "business"
 */
export async function createBridgeCustomer(fullName: string, email: string, type: "individual" | "business" = "individual") {
  // [REFI] Todo actor del sistema debe ser registrado para cumplimiento (Compliance)
  return fetchBridge("/customers", "POST", {
    full_name: fullName,
    email,
    type,
  });
}

/**
 * 2. [CELOPEDIA] Entidad: KYC Links
 * Genera un enlace seguro (alojado por Stripe/Bridge) para que el usuario suba su ID.
 * @param customerId El ID generado en el paso 1.
 */
export async function createKycLink(fullName: string, email: string) {
  // [CELOPEDIA] "Customer onboarding required: every paying user must complete KYC/KYB"
  return fetchBridge("/kyc_links", "POST", {
    full_name: fullName,
    email: email,
    type: "individual"
  });
}

/**
 * 3. [CELOPEDIA] Entidad: Virtual Accounts (EL ON-RAMP PARA EL SPONSOR)
 * Crea una cuenta bancaria real (ej. ACH/SEPA) asociada al Sponsor.
 * Lo que envíe ahí (Fiat), se convierte en USDT y va al contrato en Celo.
 * 
 * @param customerId El ID del Sponsor en Bridge
 * @param celoDestinationAddress [EVM] Dirección del BiotaSplitter (Escrow)
 */
export async function createVirtualAccount(customerId: string, celoDestinationAddress: string) {
  return fetchBridge(`/customers/${customerId}/virtual_accounts`, "POST", {
    source: { currency: "usd" }, // Recibe Dólares
    destination: {
      payment_rail: "celo",      // [CELOPEDIA] Enrutamiento crítico a la red Celo
      currency: "usdt",          // [EVM] Token ERC-20 destino
      address: celoDestinationAddress
    },
    developer_fee_percent: "0.5" // [REFI] Porcentaje de comisión para la Tesorería Biota (opcional)
  });
}

/**
 * 4. [CELOPEDIA] Entidad: External Accounts (Bancos)
 * Registra la cuenta bancaria del Campesino (Nequi, Bancolombia, etc.) en Bridge.
 * @param customerId ID del Campesino en Bridge
 * @param bankDetails Detalles locales (número de cuenta, tipo, etc.)
 */
export async function registerExternalAccount(customerId: string, accountName: string, accountNumber: string, routingNumber: string) {
  // [REFI] Fundamental para la inclusión financiera del productor rural.
  return fetchBridge(`/customers/${customerId}/external_accounts`, "POST", {
    currency: "usd", // Bridge opera internamente en USD antes de convertir a moneda local
    account_name: accountName,
    account_number: accountNumber,
    routing_number: routingNumber, 
  });
}

/**
 * 5. [CELOPEDIA] Entidad: Liquidation Addresses (EL OFF-RAMP PARA EL CAMPESINO)
 * Crea una "Billetera Mágica" Cripto. Si el Campesino envía USDT ahí, 
 * Bridge los destruye en Celo y le envía Fiat a su banco registrado (External Account).
 * 
 * @param customerId ID del Campesino
 * @param externalAccountId ID de su cuenta bancaria registrada en el paso 4
 */
export async function createLiquidationAddress(customerId: string, externalAccountId: string) {
  return fetchBridge(`/customers/${customerId}/liquidation_addresses`, "POST", {
    chain: "celo",           // [CELOPEDIA] La red de origen es Celo
    currency: "usdt",        // [EVM] El token que Bridge debe escuchar y liquidar
    external_account_id: externalAccountId // Banco destino
  });
}
