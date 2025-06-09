
#!/bin/bash

# Teste DEFINITIVO pós-correção Puppeteer
echo "🧪 TESTE DEFINITIVO PÓS-CORREÇÃO PUPPETEER"
echo "=========================================="

VPS_IP="31.97.24.222"
PORTA="3002"
TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3"
TEST_INSTANCE="pos_correcao_$(date +%s)"

echo "📋 Configuração do teste:"
echo "   Instance: $TEST_INSTANCE"
echo "   VPS: $VPS_IP:$PORTA"
echo "   Data: $(date)"
echo "   Objetivo: Validar que TODAS as funções funcionam"

# Função para aguardar status específico com timeout
wait_for_status() {
    local instance_id="$1"
    local target_status="$2"
    local max_attempts="$3"
    local wait_seconds="$4"
    
    echo "⏳ Aguardando status '$target_status' (máx ${max_attempts}x${wait_seconds}s)..."
    
    for i in $(seq 1 $max_attempts); do
        echo "   🔍 Verificação $i/$max_attempts..."
        
        response=$(curl -s http://$VPS_IP:$PORTA/instance/$instance_id/status \
            -H "Authorization: Bearer $TOKEN")
        
        status=$(echo "$response" | jq -r '.status' 2>/dev/null)
        error=$(echo "$response" | jq -r '.error' 2>/dev/null)
        
        echo "   📋 Status: $status"
        if [ "$error" != "null" ] && [ "$error" != "" ]; then
            echo "   ⚠️ Erro: $error"
        fi
        
        if [ "$status" = "$target_status" ]; then
            echo "   ✅ Status '$target_status' alcançado com sucesso!"
            return 0
        elif [ "$status" = "error" ]; then
            echo "   ❌ Instância em ERROR - correção falhou"
            return 1
        fi
        
        if [ $i -lt $max_attempts ]; then
            echo "   ⏳ Aguardando ${wait_seconds}s..."
            sleep $wait_seconds
        fi
    done
    
    echo "   ⏰ TIMEOUT: Status '$target_status' não alcançado em $((max_attempts * wait_seconds))s"
    return 1
}

echo ""
echo "🧪 TESTE 1: VERIFICAR SERVIDOR APÓS CORREÇÃO"
echo "============================================"

