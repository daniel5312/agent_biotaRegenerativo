import { NextResponse } from 'next/server';
import { agentExecuteDailyClaim } from '@/lib/agents/ubi-relayer';
import { supabase } from '@/lib/supabase';

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

    // 2. Consultar la lista maestra de agricultores activos en Supabase
    const { data: subscriptions, error: dbError } = await supabase
      .from('ubi_subscriptions')
      .select('wallet_address')
      .eq('is_active', true);

    if (dbError) {
      console.error('Error consultando Supabase:', dbError);
      return NextResponse.json(
        { error: 'Error interno consultando la base de datos de usuarios.' },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, message: 'No hay campesinos activos para procesar hoy.' });
    }

    const addresses = subscriptions.map((s) => s.wallet_address);

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
