#!/bin/bash
# Script de Configuración Segura para BiotaProtocol
# Protegido contra picos de gas y fallos del RPC usando Ankr y with-gas-price

echo "Iniciando configuración de variables dinámicas del Biota Passport..."
echo "Protección de gas activada: 25 Gwei"

forge script script/AdminConfig.s.sol:AdminConfig \
--rpc-url https://rpc.ankr.com/celo \
--with-gas-price 2500000000 \
--broadcast \
--verify \
--slow \
-vvvv