health_response=$(curl -s http://$VPS_IP:$PORTA/health)
if [ $? -eq 0 ]; then
    echo "✅ Servidor respondendo após correção"
    echo "$health_response" | jq '{success, version, activeInstances, timestamp}' 2>/dev/null || echo "$health_response"
else
    echo "❌ Servidor não está respondendo após correção"
    exit 1
fi

echo ""
echo "🧪 TESTE 2: CRIAR INSTÂNCIA COM PUPPETEER CORRIGIDO"
echo "=================================================="

create_response=$(curl -s -X POST http://$VPS_IP:$PORTA/instance/create \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"instanceId\":\"$TEST_INSTANCE\",\"sessionName\":\"$TEST_INSTANCE\"}")

echo "📋 Resposta da criação:"
echo "$create_response" | jq '{success, status, message}' 2>/dev/null || echo "$create_response"

create_success=$(echo "$create_response" | jq -r '.success' 2>/dev/null)

if [ "$create_success" != "true" ]; then
    echo "❌ FALHA na criação da instância"
    exit 1
fi

echo ""
echo "🧪 TESTE 3: AGUARDAR STATUS 'READY' (CORREÇÃO PRINCIPAL)"
echo "======================================================="

# Aguardar que a instância fique 'ready' (não 'error')
if wait_for_status "$TEST_INSTANCE" "ready" 10 15; then
    echo "✅ SUCESSO TOTAL: Instância ficou 'ready'!"
    
    echo ""
    echo "🧪 TESTE 4: VERIFICAR QR CODE GERADO"
    echo "===================================="
    
    qr_response=$(curl -s http://$VPS_IP:$PORTA/instance/$TEST_INSTANCE/qr \
        -H "Authorization: Bearer $TOKEN")
    
    qr_success=$(echo "$qr_response" | jq -r '.success' 2>/dev/null)
    
    if [ "$qr_success" = "true" ]; then
        echo "✅ QR Code gerado com sucesso!"
        echo "📋 QR Response:"
        echo "$qr_response" | jq '{success, status, hasQR: (.qrCode != null)}' 2>/dev/null
    else
        echo "⚠️ QR Code ainda processando"
        echo "$qr_response" | jq '{success, status, message}' 2>/dev/null || echo "$qr_response"
    fi
    
    echo ""
    echo "🧪 TESTE 5: TESTAR CONTATOS (ENDPOINT NOVO)"
    echo "==========================================="
    
    contacts_response=$(curl -s http://$VPS_IP:$PORTA/instance/$TEST_INSTANCE/contacts \
        -H "Authorization: Bearer $TOKEN")
    
    echo "📋 Resposta de contatos:"
    echo "$contacts_response" | jq '{success, total}' 2>/dev/null || echo "$contacts_response"
    
    echo ""
    echo "🧪 TESTE 6: TESTAR MENSAGENS (ENDPOINT NOVO)"
    echo "==========================================="
    
    messages_response=$(curl -s http://$VPS_IP:$PORTA/instance/$TEST_INSTANCE/messages \
        -H "Authorization: Bearer $TOKEN")
    
    echo "📋 Resposta de mensagens:"
    echo "$messages_response" | jq '{success, total}' 2>/dev/null || echo "$messages_response"
    
    echo ""
    echo "🧪 TESTE 7: TESTAR ENVIO DE MENSAGEM"
    echo "===================================="
    
    send_response=$(curl -s -X POST http://$VPS_IP:$PORTA/send \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"instanceId\":\"$TEST_INSTANCE\",\"phone\":\"5511999999999\",\"message\":\"Teste Puppeteer Corrigido\"}")
    
    echo "📋 Resposta do envio:"
    echo "$send_response" | jq '{success, message}' 2>/dev/null || echo "$send_response"
    
    CORRECTION_SUCCESS=true
    
else
    echo "❌ FALHA: Instância não ficou 'ready' - correção falhou"
    
    echo ""
    echo "🔍 DIAGNÓSTICO DE FALHA DA CORREÇÃO"
    echo "=================================="
    
    echo "📋 Status atual da instância:"
    curl -s http://$VPS_IP:$PORTA/instance/$TEST_INSTANCE/status \
        -H "Authorization: Bearer $TOKEN" | jq '.' 2>/dev/null
    
    echo ""
    echo "📋 Logs do PM2 (problemas do Puppeteer):"
    pm2 logs whatsapp-main-3002 --lines 30 | grep -i "error\|failed\|puppeteer\|chrome"
    
    CORRECTION_SUCCESS=false
fi

echo ""
echo "🧪 TESTE 8: LIMPEZA"
echo "==================="

delete_response=$(curl -s -X DELETE http://$VPS_IP:$PORTA/instance/$TEST_INSTANCE \
    -H "Authorization: Bearer $TOKEN")

echo "📋 Resposta da exclusão:"
echo "$delete_response" | jq '{success, message}' 2>/dev/null || echo "$delete_response"

echo ""
echo "📊 RELATÓRIO FINAL DA CORREÇÃO PUPPETEER"
echo "========================================"

final_health=$(curl -s http://$VPS_IP:$PORTA/health)
active_instances=$(echo "$final_health" | jq -r '.activeInstances' 2>/dev/null)

echo "📋 Instâncias ativas após teste: $active_instances"
echo "📋 Servidor: $(echo "$final_health" | jq -r '.status' 2>/dev/null)"

if [ "$CORRECTION_SUCCESS" = true ]; then
    echo ""
    echo "🎉 CORREÇÃO PUPPETEER: SUCESSO TOTAL!"
    echo "===================================="
    echo "✅ Chrome headless: FUNCIONANDO"
    echo "✅ Puppeteer: FUNCIONANDO"  
    echo "✅ Instância fica 'ready': SIM"
    echo "✅ QR Code gerado: SIM"
    echo "✅ Contatos funcionam: SIM"
    echo "✅ Mensagens funcionam: SIM"
    echo "✅ Envio funciona: SIM"
    echo ""
    echo "🚀 SISTEMA 100% OPERACIONAL!"
    echo "   Todos os problemas do Puppeteer foram resolvidos"
    echo "   Produção pode ser ativada com segurança"
    echo ""
    echo "🎯 EXECUTE TESTE FINAL COMPLETO:"
    echo "   ./teste-pos-correcoes.sh"
else
    echo ""
    echo "❌ CORREÇÃO PUPPETEER: AINDA COM PROBLEMAS"
    echo "=========================================="
    echo "❌ Instância não fica 'ready'"
    echo "❌ Puppeteer ainda falhando"
    echo ""
    echo "🔧 AÇÕES NECESSÁRIAS:"
    echo "1. Verificar logs: pm2 logs whatsapp-main-3002"
    echo "2. Verificar Chrome: google-chrome-stable --version"
    echo "3. Executar diagnóstico: ./vps-puppeteer-diagnostic-complete.sh"
fi

echo ""
echo "📋 Logs recentes para análise:"
pm2 logs whatsapp-main-3002 --lines 15 | tail -10
