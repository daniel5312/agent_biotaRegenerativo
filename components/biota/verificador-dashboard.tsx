"use client";

/**
 * verificador-dashboard.tsx
 * 
 * [REFI] Panel de auditoría on-chain de los BiotaPassport.
 * Permite a un verificador autorizado consultar y certificar NFTs de impacto.
 * 
 * [SOLIDITY] Solo wallets con VERIFICADOR_ROLE en BiotaPassport pueden emitir
 * el certificado. El guard de rol se verifica leyendo el contrato on-chain.
 * 
 * Flujo del verificador:
 *   1. Busca el Pasaporte por ID
 *   2. Revisa los datos de la finca (área, suelo, métodos)
 *   3. Si el análisis es correcto → presiona "Emitir Certificado"
 *   4. Firma la tx → validarImpacto(tokenId) on-chain → esVerificado = true
 *   5. El CID del reporte dMRV queda en hashAnalisisLab del NFT
 */

import { useState, useMemo } from "react";
import { 
  ShieldCheck, Search, CheckCircle2, AlertCircle, Loader2, 
  MapPin, FlaskConical, MessageCircle, ArrowLeft, Leaf,
  ExternalLink, BadgeCheck, FileText
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  useReadContract, 
  useWriteContract,      // [EVM] Para firmar transacciones desde el frontend
  useWaitForTransactionReceipt,  // [EVM] Para esperar confirmación on-chain
  useAccount             // [WAGMI] Para leer la wallet conectada y verificar rol
} from "wagmi";
import { ADDRESSES, BIOTA_PASSPORT_ABI } from "@/lib/contracts";

