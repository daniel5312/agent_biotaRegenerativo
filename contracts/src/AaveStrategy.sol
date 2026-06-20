// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IYieldStrategy} from "./IYieldStrategy.sol";

interface IAavePool {
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);
}

/**
 * @title AaveStrategy — Adaptador de Yield para Aave V3 Oficial
 * @author Biota Protocol
 * @notice Conecta el ecosistema Biota con el Pool oficial de Aave V3.
 */
contract AaveStrategy is IYieldStrategy, Ownable {
    using SafeERC20 for IERC20;

    IAavePool public immutable AAVE_POOL;
    address public immutable ASSET;
    address public immutable A_TOKEN;
    
    // [ARQUITECTURA] Acoplamiento de Autoridad
    address public biotaStore;

    event SuppliedToAave(address indexed investor, address indexed token, uint256 amount);
    event WithdrawnFromAave(address indexed investor, address indexed token, uint256 amount);

    constructor(
        address _aavePool,
        address _asset,
        address _aToken
    ) Ownable(msg.sender) {
        require(_aavePool != address(0), "AaveStrategy: Pool invalido");
        require(_asset != address(0), "AaveStrategy: Asset invalido");
        require(_aToken != address(0), "AaveStrategy: aToken invalido");
        
        AAVE_POOL = IAavePool(_aavePool);
        ASSET = _asset;
        A_TOKEN = _aToken;
    }

    /**
     * @notice Permite al Owner enlazar la estrategia con el contrato madre (BiotaRWA Proxy).
     */
    function setBiotaStore(address _biotaStore) external onlyOwner {
        require(_biotaStore != address(0), "AaveStrategy: direccion invalida");
        biotaStore = _biotaStore;
    }

    function deposit(
        address token,
        uint256 amount,
        address onBehalfOf
    ) external override {
        // [GAS OPTIMIZATION - REFI] Aprobación infinita condicional.
        if (IERC20(token).allowance(address(this), address(AAVE_POOL)) < amount) {
            IERC20(token).approve(address(AAVE_POOL), type(uint256).max);
        }

        AAVE_POOL.supply(token, amount, onBehalfOf, 0);
        emit SuppliedToAave(onBehalfOf, token, amount);
    }

    /**
     * @notice Retira liquidez.
     * @dev [POLIMORFISMO COMPONIBLE] No usa onlyOwner, usa acoplamiento de autoridad.
     */
    function withdraw(
        address token,
        uint256 amount,
        address receiver
    ) external override {
        require(msg.sender == biotaStore, "AaveStrategy: Denegado. Disparador exclusivo de BiotaRWA");
        
        uint256 withdrawn = AAVE_POOL.withdraw(token, amount, receiver);
        emit WithdrawnFromAave(receiver, token, withdrawn);
    }

    function getBalance(
        address, 
        address user
    ) external view override returns (uint256) {
        return IERC20(A_TOKEN).balanceOf(user);
    }

    function getProtocolName() external pure override returns (string memory) {
        return "Aave V3";
    }

    /**
     * @notice [SEGURIDAD] Escotilla Administrativa Anti-MEV
     */
    function rescueStuckERC20(address tokenToRescue, address to, uint256 amount) external onlyOwner {
        require(tokenToRescue != A_TOKEN, "AaveStrategy: El colateral de los inversores es intocable");
        IERC20(tokenToRescue).safeTransfer(to, amount);
    }
}
