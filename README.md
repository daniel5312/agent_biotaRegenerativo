# 🌿 Biota Protocol & Artesanía Viajera
**Ecosistema Autónomo de Finanzas Regenerativas (ReFi) y Economía Phygital en Celo.**

Biota Protocol es una infraestructura Web3 "invisible" diseñada para empoderar a productores rurales y artesanos. Al orquestar contratos inteligentes, flujos de capital continuo y agentes de Inteligencia Artificial, el protocolo transforma la salud del suelo y el trabajo artesanal en activos digitales, garantizando un ecosistema financiero autosustentable sin la fricción tradicional de la blockchain.

## 🧬 Arquitectura del Sistema: Dual-Wallet

El protocolo opera bajo una arquitectura de **Doble Bolsillo (Dual-Wallet)** integrada nativamente en el cliente web:
1. **Bolsillo Operativo (Privy/Wagmi):** Billetera integrada (abstracta) para la interacción diaria, optimizada para MiniPay. Gestiona compras en el mercado, sellos digitales y transacciones sin requerir frases semilla.
2. **Bolsillo de Impacto (Universal Provider):** Conexión no intrusiva vía WalletConnect con GoodWallet para la gestión exclusiva del Ingreso Básico Universal (UBI) y los flujos de Superfluid.

## 🤖 Sistema Multi-Agente y Core Lógico

El ecosistema está impulsado por agentes de IA que operan on-chain sobre **Celo Mainnet** (Chain ID: 42220):
* **Agent Cajero (x402 Merchant):** Gestiona micropagos y retiene fondos en contratos Escrow. Distribuye valor a través del `BIOTA_SPLITTER` usando un mecanismo de "Double Trigger" (Aprobación Comunitaria + Verificación IA).
* **Agent Vigil / Civil+ (Security Sentinel):** Monitor preventivo de ciberseguridad. Audita permisos ERC-20 (`allowances`) y vigila actualizaciones de contratos Proxy (EIP-1967) para proteger las billeteras contra colisiones de almacenamiento y vulnerabilidades.
* **Orquestador de Diagnóstico:** IA multimodal especializada en lectura de cromatografías y análisis microbiológico para certificar la regeneración del suelo.

## ⚙️ Flujo Financiero y Tokenización

La DApp descentraliza y automatiza el acceso al capital:
* **BiotaPass (NFT Dinámico):** Un pasaporte biológico on-chain que evoluciona a medida que mejora el Bio-Score del suelo o la reputación del artesano.
* **Claim Nativo:** El reclamo del pool diario de GoodDollar (`UBI_SCHEME`) se ejecuta 100% dentro del frontend, eliminando redirecciones externas.
* **Money Streaming:** El UBI reclamado alimenta flujos constantes (`CFA_V1_FORWARDER` de Superfluid) para garantizar un "Salario Regenerativo" continuo para la comunidad.
* **Proof of Action (PoA):** Certificación geográfica y temporal de labores agrícolas y productivas.

## 🛠️ Stack Tecnológico

* **Frontend:** Next.js 15 (App Router) + Tailwind CSS. Optimizado para Telegram Mini Apps (TWA).
* **Web3 Core:** Viem, Wagmi, Privy, Thirdweb.
* **Smart Contracts:** Solidity, Proxies UUPS.
* **Protocolos DeFi:** Superfluid (Streaming), GoodDollar (UBI).
* **Inteligencia Artificial:** Google Gen AI SDK (Gemini-flash-latest / 1.5 Pro).

## 🔒 Privacidad y Propiedad Intelectual

Para proteger el conocimiento ancestral y técnico de los productores:
* La lógica de análisis de cromatogramas y las fórmulas exactas de bioinsumos (ej. Microorganismos de Montaña - MM) operan estrictamente en el entorno Server-Side.
* Las firmas de transacciones delegadas por los agentes utilizan variables de entorno fuertemente aisladas.

## 📦 Despliegue Local

1. **Clonar el repositorio:** ```bash
   git clone [https://github.com/daniel5312/agent_biotaRegenerativo.git](https://github.com/daniel5312/agent_biotaRegenerativo.git)

   Instalar dependencias: ```bash
npm install

Variables de Entorno: Copiar .env.example a .env.local y configurar las llaves correspondientes (Privy, Gemini, RPCs).

