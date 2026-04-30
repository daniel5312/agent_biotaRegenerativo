import { PasaporteView } from "@/components/biota/pasaporte-view"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ProductorPage() {
  return (
    <div className="min-h-screen bg-[#030712] p-4 sm:p-8 text-stone-300 font-sans">
      <div className="max-w-5xl mx-auto">
        <Link 
          href="/" 
          className="group inline-flex items-center gap-2 bg-white/5 border border-white/10 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> 
          Volver al Inicio
        </Link>
        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-4 sm:p-8">
          <PasaporteView />
        </div>
      </div>
    </div>
  )
}
