
#!/bin/bash

# TESTE DE CONECTIVIDADE VPS PORTA 3002
# Verifica se o servidor migrado está funcionando corretamente
echo "🧪 TESTE DE CONECTIVIDADE VPS PORTA 3002"
echo "========================================"
echo "📅 $(date)"
echo ""

# Configurações
VPS_IP="31.97.24.222"
PORT="3002"
AUTH_TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3"

# Função de log
log() {
    echo "[$(date '+%H:%M:%S')] $1"
}

log "🔍 INICIANDO TESTES DE CONECTIVIDADE"

# TESTE 1: Ping básico
echo "📋 TESTE 1: Conectividade de rede"
if ping -c 1 $VPS_IP > /dev/null 2>&1; then
    log "✅ VPS acessível via ping"
else
    log "❌ VPS não responde ao ping"
fi

# TESTE 2: Porta aberta
echo ""
echo "📋 TESTE 2: Porta $PORT aberta"
if nc -z $VPS_IP $PORT 2>/dev/null; then
    log "✅ Porta $PORT está aberta"
else
    log "❌ Porta $PORT não está acessível"
fi

# TESTE 3: Health Check
echo ""
echo "📋 TESTE 3: Health Check do servidor"
health_response=$(curl -s -w "HTTP_STATUS:%{http_code}" "http://${VPS_IP}:${PORT}/health" --max-time 10 2>/dev/null)
http_status=$(echo $health_response | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
response_body=$(echo $health_response | sed 's/HTTP_STATUS:[0-9]*$//')

echo "Status HTTP: $http_status"
echo "Response: $response_body"

if [ "$http_status" = "200" ]; then
    log "✅ Health Check: SUCESSO"
    
    # Verificar se é nosso servidor
    if echo "$response_body" | grep -q "whatsapp-server.js"; then
        log "✅ Servidor identificado: whatsapp-server.js"
    elif echo "$response_body" | grep -q "WhatsApp"; then
        log "✅ Servidor WhatsApp confirmado"
    fi
else
    log "❌ Health Check: FALHA"
fi

# TESTE 4: Autenticação
echo ""
echo "📋 TESTE 4: Autenticação com token"
auth_response=$(curl -s -w "HTTP_STATUS:%{http_code}" \
    "http://${VPS_IP}:${PORT}/instances" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    --max-time 10 2>/dev/null)

auth_status=$(echo $auth_response | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
auth_body=$(echo $auth_response | sed 's/HTTP_STATUS:[0-9]*$//')

echo "Status HTTP: $auth_status"
echo "Response: $auth_body"

if [ "$auth_status" = "200" ]; then
    log "✅ Autenticação: SUCESSO"
else
    log "❌ Autenticação: FALHA"
fi

# TESTE 5: Criação de instância de teste
echo ""
echo "📋 TESTE 5: Criação de instância (teste rápido)"
create_response=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST \
    "http://${VPS_IP}:${PORT}/instance/create" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"instanceName":"conectivity_test"}' \
    --max-time 20 2>/dev/null)

create_status=$(echo $create_response | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
create_body=$(echo $create_response | sed 's/HTTP_STATUS:[0-9]*$//')

echo "Status HTTP: $create_status"
echo "Response: $create_body"

if [ "$create_status" = "200" ]; then
    log "✅ Criação de instância: SUCESSO"
    
    # Extrair instanceId para limpeza
    instance_id=$(echo "$create_body" | grep -o '"instanceId":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$instance_id" ]; then
        echo ""
        echo "🧹 Removendo instância de teste..."
        delete_response=$(curl -s -w "HTTP_STATUS:%{http_code}" -X DELETE \
            "http://${VPS_IP}:${PORT}/instance/${instance_id}" \
            -H "Authorization: Bearer ${AUTH_TOKEN}" \
            --max-time 10 2>/dev/null)
        
        delete_status=$(echo $delete_response | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
        
        if [ "$delete_status" = "200" ]; then
            log "✅ Instância de teste removida"
        else
            log "⚠️ Problema na remoção (não crítico)"
        fi
    fi
else
    log "❌ Criação de instância: FALHA"
fi

echo ""
echo "📊 RESUMO DOS TESTES:"
echo "===================="

# Calcular score geral
tests_passed=0
total_tests=5

[ "$?" = "0" ] && tests_passed=$((tests_passed + 1))  # Ping
[ -n "$(nc -z $VPS_IP $PORT 2>/dev/null)" ] && tests_passed=$((tests_passed + 1))  # Porta
[ "$http_status" = "200" ] && tests_passed=$((tests_passed + 1))  # Health
[ "$auth_status" = "200" ] && tests_passed=$((tests_passed + 1))  # Auth
[ "$create_status" = "200" ] && tests_passed=$((tests_passed + 1))  # Create

echo "   🎯 Testes aprovados: $tests_passed/$total_tests"

if [ $tests_passed -eq 5 ]; then
    echo "   🎉 CONECTIVIDADE PERFEITA!"
    echo "   ✅ Servidor totalmente funcional na porta $PORT"
    echo ""
    echo "🚀 PRÓXIMOS PASSOS:"
    echo "   1. Teste na interface web"
    echo "   2. Criar instância real"
    echo "   3. Verificar QR Code"
elif [ $tests_passed -ge 3 ]; then
    echo "   ⚠️ CONECTIVIDADE PARCIAL"
    echo "   🔧 Alguns ajustes podem ser necessários"
else
    echo "   ❌ PROBLEMAS DE CONECTIVIDADE"
    echo "   🔧 Verificar configuração do servidor"
fi

echo ""
echo "📋 COMANDOS PARA DEBUG:"
echo "   ssh root@$VPS_IP 'pm2 logs whatsapp-main-3002'"
echo "   ssh root@$VPS_IP 'pm2 status'"
echo "   curl -v http://$VPS_IP:$PORT/health"

log "✅ TESTE DE CONECTIVIDADE FINALIZADO!"
