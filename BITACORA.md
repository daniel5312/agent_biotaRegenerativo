# 📓 Bitácora Técnica — Biota Protocol
**Proyecto:** BiotaScrow / Biota Protocol DApp  
**Red:** Celo Mainnet (Chain ID: 42220)  
**Repositorio:** `feat/investor-refi-profile` branch  
**Inicio del proyecto:** Abril 2026  

---

## 🗂️ Índice
1. [Arquitectura General](#arquitectura-general)
2. [Contratos Desplegados en Mainnet](#contratos-desplegados-en-mainnet)
3. [Arquitectura DeFi (Yield)](#arquitectura-defi-yield)
4. [Frontend — Perfiles de Usuario](#frontend--perfiles-de-usuario)
5. [Decisiones Técnicas Importantes](#decisiones-técnicas-importantes)
6. [Sesiones de Desarrollo](#sesiones-de-desarrollo)
7. [Pendientes y Hoja de Ruta](#pendientes-y-hoja-de-ruta)

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                      BIOTA PROTOCOL V1                           │
│                                                                   │
│  FRONTEND (Next.js 15 + Privy + Wagmi)                          │
│  ┌──────────────┐     ┌──────────────────┐                      │
│  │  PRODUCTOR   │     │    INVERSOR ReFi  │                      │
│  │  Pasaporte   │     │  Mercado (Tienda) │                      │
│  │  Impacto/UBI │     │  Bóveda DeFi      │                      │
│  │  IA Capataz  │     │  Certificado RWA  │                      │
│  └──────┬───────┘     └────────┬──────────┘                      │
│         │                      │                                  │
│  CONTRATOS INTELIGENTES (Celo Mainnet)                           │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐         │
│  │BiotaPassport │   │BiotaSplitter │   │  BiotaRWA    │         │
│  │  ERC-721     │   │  Router de   │   │  ERC-1155    │         │
│  │  (NFT ID)    │   │  Pagos 3-vías│   │  (Café NFT)  │         │
│  └──────────────┘   └──────────────┘   └──────┬───────┘         │
│         │                                      │                  │
│  ┌──────────────┐                    ┌──────────────────┐        │
│  │  BiotaUBI    │                    │  IYieldStrategy  │        │
│  │  (UBI Claim) │                    │  ┌────────────┐  │        │
│  └──────────────┘                    │  │MoolaStrat. │  │        │
│                                      │  │BeefyStrat. │  │        │
│  PROTOCOLOS EXTERNOS                 │  │G$ Reserve  │  │        │
│  ┌───────────┐ ┌────────────┐        │  └────────────┘  │        │
│  │  Moola    │ │ GoodDollar │        └──────────────────┘        │
│  │  (mcUSD)  │ │  (G$ UBI)  │                                    │
│  └───────────┘ └────────────┘                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Contratos Desplegados en Mainnet

| Contrato | Dirección Proxy (UUPS) | Versión | Estado |
|---|---|---|---|
| `BiotaPassport` | `0x89Bd1517b6feE42f0DC3Cb7C5c4453b4Ca3d0442` | V3 | ✅ Activo |
| `BiotaScrow` | `0xB63B6B681E61a646624E0642c250fFE928098EC1` | V1 | ✅ Activo |
| `BiotaSplitter` | `0xf4019e82d7882E37D8f371d9aB4a65e978868125` | V1 | ✅ Activo |
| `BiotaUBI` | `0xE060D49fd545323A7602D7b005E0813594E57356` | V1 | ✅ Activo |
| `BiotaRWA` | `0x0000000000000000000000000000000000000000` | V1 | ⏳ Pendiente deploy |
| `MoolaStrategy` | `0x0000000000000000000000000000000000000000` | V1 | ⏳ Pendiente deploy |

### Tokens y Protocolos Externos (Celo Mainnet)
| Token/Protocolo | Dirección | Descripción |
|---|---|---|
| `cUSD` | `0x765DE816845861e75A25fCA122bb6898B8B1282a` | Stablecoin nativa de Celo |
| `G$` (GoodDollar) | `0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A` | Token UBI (2 decimales en Celo) |
| `USDT` | `0x48065fbBE25f71C9282ddf5e1cD6D6A8824272d2` | Tether en Celo |
| `Moola LendingPool` | `0x970b12522CA9b4054807a2c5B736149a5BE6f670` | Protocolo DeFi (fork Aave V2) |
| `Superfluid CFA` | `0xcfA132E353cB4E398080B9700609bb008eceB125` | Goteo de pagos por segundo |
| `GoodDollar UBIScheme` | `0x43d72Ff17701B2DA814620735C39C620Ce0ea4A1` | Distribución diaria UBI |

### Wallets Clave del Protocolo
| Wallet | Dirección | Rol |
|---|---|---|
| `COLLECTIVE_MUJERES` | `0x0d43131f1577310d6349baf9d6da4fc1cd39764c` | Comunidad El Carmen |
| `DAPP_BIOTA` (Treasury) | `0x9bc43f955ce11948e4fD6EAC28d46875Fba9f5F9` | Tesorería principal |
| `FONDEO_LOGIN` | `0x9158C35f1a054F25f9D45EA47107D54a2ea25945` | Gas para usuarios nuevos |
| `AGENT_TBA` (#8004) | `0x699AD5EF840764db8CEe62569455bBE6081aA6b8` | Agente ERC-6551 autónomo |

---

## Arquitectura DeFi (Yield)

### El Patrón Enchufable (Strategy Pattern)
En lugar de hardcodear Moola o Beefy dentro del contrato principal,
usamos una interfaz `IYieldStrategy` que actúa como un "enchufe universal".
Cambiar de protocolo = cambiar la dirección del adaptador. Sin redespliegues.

```
Usuario compra café (0.015 cUSD)
         ↓
BiotaSplitter.payWithSplit()
  ├── 50% → Productor (Don Arturo)   → inmediato
  ├── 10% → Treasury Biota           → inmediato
  └── 40% → BiotaRWA.recordInvestment()
                   ↓
         IYieldStrategy.deposit()
                   ↓
     [MoolaStrategy → mcUSD al inversor]
     [BeefyStrategy → mooToken (futuro)]
     [G$ Reserve    → G$ UBI (futuro)]
```

### Archivos de Contratos DeFi
| Archivo | Tipo | Estado |
|---|---|---|
| `contracts/src/IYieldStrategy.sol` | Interfaz | ✅ Creado |
| `contracts/src/MoolaStrategy.sol` | Adaptador Moola | ✅ Creado |
| `contracts/src/BiotaRWA.sol` | NFT + Yield Manager | ✅ Actualizado |

### Tasas de Rendimiento Esperadas (APY)
| Protocolo | Token Depositado | Token Recibido | APY Estimado |
|---|---|---|---|
| Moola Market | cUSD | mcUSD | 2-5% |
| Beefy Finance | cUSD | mooToken | 5-15% |
| GoodDollar | — | G$ (UBI diario) | Variable |

---

## Frontend — Perfiles de Usuario

### Sistema de Roles (localStorage)
- Clave: `BIOTA_ROLE` → valores: `'PRODUCER'` o `'INVESTOR'`
- Se elige en el `RoleSelection` component después de autenticarse con Privy
- Para resetear: borrar `BIOTA_ROLE` del localStorage del navegador

### Pestañas por Rol
| Pestaña | Productor | Inversor |
|---|---|---|
| Pasaporte (Identidad NFT) | ✅ | ❌ |
| Impacto (UBI / Métricas) | ✅ | ✅ |
| Mercado (Tienda RWA) | ❌ | ✅ |
| Academia (Learn-to-Earn) | ✅ | ❌ |
| Asesores (IA Capataz) | ✅ | ❌ |
| Vigil (Trazabilidad) | ❌ | ✅ |

### Visualización de Saldo
- **Moneda principal:** COP (pesos colombianos) — mayor impacto visual
- **Moneda secundaria:** cUSD — referencia internacional
- **Tasa:** API REST (exchangerate-api.com) actualizada cada hora
- **Ejemplo UI:** `$62,340 COP ≈ 15.08 cUSD | 📈 +$245 COP/mes`

---

## Decisiones Técnicas Importantes

### ¿Por qué ERC-1155 para BiotaRWA y no ERC-721?
El ERC-1155 permite tener un solo Token ID (ej: ID 1 = "Café Finca La Nube")
con N copias. 50 inversores pueden tener el mismo ID con distintas cantidades.
Con ERC-721 necesitaríamos mintear 50 tokens distintos, usando 50x más gas.

### ¿Por qué no actualizar BiotaSplitter para el yield?
El BiotaSplitter ya está desplegado en Mainnet con fondos reales pasando por él.
Hacerle un upgrade sin tests completos es riesgo de fondos atrapados.
La solución: el split de 3 vías lo maneja el backend/API de Biota por ahora,
y en V2 hacemos el upgrade del Splitter con tests de Foundry completos.

### ¿Por qué cUSD para la tienda y G$ para el UBI?
- **cUSD:** Estable, confiable, perfecta para pagos comerciales y DeFi
- **G$:** Token UBI de GoodDollar, ideal para goteo diario a productores.
  Los productores reciben G$ de GoodDollar + Stream de Superfluid desde inversores.

### Patrón de comentarios en el código
Todos los comentarios en el código siguen este formato:
- `[SOLIDITY]` — mecánica del lenguaje Solidity
- `[EVM]` — cómo funciona la Ethereum Virtual Machine
- `[CELO]` — específico de la red Celo
- `[REFI]` — finanzas regenerativas, lógica de impacto
- `[DEFI]` — protocolos DeFi (Moola, Beefy, Superfluid)
- `[OPENZEPPELIN]` — librerías de contratos seguros
- `[BLOCKCHAIN]` — conceptos generales de blockchain
- `[FRONTEND]` — información para el equipo de UI

---

## Sesiones de Desarrollo

### Sesión 1 — Junio 12, 2026
**Objetivo:** Auditoría de seguridad inicial
- Análisis de contratos BiotaPassport, BiotaScrow, BiotaSplitter, BiotaUBI
- Identificación de vulnerabilidades potenciales
- Documentación en `auditoria_seguridad.md`

### Sesión 2-4 — Junio 13-15, 2026
**Objetivo:** Estabilización para Hackathon Celo Onchain Agents
- Fix del layout del chat (AsesoriaView sticky sin romper glassmorphism)
- Eliminación de pantalla de carga inicial (Sprout) para acceso directo
- Diagnóstico de errores ECONNRESET con Gemini (latencia de red)
- Redacción de Milestone 4 de Karma GAP (ERC-6551 Agent + Multi-Agent Oracle)
- Estrategia Builder Score en Talent.app (usar cUSD/G$ sobre CELO nativo)

### Sesión 5 — Junio 16, 2026 (Deadline Hackathon)
**Objetivo:** Arquitectura de Perfiles Duales + NFTs RWA del Café
- Creación de rama `feat/investor-refi-profile`
- Sistema de Selector de Roles (PRODUCER/INVESTOR) en `app/page.tsx`
- Navegación inteligente filtrada por rol en `app-shell.tsx`
- Tienda con productos reales de café (Finca La Nube, Cacao Fino, etc.)
- Contrato `BiotaRWA.sol` (ERC-1155) con metadatos del café on-chain
- Hook `useBiotaRWA.ts` con datos demo como fallback
- Panel "Certificado RWA" expandible en tarjeta del café
- Fix errores Solidity: `__UUPSUpgradeable_init` (OZv5) + `supportsInterface`
- PR Draft creado en GitHub

### Sesión 6 — Junio 17-18, 2026
**Objetivo:** Arquitectura DeFi Enchufable (Yield Strategy Pattern)
- Creación de `IYieldStrategy.sol` — interfaz universal para protocolos DeFi
- Creación de `MoolaStrategy.sol` — adaptador para Moola Market (Aave V2 fork)
- Actualización de `BiotaRWA.sol`:
  - Campo `yieldStrategy` (enchufable sin redespliegue)
  - Mapeo `investorYield` (historial de inversiones por wallet)
  - Función `recordInvestment()` (deposita el 40% del pago en DeFi)
  - Función `setYieldStrategy()` (el admin puede migrar entre protocolos)
- Decisión de mostrar saldos en COP como protagonista + cUSD como referencia
- Creación de esta bitácora

---

## Pendientes y Hoja de Ruta

### 🔴 Alta Prioridad (Julio 2026)
- [ ] Compilar `BiotaRWA.sol` con `forge build` y verificar sin errores
- [ ] Escribir tests de Foundry para `BiotaRWA` + `MoolaStrategy`
- [ ] Desplegar `MoolaStrategy.sol` en Celo Mainnet
- [ ] Desplegar `BiotaRWA.sol` como proxy UUPS en Celo Mainnet
- [ ] Llamar `setYieldStrategy(direccionMoolaStrategy)` en BiotaRWA
- [ ] Actualizar `ADDRESSES.BIOTA_RWA` en `lib/contracts.ts` con dirección real
- [ ] Conectar botón de pago de la tienda para mintear NFT automáticamente

### 🟡 Media Prioridad (Agosto 2026)
- [ ] Componente "Bóveda DeFi" en la DApp del Inversor (muestra mcUSD creciendo)
- [ ] Visualización en COP + cUSD con tasa de cambio en tiempo real
- [ ] Función `claimPhysicalCoffee()` conectada al frontend
- [ ] Upload de imagen del café a IPFS y set del `tokenURI` real

### 🟢 Baja Prioridad / V2 (Septiembre+ 2026)
- [ ] `BeefyStrategy.sol` para mayor APY
- [ ] `GoodDollarStrategy.sol` para UBI social
- [ ] Upgrade de `BiotaSplitter.sol` con split de 3 destinos nativo
- [ ] Minijuego integrado vía Vercel Rewrites
- [ ] Función Learn-to-Earn en la pestaña Academia
- [ ] NFT Pasaporte Biota con imagen generada por IA (metadata on-chain)
