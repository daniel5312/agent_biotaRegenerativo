import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "@/components/providers";
import { AgentProvider } from "@/context/agentProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Biota Protocol: Suelo Vivo",
  description: "Plataforma de agricultura regenerativa para campesinos",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} font-sans antialiased`}>
        <Providers>
          <AgentProvider>{children}</AgentProvider>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
