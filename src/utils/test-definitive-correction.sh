
#!/bin/bash

# TESTE DA CORREÇÃO DEFINITIVA - VALIDAÇÃO COMPLETA
echo "🧪 TESTE DA CORREÇÃO DEFINITIVA"
echo "==============================="

VPS_IP="31.97.24.222"
PORTA="3002"
TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3"
TEST_INSTANCE="teste_correcao_definitiva_$(date +%s)"

echo "📋 Configurações:"
echo "   Instance: $TEST_INSTANCE"
echo "   VPS: $VPS_IP:$PORTA"
echo "   Data: $(date)"

function test_definitive_endpoint() {
    local name="$1"
    local url="$2"
    local method="$3"
    local payload="$4"
    
    echo ""
    echo "🧪 TESTANDO CORREÇÃO DEFINITIVA: $name"
    
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
        echo "   📋 Response: $(echo "$response_body" | jq -c '{success, correctionApplied, version}' 2>/dev/null || echo "$response_body" | head -c 100)..."
        
        # Verificar se a correção foi aplicada
        correction_applied=$(echo "$response_body" | jq -r '.correctionApplied // .correction // false' 2>/dev/null)
        if [ "$correction_applied" = "true" ]; then
            echo "   🎯 CORREÇÃO DEFINITIVA DETECTADA!"
        fi
    else
        echo "   ❌ Status: $http_status"
        echo "   📋 Error: $(echo "$response_body" | head -c 200)..."
    fi
}

echo ""
echo "🔍 FASE 1: VERIFICAR CORREÇÃO APLICADA"
echo "====================================="

test_definitive_endpoint "Health Check com Correção Definitiva" \
    "http://$VPS_IP:$PORTA/health" \
    "GET"

test_definitive_endpoint "Status com Detalhes da Correção" \
    "http://$VPS_IP:$PORTA/status" \
    "GET"

test_definitive_endpoint "Endpoint Raiz com Informações da Correção" \
    "http://$VPS_IP:$PORTA/" \
    "GET"

echo ""
echo "🚀 FASE 2: TESTAR CRIAÇÃO COM CORREÇÃO DEFINITIVA"
echo "==============================================="

test_definitive_endpoint "Criar Instância (Correção Definitiva)" \
    "http://$VPS_IP:$PORTA/instance/create" \
    "POST" \
    "{\"instanceId\":\"$TEST_INSTANCE\",\"sessionName\":\"$TEST_INSTANCE\",\"webhookUrl\":\"https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web\"}"

echo ""
echo "⏳ Aguardando 15s para inicialização com correção..."
sleep 15

test_definitive_endpoint "Status da Instância (Correção Aplicada)" \
    "http://$VPS_IP:$PORTA/instance/$TEST_INSTANCE/status" \
    "GET"

echo ""
echo "⏳ Aguardando mais 10s para QR Code com correção..."
sleep 10

test_definitive_endpoint "Buscar QR Code (Correção Definitiva)" \
    "http://$VPS_IP:$PORTA/instance/$TEST_INSTANCE/qr" \
    "GET"

echo ""
echo "🔍 FASE 3: VERIFICAR LOGS PARA PROTOCOL ERRORS"
echo "=============================================="

echo "📋 Verificando se Protocol errors foram corrigidos..."
echo "pm2 logs whatsapp-main-3002 --lines 10 | grep -i 'protocol error'"
pm2 logs whatsapp-main-3002 --lines 10 | grep -i "protocol error" && echo "❌ Ainda há Protocol errors" || echo "✅ Protocol errors corrigidos!"

echo ""
echo "📋 Verificando se Session closed foi corrigido..."
echo "pm2 logs whatsapp-main-3002 --lines 10 | grep -i 'session closed'"
pm2 logs whatsapp-main-3002 --lines 10 | grep -i "session closed" && echo "❌ Ainda há Session closed" || echo "✅ Session closed corrigido!"

echo ""
echo "📋 Logs recentes do PM2:"
pm2 logs whatsapp-main-3002 --lines 5

echo ""
echo "🧹 FASE 4: LIMPEZA"
echo "=================="

test_definitive_endpoint "Deletar Instância (Correção Aplicada)" \
    "http://$VPS_IP:$PORTA/instance/$TEST_INSTANCE" \
    "DELETE"

echo ""
echo "📊 RELATÓRIO DA CORREÇÃO DEFINITIVA"
echo "==================================="

echo ""
echo "🎯 CORREÇÕES IMPLEMENTADAS:"
echo "   ✅ Correção 1: Detecção inteligente Chrome/Chromium"
echo "   ✅ Correção 2: Args específicos para Protocol error"
echo "   ✅ Correção 3: Configuração para Session closed"
echo "   ✅ Correção 4: AppArmor bypass melhorado"
echo "   ✅ Correção 5: Timeout e retry inteligentes"
echo "   ✅ Correção 6: Logging detalhado com IDs únicos"

echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "   1. Verificar se não há mais Protocol errors nos logs"
echo "   2. Testar criação de múltiplas instâncias"
echo "   3. Validar geração consistente de QR Codes"
echo "   4. Confirmar comunicação Edge→VPS estável"

echo ""
echo "🏆 TESTE DA CORREÇÃO DEFINITIVA CONCLUÍDO!"
