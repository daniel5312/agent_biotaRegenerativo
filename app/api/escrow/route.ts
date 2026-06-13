import { NextResponse } from 'next/server';
import { executeEscrowDistribution } from '@/lib/agents/tools';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { totalAmount, currency, producerAddress } = body;

        if (!totalAmount || !currency || !producerAddress) {
            return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
        }

        // Llamar a la lógica autónoma del Agente
        const result = await executeEscrowDistribution({
            totalAmount: Number(totalAmount),
            currency,
            producerAddress
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[AGENT-ESCROW-API] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
