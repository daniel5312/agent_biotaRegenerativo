import { NextResponse } from 'next/server';
import { executeEscrowDistribution } from '@/lib/agents/tools';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { totalAmount, currency, buyerAddress, cartDetails } = body;

        if (!totalAmount || !currency || !cartDetails) {
            return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
        }

        // Llamar a la lógica autónoma del Agente
        const result = await executeEscrowDistribution({
            totalAmount: Number(totalAmount),
            currency,
            buyerAddress,
            cartDetails
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[AGENT-ESCROW-API] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
