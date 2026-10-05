import { createAuthenticatedClient, AuthenticatedClient, isFinalizedGrantWithAccessToken } from '@interledger/open-payments';

export interface BiotaFlowConfig {
  walletAddressUrl: string; // Tu dirección origen (Ej: 'https://ilp.rafiki.money/alice')
  privateKey: string;       // El string de tu private.pem
  keyId: string;            // El ID que pusimos en el JWKS (ej: 'biotaflow-key-1')
}

/**
 * Interfaz que define la estructura de respuesta que esperamos al consultar una billetera
 */
export interface WalletAddressDetails {
  id: string;              // URL completa de la wallet (ej. https://wallet.example.com/bob)
  publicName?: string;     // Nombre público del dueño
  assetCode: string;       // Moneda (ej. USD, EUR, CELO)
  assetScale: number;      // Decimales de la moneda
  authServer: string;      // Servidor de Autorización (para pedir Grants)
  resourceServer: string;  // Servidor de Recursos (para crear el pago)
}

/**
 * Interfaz para definir el monto a cobrar
 */
export interface ChargeAmount {
  value: string;           // Valor como string entero (ej. '1000')
  assetCode: string;       // Moneda (ej. 'EUR')
  assetScale: number;      // Escala decimal (ej. 2)
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
   */
  public async getClient(): Promise<AuthenticatedClient> {
    if (this.client) {
      return this.client;
    }

    try {
      this.client = await createAuthenticatedClient({
        walletAddressUrl: this.config.walletAddressUrl,
        privateKey: this.config.privateKey,
        keyId: this.config.keyId,
      });

      console.log(`✅ BiotaFlow Client conectado y autenticado.`);
      return this.client;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error criptográfico al inicializar BiotaFlowClient:`, errorMsg);
      throw new Error("No se pudo inicializar el cliente de Open Payments.");
    }
  }

  /**
   * SPRINT 3: Wallet Discovery
   * Consulta la información pública de una billetera destino.
   */
  public async getWalletDetails(targetWalletUrl: string): Promise<WalletAddressDetails> {
    try {
      const openPaymentsClient = await this.getClient();
      console.log(`🔍 [Wallet Discovery] Escaneando billetera: ${targetWalletUrl}`);

      const walletInfo = await openPaymentsClient.walletAddress.get({
        url: targetWalletUrl
      });

      console.log(`✅ Billetera encontrada. Moneda: ${walletInfo.assetCode}`);

      return {
        id: walletInfo.id,
        publicName: walletInfo.publicName,
        assetCode: walletInfo.assetCode,
        assetScale: walletInfo.assetScale,
        authServer: walletInfo.authServer,
        resourceServer: walletInfo.resourceServer
      };

    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error al consultar la billetera destino:`, errorMsg);
      throw new Error(`Fallo en Wallet Discovery: No se pudo verificar ${targetWalletUrl}`);
    }
  }

  /**
   * SPRINT 4: Create Incoming Payment (Generar un Recibo de Cobro)
   * Este método pide el permiso (Grant) y crea la factura en un solo paso optimizado.
   * 
   * @param receivingWalletUrl Tu propia wallet o la wallet donde se recibirá el dinero.
   * @param amount El monto exacto que se desea cobrar.
   * @returns La URL única del cobro (Incoming Payment URL)
   */
  public async createChargeInvoice(receivingWalletUrl: string, amount: ChargeAmount): Promise<string> {
    try {
      const openPaymentsClient = await this.getClient();
      
      // 1. Descubrir endpoints de la billetera receptora
      const receiverDetails = await this.getWalletDetails(receivingWalletUrl);
      
      console.log(`🔐 [GNAP] Solicitando permiso para crear cobro en: ${receiverDetails.authServer}`);

      // 2. Solicitar el permiso (Grant) explícito para 'incoming-payment'
      const grant = await openPaymentsClient.grant.request(
        { url: receiverDetails.authServer },
        {
          access_token: {
            access: [
              {
                type: 'incoming-payment',
                actions: ['list', 'read', 'read-all', 'complete', 'create']
              }
            ]
          }
        }
      );

      // 3. Validar seguridad del protocolo GNAP
      if (!isFinalizedGrantWithAccessToken(grant)) {
        throw new Error('El servidor de autorización denegó el Grant o requiere interacción manual.');
      }
      
      const accessToken = grant.access_token.value;
      console.log(`✅ [GNAP] Permiso obtenido. Creando recibo de cobro...`);

      // 4. Crear el recurso "Incoming Payment" (La factura)
      const incomingPayment = await openPaymentsClient.incomingPayment.create(
        {
          url: receiverDetails.resourceServer,
          accessToken: accessToken
        },
        {
          walletAddress: receivingWalletUrl,
          incomingAmount: amount,
          // Expiración de seguridad estricta: 15 minutos para que el pago se complete
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() 
        }
      );

      console.log(`🧾 [Facturación] Recibo creado exitosamente! URL: ${incomingPayment.id}`);
      return incomingPayment.id;

    } catch (error: unknown) {
      console.error(`\n🚨 DETALLE TÉCNICO DEL ERROR DEL SERVIDOR RAFIKI 🚨`);
      const err = error as Record<string, unknown>;
      console.dir(err?.response || err, { depth: null });
      throw new Error(`Fallo en el protocolo de cobro. Revisa los logs arriba.`);
    }
  }
}
