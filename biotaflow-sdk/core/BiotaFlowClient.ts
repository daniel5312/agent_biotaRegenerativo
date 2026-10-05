import { createAuthenticatedClient, AuthenticatedClient } from '@interledger/open-payments';

export interface BiotaFlowConfig {
  walletAddressUrl: string; // La dirección origen (Ej: 'https://ilp.rafiki.money/alice')
  privateKey: string;       // El string de tu private.pem
  keyId: string;            // El ID que pusimos en el JWKS (ej: 'biotaflow-key-1')
}

/**
 * BiotaFlowClient: Core SDK para interacción con Open Payments.
 * Arquitectura: OOP Estricto.
 */
export class BiotaFlowClient {
  private client: AuthenticatedClient | null = null;
  private config: BiotaFlowConfig;

  constructor(config: BiotaFlowConfig) {
    this.config = config;
  }

  /**
   * Inicializa el cliente autenticado de Open Payments.
   * Aplica un patrón de reutilización en memoria (ReFi) para evitar
   * el alto costo computacional de instanciar llaves repetidamente.
   */
  public async getClient(): Promise<AuthenticatedClient> {
    // Si el cliente ya está en memoria, lo reusamos (Eficiencia)
    if (this.client) {
      return this.client;
    }

    try {
      // Delegamos la matemática pesada (Firmas HTTP) al SDK oficial
      this.client = await createAuthenticatedClient({
        walletAddressUrl: this.config.walletAddressUrl,
        privateKey: this.config.privateKey,
        keyId: this.config.keyId,
      });

      console.log(`✅ BiotaFlow Client conectado y autenticado.`);
      return this.client;
    } catch (error) {
      console.error("❌ Error criptográfico al inicializar BiotaFlowClient:", error);
      throw new Error("No se pudo inicializar el cliente de Open Payments.");
    }
  }

  // --- MÉTODOS DEL SPRINT 3 (WALLET DISCOVERY & GRANTS) IRÁN AQUÍ ---
}
