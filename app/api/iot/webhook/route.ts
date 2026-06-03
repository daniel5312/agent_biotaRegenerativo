import { NextResponse } from 'next/server';
import { executeSoilValidation } from '@/lib/agents/tools';

// [IOT-HARDWARE] Endpoint de ingesta de datos para sensores físicos LoRaWAN.
export async function POST(req: Request) {
  try {
    // 1. El Guardián (Hardware Guardian): Verificar que el dato viene de una antena autorizada.
    const authHeader = req.headers.get('authorization');
    // NOTA: Recuerda agregar IOT_WEBHOOK_SECRET en tu .env
    if (authHeader !== `Bearer ${process.env.IOT_WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: 'Firma de sensor no autorizada' }, { status: 401 });
    }

    // 2. Extracción de la Telemetría Cruda (Payload de la antena)
    const payload = await req.json();
    const { deviceId, ph, materiaOrganica, biodiversidad, farmerAddress } = payload;

    if (!deviceId || !ph || !materiaOrganica || !biodiversidad || !farmerAddress) {
      return NextResponse.json({ error: 'Datos de telemetría incompletos' }, { status: 400 });
    }

    console.log(`📡 [LORA-WAN] Datos recibidos del sensor ${deviceId} para la wallet ${farmerAddress}`);

    // 3. El Puente con la IA: Enviar los datos fríos al Oráculo (Agente 9180) para su veredicto.
    const aiVerdict = await executeSoilValidation({
      ph: Number(ph),
      materiaOrganica: Number(materiaOrganica),
      biodiversidad: Number(biodiversidad),
      laborEjecutada: `Lectura Automática Sensor IoT [${deviceId}]`,
      farmerAddress
    });

    // 4. Respuesta al Gateway LoRaWAN
    return NextResponse.json({
      success: true,
      message: 'Telemetría procesada y analizada por el Oráculo IA',
      veredicto: aiVerdict
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ [IOT-WEBHOOK-ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
