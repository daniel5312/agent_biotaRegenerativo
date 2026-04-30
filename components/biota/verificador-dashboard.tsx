"use client";

import { useState, useMemo } from "react";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  FlaskConical,
  MessageCircle,
  Eye,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useReadContract } from "wagmi";
import { ADDRESSES, BIOTA_PASSPORT_ABI, formatCUSD } from "@/lib/contracts";
import { useVerificador } from "@/hooks/useVerificador";
import { useToast } from "@/hooks/use-toast";

// ────────────────────────────────────────────────────────────────────────────────
// Helper: Parsea el campo ingredientesHash para extraer contacto
// Formato esperado: "contacto:<tipo>:<valor>"
// ────────────────────────────────────────────────────────────────────────────────
function parseContacto(ingredientesHash: string): {
  tipo: string;
  valor: string;
} {
  if (!ingredientesHash || !ingredientesHash.startsWith("contacto:")) {
    return { tipo: "desconocido", valor: ingredientesHash || "—" };
  }
  const parts = ingredientesHash.split(":");
  return { tipo: parts[1] || "?", valor: parts.slice(2).join(":") || "—" };
}

// Tipo para los datos de pasaporte completos (12 campos de la ABI actualizada)
interface PassportData {
  tokenId: number;
  verificador: string;
  esVerificado: boolean;
  isHumanVerified: boolean;
  areaM2: number;
  cmSueloRecuperado: number;
  fechaRegistro: bigint;
  ultimaActualizacion: bigint;
  ubicacionGeografica: string;
  estadoBiologico: string;
  hashAnalisisLab: string;
  ingredientesHash: string;
  metodosAgricolas: string;
}

