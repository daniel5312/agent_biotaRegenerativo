import { TiendaMultipago } from "@/components/biota/tienda-multipago"

export default function TiendaPage() {
  return (
    <div className="min-h-screen bg-[#030712] p-4 sm:p-8 text-stone-300 font-sans">
      <div className="max-w-5xl mx-auto">
        <TiendaMultipago />
      </div>
    </div>
  )
}
