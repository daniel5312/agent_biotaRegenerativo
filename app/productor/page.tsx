import { PasaporteView } from "@/components/biota/pasaporte-view"

export default function ProductorPage() {
  return (
    <div className="min-h-screen bg-[#030712] p-4 sm:p-8 text-stone-300 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-emerald-500 mb-2 italic uppercase">Portal del Productor</h1>
        <p className="text-stone-400 mb-8">Gestión de Pasaporte y Formulario de Minteo (Ruta Dedicada)</p>
        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6">
          <PasaporteView />
        </div>
      </div>
    </div>
  )
}
