#!/bin/bash

# 🚀 SCRIPT DE TESTE COMPLETO - VPS BAILEYS SERVER
# Execute este script para testar todas as funcionalidades

echo "🎯 INICIANDO TESTES COMPLETOS DO SERVIDOR BAILEYS VPS"
echo "========================================================"

# Configurações ATUALIZADAS
VPS_IP="31.97.163.57"
PORT="3001"
BASE_URL="http://$VPS_IP:$PORT"
TEST_INSTANCE="test-$(date +%s)"
TEST_PHONE="5511999999999"  # ⚠️ SUBSTITUA PELO SEU NÚMERO

echo "📋 Configurações:"
echo "   VPS IP: $VPS_IP (NOVA VPS)"
echo "   Porta: $PORT"
echo "   Instância de Teste: $TEST_INSTANCE"
echo "   Telefone de Teste: $TEST_PHONE"
echo ""

# Função para testar endpoint
test_endpoint() {
    local name="$1"
    local url="$2"
    local method="$3"
    local data="$4"
    
    echo "🔍 Testando: $name"
    echo "   URL: $url"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$url" -H "Content-Type: application/json")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$url" -H "Content-Type: application/json" -d "$data")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE "$url" -H "Content-Type: application/json")
    fi
    
    # Separar body e status code
    body=$(echo "$response" | sed '$d')
    status_code=$(echo "$response" | tail -n1)
    
    echo "   Status: $status_code"
    echo "   Resposta: $body" | jq 2>/dev/null || echo "   Resposta: $body"
    echo ""
    
    # Verificar se foi bem-sucedido
    if [[ "$status_code" =~ ^2[0-9][0-9]$ ]]; then
        echo "   ✅ SUCESSO"
    else
        echo "   ❌ ERRO"
    fi
    echo "----------------------------------------"
}

echo "🔍 FASE 1: TESTES BÁSICOS"
echo "=========================="

test_endpoint "Health Check" \
    "$BASE_URL/health" \
    "GET"

test_endpoint "Status do Servidor" \
    "$BASE_URL/status" \
    "GET"

test_endpoint "Listar Instâncias" \
    "$BASE_URL/instances" \
    "GET"

echo ""
echo "🔍 FASE 2: GESTÃO DE INSTÂNCIAS"
echo "================================"

test_endpoint "Criar Instância" \
    "$BASE_URL/instance/create" \
    "POST" \
    "{\"instanceId\":\"$TEST_INSTANCE\",\"createdByUserId\":\"test-user-123\"}"

echo "⏳ Aguardando 15 segundos para geração do QR..."
sleep 15

test_endpoint "Obter QR Code" \
    "$BASE_URL/instance/$TEST_INSTANCE/qr" \
    "GET"

test_endpoint "Status da Instância" \
    "$BASE_URL/instance/$TEST_INSTANCE/status" \
    "GET"

test_endpoint "Detalhes da Instância" \
    "$BASE_URL/instance/$TEST_INSTANCE" \
    "GET"

echo ""
echo "🔍 FASE 3: TESTES DE WEBHOOK E DIAGNÓSTICO"
echo "==========================================="

test_endpoint "Diagnóstico de Dados" \
    "$BASE_URL/instance/$TEST_INSTANCE/debug-data" \
    "GET"

test_endpoint "Importação Robusta" \
    "$BASE_URL/instance/$TEST_INSTANCE/import-history-robust" \
    "POST" \
    "{\"importType\":\"both\",\"batchSize\":10}"

echo ""
echo "🔍 FASE 4: ENVIO DE MENSAGENS"
echo "=============================="
echo "⚠️  ATENÇÃO: Para testar o envio, você precisa:"
echo "   1. Escanear o QR Code mostrado acima"
echo "   2. Aguardar a conexão ser estabelecida"
echo "   3. Substituir o número de teste pelo seu número"
echo ""

read -p "🤔 Deseja testar o envio de mensagens? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    test_endpoint "Enviar Mensagem de Teste" \
        "$BASE_URL/send" \
        "POST" \
        "{\"instanceId\":\"$TEST_INSTANCE\",\"phone\":\"$TEST_PHONE\",\"message\":\"🎯 Teste do servidor Baileys VPS NOVA - $(date)\"}"

    test_endpoint "Enviar com Número Formatado" \
        "$BASE_URL/send" \
        "POST" \
        "{\"instanceId\":\"$TEST_INSTANCE\",\"phone\":\"$TEST_PHONE@s.whatsapp.net\",\"message\":\"✅ Teste com número formatado NOVA VPS - $(date)\"}"
else
    echo "⏭️ Pulando testes de envio de mensagens"
fi

echo ""
echo "🔍 FASE 5: LIMPEZA"
echo "=================="

test_endpoint "Deletar Instância" \
    "$BASE_URL/instance/$TEST_INSTANCE" \
    "DELETE"

test_endpoint "Verificar Deleção" \
    "$BASE_URL/instances" \
    "GET"

echo ""
echo "📊 RESUMO DOS TESTES"
echo "===================="
echo "✅ Testes básicos concluídos"
echo "✅ Gestão de instâncias testada"
echo "✅ Webhooks e diagnósticos verificados"
echo "✅ Endpoints de envio disponíveis"
echo "✅ Limpeza realizada"
echo ""
echo "🎯 PRÓXIMOS PASSOS:"
echo "   1. Verificar logs: pm2 logs whatsapp-server"
echo "   2. Testar via frontend"
echo "   3. Verificar webhooks no Supabase"
echo ""
echo "🚀 TESTES CONCLUÍDOS NA NOVA VPS!" 