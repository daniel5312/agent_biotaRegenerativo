import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { walletAddress } = await req.json();

    const apiKey = process.env.NEXT_PUBLIC_TRANSAK_API_KEY;
    const apiSecret = process.env.TRANSAK_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Missing Transak API credentials' }, { status: 500 });
    }

    // 1. Obtener Access Token de Transak (Entorno de PRODUCCIÓN)
    const tokenRes = await fetch('https://api.transak.com/partners/api/v2/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-secret': apiSecret
      },
      body: JSON.stringify({ apiKey })
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('Transak Token Error:', err);
      return NextResponse.json({ error: 'Failed to authenticate with Transak' }, { status: 500 });
    }

    const tokenData = await tokenRes.json();
    console.log("Transak Token Response:", JSON.stringify(tokenData));
    
    // El token a veces viene directo en tokenData o dentro de tokenData.data
    const accessToken = tokenData.accessToken || tokenData.data?.accessToken;

    if (!accessToken) {
      console.error('No se pudo extraer el accessToken de la respuesta');
      return NextResponse.json({ error: 'Token extraction failed' }, { status: 500 });
    }

    // 2. Generar el Secure Widget URL (Entorno de PRODUCCIÓN)
    const sessionRes = await fetch('https://api-gateway.transak.com/api/v2/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access-token': accessToken,
        'x-api-key': apiKey,
        'x-user-ip': '127.0.0.1' // El IP del usuario final
      },
      body: JSON.stringify({
        widgetParams: {
          apiKey,
          environment: 'PRODUCTION',
          cryptoCurrencyCode: 'CUSD',
          fiatCurrency: 'COP',
          network: 'celo',
          walletAddress: walletAddress || '',
          themeColor: '10b981',
          // Es MUY importante enviar el referrerDomain exacto que configuraste en Transak (localhost o tu Vercel)
          referrerDomain: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://tu-vercel.com'
        }
      })
    });

    if (!sessionRes.ok) {
      const err = await sessionRes.text();
      console.error('Transak Session Error:', err);
      return NextResponse.json({ error: 'Failed to create widget session' }, { status: 500 });
    }

    const sessionData = await sessionRes.json();
    return NextResponse.json({ secureUrl: sessionData.data.widgetUrl });

  } catch (error) {
    console.error('Transak API Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
