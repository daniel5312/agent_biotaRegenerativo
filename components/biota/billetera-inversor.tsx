import React, { useState } from "react";
import { useAccount, useReadContract, useBalance, useWriteContract, useSendTransaction } from "wagmi";
import {
  CircleDollarSign,
  ExternalLink,
  Droplets,
  Coins,
  ArrowUpRight,
  RefreshCw,
  CreditCard,
  X
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatUnits, parseUnits } from "viem";
import { ADDRESSES, ERC20_ABI } from "@/lib/contracts";
import { IdentityAction } from "./IdentityAction";
import { BovedaInversor } from "./boveda-inversor";
import { PrestamosAave } from "./prestamos-aave";

export function BilleteraInversor() {
  const { address } = useAccount();
  
  // -- ESTADOS PARA EL MODAL DE ENVÍO --
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [sendAddress, setSendAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendToken, setSendToken] = useState<"cUSD" | "USDT" | "CELO" | "G$">("cUSD");

  // -- HOOKS PARA ESCRIBIR EN LA BLOCKCHAIN --
  const { writeContract: transferToken, isPending: isTransferringERC20 } = useWriteContract();
  const { sendTransaction: transferCelo, isPending: isTransferringCelo } = useSendTransaction();

  // 1. Fetch CELO Balance
  const { data: celoRes } = useBalance({
    address: address ? (address as `0x${string}`) : undefined,
    query: { enabled: !!address, refetchInterval: 10000 },
  });

  // 2. Fetch G$ Balance
  const { data: gdBalanceRaw } = useReadContract({
    chainId: 42220,
    address: ADDRESSES.G$,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10000 },
  });

  // 3. Fetch cUSD Balance
  const { data: cUSDBalanceRaw } = useReadContract({
    chainId: 42220,
    address: ADDRESSES.CUSD,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10000 },
  });

  // Formato de Saldos
  const gDollarBalance = gdBalanceRaw
    ? Number(formatUnits(BigInt(gdBalanceRaw.toString()), 18)).toFixed(0)
    : "0";
    
  const celoBalance = celoRes
    ? Number(formatUnits(celoRes.value, 18)).toFixed(2)
    : "0.00";

  const cUSDBalance = cUSDBalanceRaw
    ? Number(formatUnits(BigInt(cUSDBalanceRaw.toString()), 18)).toFixed(2)
    : "0.00";

  // Acciones de la Navbar
  const handleBuy = () => {
    const onrampUrl = `https://buy.onramper.com/?defaultCrypto=CUSD&networkWallets=CELO:${address || ''}`;
    window.open(onrampUrl, '_blank');
  };

  const handleSwap = () => {
    const squidUrl = `https://app.squidrouter.com/?chains=137%2C42220`;
    window.open(squidUrl, '_blank');
  };

  // Función para ejecutar el envío
  const executeSend = () => {
    if (!sendAddress || !sendAmount) return alert("Llena todos los campos");
    
    const handleSuccess = () => {
      alert(`¡Transferencia de ${sendAmount} ${sendToken} enviada con éxito!`);
      setIsSendOpen(false);
      setSendAmount("");
      setSendAddress("");
    };

    const handleError = (err: any) => {
      console.error("Error enviando:", err);
      alert("Error en la transferencia. Verifica la consola.");
    };

    if (sendToken === "CELO") {
      // CELO Nativo no usa un contrato ERC20, usa la función nativa sendTransaction
      transferCelo({
        to: sendAddress as `0x${string}`,
        value: parseUnits(sendAmount, 18)
      }, {
        onSuccess: handleSuccess,
        onError: handleError
      });
    } else {
      // Tokens ERC20
      const decimals = sendToken === "USDT" ? 6 : 18;
      const tokenAddress = sendToken === "cUSD" ? ADDRESSES.CUSD : (sendToken === "USDT" ? ADDRESSES.USDT : ADDRESSES.G$);

      transferToken({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [sendAddress as `0x${string}`, parseUnits(sendAmount, decimals)]
      }, {
        onSuccess: handleSuccess,
        onError: handleError
      });
    }
  };

  const isTransferring = isTransferringERC20 || isTransferringCelo;

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 pb-20">
      
      {/* ACTION NAVBAR (REEMPLAZA 'MI BILLETERA') */}
      <div className="animate-in fade-in duration-500 mb-2">
        <div className="flex items-center justify-between bg-stone-900 border border-stone-800 rounded-full p-2 px-6 shadow-xl">
          <button 
            onClick={handleBuy}
            className="flex items-center gap-2 text-yellow-500 hover:text-yellow-400 transition-colors"
          >
            <CreditCard size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Buy</span>
          </button>
          
          <div className="w-px h-4 bg-stone-800" />
          
          <button 
            onClick={() => setIsSendOpen(true)}
            className="flex items-center gap-2 text-stone-400 hover:text-white transition-colors"
          >
            <ArrowUpRight size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Send</span>
          </button>

          <div className="w-px h-4 bg-stone-800" />
          
          <button 
            onClick={handleSwap}
            className="flex items-center gap-2 text-stone-400 hover:text-white transition-colors"
          >
            <RefreshCw size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Swap</span>
          </button>
        </div>
      </div>

      {/* SALDOS DE TOKENS (Saldos Reales - Como en Productor) DE PRIMERO */}
      <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-500 delay-100">
        <Card className="bg-white/5 border-white/5 p-6 rounded-3xl">
          <p className="text-[10px] font-black uppercase text-stone-500">
            CELO
          </p>
          <p className="text-3xl font-black text-amber-500 font-mono">
            {celoBalance}
          </p>
        </Card>
        <Card className="bg-white/5 border-white/5 p-6 rounded-3xl flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-stone-500 flex items-center gap-1">
              <Coins className="w-3 h-3" /> cUSD
            </p>
            <p className="text-3xl font-black text-emerald-500 font-mono mb-4">
              {cUSDBalance}
            </p>
          </div>
        </Card>
      </div>

      {/* -- MODAL DE ENVÍO (RENDERIZADO CONDICIONAL) -- */}
      {isSendOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
            
            {/* Botón Cerrar */}
            <button 
              onClick={() => setIsSendOpen(false)}
              className="absolute top-4 right-4 text-stone-500 hover:text-white"
            >
              <X size={16} />
            </button>

            <h2 className="text-white font-black uppercase tracking-widest text-lg mb-4 flex items-center gap-2">
              <ArrowUpRight className="text-blue-500" />
              Enviar Fondos
            </h2>

            <div className="space-y-4">
              {/* Selector de Moneda */}
              <div>
                <label className="text-[10px] font-black uppercase text-stone-500 block mb-1">
                  Moneda
                </label>
                <div className="grid grid-cols-4 gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
                  <button 
                    onClick={() => setSendToken("cUSD")}
                    className={`py-2 text-[10px] font-black uppercase rounded-lg transition-all ${sendToken === "cUSD" ? "bg-stone-800 text-white" : "text-stone-500 hover:text-stone-300"}`}
                  >
                    cUSD
                  </button>
                  <button 
                    onClick={() => setSendToken("USDT")}
                    className={`py-2 text-[10px] font-black uppercase rounded-lg transition-all ${sendToken === "USDT" ? "bg-stone-800 text-white" : "text-stone-500 hover:text-stone-300"}`}
                  >
                    USDT
                  </button>
                  <button 
                    onClick={() => setSendToken("CELO")}
                    className={`py-2 text-[10px] font-black uppercase rounded-lg transition-all ${sendToken === "CELO" ? "bg-stone-800 text-white" : "text-stone-500 hover:text-stone-300"}`}
                  >
                    CELO
                  </button>
                  <button 
                    onClick={() => setSendToken("G$")}
                    className={`py-2 text-[10px] font-black uppercase rounded-lg transition-all ${sendToken === "G$" ? "bg-stone-800 text-white" : "text-stone-500 hover:text-stone-300"}`}
                  >
                    G$
                  </button>
                </div>
              </div>

              {/* Input Dirección */}
              <div>
                <label className="text-[10px] font-black uppercase text-stone-500 block mb-1">
                  Dirección de destino (0x...)
                </label>
                <input 
                  type="text" 
                  placeholder="0x123...abc"
                  value={sendAddress}
                  onChange={(e) => setSendAddress(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* Input Cantidad */}
              <div>
                <label className="text-[10px] font-black uppercase text-stone-500 block mb-1">
                  Monto a enviar
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-white text-2xl font-black focus:outline-none focus:border-blue-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 font-black">
                    {sendToken}
                  </span>
                </div>
              </div>

              {/* Botón Ejecutar */}
              <Button 
                onClick={executeSend}
                disabled={isTransferring || !sendAmount || !sendAddress}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-xl h-12 mt-2"
              >
                {isTransferring ? "Enviando..." : `Confirmar Envío`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* GOODDOLLAR UBI + IDENTIDAD + SUPERFLUID (Idéntico al productor) */}
      <div className="space-y-6 animate-in fade-in duration-500 delay-200">
        <Card className="bg-blue-600/10 border-blue-500/20 p-8 rounded-3xl space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <CircleDollarSign size={80} className="text-blue-400" />
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
            <div>
              <Badge className="bg-blue-600 text-white text-[9px] font-black uppercase mb-2">
                GoodDollar UBI
              </Badge>
              <p className="text-5xl font-black text-white font-mono tracking-tighter">
                {gDollarBalance}
                <span className="text-xl text-blue-400 ml-2">G$</span>
              </p>
            </div>
            <a
              href="https://wallet.gooddollar.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 text-white h-12 px-8 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 shadow-xl shadow-blue-600/20"
            >
              Reclamar UBI <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          
          <div className="space-y-3 pt-4 border-t border-blue-500/20 relative z-10">
            <div className="bg-blue-600/20 p-2 rounded-2xl border border-blue-500/30">
              <IdentityAction />
            </div>
            
            <Button 
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black h-14 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              onClick={() => window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'impacto' }))}
            >
              <Droplets className="w-6 h-6" /> Empezar Goteo (Superfluid)
            </Button>
          </div>
        </Card>
      </div>

      {/* AAVE V3 YIELD - BÓVEDA DE INVERSOR */}
      <div className="pt-4 animate-in fade-in duration-500 delay-300">
        <h3 className="text-xs font-black text-stone-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          DeFi Aave V3
        </h3>
        <BovedaInversor />
        <PrestamosAave />
      </div>

    </div>
  );
}
