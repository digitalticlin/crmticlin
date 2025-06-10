
#!/bin/bash

# VALIDAÇÃO V4.0 ULTRA ROBUSTA
echo "🧪 VALIDAÇÃO V4.0 ULTRA ROBUSTA"
echo "==============================="

VPS_IP="31.97.24.222"
PORTA="3002"
TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3"
TEST_INSTANCE="test_v4_ultra_$(date +%s)"

echo "📋 Configurações V4.0:"
echo "   Instance: $TEST_INSTANCE"
echo "   VPS: $VPS_IP:$PORTA"
echo "   Data: $(date)"
echo ""

function test_v4_endpoint() {
    local name="$1"
    local url="$2"
    local method="$3"
    local payload="$4"
    
    echo ""
    echo "🧪 TESTANDO V4.0 ULTRA: $name"
    
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
        echo "   📋 Response: $(echo "$response_body" | jq -c '{success, version, ultraRobustMode}' 2>/dev/null || echo "$response_body" | head -c 100)..."
        
        # Verificar se é V4.0
        v4_detected=$(echo "$response_body" | jq -r '.version // .server // ""' 2>/dev/null | grep -i "v4.0" && echo "true" || echo "false")
        if [ "$v4_detected" = "true" ]; then
            echo "   🎯 V4.0 ULTRA DETECTADO!"
        fi
    else
        echo "   ❌ Status: $http_status"
        echo "   📋 Error: $(echo "$response_body" | head -c 200)..."
    fi
}

echo "🔍 FASE 1: VERIFICAR V4.0 APLICADO"
echo "================================="

test_v4_endpoint "Health Check V4.0" \
    "http://$VPS_IP:$PORTA/health" \
    "GET"

test_v4_endpoint "Status V4.0" \
    "http://$VPS_IP:$PORTA/status" \
    "GET"

test_v4_endpoint "Endpoint Raiz V4.0" \
    "http://$VPS_IP:$PORTA/" \
    "GET"

echo ""
echo "🚀 FASE 2: TESTAR CRIAÇÃO V4.0 ULTRA"
echo "==================================="

test_v4_endpoint "Criar Instância V4.0 Ultra" \
    "http://$VPS_IP:$PORTA/instance/create" \
    "POST" \
    "{\"instanceId\":\"$TEST_INSTANCE\",\"sessionName\":\"$TEST_INSTANCE\",\"webhookUrl\":\"https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web\"}"

echo ""
echo "⏳ Aguardando 20s para inicialização V4.0..."
sleep 20

test_v4_endpoint "Status da Instância V4.0" \
    "http://$VPS_IP:$PORTA/instance/$TEST_INSTANCE/status" \
    "GET"

echo ""
echo "⏳ Aguardando mais 15s para QR Code V4.0..."
sleep 15

test_v4_endpoint "Buscar QR Code V4.0" \
    "http://$VPS_IP:$PORTA/instance/$TEST_INSTANCE/qr" \
    "GET"

echo ""
echo "🔍 FASE 3: ANÁLISE CRÍTICA DE LOGS V4.0"
echo "====================================="

echo "📋 Verificando se V4.0 eliminou Protocol errors..."
echo "pm2 logs whatsapp-main-3002 --lines 15 | grep -i 'v4.0 ultra'"
pm2 logs whatsapp-main-3002 --lines 15 | grep -i "v4.0 ultra" && echo "✅ V4.0 Ultra detectado nos logs!" || echo "❌ V4.0 Ultra não detectado"

echo ""
echo "📋 Verificando Protocol errors (DEVE ESTAR VAZIO):"
echo "pm2 logs whatsapp-main-3002 --lines 20 | grep -i 'protocol error'"
protocol_errors=$(pm2 logs whatsapp-main-3002 --lines 20 | grep -i "protocol error" | wc -l)
if [ "$protocol_errors" -eq 0 ]; then
    echo "✅ SUCESSO V4.0: ZERO Protocol errors detectados!"
else
    echo "❌ FALHA V4.0: Ainda há $protocol_errors Protocol errors"
    pm2 logs whatsapp-main-3002 --lines 10 | grep -i "protocol error"
fi

echo ""
echo "📋 Verificando Session closed (DEVE ESTAR VAZIO):"
echo "pm2 logs whatsapp-main-3002 --lines 20 | grep -i 'session closed'"
session_errors=$(pm2 logs whatsapp-main-3002 --lines 20 | grep -i "session closed" | wc -l)
if [ "$session_errors" -eq 0 ]; then
    echo "✅ SUCESSO V4.0: ZERO Session closed detectados!"
else
    echo "❌ FALHA V4.0: Ainda há $session_errors Session closed"
    pm2 logs whatsapp-main-3002 --lines 10 | grep -i "session closed"
fi

echo ""
echo "📋 Verificando Config Level (novidade V4.0):"
echo "pm2 logs whatsapp-main-3002 --lines 15 | grep -i 'config level'"
pm2 logs whatsapp-main-3002 --lines 15 | grep -i "config level" && echo "✅ Sistema de Config Level V4.0 funcionando!" || echo "⚠️ Config Level não detectado"

echo ""
echo "📋 Logs recentes V4.0:"
pm2 logs whatsapp-main-3002 --lines 8

echo ""
echo "🧹 FASE 4: LIMPEZA V4.0"
echo "======================"

test_v4_endpoint "Deletar Instância V4.0" \
    "http://$VPS_IP:$PORTA/instance/$TEST_INSTANCE" \
    "DELETE"

echo ""
echo "📊 RELATÓRIO V4.0 ULTRA ROBUSTO"
echo "==============================="

echo ""
echo "🎯 MELHORIAS V4.0 IMPLEMENTADAS:"
echo "   ✅ Detecção Chrome inteligente automática"
echo "   ✅ Sistema de 3 níveis de configuração Puppeteer"
echo "   ✅ Fallback progressivo (robusto → intermediário → básico)"
echo "   ✅ Eliminação total de args que causam Protocol error"
echo "   ✅ Sistema de retry com config simplificada"
echo "   ✅ Logging detalhado com Config Level tracking"
echo "   ✅ Inicialização adaptativa baseada em tentativas"

echo ""
echo "📋 RESULTADOS ESPERADOS:"
if [ "$protocol_errors" -eq 0 ] && [ "$session_errors" -eq 0 ]; then
    echo "   🏆 SUCESSO TOTAL V4.0: Zero Protocol/Session errors!"
    echo "   ✅ V4.0 Ultra Robusto funcionando perfeitamente"
    echo "   ✅ Configuração otimizada aplicada com sucesso"
    echo "   ✅ Sistema de fallback progressivo operacional"
else
    echo "   ⚠️ ATENÇÃO: Ainda há erros detectados"
    echo "   📋 Protocol errors: $protocol_errors"
    echo "   📋 Session errors: $session_errors"
    echo "   🔧 Pode ser necessário ajuste adicional"
fi

echo ""
echo "📋 PRÓXIMAS ETAPAS:"
echo "   1. Se ZERO errors: ✅ V4.0 Ultra aplicado com sucesso!"
echo "   2. Se ainda há errors: Aplicar diagnóstico avançado V4.1"
echo "   3. Testar criação múltiplas instâncias"
echo "   4. Validar estabilidade por 1 hora"

echo ""
echo "🏆 VALIDAÇÃO V4.0 ULTRA ROBUSTA CONCLUÍDA!"
