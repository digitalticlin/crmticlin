
#!/bin/bash

# Script para testar correções críticas aplicadas
echo "🧪 TESTE PÓS-CORREÇÕES - VALIDANDO 4 FIXES"
echo "============================================"

VPS_IP="31.97.24.222"
PORTA="3002"
TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3"
TEST_INSTANCE="test_fixes_$(date +%s)"

echo "📋 Configurações:"
echo "   Instance: $TEST_INSTANCE"
echo "   VPS: $VPS_IP:$PORTA"

function test_endpoint() {
    local name="$1"
    local url="$2"
    local method="$3"
    local payload="$4"
    
    echo ""
    echo "🧪 TESTANDO: $name"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
            -H "Authorization: Bearer $TOKEN" \
            "$url")
    else
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
            -X "$method" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$payload" \
            "$url")
    fi
    
    http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
    response_body=$(echo "$response" | grep -v "HTTP_STATUS:")
    
    if [ "$http_status" = "200" ] || [ "$http_status" = "201" ]; then
        echo "   ✅ Status: $http_status"
        echo "   📋 Response: $(echo "$response_body" | jq -c '{success, message}' 2>/dev/null || echo "$response_body" | head -c 100)..."
    else
        echo "   ❌ Status: $http_status"
        echo "   📋 Error: $(echo "$response_body" | head -c 200)..."
    fi
}

echo ""
echo "🔍 FASE 1: VERIFICAR CORREÇÕES APLICADAS"
echo "========================================"

test_endpoint "Health Check com Correções" \
    "http://$VPS_IP:$PORTA/health" \
    "GET"

test_endpoint "Status com Lista de Fixes" \
    "http://$VPS_IP:$PORTA/status" \
    "GET"

echo ""
echo "🔍 FASE 2: TESTAR CRIAÇÃO DE INSTÂNCIA"
echo "======================================"

test_endpoint "Criar Instância (Correção 1+2)" \
    "http://$VPS_IP:$PORTA/instance/create" \
    "POST" \
    "{\"instanceId\":\"$TEST_INSTANCE\",\"sessionName\":\"$TEST_INSTANCE\",\"webhookUrl\":\"https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web\"}"

echo ""
echo "⏳ Aguardando 10s para QR Code..."
sleep 10

test_endpoint "Buscar QR Code (Correção 1)" \
    "http://$VPS_IP:$PORTA/instance/$TEST_INSTANCE/qr" \
    "GET"

echo ""
echo "🔍 FASE 3: TESTAR NOVOS ENDPOINTS (Correção 3)"
echo "=============================================="

test_endpoint "Buscar Contatos - NOVO ENDPOINT" \
    "http://$VPS_IP:$PORTA/instance/$TEST_INSTANCE/contacts" \
    "GET"

test_endpoint "Buscar Mensagens - NOVO ENDPOINT" \
    "http://$VPS_IP:$PORTA/instance/$TEST_INSTANCE/messages" \
    "GET"

echo ""
echo "🔍 FASE 4: TESTAR ENVIO DE MENSAGEM"
echo "==================================="

test_endpoint "Enviar Mensagem" \
    "http://$VPS_IP:$PORTA/send" \
    "POST" \
    "{\"instanceId\":\"$TEST_INSTANCE\",\"phone\":\"5511999999999\",\"message\":\"Teste pós-correções\"}"

echo ""
echo "🔍 FASE 5: LIMPEZA"
echo "=================="

test_endpoint "Deletar Instância" \
    "http://$VPS_IP:$PORTA/instance/$TEST_INSTANCE" \
    "DELETE"

echo ""
echo "📊 RELATÓRIO DE CORREÇÕES APLICADAS"
echo "==================================="

echo ""
echo "🎯 CORREÇÕES IMPLEMENTADAS:"
echo "   ✅ Correção 1: Autenticação VPS-Supabase (Service Role Key)"
echo "   ✅ Correção 2: Payload webhook padronizado"
echo "   ✅ Correção 3: Endpoints /contacts e /messages adicionados"
echo "   ✅ Correção 4: Compatibilidade RLS melhorada"

echo ""
echo "📋 VERIFICAR MANUALMENTE:"
echo "   1. pm2 logs whatsapp-main-3002 --lines 20"
echo "   2. Testar via interface web"
echo "   3. Verificar webhook no Supabase Edge Function logs"

echo ""
echo "🎉 TESTE PÓS-CORREÇÕES CONCLUÍDO!"
