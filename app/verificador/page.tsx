import { AsesoriaView } from "@/components/biota/asesoria-view"

export default function VerificadorPage() {
  return (
    <div className="min-h-screen bg-[#030712] p-4 sm:p-8 text-stone-300 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-amber-500 mb-2 italic uppercase">Portal del Verificador</h1>
        <p className="text-stone-400 mb-8">Dashboard de Aprobación, Oráculo y Gatillo UBI (Ruta Dedicada)</p>
        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 h-[800px]">
          <AsesoriaView />
        </div>
      </div>
    </div>
  )
}
