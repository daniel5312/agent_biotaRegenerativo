import { newKit } from "@celo/contractkit";
import { OdisUtils } from "@celo/identity";
import type { AuthSigner } from "@celo/identity/lib/odis/query";

/**
 * [CELOPEDIA] - El Emisor de Confianza (Trusted Issuer) de MiniPay.
 * En la red Celo (FederatedAttestations), cualquiera puede asociar un teléfono a una wallet.
 * Por eso, nosotros decidimos "confiar" únicamente en los mapeos que haya validado
 * oficialmente MiniPay (Opera). Si el teléfono fue verificado por MiniPay, lo aceptamos.
 */
const MINIPAY_ISSUER = "0x7888612486844Bb9BE598668081c59A9f7367FBc";

/**
 * [REFI / ODIS] - Oráculo de Identidad Móvil
 * Esta función toma un número de teléfono E.164 (ej: +573001234567), lo ofusca usando criptografía,
 * y le pregunta a la blockchain a qué billetera (0x...) pertenece ese número.
 * 
 * @param rpcUrl La conexión a la blockchain (ej: "https://forno.celo.org")
 * @param agentPrivateKey La llave privada del Agente 8004 (para autenticarnos con ODIS)
 * @param phoneE164 El número de teléfono del productor agrícola
 * @returns La dirección pública (0x...) o null si el teléfono no tiene una wallet asociada
 */
export async function lookupMiniPayAddress(
  rpcUrl: string,
  agentPrivateKey: string,
  phoneE164: string,
): Promise<string | null> {
  
  // 1. [EVM] Inicializamos la conexión a Celo usando ContractKit (Librería Core de Celo)
  const kit = newKit(rpcUrl);
  
  // 2. [SEGURIDAD] Formateamos la llave privada y la inyectamos temporalmente en el kit local.
  // IMPORTANTE: Esto ocurre solo en el backend, la llave jamás viaja al navegador.
  const pk = agentPrivateKey.startsWith("0x") ? agentPrivateKey : `0x${agentPrivateKey}`;
  kit.addAccount(pk);
  
  // Obtenemos la cuenta del Agente que acabamos de inyectar y la establecemos por defecto
  const locals = kit.connection.getLocalAccounts();
  if (!locals.length) throw new Error("No se pudo cargar la cuenta del Agente.");
  kit.defaultAccount = locals[0];
  const quotaAccount = locals[0]; // El Agente es quien firma (y potencialmente paga la cuota anti-spam)

  // 3. [ODIS] Configuramos el Contexto del Servicio. 
  // OdisAPI.PNP significa "Phone Number Privacy" (Privacidad de Número Telefónico).
  // Le decimos que consulte los nodos oficiales de la Mainnet.
  const serviceContext = OdisUtils.Query.getServiceContext(
    OdisUtils.Query.OdisContextName.MAINNET,
    OdisUtils.Query.OdisAPI.PNP,
  );

  // 4. [ODIS] Configuramos cómo vamos a firmar la petición. 
  // WALLET_KEY indica que usamos la llave del Agente que está en el ContractKit.
  const authSigner: AuthSigner = {
    authenticationMethod: OdisUtils.Query.AuthenticationMethod.WALLET_KEY,
    contractKit: kit as any,
  };

  try {
    // 5. [CRIPTOGRAFÍA] Cegado (Blinding).
    // Aquí ocurre la magia: Le enviamos el teléfono al Oráculo Off-Chain (ODIS).
    // ODIS no puede ver el teléfono original gracias al cifrado de cegado, pero 
    // nos devuelve un "Pepper" (Sal criptográfica) que nos permite generar el 'obfuscatedIdentifier'.
    const { obfuscatedIdentifier } = await OdisUtils.Identifier.getObfuscatedIdentifier(
      phoneE164,
      OdisUtils.Identifier.IdentifierPrefix.PHONE_NUMBER,
      quotaAccount,
      authSigner,
      serviceContext,
    );

    // 6. [EVM] Directorio Telefónico On-Chain (FederatedAttestations)
    // Instanciamos el contrato oficial de Celo que guarda los mapeos Hash -> Billetera.
    const federated = await kit.contracts.getFederatedAttestations();
    
    // Le pedimos a la blockchain que busque billeteras asociadas a nuestro Hash (obfuscatedIdentifier),
    // pero SOLO si fueron verificadas por el contrato de MiniPay (MINIPAY_ISSUER).
    const { accounts } = await federated.lookupAttestations(obfuscatedIdentifier, [
      MINIPAY_ISSUER,
    ]);

    // 7. Retornamos la billetera del campesino (si existe), o null si no se encontró.
    return accounts[0] ?? null;

  } catch (error) {
    console.error("[ODIS-ERROR] Hubo un fallo al consultar la identidad móvil:", error);
    return null;
  }
}
