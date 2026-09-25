"use client";

import { useMemo, useState } from "react";
import { Copy, ShieldCheck, Download, ArrowUpRight, X, Loader2, Send, ArrowRightLeft } from "lucide-react";
import { formatUnits, parseUnits } from "viem";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useWriteContract, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { useMultiTokenBalances } from "@/hooks/useMultiTokenBalances";
import { ADDRESSES, ERC20_ABI } from "@/lib/contracts";

export function GlobalHeader() {
  const { user } = usePrivy();
  const { address: activeAddress } = useAccount();
  const { toast } = useToast();
  
  // WALLET A (Privy/Login Wallet) - De donde calcularemos TODOS los saldos, incluido el G$
  const primaryAddress = (user?.wallet?.address || activeAddress) as `0x${string}`;
  const { balances: primaryBalances } = useMultiTokenBalances(primaryAddress);

  const [isSendOpen, setIsSendOpen] = useState(false);
  const [sendAddress, setSendAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendToken, setSendToken] = useState<"cUSD" | "USDT" | "CELO" | "G$">("CELO");

  // Estado del Switch USD/COP
  const [showUSD, setShowUSD] = useState(true);

  // Modulos de Transferencia
  const { data: hashERC20, writeContract: transferToken, isPending: isTransferringERC20 } = useWriteContract();
  const { data: hashCelo, sendTransaction: transferCelo, isPending: isTransferringCelo } = useSendTransaction();
  const { isLoading: isConfirmingERC20 } = useWaitForTransactionReceipt({ hash: hashERC20 });
  const { isLoading: isConfirmingCelo } = useWaitForTransactionReceipt({ hash: hashCelo });

  const executeSend = () => {
    if (!sendAddress || !sendAmount) {
      toast({ title: "Atención", description: "Llena todos los campos", variant: "destructive" });
      return;
    }
    try {
      if (sendToken === "CELO") {
        transferCelo({ to: sendAddress as `0x${string}`, value: parseUnits(sendAmount, 18) });
      } else {
        const tokenAddress = ADDRESSES[sendToken === "cUSD" ? "CUSD" : sendToken];
        transferToken({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [sendAddress as `0x${string}`, parseUnits(sendAmount, sendToken === "USDT" ? 6 : (sendToken === "G$" ? 18 : 18))],
        });
      }
      setIsSendOpen(false);
      setSendAmount("");
      setSendAddress("");
      toast({ title: "Transacción Iniciada", description: `Enviando ${sendAmount} ${sendToken}` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "La transacción falló", variant: "destructive" });
    }
  };

  const handleCopy = (text: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(text);
      toast({ title: "✅ Copiado" });
    }
  };

  // Cálculo de Saldo en USD
  const totalUsdFixed = useMemo(() => {
    if (!primaryBalances) return "0.00";
    const stables =
      Number(formatUnits(primaryBalances.cusd || 0n, 18)) +
      Number(formatUnits(primaryBalances.usdt || 0n, 6)) +
      Number(formatUnits(primaryBalances.usdc || 0n, 6));
    const celoInUsd = Number(formatUnits(primaryBalances.celo || 0n, 18)) * 0.8;
    const gdInUsd = Number(formatUnits(primaryBalances.gd || 0n, 18)) * 0.00003; 
    
    return (stables + celoInUsd + gdInUsd).toFixed(4); 
  }, [primaryBalances]);

  // Conversión COP
  const valueCOP = (Number(totalUsdFixed) * Number(process.env.NEXT_PUBLIC_COP_CONVERSION_RATE || 4150)).toLocaleString("es-CO", { maximumFractionDigits: 0 });
  
  // Saldo G$ Extraído DE WALLET A
  const formatGD = primaryBalances ? Number(formatUnits(primaryBalances.gd || 0n, 18)).toFixed(0) : "0";

  return (
    <>
      <div className="w-full bg-[#0D1B1A]/95 shrink-0 border-b border-emerald-900/50 p-4 shadow-xl z-30 space-y-3">
        {/* Cabecera Superior: Dirección + Toggle Tabs Mini */}
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-1.5 bg-black/40 p-0.5 rounded-lg border border-white/5">
             <button onClick={() => window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'pasaporte' }))} className="px-2 py-1 text-[9px] uppercase font-bold rounded transition-all bg-emerald-500/20 text-emerald-400">PasaP</button>
             <button onClick={() => window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'ahorro' }))} className="px-2 py-1 text-[9px] uppercase font-bold rounded transition-all text-stone-500 hover:text-white">Bille</button>
          </div>
          {primaryAddress && (
            <div onClick={() => handleCopy(primaryAddress)} className="flex items-center gap-1 cursor-pointer hover:text-emerald-400 transition-colors bg-black/20 px-2 py-1 rounded border border-stone-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono font-bold opacity-80">{primaryAddress.slice(0, 4)}...{primaryAddress.slice(-4)}</span>
              <Copy size={10} className="opacity-50" />
            </div>
          )}
        </div>

        {/* Display Minimalista del Patrimonio y G$ */}
        <div className="flex items-center justify-center gap-3">
          
          {/* Contenedor del Saldo Intercambiable USD/COP */}
          <div 
            onClick={() => setShowUSD(!showUSD)}
            className="flex items-baseline justify-center gap-1 cursor-pointer group hover:bg-white/5 p-2 rounded-xl transition-all"
            title="Toca para cambiar moneda"
          >
            {showUSD ? (
              <>
                <span className="text-lg text-emerald-400 font-bold group-hover:text-emerald-300">$</span>
                <span className="text-3xl font-black tracking-tighter text-white font-mono">{totalUsdFixed}</span>
                <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1 py-0.5 rounded ml-1 flex items-center gap-1">
                  USD <ArrowRightLeft size={8} />
                </span>
              </>
            ) : (
              <>
                <span className="text-lg text-emerald-400 font-bold group-hover:text-emerald-300">$</span>
                <span className="text-3xl font-black tracking-tighter text-white font-mono">{valueCOP}</span>
                <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1 py-0.5 rounded ml-1 flex items-center gap-1">
                  COP <ArrowRightLeft size={8} />
                </span>
              </>
            )}
          </div>
          
          {/* Cápsula de GoodDollar al lado del principal (Wallet A) */}
          <div className="flex flex-col items-center justify-center bg-blue-500/10 border border-blue-500/20 px-2 py-1.5 rounded-xl">
             <ShieldCheck size={12} className="text-blue-400 mb-0.5" />
             <div className="flex items-baseline gap-0.5">
               <span className="text-xs font-black font-mono text-blue-400">{formatGD}</span>
               <span className="text-[8px] font-black uppercase text-blue-500/60">G$</span>
             </div>
          </div>
        </div>

        {/* Botones Enviar/Recibir */}
        <div className="grid grid-cols-2 gap-2 pt-1">
           <button onClick={() => setIsSendOpen(true)} className="w-full bg-emerald-900/40 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/30 font-black h-9 rounded-xl flex justify-center items-center gap-2 transition-all">
             <ArrowUpRight size={14} /> <span className="text-[10px] uppercase tracking-widest">Enviar</span>
           </button>
           <button onClick={() => handleCopy(primaryAddress)} className="w-full bg-emerald-900/40 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/30 font-black h-9 rounded-xl flex justify-center items-center gap-2 transition-all">
             <Download size={14} /> <span className="text-[10px] uppercase tracking-widest">Recibir</span>
           </button>
        </div>
      </div>

      {/* -- MODAL DE ENVÍO -- */}
      {isSendOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
            <button onClick={() => setIsSendOpen(false)} className="absolute top-4 right-4 text-stone-500 hover:text-white"><X size={16} /></button>
            <h2 className="text-white font-black uppercase tracking-widest text-lg mb-4 flex items-center gap-2"><ArrowUpRight className="text-emerald-500" /> Transferir</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-stone-500 block mb-1">Qué vas a enviar</label>
                <div className="grid grid-cols-4 gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
                  {["CELO", "cUSD", "USDT", "G$"].map((token) => (
                     <button key={token} onClick={() => setSendToken(token as any)} className={`py-2 text-[10px] font-black uppercase rounded-lg transition-all ${sendToken === token ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400" : "text-stone-500 hover:text-stone-300"}`}>{token}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-stone-500 block mb-1">Billetera Destino</label>
                <input type="text" value={sendAddress} onChange={(e) => setSendAddress(e.target.value)} placeholder="0x..." className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-white text-xs font-mono focus:outline-none focus:border-emerald-500/50" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-stone-500 block mb-1">Cantidad ({sendToken})</label>
                <input type="number" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} placeholder="0.00" className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-white text-lg font-mono focus:outline-none focus:border-emerald-500/50" />
              </div>
              <button 
                onClick={executeSend}
                disabled={isTransferringERC20 || isTransferringCelo || isConfirmingERC20 || isConfirmingCelo}
                className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest rounded-xl transition-all flex justify-center items-center gap-2 mt-2"
              >
                {(isTransferringERC20 || isTransferringCelo || isConfirmingERC20 || isConfirmingCelo) ? (
                  <><Loader2 size={16} className="animate-spin" /> Procesando TX...</>
                ) : (
                  <><Send size={16} /> Confirmar Envío</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
