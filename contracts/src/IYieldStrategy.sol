// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

// ============================================================
// IYieldStrategy.sol - Interfaz de Estrategia de Rendimiento
// ============================================================
//
// [ARQUITECTURA] Este archivo define un "contrato de comunicación" (interfaz).
// No se despliega solo. Es el idioma común que cualquier protocolo DeFi
// debe hablar para conectarse a Biota sin que tengamos que cambiar el
// contrato principal.
//
// Piénsalo como un enchufe eléctrico: el enchufe siempre tiene la misma
// forma, sin importar qué electrodoméstico conectes (Moola, Beefy, etc.).
// ============================================================

interface IYieldStrategy {

    // -------------------------------------------------------
    // FUNCIÓN: deposit
    // -------------------------------------------------------
    // [REFI] Deposita tokens del inversor en el protocolo DeFi seleccionado.
    // @param token    la dirección del ERC-20 a depositar (ej: cUSD en celo)
    // @param amount   cuántos tokens (en la unidad mínima, wei) depositar
    // @param onBehalfOf  a quién beneficia el depósito (wallet del inversor)
    //
    // [SEGURIDAD] El contrato que implementa esto debe hacer primero un
    // transferFrom del token hacia sí mismo, y luego depositarlo en el protocolo.
    // El inversor debe haber dado approve() antes de llamar esta función.
    // -------------------------------------------------------
    function deposit(
        address token,
        uint256 amount,
        address onBehalfOf
    ) external;

    // -------------------------------------------------------
    // FUNCIÓN: withdraw
    // -------------------------------------------------------
    // [REFI] Retira los tokens (con intereses acumulados) del protocolo DeFi.
    // @param token       el ERC-20 original que se depositó (ej: cUSD)
    // @param amount      cuánto retirar (uint256 max = retirar todo)
    // @param receiver    quién recibe los fondos (normalmente el mismo inversor)
    //
    // [MOOLA] En Moola, esto quema los mcUSD y devuelve cUSD + intereses.
    // [BEEFY] En Beefy, esto retira los mooTokens y devuelve los LP subyacentes.
    // -------------------------------------------------------
    function withdraw(
        address token,
        uint256 amount,
        address receiver
    ) external;

    // -------------------------------------------------------
    // FUNCIÓN: getBalance
    // -------------------------------------------------------
    // [FRONTEND] Consulta cuánto tiene un usuario en este protocolo.
    // @param token   el token original (ej: cUSD)
    // @param user    la wallet del inversor
    // @return        el balance en wei, incluyendo los intereses acumulados
    //
    // [GAS] Esta función es 'view', no consume gas cuando la llama el frontend.
    // La DApp la usa para mostrar "Tu saldo en Moola: $5.24 cUSD" en tiempo real.
    // -------------------------------------------------------
    function getBalance(
        address token,
        address user
    ) external view returns (uint256);

    // -------------------------------------------------------
    // FUNCIÓN: getProtocolName
    // -------------------------------------------------------
    // [UI] Devuelve el nombre del protocolo para mostrarlo en la interfaz.
    // @return  "Moola Market", "Beefy Finance", "GoodDollar", etc.
    //
    // [FRONTEND] Esto permite que la DApp diga dinámicamente:
    // "Tu yield está en: Moola Market" sin hardcodear el nombre.
    // -------------------------------------------------------
    function getProtocolName() external pure returns (string memory);
}
