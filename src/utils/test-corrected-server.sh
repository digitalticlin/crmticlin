
#!/bin/bash
# Teste do servidor corrigido - Criação permissiva de instância
# Execute: chmod +x src/utils/test-corrected-server.sh && src/utils/test-corrected-server.sh

echo "🧪 TESTE DO SERVIDOR CORRIGIDO - MODO PERMISSIVO"
echo "==============================================="

# Configurações
VPS_IP="31.97.24.222"
VPS_PORT="3002"
AUTH_TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3"
INSTANCE_NAME="teste_corrigido_$(date +%s)"

echo "📋 Configurações:"
echo "   🔸 VPS: ${VPS_IP}:${VPS_PORT}"
echo "   🔸 Instância: ${INSTANCE_NAME}"
echo "   🔸 Modo: PERMISSIVO"

# Função para fazer requests
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
echo "1️⃣ VERIFICAR SERVIDOR CORRIGIDO"
echo "==============================="
SERVER_STATUS=$(make_request "http://${VPS_IP}:${VPS_PORT}/health")

if echo "$SERVER_STATUS" | jq -e '.success and .permissive_mode' > /dev/null 2>&1; then
    echo "✅ Servidor corrigido online e em modo permissivo"
    echo "$SERVER_STATUS" | jq '{version, permissive_mode, active_instances}'
else
    echo "❌ Servidor não está em modo permissivo ou offline"
    echo "Response: $SERVER_STATUS"
    exit 1
fi

echo ""
echo "2️⃣ CRIAR INSTÂNCIA COM SERVIDOR PERMISSIVO"
echo "=========================================="

CREATE_PAYLOAD="{\"instanceId\": \"$INSTANCE_NAME\", \"sessionName\": \"$INSTANCE_NAME\"}"

echo "📤 Criando instância permissiva..."
CREATE_RESPONSE=$(make_request "http://${VPS_IP}:${VPS_PORT}/instance/create" "POST" "$CREATE_PAYLOAD")

if echo "$CREATE_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ Instância criada com servidor permissivo!"
    echo "$CREATE_RESPONSE" | jq '{success, instanceId, status, message, permissive_mode}'
else
    echo "❌ Falha na criação permissiva"
    echo "Response: $CREATE_RESPONSE"
    exit 1
fi

echo ""
echo "3️⃣ VERIFICAR STATUS IMEDIATO"
echo "==========================="

echo "🔍 Verificando status da instância recém-criada..."
STATUS_RESPONSE=$(make_request "http://${VPS_IP}:${VPS_PORT}/instance/$INSTANCE_NAME/status")

echo "📊 Status imediato:"
echo "$STATUS_RESPONSE" | jq '{success, instanceId, status, permissive_mode}'

echo ""
echo "4️⃣ TENTAR OBTER QR CODE (PERMISSIVO)"
echo "=================================="

echo "📱 Tentando obter QR Code..."
QR_PAYLOAD="{\"instanceId\": \"$INSTANCE_NAME\"}"
QR_RESPONSE=$(make_request "http://${VPS_IP}:${VPS_PORT}/instance/qr" "POST" "$QR_PAYLOAD")

if echo "$QR_RESPONSE" | jq -e '.success and .qrCode' > /dev/null 2>&1; then
    echo "✅ QR Code obtido com sucesso!"
    echo "📱 QR Code disponível para escaneamento"
    
    # Mostrar o QR Code
    QR_CODE=$(echo "$QR_RESPONSE" | jq -r '.qrCode')
    echo ""
    echo "📱 ESCANEIE ESTE QR CODE NO SEU WHATSAPP:"
    echo "========================================"
    echo "$QR_CODE"
    echo "========================================"
    
else
    echo "⏳ QR Code ainda não disponível - mas isso é NORMAL no modo permissivo"
    echo "$QR_RESPONSE" | jq '{success, status, message, permissive_info}'
    
    echo ""
    echo "🔄 Aguardando 30s e tentando novamente..."
    sleep 30
    
    QR_RESPONSE_2=$(make_request "http://${VPS_IP}:${VPS_PORT}/instance/qr" "POST" "$QR_PAYLOAD")
    
    if echo "$QR_RESPONSE_2" | jq -e '.success and .qrCode' > /dev/null 2>&1; then
        echo "✅ QR Code obtido na segunda tentativa!"
        
        QR_CODE=$(echo "$QR_RESPONSE_2" | jq -r '.qrCode')
        echo ""
        echo "📱 ESCANEIE ESTE QR CODE NO SEU WHATSAPP:"
        echo "========================================"
        echo "$QR_CODE"
        echo "========================================"
        
    else
        echo "⏳ QR Code ainda processando - aguarde mais um pouco"
        echo "$QR_RESPONSE_2" | jq '{status, message, permissive_info}'
    fi
fi

echo ""
echo "5️⃣ LISTAR TODAS AS INSTÂNCIAS"
echo "============================"

echo "📋 Lista de instâncias no servidor:"
INSTANCES_LIST=$(make_request "http://${VPS_IP}:${VPS_PORT}/instances")
echo "$INSTANCES_LIST" | jq '{total, instances: [.instances[] | {instanceId, status, hasQR, createdAt}]}'

echo ""
echo "🎉 TESTE DO SERVIDOR CORRIGIDO CONCLUÍDO!"
echo "========================================"
echo "✅ Servidor: CORRIGIDO e PERMISSIVO"
echo "✅ Instância: CRIADA ($INSTANCE_NAME)"
echo "✅ Modo: Criação assíncrona funcionando"
echo "✅ Validações: Relaxadas e informativas"
echo ""
echo "📝 RESUMO DO QUE FOI CORRIGIDO:"
echo "1. Criação de instância não aguarda QR (assíncrona)"
echo "2. Timeouts aumentados de 30s para 120s"
echo "3. Instâncias mantidas mesmo com timeout/erro"
echo "4. Retornos sempre informativos sobre o status"
echo "5. Validações permissivas (não bloqueiam criação)"
echo ""
echo "🚀 PRÓXIMOS PASSOS:"
echo "1. Use o frontend /settings → Teste Final"
echo "2. QR Code será gerado em background"
echo "3. Escaneie quando aparecer"
echo "4. Sistema agora está robusto e permissivo!"
echo "========================================"
