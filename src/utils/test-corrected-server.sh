
#!/bin/bash

# Script de Teste do Servidor WhatsApp CORRIGIDO
echo "🧪 Iniciando testes do servidor WhatsApp CORRIGIDO..."

# Definir variáveis
SERVER_URL="http://localhost:3002"
EXTERNAL_URL="http://31.97.24.222:3002"
TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3"

# Função para testar endpoint
test_endpoint() {
    local url=$1
    local expected_code=${2:-200}
    local method=${3:-GET}
    local data=${4:-""}
    
    echo "🔍 Testando: $method $url"
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            -d "$data" \
            "$url")
    else
        response=$(curl -s -w "\n%{http_code}" \
            -H "Authorization: Bearer $TOKEN" \
            "$url")
    fi
    
    body=$(echo "$response" | head -n -1)
    code=$(echo "$response" | tail -n 1)
    
    if [ "$code" = "$expected_code" ]; then
        echo "✅ Sucesso: HTTP $code"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    else
        echo "❌ Falha: HTTP $code (esperado $expected_code)"
        echo "$body"
    fi
    
    echo "---"
}

# Verificar se servidor está rodando
echo "📊 Verificando status do PM2..."
pm2 status

echo ""
echo "🔍 Verificando se porta 3002 está aberta..."
netstat -tulpn | grep :3002

echo ""
echo "🧪 TESTES LOCAIS (localhost:3002)"
echo "=================================="

# Testes básicos
test_endpoint "$SERVER_URL/health"
test_endpoint "$SERVER_URL/status"
test_endpoint "$SERVER_URL/instances"

# Teste de criação de instância
instance_data='{"instanceId":"test123","sessionName":"test123","webhookUrl":"https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web"}'
test_endpoint "$SERVER_URL/instance/create" 200 "POST" "$instance_data"

# Aguardar um pouco
echo "⏳ Aguardando 5 segundos..."
sleep 5

# Verificar instância criada
test_endpoint "$SERVER_URL/instance/test123/status"
test_endpoint "$SERVER_URL/instance/test123/qr"

echo ""
echo "🌐 TESTES EXTERNOS (31.97.24.222:3002)"
echo "======================================"

# Testes externos
test_endpoint "$EXTERNAL_URL/health"
test_endpoint "$EXTERNAL_URL/status"

echo ""
echo "🔥 TESTE DE STRESS"
echo "=================="

# Teste de múltiplas requisições
for i in {1..5}; do
    echo "Requisição $i/5..."
    curl -s "$SERVER_URL/health" > /dev/null && echo "✅ OK" || echo "❌ FALHA"
done

echo ""
echo "📊 MÉTRICAS FINAIS"
echo "=================="

# Estatísticas PM2
pm2 show whatsapp-server

# Uso de memória
echo ""
echo "💾 Uso de memória:"
ps aux | grep "node.*server" | grep -v grep

# Logs recentes
echo ""
echo "📝 Últimos logs (10 linhas):"
pm2 logs whatsapp-server --lines 10

echo ""
echo "✅ Testes concluídos!"
echo "🎯 Para monitoramento contínuo: watch 'curl -s http://localhost:3002/health | jq .'"
