import { NextResponse } from 'next/server';
import { executeSoilValidation } from '@/lib/agents/tools';
import { agentExecuteDoubleMint } from '@/lib/agents/ubi-relayer';

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

    // 4. El Volante y el Motor: Si la IA aprueba, disparamos el Doble Minteo (ReFi) on-chain
    // Hola Junior! Aquí conectamos el veredicto matemático de la IA con la máquina de imprimir dinero regenerativo.
    let mintResult = null;
    if (aiVerdict.verdict.status === "APROBADO") {
      console.log(`🚀 [MOTOR-REFI] Veredicto APROBADO. Iniciando minteo on-chain para ${farmerAddress}...`);
      
      // Adaptamos la telemetría del sensor al formato que espera el contrato (LabData)
      // Como esto es automatizado, aproximamos algunos valores biológicos que normalmente 
      // vendrían de un laboratorio físico (Fase 1).
      const labData = {
        laboratorio: `Sensor IoT [${deviceId}]`,
        fecha: new Date().toISOString(),
        ubicacionGeografica: "Finca Conectada (IoT)",
        areaM2: 10000, // Asumimos 1 hectárea por defecto (luego lo leeremos del BiotaPassport NFT)
        materiaOrganicaPorcentaje: Number(materiaOrganica),
        hongosPorcentaje: Number(biodiversidad) * 0.6, // Aproximación biológica desde el sensor
        bacteriasPorcentaje: Number(biodiversidad) * 0.4,
        ufc: 1e7, // Unidad base simulada
        phSueloManual: Number(ph),
        metodosAgricolas: "Monitoreo Automatizado LoRaWAN",
        verificadoPor: "Agente Autónomo 8004"
      };

      // ¡Encendemos el motor! El Agente firma la transacción atómica (Stage + Carbon)
      mintResult = await agentExecuteDoubleMint(farmerAddress as `0x${string}`, labData);
      console.log(`✅ [MOTOR-REFI] Minteo exitoso. StageTx: ${mintResult.stageTx} | CarbonTx: ${mintResult.carbonTx}`);
    }

    // 5. Respuesta al Gateway LoRaWAN
    return NextResponse.json({
      success: true,
      message: mintResult 
        ? 'Telemetría procesada y minteo regenerativo ejecutado on-chain.' 
        : 'Telemetría procesada. Veredicto en observación, sin minteo.',
      veredicto: aiVerdict,
      mintReceipt: mintResult
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ [IOT-WEBHOOK-ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
