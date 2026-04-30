"use client"

import { useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  User,
  MapPin,
  Maximize,
  Smartphone,
  Send as SendIcon,
  FlaskConical,
  Sprout,
  Leaf,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  TreePine,
  Coins,
  CircleDollarSign,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useConnection } from "wagmi"
import { useBiotaPass } from "@/hooks/useBiotaPass"
import { type PaymentMethod } from "@/hooks/useBiotaPass"
import { useToast } from "@/hooks/use-toast"

// ────────────────────────────────────────────────────────────────────────────────
// [ZOD] Schema de Validación — Campos alineados al contrato BiotaPassport.
// ────────────────────────────────────────────────────────────────────────────────
const registroSchema = z.object({
  // === PASO 1: Identidad y Contacto ===
  contacto: z
    .string()
    .min(5, "Mínimo 5 caracteres (celular o @telegram)")
    .max(60, "Máximo 60 caracteres"),
  tipoContacto: z.enum(["celular", "telegram"], {
    required_error: "Selecciona un tipo de contacto",
  }),

  // === PASO 2: Datos del Predio ===
  finca: z.string().min(2, "Nombre de la finca o predio").max(60),
  vereda: z.string().min(2, "Nombre de la vereda").max(60),
  municipio: z.string().min(2, "Municipio o ciudad").max(60),
  departamento: z.string().min(2, "Departamento").max(60),
  areaM2: z
    .number({ invalid_type_error: "Ingresa un número válido" })
    .min(1, "El área debe ser mayor a 0")
    .max(10_000_000, "Máximo 10.000.000 m²"),

  // === PASO 3: Diagnóstico Técnico ===
  estadoBiologico: z
    .string()
    .max(200, "Máximo 200 caracteres")
    .optional()
    .default(""),
  hashAnalisisLab: z
    .string()
    .max(200, "Máximo 200 caracteres")
    .optional()
    .default(""),
  metodosAgricolas: z
    .string()
    .min(2, "Describe al menos un método")
    .max(200, "Máximo 200 caracteres"),
  metodoPago: z.enum(["celo", "gd"]).default("celo"),
})

type RegistroFormData = z.infer<typeof registroSchema>

