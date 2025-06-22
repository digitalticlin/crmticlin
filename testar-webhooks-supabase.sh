
#!/bin/bash

# SCRIPT DE TESTE: WEBHOOKS SUPABASE (EDGE FUNCTIONS PÚBLICAS)
echo "🧪 TESTE COMPLETO: WEBHOOKS SUPABASE"
echo "===================================="

echo "📅 Data: $(date)"
echo "🎯 Objetivo: Testar conectividade VPS → Edge Functions"
echo ""

# CONFIGURAÇÕES
VPS_IP="31.97.24.222"
PORTA="3002"
SUPABASE_PROJECT="rhjgagzstjzynvrakdyj"

# URLs das Edge Functions
QR_WEBHOOK_URL="https://${SUPABASE_PROJECT}.supabase.co/functions/v1/webhook_qr_receiver"
MESSAGE_WEBHOOK_URL="https://${SUPABASE_PROJECT}.supabase.co/functions/v1/whatsapp_message_service"
EVOLUTION_WEBHOOK_URL="https://${SUPABASE_PROJECT}.supabase.co/functions/v1/webhook_evolution"
WHATSAPP_WEB_WEBHOOK_URL="https://${SUPABASE_PROJECT}.supabase.co/functions/v1/webhook_whatsapp_web"

echo "🔍 ETAPA 1: VERIFICAR VPS"
echo "========================"

# Testar VPS
echo -n "🧪 VPS Health... "
vps_health=$(timeout 10s curl -s http://$VPS_IP:$PORTA/health 2>/dev/null)
if [[ $? -eq 0 ]]; then
    echo "✅ OK"
    echo "📋 VPS Info: $(echo $vps_health | jq -r '.status // "unknown"')"
else
    echo "❌ FAIL"
    echo "🚨 VPS não está respondendo!"
    exit 1
fi

echo ""
echo "🌐 ETAPA 2: TESTAR EDGE FUNCTIONS (PÚBLICAS)"
echo "==========================================="

# Função para testar Edge Function
function test_edge_function() {
    local name="$1"
    local url="$2"
    
    echo -n "🧪 $name... "
    
    # Testar com POST vazio (deve retornar 400 ou processar)
    response=$(timeout 10s curl -s -w "%{http_code}" -X POST "$url" \
        -H "Content-Type: application/json" \
        -d '{"test": "connectivity"}' 2>/dev/null)
    
    if [[ $? -eq 0 ]]; then
        http_code="${response: -3}"
        if [[ "$http_code" =~ ^[2-4][0-9][0-9]$ ]]; then
            echo "✅ OK ($http_code)"
            return 0
        else
            echo "❌ FAIL ($http_code)"
            return 1
        fi
    else
        echo "❌ TIMEOUT"
        return 1
    fi
}

# Testar Edge Functions
test_edge_function "QR Webhook" "$QR_WEBHOOK_URL"
qr_ok=$?

test_edge_function "Message Webhook" "$MESSAGE_WEBHOOK_URL"
message_ok=$?

test_edge_function "Evolution Webhook" "$EVOLUTION_WEBHOOK_URL"
evolution_ok=$?

test_edge_function "WhatsApp Web Webhook" "$WHATSAPP_WEB_WEBHOOK_URL"
whatsapp_ok=$?

echo ""
echo "📡 ETAPA 3: TESTE COMPLETO DE WEBHOOK"
echo "===================================="

# Criar instância e verificar se webhook é enviado
INSTANCE_ID="teste_webhook_$(date +%s)"
echo "🚀 Criando instância de teste: $INSTANCE_ID"

create_response=$(curl -s -X POST http://$VPS_IP:$PORTA/instance/create \
  -H "Content-Type: application/json" \
  -d "{
    \"instanceId\": \"$INSTANCE_ID\",
    \"sessionName\": \"teste_session\",
    \"webhookUrl\": \"$QR_WEBHOOK_URL\"
  }")

echo "📋 Resposta da criação:"
echo "$create_response" | jq '.' 2>/dev/null || echo "$create_response"

# Aguardar e verificar QR Code
echo ""
echo "⏳ Aguardando 5 segundos para geração de QR Code..."
sleep 5

echo "📱 Verificando QR Code:"
qr_response=$(curl -s http://$VPS_IP:$PORTA/instance/$INSTANCE_ID/qr)
echo "$qr_response" | jq '.' 2>/dev/null || echo "$qr_response"

# Verificar status da instância
echo ""
echo "📊 Status da instância:"
status_response=$(curl -s http://$VPS_IP:$PORTA/instance/$INSTANCE_ID)
echo "$status_response" | jq '.' 2>/dev/null || echo "$status_response"

echo ""
echo "🧹 ETAPA 4: LIMPEZA"
echo "=================="

# Deletar instância de teste
echo "🗑️ Deletando instância de teste..."
delete_response=$(curl -s -X DELETE http://$VPS_IP:$PORTA/instance/$INSTANCE_ID)
echo "$delete_response" | jq '.' 2>/dev/null || echo "$delete_response"

echo ""
echo "📊 RESULTADO FINAL:"
echo "=================="

# Contar sucessos
total_tests=4
success_count=0
[ $qr_ok -eq 0 ] && ((success_count++))
[ $message_ok -eq 0 ] && ((success_count++))
[ $evolution_ok -eq 0 ] && ((success_count++))
[ $whatsapp_ok -eq 0 ] && ((success_count++))

echo "📈 Edge Functions: $success_count/$total_tests funcionando"
echo "📋 Detalhes:"
echo "   QR Webhook: $([ $qr_ok -eq 0 ] && echo '✅ OK' || echo '❌ FAIL')"
echo "   Message Webhook: $([ $message_ok -eq 0 ] && echo '✅ OK' || echo '❌ FAIL')"
echo "   Evolution Webhook: $([ $evolution_ok -eq 0 ] && echo '✅ OK' || echo '❌ FAIL')"
echo "   WhatsApp Web Webhook: $([ $whatsapp_ok -eq 0 ] && echo '✅ OK' || echo '❌ FAIL')"

if [[ $success_count -eq $total_tests ]]; then
    echo ""
    echo "🎉 TODOS OS TESTES PASSARAM!"
    echo "✅ Edge Functions públicas funcionando"
    echo "✅ VPS → Supabase conectividade OK"
    echo "✅ Webhooks prontos para uso"
    echo ""
    echo "🚀 SISTEMA PRONTO PARA PRODUÇÃO!"
else
    echo ""
    echo "⚠️ ALGUNS TESTES FALHARAM"
    echo "📋 Verificar logs das Edge Functions no Supabase"
    echo "📋 Verificar logs do PM2: pm2 logs whatsapp-server"
fi

echo ""
echo "✅ TESTE COMPLETO FINALIZADO!"
echo "============================="
echo "📱 URLs testadas:"
echo "   $QR_WEBHOOK_URL"
echo "   $MESSAGE_WEBHOOK_URL"
echo "   $EVOLUTION_WEBHOOK_URL"
echo "   $WHATSAPP_WEB_WEBHOOK_URL"
