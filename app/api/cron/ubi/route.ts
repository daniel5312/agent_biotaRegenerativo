import { NextResponse } from 'next/server';
import { agentExecuteDailyClaim } from '@/lib/agents/ubi-relayer';

export async function POST(request: Request) {
  try {
    // 1. Validación Segura del CRON_SECRET (Previene ataques)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { error: 'CRON_SECRET no está configurado en el servidor.' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'No autorizado. Secreto incorrecto.' },
        { status: 401 }
      );
    }

    // 2. Extraer el array de billeteras
    const body = await request.json();
    const addresses: string[] = body.addresses;

    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      return NextResponse.json(
        { error: 'Debe proveer un array válido de addresses.' },
        { status: 400 }
      );
    }

    // 3. Ejecutar el Agente para cada billetera
    const results = [];
    for (const address of addresses) {
      try {
        const result = await agentExecuteDailyClaim(address);
        results.push({ address, success: true, hash: result.hash });
      } catch (error: any) {
        console.error(`Error reclamando para ${address}:`, error);
        results.push({ address, success: false, error: error.message });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('[CRON UBI API] Error fatal:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error interno procesando la petición.' },
      { status: 500 }
    );
  }
}
