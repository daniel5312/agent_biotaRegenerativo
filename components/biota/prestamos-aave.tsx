"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Landmark, ArrowDownCircle, ArrowUpCircle, AlertTriangle } from "lucide-react";
import { formatUnits, parseUnits } from "viem";
import { ADDRESSES, ERC20_ABI } from "@/lib/contracts";

// Aave V3 Pool en Celo Mainnet
const AAVE_POOL_ADDRESS = "0x3E59A31363E2ad014dcbc521c4a0d5757d9f3402";

const AAVE_POOL_ABI = [
  {
    "inputs": [{"internalType": "address","name": "user","type": "address"}],
    "name": "getUserAccountData",
    "outputs": [
      {"internalType": "uint256","name": "totalCollateralBase","type": "uint256"},
      {"internalType": "uint256","name": "totalDebtBase","type": "uint256"},
      {"internalType": "uint256","name": "availableBorrowsBase","type": "uint256"},
      {"internalType": "uint256","name": "currentLiquidationThreshold","type": "uint256"},
      {"internalType": "uint256","name": "ltv","type": "uint256"},
      {"internalType": "uint256","name": "healthFactor","type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address","name": "asset","type": "address"},
      {"internalType": "uint256","name": "amount","type": "uint256"},
      {"internalType": "address","name": "onBehalfOf","type": "address"},
      {"internalType": "uint16","name": "referralCode","type": "uint16"}
    ],
    "name": "supply",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address","name": "asset","type": "address"},
      {"internalType": "uint256","name": "amount","type": "uint256"},
      {"internalType": "uint256","name": "interestRateMode","type": "uint256"},
      {"internalType": "uint16","name": "referralCode","type": "uint16"},
      {"internalType": "address","name": "onBehalfOf","type": "address"}
    ],
    "name": "borrow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export function PrestamosAave() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("10"); // Valor por defecto 10 cUSD

  const [selectedAsset, setSelectedAsset] = useState<"cUSD" | "USDT">("cUSD");

  const ASSETS = {
    cUSD: { address: ADDRESSES.CUSD, decimals: 18, symbol: "cUSD" },
    USDT: { address: ADDRESSES.USDT, decimals: 6, symbol: "USDT" },
  };
  
  const currentToken = ASSETS[selectedAsset];

  // 1. Obtener Datos del Usuario en Aave (Poder de Préstamo)
  const { data: accountData, refetch } = useReadContract({
    chainId: 42220,
    address: AAVE_POOL_ADDRESS,
    abi: AAVE_POOL_ABI,
    functionName: "getUserAccountData",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  // Los valores base en Aave V3 suelen estar en 8 decimales (USD base)
  const availableBorrows = accountData ? Number(formatUnits((accountData as any)[2], 8)) : 0;
  const totalCollateral = accountData ? Number(formatUnits((accountData as any)[0], 8)) : 0;
  const totalDebt = accountData ? Number(formatUnits((accountData as any)[1], 8)) : 0;
  const healthFactorRaw = accountData ? (accountData as any)[5] : 0n;
  
  // Health Factor es type(uint256).max si no hay deuda
  const isSafe = healthFactorRaw > 1000000000000000000n; // > 1.0

  // 2. Revisar Allowance (Permiso para que Aave gaste el token)
  const { data: allowanceData } = useReadContract({
    chainId: 42220,
    address: currentToken.address,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, AAVE_POOL_ADDRESS] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  const currentAllowance = allowanceData ? (allowanceData as bigint) : 0n;
  const parsedAmount = parseUnits(amount || "0", currentToken.decimals);
  const needsApproval = currentAllowance < parsedAmount;

  // 3. Lógica de Transacciones Wagmi (Aprobación y Préstamo)
  const { mutate: writeContract, isPending } = useWriteContract();

  // A. Aprobar o Suministrar Colateral (Supply)
  const handleSupply = () => {
    if (!address) return;
    if (needsApproval) {
      writeContract({
        address: currentToken.address,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [AAVE_POOL_ADDRESS, parsedAmount],
      });
      return;
    }

    writeContract({
      address: AAVE_POOL_ADDRESS,
      abi: AAVE_POOL_ABI,
      functionName: "supply",
      args: [currentToken.address, parsedAmount, address, 0],
    });
  };

  // B. Pedir Prestado (Borrow)
  const handleBorrow = () => {
    if (!address) return;
    writeContract({
      address: AAVE_POOL_ADDRESS,
      abi: AAVE_POOL_ABI,
      functionName: "borrow",
      args: [currentToken.address, parsedAmount, 2, 0, address], // 2 = Variable Rate
    });
  };

  if (!isConnected) return null;

  return (
    <Card className="glass-card border-none bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white shadow-2xl relative overflow-hidden mt-6">
      <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[60px] rounded-full pointer-events-none" />
      <CardContent className="p-6 relative z-10 space-y-6">
        
        <div className="flex justify-between items-start">
          <div>
            <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
              Aave V3 Préstamos
            </Badge>
            <h2 className="text-xl font-black flex items-center gap-2">
              <Landmark className="w-5 h-5 text-indigo-400" /> Línea de Crédito
            </h2>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-indigo-300/70 uppercase font-bold">APY Variable</p>
            <p className="text-lg font-mono font-black text-emerald-400">~6.5%</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 bg-black/20 p-4 rounded-2xl border border-white/5">
          <div>
            <p className="text-[10px] text-stone-400 uppercase">Colateral</p>
            <p className="text-sm font-mono font-bold">${totalCollateral.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[10px] text-stone-400 uppercase">Deuda</p>
            <p className="text-sm font-mono font-bold text-red-400">${totalDebt.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[10px] text-stone-400 uppercase">Disponible</p>
            <p className="text-sm font-mono font-bold text-emerald-400">${availableBorrows.toFixed(2)}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl px-2">
              <select
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value as "cUSD" | "USDT")}
                className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer p-2"
              >
                <option value="cUSD" className="bg-slate-900">cUSD</option>
                <option value="USDT" className="bg-slate-900">USDT</option>
              </select>
            </div>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">$</span>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-xl h-12 pl-8 pr-4 font-mono font-bold focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={handleSupply}
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 rounded-xl flex items-center gap-2 px-2 text-xs"
            >
              <ArrowUpCircle className="w-4 h-4" /> {needsApproval ? `Aprobar ${currentToken.symbol}` : "Depositar Recompensa"}
            </Button>
            <Button 
              onClick={handleBorrow}
              disabled={isPending || availableBorrows <= 0}
              className="bg-white hover:bg-stone-200 text-indigo-950 font-bold h-12 rounded-xl flex items-center gap-2"
            >
              <ArrowDownCircle className="w-4 h-4" /> Pedir Prestado
            </Button>
          </div>
          
          {availableBorrows <= 0 && totalCollateral <= 0 && (
            <p className="text-[10px] text-indigo-300/70 flex items-center gap-1 mt-2">
              <AlertTriangle className="w-3 h-3" />
              Deposita saldo primero para generar poder de préstamo.
            </p>
          )}
        </div>

      </CardContent>
    </Card>
  );
}