Ejecutar servidor de desarrollo: ```bash
npm run dev

Hecho con ❤️ en Envigado, Antioquia, para el ecosistema ReFi global.
## 🤖 Agentes Autónomos Integrados

El corazón de Biota está impulsado por agentes de Inteligencia Artificial que operan directamente sobre la blockchain (Celo Mainnet ID: 42220):

* **Agent Cajero (x402 Merchant):** Gestiona micropagos, retiene fondos en Escrow y distribuye valor a través del `BIOTA_SPLITTER` utilizando un mecanismo de "Double Trigger" (Aprobación Social + IA).
* **Agent Vigil / Civil+ (Security Sentinel):** Monitor de ciberseguridad en tiempo real. Audita permisos ERC-20 (`allowances`) y vigila actualizaciones de contratos Proxy (EIP-1967) para proteger los fondos de los productores rurales contra vulnerabilidades y colisiones de almacenamiento.

## ⚙️ Flujo Financiero y Reclamo Nativo (UBI)

La DApp descentraliza completamente el acceso al capital:
* **Claim Nativo:** El reclamo del pool diario de GoodDollar (`UBI_SCHEME`) se ejecuta 100% dentro del frontend de Biota, eliminando redirecciones externas.
* **Money Streaming:** El UBI reclamado alimenta flujos constantes (`CFA_V1_FORWARDER` de Superfluid) para garantizar un "Salario Regenerativo" segundo a segundo para los agricultores y artesanos.

## 🛠️ Stack Tecnológico
* **Red:** Celo Mainnet
* **Framework:** Next.js + React
* **Web3:** Viem, Wagmi, Privy, Thirdweb
* **Protocolos:** Superfluid (Streaming), GoodDollar (UBI)
* **IA:** Google Gen AI SDK (Gemini-flash-latest)

ENGLISH:
# 🌿 Biota Protocol
**Autonomous Regenerative Finance (ReFi) and Phygital Economy Ecosystem on Celo.**

Biota Protocol is an "invisible" Web3 infrastructure designed to empower rural producers and artisans. By orchestrating smart contracts, continuous capital streams, and Artificial Intelligence agents, the protocol transforms soil health and artisanal labor into digital assets, ensuring a self-sustaining financial ecosystem without the traditional friction of blockchain technology.

## 🧬 System Architecture: Dual-Wallet

The protocol operates under a **Dual-Wallet** architecture integrated natively into the web client:
1. **Operational Pocket (Privy/Wagmi):** An embedded abstract wallet for daily interactions, optimized for MiniPay. It manages marketplace purchases, digital stamps, and transactions without requiring seed phrases.
2. **Impact Pocket (Universal Provider):** A non-intrusive connection via WalletConnect with GoodWallet, exclusively managing the Universal Basic Income (UBI) and Superfluid streams.

## 🤖 Multi-Agent System and Core Logic

The ecosystem is powered by AI agents operating on-chain over **Celo Mainnet** (Chain ID: 42220):
* **Cashier Agent (x402 Merchant):** Manages micropayments and holds funds in Escrow contracts. It distributes value through the `BIOTA_SPLITTER` using a "Double Trigger" mechanism (Community Approval + AI Verification).
* **Vigil / Civil+ Agent (Security Sentinel):** Preventive cybersecurity monitor. It audits ERC-20 permissions (`allowances`) and tracks Proxy contract updates (EIP-1967) to protect wallets against storage collisions and vulnerabilities.
* **Diagnostic Orchestrator:** Multimodal AI specialized in reading chromatograms and microbiological analysis to certify soil regeneration.

## ⚙️ Financial Flow and Tokenization

The DApp decentralizes and automates capital access:
* **BiotaPass (Dynamic NFT):** An on-chain biological passport that evolves as the soil's Bio-Score or the artisan's reputation improves.
* **Native Claim:** The daily GoodDollar pool claim (`UBI_SCHEME`) is executed 100% within the frontend, eliminating external redirections.
* **Money Streaming:** The claimed UBI feeds constant flows (`CFA_V1_FORWARDER` from Superfluid) to guarantee a continuous "Regenerative Salary" for the community.
* **Proof of Action (PoA):** Geographic and temporal certification of agricultural and productive labor.

## 🛠️ Tech Stack

* **Frontend:** Next.js 15 (App Router) + Tailwind CSS. Optimized for Telegram Mini Apps (TWA).
* **Web3 Core:** Viem, Wagmi, Privy, Thirdweb.
* **Smart Contracts:** Solidity, UUPS Proxies.
* **DeFi Protocols:** Superfluid (Streaming), GoodDollar (UBI).
* **Artificial Intelligence:** Google Gen AI SDK (Gemini-flash-latest / 1.5 Pro).

## 🔒 Privacy and Intellectual Property

To protect the ancestral and technical knowledge of the producers:
* The chromatogram analysis logic and exact bio-input formulas (e.g., Mountain Microorganisms - MM) operate strictly in a Server-Side environment.
* Delegated transaction signatures by agents use tightly isolated environment variables.

## 📦 Local Deployment

1. **Clone the repository:** ```bash
   git clone [https://github.com/daniel5312/agent_biotaRegenerativo.git](https://github.com/daniel5312/agent_biotaRegenerativo.git)

   Install dependencies: ```bash
npm install

Environment Variables: Copy .env.example to .env.local and configure the corresponding keys (Privy, Gemini, RPCs).

Run development server: ```bash
npm run dev

Made with ❤️ in Envigado, Antioquia, for the global ReFi ecosystem.