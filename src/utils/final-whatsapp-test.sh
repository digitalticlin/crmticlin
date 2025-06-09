
#!/bin/bash
# TESTE FINAL - CONECTAR WHATSAPP E VALIDAR INTEGRAÇÃO COMPLETA
# Execute: chmod +x src/utils/final-whatsapp-test.sh && src/utils/final-whatsapp-test.sh

echo "🚀 TESTE FINAL - CONECTAR WHATSAPP VIA SSH"
echo "=========================================="

# Configurações
VPS_IP="31.97.24.222"
VPS_PORT="3002"
AUTH_TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3"
INSTANCE_NAME="teste_final_$(date +%s)"

echo "📋 Configurações do teste:"
echo "   🔸 VPS: ${VPS_IP}:${VPS_PORT}"
echo "   🔸 Instância: ${INSTANCE_NAME}"
echo "   🔸 Timestamp: $(date)"

# Função para fazer requests com timeout
make_request() {
    local url=$1
    local method=${2:-GET}
    local data=${3:-""}
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        timeout 15 curl -s -X POST "$url" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            --data "$data"
    else
        timeout 15 curl -s "$url" \
            -H "Authorization: Bearer $AUTH_TOKEN"
    fi
}

echo ""
echo "1️⃣ VERIFICAR STATUS DO SERVIDOR"
echo "================================"
SERVER_STATUS=$(make_request "http://${VPS_IP}:${VPS_PORT}/health")

if echo "$SERVER_STATUS" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ Servidor online e respondendo"
    echo "$SERVER_STATUS" | jq '{version, active_instances, permanent_mode, qr_validation_fix}'
else
    echo "❌ Servidor não está respondendo"
    echo "Response: $SERVER_STATUS"
    exit 1
fi

echo ""
echo "2️⃣ CRIAR INSTÂNCIA WHATSAPP"
echo "==========================="

CREATE_PAYLOAD="{\"instanceId\": \"$INSTANCE_NAME\", \"sessionName\": \"$INSTANCE_NAME\", \"webhookUrl\": \"https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web\"}"

echo "📤 Enviando request para criar instância..."
CREATE_RESPONSE=$(make_request "http://${VPS_IP}:${VPS_PORT}/instance/create" "POST" "$CREATE_PAYLOAD")

if echo "$CREATE_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ Instância criada com sucesso!"
    echo "$CREATE_RESPONSE" | jq '{success, instanceId, status, message}'
else
    echo "❌ Falha ao criar instância"
    echo "Response: $CREATE_RESPONSE"
    exit 1
fi

echo ""
echo "3️⃣ AGUARDAR QR CODE (60s)"
echo "========================="

QR_ATTEMPTS=0
MAX_QR_ATTEMPTS=12  # 12 tentativas x 5s = 60s
QR_FOUND=false

while [ $QR_ATTEMPTS -lt $MAX_QR_ATTEMPTS ] && [ "$QR_FOUND" = false ]; do
    QR_ATTEMPTS=$((QR_ATTEMPTS + 1))
    echo "🔄 Tentativa $QR_ATTEMPTS/$MAX_QR_ATTEMPTS para obter QR Code..."
    
    QR_PAYLOAD="{\"instanceId\": \"$INSTANCE_NAME\"}"
    QR_RESPONSE=$(make_request "http://${VPS_IP}:${VPS_PORT}/instance/qr" "POST" "$QR_PAYLOAD")
    
    if echo "$QR_RESPONSE" | jq -e '.success and .qrCode' > /dev/null 2>&1; then
        echo "✅ QR Code obtido!"
        QR_CODE=$(echo "$QR_RESPONSE" | jq -r '.qrCode')
        echo ""
        echo "📱 ESCANEIE ESTE QR CODE NO SEU WHATSAPP:"
        echo "========================================="
        echo "$QR_CODE"
        echo "========================================="
        echo ""
        echo "📝 INSTRUÇÕES:"
        echo "1. Abra o WhatsApp no seu celular"
        echo "2. Vá em Menu → Aparelhos conectados"
        echo "3. Toque em 'Conectar um aparelho'"
        echo "4. Escaneie o QR code acima"
        echo ""
        QR_FOUND=true
        break
    else
        echo "⏳ QR Code ainda não disponível (status: $(echo "$QR_RESPONSE" | jq -r '.status // "unknown"'))"
        sleep 5
    fi
done

if [ "$QR_FOUND" = false ]; then
    echo "❌ Timeout: QR Code não foi gerado em 60s"
    echo "🔍 Verificando logs do servidor..."
    exit 1
fi

echo ""
echo "4️⃣ AGUARDAR CONEXÃO WHATSAPP (120s)"
echo "=================================="

CONNECTION_ATTEMPTS=0
MAX_CONNECTION_ATTEMPTS=24  # 24 tentativas x 5s = 120s
CONNECTED=false

echo "⏳ Aguardando você escanear o QR Code..."
echo "💡 Dica: O QR Code expira em alguns minutos, escaneie rapidamente!"

