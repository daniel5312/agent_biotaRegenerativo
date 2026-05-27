#!/bin/bash
# Script de Despliegue Seguro para BiotaProtocol
# Protegido contra picos de gas y fallos del RPC usando Ankr y with-gas-price

echo "Iniciando Upgrade del Biota Passport en Celo Mainnet..."
echo "Protección de gas activada: 5 Gwei"

forge script script/UpgradeBiotaPassport.s.sol:UpgradeBiotaPassport \
--rpc-url https://rpc.ankr.com/celo \
--gas-limit 5000000 \
--broadcast \
--verify \
--slow \
-vvvv