// ────────────────────────────────────────────────────────────────────────────────
// [MAPEO] Convierte los campos del formulario a los parámetros de mintPasaporte.
// ────────────────────────────────────────────────────────────────────────────────
function mapFormToMintParams(data: RegistroFormData) {
  const contactoEncoded = `contacto:${data.tipoContacto}:${data.contacto}`

  // Concatenación territorial: un solo string, semánticamente rico, bajo coste on-chain
  // Formato: "Finca:<nombre>|Vereda:<vereda>|<municipio>,<departamento>"
  const ubicacion = `Finca:${data.finca}|Vereda:${data.vereda}|${data.municipio},${data.departamento}`

  return {
    tokenURI: "ipfs://biota-onboarding-v1",
    ubicacionGeografica: ubicacion,
    areaM2: BigInt(Math.round(data.areaM2)),
    cmSueloRecuperado: BigInt(0),
    estadoBiologico: data.estadoBiologico || "En Diagnóstico Inicial",
    hashAnalisisLab: data.hashAnalisisLab || "Pendiente de análisis",
    ingredientesHash: contactoEncoded,
    metodosAgricolas: data.metodosAgricolas,
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// [STEPPER] Configuración visual de los pasos
// ────────────────────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, title: "Identidad", subtitle: "Contacto del productor", icon: User },
  { id: 2, title: "Predio", subtitle: "Ubicación y extensión", icon: MapPin },
  { id: 3, title: "Diagnóstico", subtitle: "Técnicas y laboratorio", icon: FlaskConical },
] as const

// ────────────────────────────────────────────────────────────────────────────────
// [COMPONENTE] FormularioRegistroProductor
// ────────────────────────────────────────────────────────────────────────────────
export function FormularioRegistroProductor() {
  const [step, setStep] = useState(1)
  const [success, setSuccess] = useState(false)
  const { address } = useConnection()
  const { mintPassport, isMinting, hasPassport } = useBiotaPass()
  const { toast } = useToast()

  const form = useForm<RegistroFormData>({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      contacto: "",
      tipoContacto: "celular",
      finca: "",
      vereda: "",
      municipio: "",
      departamento: "",
      areaM2: 0,
      estadoBiologico: "",
      hashAnalisisLab: "",
      metodosAgricolas: "Agroecología",
      metodoPago: "celo",
    },
    mode: "onTouched",
  })

  // Validar campos del paso actual antes de avanzar
  const validateStep = useCallback(async (currentStep: number): Promise<boolean> => {
    const fieldsPerStep: Record<number, (keyof RegistroFormData)[]> = {
      1: ["contacto", "tipoContacto"],
      2: ["finca", "vereda", "municipio", "departamento", "areaM2"],
      3: ["metodosAgricolas"],
    }
    const result = await form.trigger(fieldsPerStep[currentStep])
    return result
  }, [form])

  const handleNext = useCallback(async () => {
    const isValid = await validateStep(step)
    if (isValid && step < 3) setStep(s => s + 1)
  }, [step, validateStep])

  const handlePrev = useCallback(() => {
    if (step > 1) setStep(s => s - 1)
  }, [step])

  const onSubmit = useCallback(async (data: RegistroFormData) => {
    if (!address) {
      toast({ title: "Wallet no conectada", description: "Conecta tu wallet para continuar.", variant: "destructive" })
      return
    }
    try {
      const mintParams = mapFormToMintParams(data)
      await mintPassport(mintParams, data.metodoPago as PaymentMethod)
      setSuccess(true)
      toast({
        title: "🌱 ¡Pasaporte Solicitado!",
        description: "Tu identidad biota se está registrando en Celo Mainnet.",
      })
    } catch (error: any) {
      toast({
        title: "Error al registrar",
        description: error?.message?.slice(0, 100) || "Error desconocido",
        variant: "destructive",
      })
    }
  }, [address, mintPassport, toast])

  // Si ya tiene pasaporte, mostramos un badge de éxito
  if (hasPassport) {
    return (
      <Card className="bg-emerald-900/20 border-emerald-500/30 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-400" />
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h3 className="text-xl font-black text-emerald-400 uppercase tracking-tight">Pasaporte Activo</h3>
          <p className="text-stone-400 text-sm max-w-sm mx-auto">
            Tu identidad Biota ya está registrada en la blockchain de Celo. 
            Navega al panel de Pasaporte para gestionar tu predio.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Si el mint fue exitoso
  if (success) {
    return (
      <Card className="bg-emerald-900/20 border-emerald-500/30 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#FCFF52] via-emerald-400 to-[#00B0A0] animate-shimmer" />
        <CardContent className="p-8 text-center space-y-6">
          <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
            <Sprout className="w-12 h-12 text-emerald-500 animate-pulse" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">
              Registro Enviado
            </h3>
            <p className="text-stone-400 text-sm mt-2 max-w-sm mx-auto">
              Tu pasaporte se está confirmando en la blockchain de Celo. 
              El Oráculo Biota verificará tus datos y activará tu acceso al protocolo.
            </p>
          </div>
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
            <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">
              Estado del Pasaporte
            </p>
            <p className="font-mono text-xs mt-1 text-emerald-200/50 animate-pulse">
              CONFIRMANDO_EN_CELO...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#0a0a0a] border-white/5 overflow-hidden shadow-2xl rounded-3xl">
      {/* ═══ HEADER CON BARRA DE PROGRESO ═══ */}
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-black italic uppercase text-white leading-none flex items-center gap-2">
              <Leaf className="w-5 h-5" />
              Registro de Productor
            </h3>
            <p className="text-emerald-100/80 text-[10px] font-bold uppercase tracking-widest mt-1">
              Paso {step} de 3 • Onboarding Agrosostenible
            </p>
          </div>
          <ShieldCheck size={36} className="text-white/30" />
        </div>

        {/* Stepper visual */}
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const isActive = step === s.id
            const isComplete = step > s.id
            return (
              <div key={s.id} className="flex-1 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => { if (isComplete) setStep(s.id) }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-[10px] font-bold uppercase tracking-wide w-full
                    ${isActive ? "bg-white/20 text-white shadow-inner" :
                      isComplete ? "bg-white/10 text-emerald-200 cursor-pointer hover:bg-white/15" :
                      "bg-white/5 text-white/30 cursor-default"}`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0
                    ${isComplete ? "bg-emerald-300/30" : isActive ? "bg-white/20" : "bg-white/5"}`}>
                    {isComplete ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  <span className="hidden sm:inline truncate">{s.title}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`w-4 h-0.5 rounded shrink-0 ${isComplete ? "bg-emerald-300/50" : "bg-white/10"}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══ FORMULARIO ═══ */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="p-6 sm:p-8">
            {/* ═══ PASO 1: Identidad y Contacto ═══ */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Identidad del Productor</span>
                </div>

                <FormField
                  control={form.control}
                  name="tipoContacto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-stone-500">
                        Tipo de Contacto
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-12 text-sm w-full hover:border-emerald-500/50 transition-colors">
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="celular">
                            <span className="flex items-center gap-2">
                              <Smartphone className="w-4 h-4 text-emerald-500" />
                              Celular / WhatsApp
                            </span>
                          </SelectItem>
                          <SelectItem value="telegram">
                            <span className="flex items-center gap-2">
                              <SendIcon className="w-4 h-4 text-blue-400" />
                              Telegram
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contacto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-stone-500">
                        {form.watch("tipoContacto") === "telegram" ? "Usuario de Telegram" : "Número de Celular"}
                      </FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 focus-within:border-emerald-500 transition-all">
                          {form.watch("tipoContacto") === "telegram" 
                            ? <SendIcon className="w-4 h-4 text-blue-400 shrink-0" />
                            : <Smartphone className="w-4 h-4 text-stone-500 shrink-0" />
                          }
                          <Input 
                            {...field}
                            placeholder={form.watch("tipoContacto") === "telegram" ? "@usuario_biota" : "+57 300 000 0000"}
                            className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-12 text-sm px-0"
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-[10px] text-stone-600">
                        Este dato se almacena on-chain para que el equipo técnico pueda contactarte.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ═══ Selector de Método de Pago ═══ */}
                <FormField
                  control={form.control}
                  name="metodoPago"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-stone-500">
                        Método de Pago del Pasaporte
                      </FormLabel>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => field.onChange("celo")}
                          className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                            field.value === "celo"
                              ? "bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/10"
                              : "bg-white/5 border-white/10 hover:border-amber-500/20"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            field.value === "celo" ? "bg-amber-500/20" : "bg-white/5"
                          }`}>
                            <Coins className={`w-5 h-5 ${field.value === "celo" ? "text-amber-400" : "text-stone-500"}`} />
                          </div>
                          <div className="text-left">
                            <p className={`text-sm font-bold ${field.value === "celo" ? "text-amber-400" : "text-stone-300"}`}>0.25 CELO</p>
                            <p className="text-[9px] text-stone-500">Pago nativo</p>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange("gd")}
                          className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                            field.value === "gd"
                              ? "bg-blue-500/10 border-blue-500/40 shadow-lg shadow-blue-500/10"
                              : "bg-white/5 border-white/10 hover:border-blue-500/20"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            field.value === "gd" ? "bg-blue-500/20" : "bg-white/5"
                          }`}>
                            <CircleDollarSign className={`w-5 h-5 ${field.value === "gd" ? "text-blue-400" : "text-stone-500"}`} />
                          </div>
                          <div className="text-left">
                            <p className={`text-sm font-bold ${field.value === "gd" ? "text-blue-400" : "text-stone-300"}`}>50 G$</p>
                            <p className="text-[9px] text-stone-500">GoodDollar</p>
                          </div>
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* ═══ PASO 2: Datos del Predio ═══ */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Datos del Predio</span>
                </div>

                <FormField
                  control={form.control}
                  name="finca"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-stone-500">Nombre de la Finca / Predio</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 focus-within:border-emerald-500 transition-all">
                          <Leaf className="w-4 h-4 text-stone-500 shrink-0" />
                          <Input {...field} placeholder="Finca Las Palmas, Predio El Naranjal..." className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-12 text-sm px-0" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="vereda"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase text-stone-500">Vereda</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Vereda La Madera" className="bg-white/5 border-white/10 rounded-xl h-11 text-sm px-3 focus:border-emerald-500 transition-all" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="municipio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase text-stone-500">Municipio / Ciudad</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="El Carmen de Viboral" className="bg-white/5 border-white/10 rounded-xl h-11 text-sm px-3 focus:border-emerald-500 transition-all" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="departamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-stone-500">Departamento</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 focus-within:border-emerald-500 transition-all">
                          <MapPin className="w-4 h-4 text-stone-500 shrink-0" />
                          <Input {...field} placeholder="Antioquia, Nariño, Boyacá..." className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-12 text-sm px-0" />
                        </div>
                      </FormControl>
                      <FormDescription className="text-[10px] text-stone-600">
                        Se concatena en un solo string: <code className="text-emerald-500/70">Finca|Vereda|Municipio,Depto</code>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="areaM2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-stone-500">
                        Área Total (m²)
                      </FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 focus-within:border-emerald-500 transition-all">
                          <Maximize className="w-4 h-4 text-stone-500 shrink-0" />
                          <Input 
                            type="number"
                            placeholder="10000"
                            className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-12 text-sm px-0"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                          />
                          <span className="text-[10px] font-bold text-stone-600 shrink-0">m²</span>
                        </div>
                      </FormControl>
                      <FormDescription className="text-[10px] text-stone-600">
                        1 hectárea = 10.000 m². Se almacena como <code className="text-emerald-500/70">areaM2</code> (uint32).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* ═══ PASO 3: Diagnóstico Técnico ═══ */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <FlaskConical className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Diagnóstico Técnico</span>
                </div>

                <FormField
                  control={form.control}
                  name="estadoBiologico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-stone-500">
                        Diagnóstico Agrosostenible Inicial
                        <Badge variant="outline" className="ml-2 text-[8px] text-stone-600 border-stone-700">Opcional</Badge>
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field}
                          placeholder="Ej: Suelo arcilloso degradado por ganadería extensiva, pH 4.5, presencia mínima de micorrizas..."
                          className="bg-white/5 border-white/10 rounded-xl min-h-20 text-sm resize-none focus:border-emerald-500 transition-all"
                        />
                      </FormControl>
                      <FormDescription className="text-[10px] text-stone-600">
                        Se almacena como <code className="text-emerald-500/70">estadoBiologico</code>. Si se deja vacío, se registra como &quot;En Diagnóstico Inicial&quot;.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hashAnalisisLab"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-stone-500">
                        Resultados de Laboratorio
                        <Badge variant="outline" className="ml-2 text-[8px] text-stone-600 border-stone-700">Opcional</Badge>
                      </FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 focus-within:border-emerald-500 transition-all">
                          <FlaskConical className="w-4 h-4 text-stone-500 shrink-0" />
                          <Input 
                            {...field}
                            placeholder="pH 5.2, MO 3.1%, N 0.15%, CIC 12"
                            className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-12 text-sm px-0"
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-[10px] text-stone-600">
                        Se almacena como <code className="text-emerald-500/70">hashAnalisisLab</code>. Formato libre de comas/valores.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="metodosAgricolas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-stone-500">
                        Métodos Agrícolas
                      </FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 focus-within:border-emerald-500 transition-all">
                          <TreePine className="w-4 h-4 text-stone-500 shrink-0" />
                          <Input 
                            {...field}
                            placeholder="Agroecología, Sintrópica, Biochar, Bocashi..."
                            className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-12 text-sm px-0"
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-[10px] text-stone-600">
                        Se almacena como <code className="text-emerald-500/70">metodosAgricolas</code> en el contrato.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* ═══ BOTONES DE NAVEGACIÓN ═══ */}
            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrev}
                  className="flex-1 sm:flex-none border-white/10 text-stone-400 hover:text-white hover:border-emerald-500/50 rounded-xl h-12 font-black uppercase text-xs transition-all"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Atrás
                </Button>
              )}
              
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 bg-white text-black hover:bg-emerald-500 hover:text-white rounded-xl h-12 font-black uppercase text-sm transition-all"
                >
                  Siguiente Paso
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isMinting || !address}
                  className="flex-1 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-400 hover:via-green-400 hover:to-teal-400 text-white rounded-xl h-12 font-black uppercase text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isMinting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Registrando en Celo...
                    </>
                  ) : !address ? (
                    <>Conecta tu Wallet</>
                  ) : (
                    <>
                      <Sprout className="w-4 h-4 mr-2" />
                      Firmar y Registrar — Costo: {form.watch("metodoPago") === "celo" ? "0.25 CELO" : "50 G$"}
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* ═══ INDICADOR DE WALLET ═══ */}
            {address && (
              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-stone-600">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono">{address.slice(0, 6)}...{address.slice(-4)}</span>
                <span className="text-stone-700">|</span>
                <span className="text-emerald-600 font-bold">Celo Mainnet</span>
              </div>
            )}
          </CardContent>
        </form>
      </Form>
    </Card>
  )
}
