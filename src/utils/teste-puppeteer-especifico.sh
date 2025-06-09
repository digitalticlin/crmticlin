
#!/bin/bash

# Teste específico para validar correção do Puppeteer
echo "🧪 TESTE ESPECÍFICO PUPPETEER - VALIDAÇÃO COMPLETA"
echo "=================================================="

VPS_IP="31.97.24.222"
PORTA="3002"
TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3"
TEST_INSTANCE="puppeteer_validation_$(date +%s)"

echo "📋 Configurações:"
echo "   Instance: $TEST_INSTANCE"
echo "   VPS: $VPS_IP:$PORTA"
echo "   Objetivo: Validar que instância fica 'ready'"

function wait_and_check_status() {
    local instance_id="$1"
    local max_attempts="$2"
    local wait_seconds="$3"
    
    echo "⏳ Aguardando instância ficar 'ready' (máx ${max_attempts}x${wait_seconds}s)..."
    
    for i in $(seq 1 $max_attempts); do
        echo "   🔍 Tentativa $i/$max_attempts..."
        
        response=$(curl -s http://$VPS_IP:$PORTA/instance/$instance_id/status \
            -H "Authorization: Bearer $TOKEN")
        
        status=$(echo "$response" | jq -r '.status' 2>/dev/null)
        
        echo "   📋 Status atual: $status"
        
        if [ "$status" = "ready" ]; then
            echo "   ✅ Instância está PRONTA!"
            return 0
        elif [ "$status" = "error" ]; then
            echo "   ❌ Instância em ERROR - verificar logs"
            return 1
        fi
        
        if [ $i -lt $max_attempts ]; then
            echo "   ⏳ Aguardando ${wait_seconds}s antes da próxima verificação..."
            sleep $wait_seconds
        fi
    done
    
    echo "   ⏰ TIMEOUT: Instância não ficou pronta após $((max_attempts * wait_seconds))s"
    return 1
}

echo ""
echo "🧪 TESTE 1: HEALTH CHECK"
echo "========================"

health_response=$(curl -s http://$VPS_IP:$PORTA/health)
echo "📋 Health Response:"
echo "$health_response" | jq '{version, status, chromePath, activeInstances}'

echo ""
echo "🧪 TESTE 2: CRIAÇÃO DE INSTÂNCIA"
echo "================================"

create_response=$(curl -s -X POST http://$VPS_IP:$PORTA/instance/create \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"instanceId\":\"$TEST_INSTANCE\",\"sessionName\":\"$TEST_INSTANCE\"}")

echo "📋 Create Response:"
echo "$create_response" | jq '{success, status, message}'

create_success=$(echo "$create_response" | jq -r '.success' 2>/dev/null)

if [ "$create_success" != "true" ]; then
    echo "❌ FALHA na criação da instância"
    exit 1
fi

echo ""
echo "🧪 TESTE 3: AGUARDAR STATUS 'READY'"
echo "==================================="

if wait_and_check_status "$TEST_INSTANCE" 6 15; then
    echo "✅ SUCESSO: Instância ficou 'ready'"
    
    echo ""
    echo "🧪 TESTE 4: VALIDAR QR CODE"
    echo "==========================="
    
    qr_response=$(curl -s http://$VPS_IP:$PORTA/instance/$TEST_INSTANCE/qr \
        -H "Authorization: Bearer $TOKEN")
    
    echo "📋 QR Response:"
    echo "$qr_response" | jq '{success, status, hasQR: (.qrCode != null)}'
    
    echo ""
    echo "🧪 TESTE 5: TESTAR ENDPOINTS AVANÇADOS"
    echo "======================================"
    
    echo "🧪 5a: Contatos"
    curl -s http://$VPS_IP:$PORTA/instance/$TEST_INSTANCE/contacts \
        -H "Authorization: Bearer $TOKEN" | jq '{success, total}'
    
    echo "🧪 5b: Mensagens"
    curl -s http://$VPS_IP:$PORTA/instance/$TEST_INSTANCE/messages \
        -H "Authorization: Bearer $TOKEN" | jq '{success, total}'
    
    echo "🧪 5c: Envio de Mensagem"
    curl -s -X POST http://$VPS_IP:$PORTA/send \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"instanceId\":\"$TEST_INSTANCE\",\"phone\":\"5511999999999\",\"message\":\"Teste Puppeteer\"}" | jq '{success}'
    
else
    echo "❌ FALHA: Instância não ficou 'ready'"
    
    echo ""
    echo "🔍 DIAGNÓSTICO DE FALHA"
    echo "======================="
    
    echo "📋 Status atual da instância:"
    curl -s http://$VPS_IP:$PORTA/instance/$TEST_INSTANCE/status \
        -H "Authorization: Bearer $TOKEN" | jq '.'
    
    echo "📋 Logs do PM2 (últimas 20 linhas):"
    pm2 logs whatsapp-main-3002 --lines 20
fi

echo ""
echo "🧪 TESTE 6: LIMPEZA"
echo "==================="

delete_response=$(curl -s -X DELETE http://$VPS_IP:$PORTA/instance/$TEST_INSTANCE \
    -H "Authorization: Bearer $TOKEN")

echo "📋 Delete Response:"
echo "$delete_response" | jq '{success, message}'

echo ""
echo "📊 RELATÓRIO FINAL"
echo "=================="

final_health=$(curl -s http://$VPS_IP:$PORTA/health)
active_instances=$(echo "$final_health" | jq -r '.activeInstances' 2>/dev/null)

echo "📋 Instâncias ativas após limpeza: $active_instances"

if wait_and_check_status "$TEST_INSTANCE" 1 1 2>/dev/null; then
    echo "🎉 PUPPETEER FUNCIONANDO PERFEITAMENTE!"
    echo "✅ Todos os testes devem passar agora"
    echo ""
    echo "🚀 EXECUTE AGORA:"
    echo "   ./teste-pos-correcoes.sh"
    echo ""
    echo "🎯 EXPECTATIVA: TODOS os 7 testes com ✅"
else
    echo "⚠️ Puppeteer ainda com problemas"
    echo "📋 Verificar logs para mais detalhes"
fi
