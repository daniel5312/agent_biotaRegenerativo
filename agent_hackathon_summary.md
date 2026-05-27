# 📝 Resumen Técnico: Arquitectura y Registro de Agentes ERC-8004 (Celo Agent Hackathon)

Este documento resume la configuración técnica realizada para cumplir con los requisitos del Celo Agent Hackathon, estableciendo la identidad en cadena del agente y diseñando una arquitectura frontend robusta que evita conflictos entre librerías Web3.

## 1. Identidad en Cadena: ERC-8004 + Self Agent ID

Para cumplir con el requisito principal del Hackathon de dotar a los agentes de una identidad on-chain demostrable, implementamos el estándar **ERC-8004** en la red de Celo Mainnet.

### ¿Cómo lo hicimos?
- **Script de Registro (`register.ts`)**: Desarrollamos un script automatizado usando `ethers.js` que interactúa directamente con el contrato `IdentityRegistry` oficial de ERC-8004 (`0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`).
- **Flujo de Ejecución**: 
  1. El script lee la `AGENT_PRIVATE_KEY` de las variables de entorno.
  2. Verifica mediante la función `balanceOf` si el agente ya posee una identidad (NFT) registrada.
  3. Si no la tiene, ejecuta la función `register()` para acuñar un nuevo Agent ID.
  4. Extrae el `agentId` de los logs del evento `Registered` emitido por el contrato.
- **Self Agent ID**: Este registro nos proporcionó el identificador único oficial que certifica que nuestro agente tiene una "cédula de identidad" (Self Agent ID) válida en la blockchain de Celo, la cual puede ser verificada a través de [8004scan.io](http://8004scan.io).

### Cumplimiento del Grant
Con esta implementación aseguramos los entregables clave:
1. **Registro on-chain**: Demostrado a través de un ID del estándar ERC-8004 para el registro en el Hackathon y en Agentscan.
2. **Infraestructura de Pagos**: Sentamos la base para utilizar micropagos x402, permitiendo que las interacciones con el agente estén respaldadas por una identidad soberana y conectadas al ecosistema regenerativo de Biota.

---

## 2. Prevención de Conflictos Web3 (Thirdweb vs Wagmi + Viem + Privy)

Uno de los mayores desafíos arquitectónicos fue evitar que las distintas librerías de conexión Web3 colisionaran. 

### Estrategia de Separación de Responsabilidades (SoC)

Para evitar la colisión de contextos (React Context clashing) y dependencias circulares en el frontend, implementamos la siguiente arquitectura:

1. **Capa de Autenticación y Estado de Wallet (Frontend)**
   - **Privy**: Actúa como el único punto de entrada para la autenticación y las UI de conexión.
   - **Wagmi + Viem**: Se utilizan exclusivamente como la capa de transporte de red (RPC) y gestión del estado reactivo de las wallets en el cliente (`useAccount`, `useReadContract`, etc.).
   - **Solución**: Configuramos un único `Providers` global que inicializa Privy envolviendo a Wagmi (`@privy-io/wagmi`). **Nunca** envolvemos el árbol de componentes principal (root layout) con un `<ThirdwebProvider>`.

2. **Capa de Transacciones de Agentes (Backend/Servicios/Acciones Aisladas)**
   - **Thirdweb (SDK v5)**: Lo utilizamos de manera **aislada y sin estado (stateless)**. Actúa puramente como un motor de ejecución y SDK para operaciones específicas (como el protocolo de pagos x402).
   - **Solución**: Instanciamos los clientes de Thirdweb (`createThirdwebClient`) a nivel de funciones utilitarias o en el backend, utilizando directamente la llave privada o el signer del agente. 
   - *Resultado*: Thirdweb nunca interfiere con los hooks de React de Wagmi ni inyecta su propio Provider global en el DOM, evitando que compita con Privy por el control del objeto `window.ethereum`.

3. **Manejo de Rutas Nativas (MiniPay)**
   - Para billeteras integradas (in-app browsers) como MiniPay, utilizamos condicionales en el enrutamiento (`pathname.includes("/minipay")`) para gestionar de forma independiente la desconexión o conexión nativa, permitiendo que Wagmi maneje directamente el inyectado sin que Privy asuma el control exclusivo.

---

## Fuentes y Recursos Utilizados
- **Documentación de Celo**: [Build with AI - ERC-8004](https://docs.celo.org/build-on-celo/build-with-ai/8004)
- **Contratos Oficiales**: Contrato Identity Registry ERC-8004 (`0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`) en Celo Mainnet.
- **Librerías Core**: `ethers.js` para los scripts en crudo del registro de identidad.
- **Thirdweb v5 SDK Docs**: Para la arquitectura de clientes ligeros (`createThirdwebClient`).
- **Privy + Wagmi Docs**: Para el patrón oficial de integración sin conflictos de providers.
