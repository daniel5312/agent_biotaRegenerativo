import { NextResponse } from 'next/server';
import { createWalletClient, http, parseEther, parseUnits, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celo } from 'viem/chains';
import { ADDRESSES, ERC20_ABI } from '@/lib/contracts';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { address } = body;

        if (!address) {
            return NextResponse.json({ error: "Falta la dirección del campesino" }, { status: 400 });
        }

        const privateKey = process.env.FONDEO_PRIVATE_KEY;
        if (!privateKey) {
            console.error("[FAUCET] Error: FONDEO_PRIVATE_KEY no está configurada en .env");
            return NextResponse.json({ error: "Falla interna del Fondeo" }, { status: 500 });
        }

        // Configurar la cuenta administradora de fondeo
        const account = privateKeyToAccount(`0x${privateKey.replace('0x', '')}`);
        
        const client = createWalletClient({
            account,
            chain: celo,
            transport: http(),
        }).extend(publicActions);

        console.log(`[FAUCET] Iniciando fondeo automático a ${address}...`);

        // 1. Enviar 0.1 CELO (Gas)
        const amountToFunde = "0.1";
        const hashCelo = await client.sendTransaction({
            to: address as `0x${string}`,
            value: parseEther(amountToFunde),
        });
        console.log(`[FAUCET] ✅ CELO enviado. Hash: ${hashCelo}`);

        // 2. Enviar 10 G$ como bono semilla de bienvenida.
        // [CELO] IMPORTANTE: G$ (GoodDollar) tiene 2 decimales en Celo (no 18 como ETH).
        // parseUnits("10", 2) = 1000 unidades mínimas = 10.00 G$ correctos.
        // Si usáramos parseEther("10") enviaríamos 10^18 unidades → el transfer fallaría.
        const amountGD = "10";
        const hashGD = await client.writeContract({
            address: ADDRESSES['G$'],
            abi: ERC20_ABI,
            functionName: 'transfer',
            // [GOODDOLLAR] 2 decimales: parseUnits("10", 2) = 1000 = 10.00 G$
            args: [address as `0x${string}`, parseUnits(amountGD, 2)]
        });
        console.log(`[FAUCET] ✅ G$ enviado. Hash: ${hashGD}`);

        return NextResponse.json({
            success: true,
            hashCelo: hashCelo,
            hashGD: hashGD,
            message: `Fondeo de ${amountToFunde} CELO y bono de ${amountGD} G$ completado exitosamente.`
        });

    } catch (error: any) {
        console.error("[FAUCET] Error en el servidor:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
