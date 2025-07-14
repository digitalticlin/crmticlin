#!/bin/bash

echo "=== DIAGNÓSTICO RÁPIDO VPS ==="
echo "Verificando se VPS está em loop ou com problemas..."
echo

# Teste básico de conectividade
echo "1. TESTE DE CONECTIVIDADE:"
ping -c 3 31.97.24.222 2>/dev/null && echo "✅ VPS responde ao ping" || echo "❌ VPS não responde ao ping"
echo

# Teste de porta HTTP
echo "2. TESTE DE PORTA 3002:"
timeout 5 curl -s http://31.97.24.222:3002/health 2>/dev/null && echo "✅ Porta 3002 responde" || echo "❌ Porta 3002 não responde"
echo

# Teste de criação de instância (timeout curto)
echo "3. TESTE RÁPIDO DE API:"
timeout 10 curl -s -X POST http://31.97.24.222:3002/instance/create \
  -H "Content-Type: application/json" \
  -d '{"instanceId": "test_diagnostico"}' 2>/dev/null && echo "✅ API responde" || echo "❌ API não responde ou timeout"
echo

# Teste de SSH (sem tentar conectar, só verificar se porta está aberta)
echo "4. TESTE DE PORTA SSH (22):"
timeout 3 nc -z 31.97.24.222 22 2>/dev/null && echo "✅ SSH porta aberta" || echo "❌ SSH porta fechada ou timeout"
echo

echo "=== POSSÍVEIS PROBLEMAS ==="
echo "Se SSH não responde: Servidor pode estar em loop de CPU alta"
echo "Se API não responde: Processo PM2 pode estar crashando"
echo "Se ping não responde: Problema de rede ou servidor down"
echo

echo "=== SOLUÇÕES SUGERIDAS ==="
echo "1. Aguardar 2-3 minutos para CPU normalizar"
echo "2. Tentar SSH novamente com timeout maior"
echo "3. Se persistir, contatar provedor (Hostinger)" 