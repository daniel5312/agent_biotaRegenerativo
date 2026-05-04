import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "@/components/providers";
import { AgentProvider } from "@/context/agentProvider";
import { ThemeProvider } from "next-themes"; // [NEXT-THEMES]
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

// Fallback to system fonts to bypass Google Fonts timeout
const inter = { className: "font-sans" }; 

export const metadata: Metadata = {
  title: "Biota Protocol: Suelo Vivo",
  description: "Plataforma de agricultura regenerativa para campesinos",
};

import { UbiFlowProvider } from "@/context/UbiFlowContext";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} font-sans antialiased transition-colors duration-500`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <Providers>
            <AgentProvider>
              <UbiFlowProvider>
                {children}
              </UbiFlowProvider>
            </AgentProvider>
          </Providers>
        </ThemeProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
