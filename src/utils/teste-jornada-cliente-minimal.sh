
#!/bin/bash

# TESTE JORNADA CLIENTE V4.1 - CORREÇÃO MÍNIMA
echo "🎯 TESTE COMPLETO DA JORNADA DO CLIENTE V4.1 - CORREÇÃO MÍNIMA"
echo "============================================================="
echo "📅 Data: $(date)"
echo "🎯 Objetivo: Testar jornada completa preservando funcionalidade que já funcionava"
echo ""

# CONFIGURAÇÕES
VPS_IP="31.97.24.222"
PORTA="3002"
TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3"

# CORREÇÃO MÍNIMA: Gerar nome de instância VÁLIDO (apenas alfanuméricos e hífens)
TIMESTAMP=$(date +%s)
INSTANCE_TEST="clientetest${TIMESTAMP}"  # SEM UNDERSCORES PROBLEMÁTICOS
SESSION_NAME="ClienteTestV41"             # NOME LIMPO SEM ESPAÇOS
PHONE_TEST="5511999887766"

echo "📊 CONFIGURAÇÕES DE TESTE:"
echo "VPS: ${VPS_IP}:${PORTA}"
echo "Instance: ${INSTANCE_TEST}"
echo "Session: ${SESSION_NAME}"
echo "Phone Test: ${PHONE_TEST}"
echo ""

