// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title BiotaSplitter V1 - Motor de Impacto Regenerativo
 * @author Biota Protocol
 * @notice Este contrato actúa como un "router" financiero para la economía regenerativa (ReFi).
 * Permite que una sola transacción de compra se convierta en tres flujos de valor:
 * 1. Ingreso para el Productor (96%)
 * 2. Donación a Colectivos Sociales (2%) - Mujeres del Carmen
 * 3. Aporte al Pool de Regeneración Biota (2%)
 */

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BiotaSplitter is Ownable {
    
    // --- EVENTOS (Blockchain Transparency) ---
    
    /**
     * @dev Emitido cuando se procesa un pago con éxito.
     * @param payer La dirección de quien realiza la compra (Farmer/User).
     * @param token El activo digital usado (G$, cUSD, CELO, etc).
     * @param amount El volumen total de la transacción.
     * @param merchant El productor que recibe el grueso del pago.
     */
    event PaymentSplit(
        address indexed payer,
        address indexed token,
        uint256 amount,
        address merchant,
        address collective,
        address pool
    );

    // --- CONSTRUCTOR ---

    /**
     * @notice Inicializa el contrato definiendo al administrador (Owner).
     * @dev Ownable(msg.sender) establece que quien despliega tiene el control de emergencia.
     */
    constructor() Ownable(msg.sender) {}

    // --- FUNCIONES EXTERNAS (Optimización de Gas) ---

    /**
     * @notice Ejecuta un pago atómico y reparte dividendos de impacto social.
     * @dev Optimizado usando 'calldata' para reducir costos de memoria. 
     * @param token Dirección del contrato inteligente del Token (ERC20).
     * @param amount Cantidad total en unidades mínimas (decimals).
     * @param merchant Destino del 96% (Productor).
     * @param collective Destino del 2% (ReFi Collective).
     * @param pool Destino del 2% (Regenerative Infrastructure).
     */
    function payWithSplit(
        address token,
        uint256 amount,
        address merchant,
        address collective,
        address pool
    ) external {
        // [CHECK] Validación básica de seguridad
        require(amount >= 100, "Monto insuficiente para split");
        require(merchant != address(0) && collective != address(0) && pool != address(0), "Direccion invalida");

        // [INTERACTION] Inicializar interfaz del token
        IERC20 erc20 = IERC20(token);

        // [MATH] Cálculo de porcentajes (Optimizado para precisión)
        // Usamos variables locales en stack para evitar SLOADs costosos.
        uint256 collectivePart = (amount * 2) / 100;
        uint256 poolPart = (amount * 2) / 100;
        uint256 merchantPart = amount - collectivePart - poolPart;

        // [EFFECT] Transferencia principal: Usuario -> Contrato
        // Nota ReFi: El usuario debe haber ejecutado 'approve' previamente.
        require(erc20.transferFrom(msg.sender, address(this), amount), "Error: TransferFrom fallido");

        // [EFFECT] Reparto atómico de fondos
        // Estas transferencias ocurren en el mismo bloque de la blockchain Celo.
        require(erc20.transfer(merchant, merchantPart), "Error: Pago a mercante fallido");
        require(erc20.transfer(collective, collectivePart), "Error: Aporte colectivo fallido");
        require(erc20.transfer(pool, poolPart), "Error: Aporte pool fallido");

        // [LOG] Registro inmutable en la blockchain
        emit PaymentSplit(msg.sender, token, amount, merchant, collective, pool);
    }

    // --- SEGURIDAD Y MANTENIMIENTO ---

    /**
     * @notice Recupera fondos enviados por error al contrato.
     * @dev Solo puede ser ejecutado por el administrador de Biota.
     * @param token Dirección del token a rescatar.
     * @param amount Cantidad a retirar.
     */
    function rescueTokens(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(msg.sender, amount), "Error en rescate");
    }
}
