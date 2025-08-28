#!/bin/bash

# ====================================================================
# LISTAR TODAS AS INSTÂNCIAS ATIVAS NA VPS
# ====================================================================
# Script para verificar status de todas as instâncias WhatsApp na VPS

set -e

# Configurações da VPS
VPS_BASE_URL="http://vpswhatsapp.ticlin.com.br"
VPS_API_TOKEN="sua_api_token_aqui"  # Substitua pela token real

echo "🔍 LISTANDO TODAS AS INSTÂNCIAS NA VPS"
echo "===================================="
echo "📡 VPS URL: $VPS_BASE_URL"
echo "🕐 Timestamp: $(date)"
echo ""

# 1. LISTAR TODAS AS INSTÂNCIAS
echo "1️⃣ LISTANDO TODAS AS INSTÂNCIAS:"
echo "--------------------------------"

response=$(curl -s \
  -X GET \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VPS_API_TOKEN" \
  -H "x-api-token: $VPS_API_TOKEN" \
  "$VPS_BASE_URL/instances" \
  2>/dev/null || echo '{"error": "Falha na conexão"}')

echo "📋 Resposta da VPS:"
echo "$response" | jq '.' 2>/dev/null || echo "$response"
echo ""

# 2. VERIFICAR STATUS DE INSTÂNCIAS ESPECÍFICAS (se necessário)
echo "2️⃣ VERIFICANDO STATUS DE INSTÂNCIAS CONHECIDAS:"
echo "----------------------------------------------"

# Array com nomes de instâncias conhecidas
known_instances=(
  "contatoluizantoniooliveira" 
  "admgeuniformes"
  "marketing"
  "alinyvalerias"
  "paulamarisaames"
  "admcasaoficial"
)

for instance in "${known_instances[@]}"; do
  echo "🔍 Verificando instância: $instance"
  
  status_response=$(curl -s \
    -X GET \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $VPS_API_TOKEN" \
    -H "x-api-token: $VPS_API_TOKEN" \
    "$VPS_BASE_URL/instance/$instance/status" \
    2>/dev/null || echo '{"error": "Falha na conexão"}')
  
  echo "   Status: $status_response" | jq '.' 2>/dev/null || echo "   Status: $status_response"
  echo ""
done

# 3. HEALTH CHECK DO SERVIDOR VPS
echo "3️⃣ HEALTH CHECK DO SERVIDOR VPS:"
echo "--------------------------------"

health_response=$(curl -s \
  -X GET \
  -H "Content-Type: application/json" \
  "$VPS_BASE_URL/health" \
  2>/dev/null || echo '{"error": "Servidor indisponível"}')

echo "🏥 Health Status:"
echo "$health_response" | jq '.' 2>/dev/null || echo "$health_response"
echo ""

# 4. RESUMO
echo "📊 RESUMO DA VERIFICAÇÃO:"
echo "========================"
echo "✅ Script executado com sucesso"
echo "📋 Verifique os resultados acima para:"
echo "   - Lista completa de instâncias na VPS"
echo "   - Status individual de cada instância"
echo "   - Saúde geral do servidor VPS"
echo ""
echo "🔧 PRÓXIMOS PASSOS:"
echo "1. Compare com instâncias no banco Supabase"
echo "2. Identifique instâncias órfãs ou duplicadas"
echo "3. Teste deleção com edge function corrigida"
echo ""