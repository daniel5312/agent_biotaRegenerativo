import { MiniPayHeader } from "@/components/minipay/minipay-header"
import type { ReactNode } from "react"

export default function MiniPayLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#fafafa] dark:bg-[#021a0e] transition-theme">
      <MiniPayHeader />
      <main className="flex-1 w-full max-w-md mx-auto relative">
        {children}
      </main>
      
      {/* Footer minimalista */}
      <footer className="py-4 text-center border-t border-emerald-200/20 dark:border-emerald-500/5">
        <p className="text-[8px] text-emerald-600/30 dark:text-emerald-400/20 font-mono uppercase tracking-[0.3em]">
          Biota Protocol · Native MiniPay Experience
        </p>
      </footer>
    </div>
  )
}