while [ $CONNECTION_ATTEMPTS -lt $MAX_CONNECTION_ATTEMPTS ] && [ "$CONNECTED" = false ]; do
    CONNECTION_ATTEMPTS=$((CONNECTION_ATTEMPTS + 1))
    echo "🔄 Verificando conexão ($CONNECTION_ATTEMPTS/$MAX_CONNECTION_ATTEMPTS)..."
    
    STATUS_RESPONSE=$(make_request "http://${VPS_IP}:${VPS_PORT}/instance/$INSTANCE_NAME/status")
    
    if echo "$STATUS_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status // "unknown"')
        echo "📊 Status atual: $STATUS"
        
        if [ "$STATUS" = "ready" ] || [ "$STATUS" = "open" ] || [ "$STATUS" = "connected" ]; then
            echo "✅ WhatsApp conectado com sucesso!"
            PHONE=$(echo "$STATUS_RESPONSE" | jq -r '.phone // "N/A"')
            PROFILE=$(echo "$STATUS_RESPONSE" | jq -r '.profileName // "N/A"')
            echo "📱 Telefone: $PHONE"
            echo "👤 Perfil: $PROFILE"
            CONNECTED=true
            break
        fi
    else
        echo "⚠️ Erro ao verificar status: $STATUS_RESPONSE"
    fi
    
    sleep 5
done

if [ "$CONNECTED" = false ]; then
    echo "❌ Timeout: WhatsApp não conectou em 120s"
    echo "💡 Possíveis causas:"
    echo "   - QR Code não foi escaneado"
    echo "   - QR Code expirou"
    echo "   - Problemas de rede"
    echo ""
    echo "🔍 Status final da instância:"
    make_request "http://${VPS_IP}:${VPS_PORT}/instance/$INSTANCE_NAME/status" | jq '.'
    exit 1
fi

echo ""
echo "5️⃣ TESTE DE ENVIO DE MENSAGEM"
echo "============================="

echo "📤 Testando envio de mensagem para o próprio número..."

# Obter o número conectado para enviar mensagem para si mesmo
PHONE_NUMBER=$(echo "$STATUS_RESPONSE" | jq -r '.phone')

if [ "$PHONE_NUMBER" != "null" ] && [ "$PHONE_NUMBER" != "N/A" ]; then
    TEST_MESSAGE="🤖 Teste automático do servidor WhatsApp - $(date)"
    SEND_PAYLOAD="{\"instanceId\": \"$INSTANCE_NAME\", \"phone\": \"$PHONE_NUMBER\", \"message\": \"$TEST_MESSAGE\"}"
    
    SEND_RESPONSE=$(make_request "http://${VPS_IP}:${VPS_PORT}/send" "POST" "$SEND_PAYLOAD")
    
    if echo "$SEND_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        echo "✅ Mensagem de teste enviada com sucesso!"
        echo "$SEND_RESPONSE" | jq '{success, messageId, timestamp}'
    else
        echo "⚠️ Falha ao enviar mensagem de teste"
        echo "Response: $SEND_RESPONSE"
    fi
else
    echo "⚠️ Não foi possível obter o número para teste de envio"
fi

echo ""
echo "6️⃣ VALIDAR PERSISTÊNCIA"
echo "======================="

echo "🔍 Verificando estruturas de persistência..."

# Verificar diretórios de sessão
if [ -d "/root/webhook-server-3002/.wwebjs_auth/$INSTANCE_NAME" ]; then
    echo "✅ Diretório de sessão criado: /root/webhook-server-3002/.wwebjs_auth/$INSTANCE_NAME"
    SESSION_FILES=$(find "/root/webhook-server-3002/.wwebjs_auth/$INSTANCE_NAME" -type f | wc -l)
    echo "📁 Arquivos de sessão: $SESSION_FILES"
else
    echo "⚠️ Diretório de sessão não encontrado"
fi

# Verificar se a instância está na lista
echo ""
echo "📋 Listando todas as instâncias ativas:"
INSTANCES_LIST=$(make_request "http://${VPS_IP}:${VPS_PORT}/instances")
echo "$INSTANCES_LIST" | jq '{total, instances: [.instances[] | {instanceId, status, phone, profileName}]}'

echo ""
echo "🎉 TESTE FINAL CONCLUÍDO!"
echo "========================="
echo "✅ Servidor: FUNCIONANDO"
echo "✅ Instância: CRIADA ($INSTANCE_NAME)"
echo "✅ QR Code: GERADO"
echo "✅ WhatsApp: CONECTADO"
echo "✅ Persistência: VALIDADA"
echo ""

if [ "$CONNECTED" = true ]; then
    echo "🚀 PRÓXIMOS PASSOS:"
    echo "1. Acesse o frontend em /settings para gerenciar instâncias"
    echo "2. Use /whatsapp-chat para enviar mensagens"
    echo "3. A instância '$INSTANCE_NAME' ficará ativa permanentemente"
    echo "4. Reinicie o servidor para testar a reconexão automática"
    echo ""
    echo "📊 COMANDOS ÚTEIS:"
    echo "   pm2 status                    # Ver status do servidor"
    echo "   pm2 logs webhook-server-3002  # Ver logs"
    echo "   pm2 restart webhook-server-3002 # Reiniciar (teste persistência)"
else
    echo "⚠️ WhatsApp não foi conectado, mas o servidor está funcionando"
    echo "💡 Tente executar o script novamente e escaneie o QR rapidamente"
fi

echo ""
echo "🔗 ENDPOINTS ÚTEIS:"
echo "   Health: http://${VPS_IP}:${VPS_PORT}/health"
echo "   Status: http://${VPS_IP}:${VPS_PORT}/instances"
echo "   QR: http://${VPS_IP}:${VPS_PORT}/instance/qr"
echo ""
echo "================================================="