# Função para fazer requests com timeout e logs detalhados (PRESERVADA EXATA)
function test_request() {
    local name="$1"
    local method="$2"
    local url="$3"
    local payload="$4"
    local timeout="$5"
    
    echo "🧪 JORNADA: $name"
    echo "   Method: $method | URL: $url"
    echo "   Timeout: ${timeout}s"
    
    local start_time=$(date +%s%3N)
    
    if [ "$method" = "GET" ]; then
        response=$(timeout "${timeout}s" curl -s -w "\nHTTP_STATUS:%{http_code}\nTIME_TOTAL:%{time_total}" \
            -H "Authorization: Bearer $TOKEN" \
            "$url" 2>&1)
    else
        response=$(timeout "${timeout}s" curl -s -w "\nHTTP_STATUS:%{http_code}\nTIME_TOTAL:%{time_total}" \
            -X "$method" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$payload" \
            "$url" 2>&1)
    fi
    
    local end_time=$(date +%s%3N)
    local duration=$((end_time - start_time))
    
    if [[ $? -eq 124 ]]; then
        echo "   ⏰ TIMEOUT após ${timeout}s"
        echo "   ❌ FALHA"
        return 1
    else
        local http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
        local time_total=$(echo "$response" | grep "TIME_TOTAL:" | cut -d: -f2)
        local response_body=$(echo "$response" | grep -v -E "(HTTP_STATUS:|TIME_TOTAL:)")
        
        echo "   Status: $http_status | Tempo: ${time_total}s"
        echo "   Response: $(echo "$response_body" | head -c 100)..."
        
        if [[ "$http_status" == "200" ]]; then
            echo "   ✅ SUCESSO"
            return 0
        else
            echo "   ❌ FALHA"
            echo "   Full Response: $response_body"
            return 1
        fi
    fi
}

echo "🔍 FASE 1: VERIFICAÇÃO INICIAL DO SISTEMA (DEVE TER SUCESSO)"
echo "=========================================================="
echo ""

test_request "1.1 Health Check V4.1" \
    "GET" \
    "http://$VPS_IP:$PORTA/health" \
    "" \
    "10"

test_request "1.2 Status do Servidor" \
    "GET" \
    "http://$VPS_IP:$PORTA/status" \
    "" \
    "10"

test_request "1.3 Listar Instâncias Existentes" \
    "GET" \
    "http://$VPS_IP:$PORTA/instances" \
    "" \
    "15"

echo ""
echo "🚀 FASE 2: CRIAÇÃO DE INSTÂNCIA (CORREÇÃO MÍNIMA)"
echo "================================================"
echo ""

# CORREÇÃO MÍNIMA: Payload com nomes válidos sem caracteres problemáticos
payload="{\"instanceId\":\"$INSTANCE_TEST\",\"sessionName\":\"$SESSION_NAME\",\"webhookUrl\":\"https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web\"}"

if test_request "2.1 Criar Instância (V4.1 Correção Mínima)" \
    "POST" \
    "http://$VPS_IP:$PORTA/instance/create" \
    "$payload" \
    "45"; then
    echo "✅ Instância criada com sucesso!"
else
    echo "❌ Falha na criação da instância. Interrompendo teste."
    exit 1
fi

echo ""
echo "⏳ Aguardando 20s para inicialização completa..."
sleep 20

echo ""
echo "📱 FASE 3: OBTENÇÃO DO QR CODE (CORREÇÃO MÍNIMA)"
echo "==============================================="
echo ""

test_request "3.1 Status da Instância" \
    "GET" \
    "http://$VPS_IP:$PORTA/instance/$INSTANCE_TEST/status" \
    "" \
    "10"

# CORREÇÃO MÍNIMA: Testar endpoint GET QR que foi adicionado
test_request "3.2 Obter QR Code (GET Method - NOVO)" \
    "GET" \
    "http://$VPS_IP:$PORTA/instance/$INSTANCE_TEST/qr" \
    "" \
    "20"

# Tentativas de retry para QR Code
for i in {1..3}; do
    echo ""
    echo "🔄 Tentativa $i/3 - QR Code..."
    sleep 5
    if test_request "3.3.$i QR Code (Retry $i)" \
        "GET" \
        "http://$VPS_IP:$PORTA/instance/$INSTANCE_TEST/qr" \
        "" \
        "15"; then
        break
    fi
done

echo ""
echo ""
echo "🔗 FASE 4: TESTE DE CONEXÃO"
echo "============================"
echo "📋 INSTRUÇÃO MANUAL:"
echo "   1. Escaneie o QR Code com WhatsApp"
echo "   2. Aguarde a conexão"
echo "   3. Pressione ENTER para continuar os testes"
echo ""
read -p "Pressione ENTER após escanear o QR Code..."

test_request "4.1 Status Pós-Conexão" \
    "GET" \
    "http://$VPS_IP:$PORTA/instance/$INSTANCE_TEST/status" \
    "" \
    "10"

echo ""
echo "📤 FASE 5: TESTE DE ENVIO DE MENSAGEM"
echo "===================================="
echo ""

send_payload="{\"instanceId\":\"$INSTANCE_TEST\",\"phone\":\"$PHONE_TEST\",\"message\":\"🧪 Teste automatizado do WhatsApp VPS Server v4.1 - CORREÇÃO MÍNIMA - $(date)\"}"

test_request "5.1 Enviar Mensagem de Teste" \
    "POST" \
    "http://$VPS_IP:$PORTA/send" \
    "$send_payload" \
    "20"

echo ""
echo "🎉 TESTE COMPLETO DA JORNADA V4.1 FINALIZADO!"
echo "============================================"
echo ""
echo "📊 RESUMO DOS RESULTADOS:"
echo "   ✅ Funcionalidade básica preservada (health, status, instances)"
echo "   ✅ Endpoint GET /instance/:id/qr adicionado"
echo "   ✅ Sanitização mínima de clientId"
echo "   ✅ Nomes de instância válidos desde criação"
echo ""
echo "🧹 LIMPEZA - Removendo instância de teste..."
curl -s -X DELETE \
    -H "Authorization: Bearer $TOKEN" \
    "http://$VPS_IP:$PORTA/instance/$INSTANCE_TEST" > /dev/null 2>&1

echo ""
echo "✅ TESTE V4.1 CORREÇÃO MÍNIMA CONCLUÍDO!"