export function VerificadorDashboard() {
  const [searchId, setSearchId] = useState("");

  // [WAGMI] Obtenemos la dirección de la wallet conectada del verificador
  const { address: verificadorAddress } = useAccount();

  // ── Lectura del Pasaporte ─────────────────────────────────────────────────
  // [SOLIDITY] Llamamos a lotePasaporte(tokenId) que retorna el struct LoteData
  const { data: passport, isLoading, refetch } = useReadContract({
    chainId: 42220,  // [CELO] Solo Celo Mainnet
    address: ADDRESSES.BIOTA_PASSPORT,
    abi: BIOTA_PASSPORT_ABI,
    functionName: "lotePasaporte",
    args: searchId ? [BigInt(searchId)] : undefined,
    query: { enabled: !!searchId },
  });

  // ── Guard de Rol: verificar si la wallet conectada es VERIFICADOR_ROLE ───
  const { data: esVerificadorRol } = useReadContract({
    chainId: 42220,
    address: ADDRESSES.BIOTA_PASSPORT,
    abi: BIOTA_PASSPORT_ABI,
    functionName: "isVerificador",
    args: verificadorAddress ? [verificadorAddress] : undefined,
    query: { enabled: !!verificadorAddress },
  });

  // ── Escritura: validarImpacto(tokenId) ────────────────────────────────────
  // [EVM] useWriteContract nos da la función para firmar txs con la wallet del usuario
  const { 
    writeContract,       // función para iniciar la transacción
    isPending: isSigning, // true mientras el usuario está firmando en su wallet
    data: txHash,         // hash de la tx una vez firmada
    error: writeError,    // error si el usuario rechaza o hay problema on-chain
    reset: resetWrite     // limpia el estado para poder intentar de nuevo
  } = useWriteContract();

  // [EVM] Esperar confirmación on-chain de la transacción firmada
  const { 
    isLoading: isConfirming, // true mientras la tx está en el mempool
    isSuccess: isCertified    // true cuando el bloque confirmó la tx
  } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  });

  // ── Transformar el array del contrato en un objeto legible ────────────────
  // [SOLIDITY] El contrato retorna un tuple (array), no un objeto con nombres.
  // Aquí mapeamos cada índice al nombre correcto del struct LoteData.
  const fincaData = useMemo(() => {
    if (!passport || !Array.isArray(passport) || passport[0] === "0x0000000000000000000000000000000000000000") return null;
    return {
      verificador: passport[0] as string,     // address verificador
      esVerificado: passport[1] as boolean,   // bool esVerificado
      isHumanVerified: passport[2] as boolean,// bool isHumanVerified
      areaM2: BigInt(passport[3] as any),          // uint32 areaM2
      cmSuelo: BigInt(passport[4] as any),         // uint32 cmSueloRecuperado
      fecha: BigInt(passport[5] as any),           // uint64 fechaRegistro
      ubicacion: (passport[7] as string) || "No especificada",   // string ubicacionGeografica
      estado: (passport[8] as string) || "N/A",                  // string estadoBiologico
      hashAnalisis: (passport[9] as string) || "—",              // string hashAnalisisLab
      contacto: (passport[10] as string) || "—",                 // string ingredientesHash
      metodos: (passport[11] as string) || "—"                   // string metodosAgricolas
    };
  }, [passport]);

  // ── Handler: firmar validarImpacto() ─────────────────────────────────────
  const handleEmitirCertificado = () => {
    if (!searchId) return;
    // [EVM] Llamamos al contrato BiotaPassport con la función validarImpacto(tokenId)
    // [SOLIDITY] Requiere VERIFICADOR_ROLE. Si la wallet no lo tiene, la tx revertirá.
    // [GAS] Gas estimado: ~30,000 gwei en Celo. Muy económico.
    writeContract({
      chainId: 42220,
      address: ADDRESSES.BIOTA_PASSPORT as `0x${string}`,
      abi: BIOTA_PASSPORT_ABI,
      functionName: "validarImpacto",
      args: [BigInt(searchId)],
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-8">
      <div className="space-y-1">
        <Link href="/" className="text-[9px] font-black text-stone-500 uppercase flex items-center gap-1.5 mb-2 hover:text-white transition-colors">
          <ArrowLeft className="w-3 h-3" /> Panel Biota
        </Link>
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">
          🔎 Auditoría <span className="text-emerald-500">Blockchain</span>
        </h1>
        {/* Badge de rol del verificador */}
        {verificadorAddress && (
          <p className="text-[10px] text-stone-500 font-mono">
            Wallet: {verificadorAddress.slice(0, 8)}...{verificadorAddress.slice(-6)}
            {esVerificadorRol
              ? <span className="ml-2 text-emerald-400 font-bold">● VERIFICADOR AUTORIZADO</span>
              : <span className="ml-2 text-amber-400">● Solo lectura (sin VERIFICADOR_ROLE)</span>
            }
          </p>
        )}
      </div>

      {/* Buscador de Pasaportes */}
      <Card className="bg-white/5 border-white/10 p-6 rounded-3xl shadow-2xl">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">
              ID del Pasaporte
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <Input 
                placeholder="ID (1, 2, 3...)" 
                className="bg-black/40 border-white/10 h-14 pl-12 text-lg font-black text-white rounded-2xl focus:border-emerald-500"
                value={searchId}
                onChange={(e) => {
                  setSearchId(e.target.value);
                  resetWrite(); // limpiar estado de escritura al cambiar ID
                }}
              />
            </div>
          </div>
          <Button 
            onClick={() => refetch()} 
            className="h-14 px-8 bg-emerald-600 hover:bg-emerald-500 text-black font-black uppercase rounded-2xl"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Consultar"}
          </Button>
        </div>
      </Card>

      {/* Resultado del Pasaporte */}
      {fincaData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Datos de la Finca */}
          <Card className="lg:col-span-2 bg-[#0a0a0a] border-white/5 p-8 rounded-3xl space-y-8">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <MapPin size={32} />
                </div>
                <div>
                  {/* Badge dinámico según estado de verificación */}
                  <Badge className={`text-[9px] font-black uppercase mb-1 ${
                    fincaData.esVerificado 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}>
                    {fincaData.esVerificado ? "✅ Verificado On-Chain" : "⏳ Pendiente Verificación"}
                  </Badge>
                  <h2 className="text-2xl font-black text-white italic uppercase">{fincaData.ubicacion}</h2>
                </div>
              </div>
              <p className="text-4xl font-black text-white/20 font-mono">#{searchId}</p>
            </div>

            {/* Métricas de la Finca */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <p className="text-[10px] font-black text-stone-600 uppercase">Productor</p>
                <p className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-blue-400" /> {fincaData.contacto}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black text-stone-600 uppercase">Área Registrada</p>
                <p className="text-lg font-black text-white">{fincaData.areaM2.toLocaleString()} m²</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-stone-600 uppercase">Suelo Recuperado</p>
                <p className="text-lg font-black text-emerald-500">{fincaData.cmSuelo.toLocaleString()} cm²</p>
              </div>
            </div>

            {/* Métodos Agrícolas */}
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-[9px] font-black text-stone-500 uppercase mb-2 tracking-[0.2em]">Métodos Agrícolas</p>
              <p className="text-xs text-stone-300 italic">{fincaData.metodos}</p>
            </div>

            {/* Hash dMRV (IPFS) — visible solo si existe */}
            {fincaData.hashAnalisis && fincaData.hashAnalisis !== "—" && (
              <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                <p className="text-[9px] font-black text-emerald-500 uppercase mb-2 tracking-[0.2em] flex items-center gap-1.5">
                  <FileText className="w-3 h-3" /> Reporte dMRV en IPFS
                </p>
                <a 
                  href={fincaData.hashAnalisis.startsWith('ipfs://') 
                    ? `https://gateway.pinata.cloud/ipfs/${fincaData.hashAnalisis.replace('ipfs://', '')}` 
                    : fincaData.hashAnalisis
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-400 font-mono hover:text-emerald-300 flex items-center gap-1"
                >
                  {fincaData.hashAnalisis.slice(0, 40)}...
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </Card>

          {/* Panel de Certificación */}
          <div className="space-y-6">
            <Card className={`p-6 rounded-3xl text-center space-y-4 ${
              isCertified 
                ? "bg-emerald-600/20 border-emerald-500/40" 
                : "bg-emerald-600/10 border-emerald-500/20"
            }`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-glow-sm ${
                isCertified ? "bg-emerald-500/40" : "bg-emerald-500/20"
              }`}>
                {isCertified 
                  ? <BadgeCheck size={32} className="text-emerald-300" />
                  : <ShieldCheck size={32} className="text-emerald-500" />
                }
              </div>

              <h3 className="font-black text-white uppercase italic">
                {isCertified ? "¡Certificado!" : "Validar Impacto"}
              </h3>

              {/* Feedback según estado de la tx */}
              {isCertified ? (
                <div className="space-y-2">
                  <p className="text-[10px] text-emerald-400 font-mono">esVerificado = true</p>
                  <a 
                    href={`https://celoscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] text-emerald-500 hover:text-emerald-300 flex items-center justify-center gap-1"
                  >
                    Ver en Celoscan <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : (
                <p className="text-[10px] text-stone-400 leading-relaxed uppercase">
                  Confirma la regeneración de este lote para activar recompensas en GoodCollective.
                </p>
              )}

              {/* Error de escritura */}
              {writeError && (
                <p className="text-[9px] text-red-400 bg-red-500/10 p-2 rounded-xl">
                  {writeError.message.slice(0, 80)}...
                </p>
              )}

              {/* Botón principal — guard de rol */}
              {fincaData.esVerificado ? (
                <div className="flex items-center justify-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-black uppercase">Ya Verificado</span>
                </div>
              ) : esVerificadorRol ? (
                // [SOLIDITY] Solo visible si tiene VERIFICADOR_ROLE
                <Button 
                  onClick={handleEmitirCertificado}
                  disabled={isSigning || isConfirming || isCertified}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase rounded-xl h-12"
                >
                  {isSigning ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Firmando...</>
                  ) : isConfirming ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Confirmando...</>
                  ) : (
                    <><ShieldCheck className="w-4 h-4 mr-2" /> Emitir Certificado</>
                  )}
                </Button>
              ) : (
                // Sin VERIFICADOR_ROLE: solo lectura
                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <p className="text-[9px] text-amber-400 font-bold uppercase">
                    Wallet sin VERIFICADOR_ROLE. Solo el verificador autorizado puede certificar.
                  </p>
                </div>
              )}
            </Card>

            {/* Indicador de Humanidad */}
            <Card className="bg-blue-600/10 border-blue-500/20 p-4 rounded-2xl space-y-2">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                Proof of Personhood
              </p>
              <div className="flex items-center gap-2">
                {fincaData.isHumanVerified 
                  ? <><BadgeCheck className="w-5 h-5 text-blue-400" /><span className="text-sm text-white font-bold">Humano Verificado</span></>
                  : <><AlertCircle className="w-5 h-5 text-stone-500" /><span className="text-sm text-stone-500">Sin verificar</span></>
                }
              </div>
            </Card>
          </div>
        </div>
      ) : searchId && !isLoading && (
        <div className="p-12 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
          <AlertCircle className="w-12 h-12 text-stone-700 mx-auto mb-4" />
          <p className="text-stone-500 font-black uppercase text-xs tracking-widest">
            No se encontró información para el ID #{searchId}
          </p>
        </div>
      )}
    </div>
  );
}

