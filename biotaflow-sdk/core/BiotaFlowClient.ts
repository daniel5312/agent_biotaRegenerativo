import { createAuthenticatedClient, AuthenticatedClient, isFinalizedGrantWithAccessToken, isPendingGrant, Quote } from '@interledger/open-payments';

export interface BiotaFlowConfig {
  walletAddressUrl: string; // La dirección origen (Ej: 'https://ilp.rafiki.money/alice')
  privateKey: string;       // El string de tu private.pem
  keyId: string;            // El ID del JWKS
}

export interface WalletAddressDetails {
  id: string;
  publicName?: string;
  assetCode: string;
  assetScale: number;
  authServer: string;
  resourceServer: string;
}

export interface ChargeAmount {
  value: string;
  assetCode: string;
  assetScale: number;
}

/**
 * Interfaz de respuesta al crear un recibo de cobro.
 */
export interface InvoiceResponse {
  invoiceUrl: string;
  accessToken: string;
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
      return this.client;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error("No se pudo inicializar el cliente de Open Payments: " + errorMsg);
    }
  }
  
  public async getWalletDetails(targetWalletUrl: string): Promise<WalletAddressDetails> {
    try {
      const openPaymentsClient = await this.getClient();
      const walletInfo = await openPaymentsClient.walletAddress.get({ url: targetWalletUrl });

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
      throw new Error(`Fallo en Wallet Discovery: No se pudo verificar ${targetWalletUrl}. Error: ${errorMsg}`);
    }
  }

  public async createChargeInvoice(receivingWalletUrl: string, amount: ChargeAmount): Promise<InvoiceResponse> {
    try {
      const openPaymentsClient = await this.getClient();
      const receiverDetails = await this.getWalletDetails(receivingWalletUrl);
      
      const grant = await openPaymentsClient.grant.request(
        { url: receiverDetails.authServer },
        { access_token: { access: [{ type: 'incoming-payment', actions: ['list', 'read', 'read-all', 'complete', 'create'] }] } }
      );

      if (!isFinalizedGrantWithAccessToken(grant)) throw new Error('El servidor de autorización denegó el Grant o requiere interacción manual.');
      
      const accessToken = grant.access_token.value;

      const incomingPayment = await openPaymentsClient.incomingPayment.create(
        { url: receiverDetails.resourceServer, accessToken: accessToken },
        {
          walletAddress: receivingWalletUrl,
          incomingAmount: amount,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() 
        }
      );

      return {
        invoiceUrl: incomingPayment.id,
        accessToken: accessToken
      };

    } catch (error: unknown) {
      throw new Error(`Fallo al crear la factura.`);
    }
  }

  public async createQuoteForPayment(invoiceUrl: string): Promise<Quote> {
    try {
      const openPaymentsClient = await this.getClient();
      const senderDetails = await this.getWalletDetails(this.config.walletAddressUrl);
      
      const quoteGrant = await openPaymentsClient.grant.request(
        { url: senderDetails.authServer },
        { access_token: { access: [{ type: 'quote', actions: ['create', 'read', 'read-all'] }] } }
      );

      if (!isFinalizedGrantWithAccessToken(quoteGrant)) {
        throw new Error('El servidor denegó el permiso para cotizar.');
      }

      const quote = await openPaymentsClient.quote.create(
        {
          url: senderDetails.resourceServer,
          accessToken: quoteGrant.access_token.value
        },
        {
          method: 'ilp',
          walletAddress: this.config.walletAddressUrl,
          receiver: invoiceUrl
        }
      );

      return quote;

    } catch (error: unknown) {
      throw new Error(`Fallo en el cálculo de la cotización.`);
    }
  }

  public async requestInteractivePaymentGrant(quote: Quote, redirectFrontendUrl: string): Promise<{ interactionUrl: string, continueToken: string, continueUri: string }> {
    try {
      const openPaymentsClient = await this.getClient();
      const senderDetails = await this.getWalletDetails(this.config.walletAddressUrl);

      const cryptoNonce = crypto.randomUUID();

      const grant = await openPaymentsClient.grant.request(
        { url: senderDetails.authServer },
        {
          access_token: {
            access: [
              {
                identifier: senderDetails.id,
                type: 'outgoing-payment',
                actions: ['list', 'list-all', 'read', 'read-all', 'create'],
                limits: {
                  debitAmount: {
                    assetCode: quote.debitAmount.assetCode,
                    assetScale: quote.debitAmount.assetScale,
                    value: quote.debitAmount.value
                  }
                }
              }
            ]
          },
          interact: {
            start: ['redirect'],
            finish: {
              method: 'redirect',
              uri: redirectFrontendUrl,
              nonce: cryptoNonce
            }
          }
        }
      );

      if (!isPendingGrant(grant)) {
        throw new Error('El servidor no devolvió una URL interactiva. Rechazado.');
      }

      return {
        interactionUrl: grant.interact.redirect,
        continueToken: grant.continue.access_token.value,
        continueUri: grant.continue.uri
      };

    } catch (error: unknown) {
      throw new Error(`Fallo en la negociación de pago interactivo.`);
    }
  }

  public async executePayment(quoteId: string, finalAccessToken: string): Promise<string> {
    try {
      const openPaymentsClient = await this.getClient();
      const senderDetails = await this.getWalletDetails(this.config.walletAddressUrl);

      const outgoingPayment = await openPaymentsClient.outgoingPayment.create(
        {
          url: senderDetails.resourceServer,
          accessToken: finalAccessToken
        },
        {
          walletAddress: this.config.walletAddressUrl,
          quoteId: quoteId
        }
      );

      return outgoingPayment.id;

    } catch (error: unknown) {
      throw new Error(`Fallo en el movimiento de fondos (Outgoing Payment).`);
    }
  }

  public async finalizeInteractiveGrant(continueUri: string, continueToken: string, interactRef: string): Promise<string> {
    try {
      const openPaymentsClient = await this.getClient();

      const finalGrant = await openPaymentsClient.grant.continue(
        {
          url: continueUri,
          accessToken: continueToken
        },
        {
          interact_ref: interactRef
        }
      );

      if (!isFinalizedGrantWithAccessToken(finalGrant)) {
        throw new Error('El servidor rechazó la continuación del Grant.');
      }

      return finalGrant.access_token.value;

    } catch (error: unknown) {
      throw new Error(`El usuario probablemente denegó el permiso o el link expiró.`);
    }
  }
}