// ────────────────────────────────────────────────────────────────────────────────
// [COMPONENTE] VerificadorDashboard
// ────────────────────────────────────────────────────────────────────────────────
export function VerificadorDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
  const { validarImpacto, isValidating, isVerificador } = useVerificador();
  const { toast } = useToast();

  // ── Lectura de pasaportes (10 slots fijos — Rules of Hooks: no hooks en loops) ──
  const q1 = useReadContract({
    chainId: 42220,
    address: ADDRESSES.BIOTA_PASSPORT,
    abi: BIOTA_PASSPORT_ABI,
    functionName: "lotePasaporte",
    args: [BigInt(1)],
  });
  const q2 = useReadContract({
    chainId: 42220,
    address: ADDRESSES.BIOTA_PASSPORT,
    abi: BIOTA_PASSPORT_ABI,
    functionName: "lotePasaporte",
    args: [BigInt(2)],
  });
  const q3 = useReadContract({
    chainId: 42220,
    address: ADDRESSES.BIOTA_PASSPORT,
    abi: BIOTA_PASSPORT_ABI,
    functionName: "lotePasaporte",
    args: [BigInt(3)],
  });
  const q4 = useReadContract({
    chainId: 42220,
    address: ADDRESSES.BIOTA_PASSPORT,
    abi: BIOTA_PASSPORT_ABI,
    functionName: "lotePasaporte",
    args: [BigInt(4)],
  });
  const q5 = useReadContract({
    chainId: 42220,
    address: ADDRESSES.BIOTA_PASSPORT,
    abi: BIOTA_PASSPORT_ABI,
    functionName: "lotePasaporte",
    args: [BigInt(5)],
  });
  const q6 = useReadContract({
    chainId: 42220,
    address: ADDRESSES.BIOTA_PASSPORT,
    abi: BIOTA_PASSPORT_ABI,
    functionName: "lotePasaporte",
    args: [BigInt(6)],
  });
  const q7 = useReadContract({
    chainId: 42220,
    address: ADDRESSES.BIOTA_PASSPORT,
    abi: BIOTA_PASSPORT_ABI,
    functionName: "lotePasaporte",
    args: [BigInt(7)],
  });
  const q8 = useReadContract({
    chainId: 42220,
    address: ADDRESSES.BIOTA_PASSPORT,
    abi: BIOTA_PASSPORT_ABI,
    functionName: "lotePasaporte",
    args: [BigInt(8)],
  });
  const q9 = useReadContract({
    chainId: 42220,
    address: ADDRESSES.BIOTA_PASSPORT,
    abi: BIOTA_PASSPORT_ABI,
    functionName: "lotePasaporte",
    args: [BigInt(9)],
  });
  const q10 = useReadContract({
    chainId: 42220,
    address: ADDRESSES.BIOTA_PASSPORT,
    abi: BIOTA_PASSPORT_ABI,
    functionName: "lotePasaporte",
    args: [BigInt(10)],
  });

  const rawQueries = [
    { id: 1, ...q1 },
    { id: 2, ...q2 },
    { id: 3, ...q3 },
    { id: 4, ...q4 },
    { id: 5, ...q5 },
    { id: 6, ...q6 },
    { id: 7, ...q7 },
    { id: 8, ...q8 },
    { id: 9, ...q9 },
    { id: 10, ...q10 },
  ];

  const isLoadingAny = rawQueries.some((q) => q.isLoading);

  // Parsear datos de pasaportes válidos (verificador address != zero address)
  const passports: PassportData[] = useMemo(() => {
    return rawQueries
      .filter((q) => {
        if (!q.data || !Array.isArray(q.data)) return false;
        return (
          (q.data as readonly any[])[0] !==
          "0x0000000000000000000000000000000000000000"
        );
      })
      .map((q) => {
        const d = q.data as readonly any[];
        return {
          tokenId: q.id,
          verificador: d[0],
          esVerificado: d[1],
          isHumanVerified: d[2],
          areaM2: Number(d[3]),
          cmSueloRecuperado: Number(d[4]),
          fechaRegistro: d[5],
          ultimaActualizacion: d[6],
          ubicacionGeografica: d[7] || "—",
          estadoBiologico: d[8] || "—",
          hashAnalisisLab: d[9] || "—",
          ingredientesHash: d[10] || "—",
          metodosAgricolas: d[11] || "—",
        };
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    q1.data,
    q2.data,
    q3.data,
    q4.data,
    q5.data,
    q6.data,
    q7.data,
    q8.data,
    q9.data,
    q10.data,
  ]);

  // Filtrar por búsqueda
  const filtered = useMemo(() => {
    if (!searchQuery) return passports;
    const q = searchQuery.toLowerCase();
    return passports.filter(
      (p) =>
        p.ubicacionGeografica.toLowerCase().includes(q) ||
        p.ingredientesHash.toLowerCase().includes(q) ||
        p.hashAnalisisLab.toLowerCase().includes(q) ||
        p.tokenId.toString().includes(q),
    );
  }, [passports, searchQuery]);

  const handleValidar = (tokenId: number) => {
    if (!isVerificador) {
      toast({
        title: "Sin permisos",
        description: "Tu wallet no tiene rol de Verificador.",
        variant: "destructive",
      });
      return;
    }
    setSelectedTokenId(tokenId);
    validarImpacto(BigInt(tokenId));
    toast({
      title: "⏳ Validando Impacto...",
      description: `Firma la transacción para verificar el pasaporte #${tokenId}.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/"
            className="group inline-flex items-center gap-2 bg-white/5 border border-white/10 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 hover:text-amber-500 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            Volver al Inicio
          </Link>
          <h1 className="text-4xl font-black text-amber-500 italic uppercase leading-tight tracking-tighter">
            Panel de Auditoría <span className="text-stone-600">On-Chain</span>
          </h1>
          <p className="text-stone-500 text-xs font-mono uppercase tracking-[0.2em] mt-2">
            Verificación Determinista de Pasaportes Biológicos | Celo Mainnet
          </p>
        </div>
        <Badge
          className={`h-10 px-6 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all ${
            isVerificador
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 shadow-emerald-500/10"
              : "bg-red-500/10 text-red-500 border-red-500/30 shadow-red-500/10"
          }`}
        >
          <ShieldCheck className="w-4 h-4 mr-2" />
          {isVerificador ? "Verificador Autorizado" : "Acceso Restringido"}
        </Badge>
      </div>

      {/* SEARCH BAR */}
      <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 focus-within:border-amber-500/50 transition-all">
        <Search className="w-4 h-4 text-stone-500 shrink-0" />
        <Input
          placeholder="Buscar por finca, contacto, lab o tokenId..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-12 text-sm px-0"
        />
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-emerald-900/20 border-emerald-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-black text-emerald-400 font-mono">
              {passports.length}
            </p>
            <p className="text-[9px] text-stone-500 uppercase font-bold tracking-widest mt-1">
              Pasaportes
            </p>
          </CardContent>
        </Card>
        <Card className="bg-amber-900/20 border-amber-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-black text-amber-400 font-mono">
              {passports.filter((p) => p.esVerificado).length}
            </p>
            <p className="text-[9px] text-stone-500 uppercase font-bold tracking-widest mt-1">
              Verificados
            </p>
          </CardContent>
        </Card>
        <Card className="bg-blue-900/20 border-blue-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-black text-blue-400 font-mono">
              {passports.filter((p) => !p.esVerificado).length}
            </p>
            <p className="text-[9px] text-stone-500 uppercase font-bold tracking-widest mt-1">
              Pendientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* DATA TABLE */}
      <Card className="bg-[#0a0a0a] border-white/5 overflow-hidden rounded-2xl">
        <div className="h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400" />
        <CardContent className="p-0">
          {isLoadingAny ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
              <span className="text-stone-500 text-sm font-bold">
                Leyendo contratos on-chain...
              </span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Eye className="w-8 h-8 text-stone-700" />
              <span className="text-stone-600 text-sm">
                {searchQuery
                  ? "Sin resultados para la búsqueda"
                  : "No se encontraron pasaportes registrados"}
              </span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase text-stone-500 tracking-widest">
                      #ID
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-stone-500 tracking-widest">
                      <MessageCircle className="w-3 h-3 inline mr-1" />
                      Contacto
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-stone-500 tracking-widest">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      Finca / Vereda
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-stone-500 tracking-widest">
                      <FlaskConical className="w-3 h-3 inline mr-1" />
                      Lab / Suelo
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-stone-500 tracking-widest">
                      Estado
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-stone-500 tracking-widest text-right">
                      Acción
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => {
                    const contacto = parseContacto(p.ingredientesHash);
                    return (
                      <TableRow
                        key={p.tokenId}
                        className="border-white/5 hover:bg-white/[0.02]"
                      >
                        <TableCell className="font-mono font-bold text-amber-400">
                          #{p.tokenId}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {contacto.tipo === "telegram" ? (
                              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[9px] px-1.5">
                                TG
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] px-1.5">
                                CEL
                              </Badge>
                            )}
                            <span className="text-xs text-stone-300 font-mono">
                              {contacto.valor}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-stone-300 max-w-[160px] truncate block">
                            {p.ubicacionGeografica}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-stone-400 max-w-[140px] truncate block font-mono">
                            {p.hashAnalisisLab}
                          </span>
                        </TableCell>
                        <TableCell>
                          {p.esVerificado ? (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px]">
                              <CheckCircle2 className="w-3 h-3 mr-1" />{" "}
                              Verificado
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[9px]">
                              <AlertCircle className="w-3 h-3 mr-1" /> Pendiente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            disabled={
                              !isVerificador ||
                              p.esVerificado ||
                              (isValidating && selectedTokenId === p.tokenId)
                            }
                            onClick={() => handleValidar(p.tokenId)}
                            className={`h-8 text-[10px] font-black uppercase rounded-lg transition-all ${
                              p.esVerificado
                                ? "bg-emerald-500/10 text-emerald-500/50 cursor-not-allowed"
                                : "bg-amber-500 hover:bg-amber-400 text-black"
                            }`}
                          >
                            {isValidating && selectedTokenId === p.tokenId ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : p.esVerificado ? (
                              "OK"
                            ) : (
                              <>
                                <ShieldCheck className="w-3 h-3 mr-1" /> Validar
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
