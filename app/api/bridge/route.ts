import { NextResponse } from "next/server";
import { 
  createBridgeCustomer, 
  createVirtualAccount, 
  registerExternalAccount, 
  createLiquidationAddress 
} from "@/lib/celo/bridge";
import { ADDRESSES } from "@/lib/contracts";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    if (!action) {
      return NextResponse.json({ error: "No action provided" }, { status: 400 });
    }

    // ==========================================
    // 1. FLUJO ON-RAMP (Sponsor / Tienda)
    // El cliente envía USD vía Banco, y BiotaSplitter recibe USDT en Celo.
    // ==========================================
    if (action === "ON_RAMP") {
      const { fullName, email } = payload;
      
      // A. Registrar al Sponsor como cliente en Stripe/Bridge
      const customer = await createBridgeCustomer(
        fullName || "Sponsor Biota", 
        email || "sponsor@example.com", 
        "individual"
      );
      
      // B. Asignarle una Cuenta Bancaria Virtual atada al BiotaSplitter
      const virtualAccount = await createVirtualAccount(
        customer.id, 
        ADDRESSES.BIOTA_SPLITTER // Destino en Celo
      );

      return NextResponse.json({ success: true, virtualAccount });
    }

    // ==========================================
    // 2. FLUJO OFF-RAMP (Campesino)
    // El Campesino envía USDT en Celo, y recibe COP en su Nequi/Bancolombia.
    // ==========================================
    if (action === "OFF_RAMP") {
      const { fullName, email, bankType, accountNumber } = payload;

      // A. Registrar al Campesino en Bridge
      const farmer = await createBridgeCustomer(
        fullName || "Productor Rural", 
        email || "productor@biota.network", 
        "individual"
      );

      // B. Registrar su cuenta de Nequi/Bancolombia
      // (Usamos datos simulados de routing internacional por ahora)
      const routingNumber = bankType === "NEQUI" ? "021000021" : "021000022";
      const bankAccount = await registerExternalAccount(
        farmer.id, 
        fullName || "Productor Rural", 
        accountNumber, 
        routingNumber
      );

      // C. Generar la billetera liquidadora en Celo
      const liquidation = await createLiquidationAddress(farmer.id, bankAccount.id);

      return NextResponse.json({ success: true, liquidation });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error: any) {
    console.error("API Bridge Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Error interno del orquestador Fiat" 
    }, { status: 500 });
  }
}
