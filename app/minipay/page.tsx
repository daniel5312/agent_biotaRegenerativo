// app/minipay/page.tsx
'use client'

import { MiniPayDashboard } from '@/components/biota/MiniPayDashboard'

export default function MiniPayPage() {
  return (
    <main className="min-h-screen bg-emerald-50 dark:bg-emerald-950/40">
      {/* 
         Ruta Crítica: SPA Ligera para productores en MiniPay.
         Optimizado para conexiones móviles lentas.
      */}
      <MiniPayDashboard />
    </main>
  )
}
