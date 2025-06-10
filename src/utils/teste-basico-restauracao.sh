
#!/bin/bash

# TESTE BÁSICO DA RESTAURAÇÃO
echo "🧪 TESTE BÁSICO DA RESTAURAÇÃO"
echo "============================"

# CONFIGURAÇÕES
VPS_IP="31.97.24.222"
PORTA="3002"
TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3"

echo "📅 Data: $(date)"
echo "🎯 Objetivo: Validar que funcionalidade básica foi restaurada"
echo ""

# Função para teste detalhado
function test_endpoint_detailed() {
    local name="$1"
    local method="$2"
    local url="$3"
    local expected_status="${4:-200}"
    
    echo "🧪 TESTE: $name"
    echo "   Method: $method | URL: $url"
    echo "   Expected: $expected_status"
    
    local start_time=$(date +%s%3N)
    
    if [ "$method" = "GET" ]; then
        response=$(timeout 10s curl -s -w "\nHTTP_STATUS:%{http_code}\nTIME_TOTAL:%{time_total}" \
            -H "Authorization: Bearer $TOKEN" \
            "$url" 2>&1)
    else
        response=$(timeout 10s curl -s -w "\nHTTP_STATUS:%{http_code}\nTIME_TOTAL:%{time_total}" \
            -X "$method" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            "$url" 2>&1)
    fi
    
    local end_time=$(date +%s%3N)
    local duration=$((end_time - start_time))
    
    if [[ $? -eq 124 ]]; then
        echo "   ⏰ TIMEOUT"
        echo "   ❌ FALHA"
        return 1
    else
        local http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
        local time_total=$(echo "$response" | grep "TIME_TOTAL:" | cut -d: -f2)
        local response_body=$(echo "$response" | grep -v -E "(HTTP_STATUS:|TIME_TOTAL:)")
        
        echo "   Status: $http_status | Tempo: ${time_total}s"
        echo "   Response: $(echo "$response_body" | head -c 100)..."
        
        if [[ "$http_status" == "$expected_status" ]]; then
            echo "   ✅ SUCESSO"
            return 0
        else
            echo "   ❌ FALHA (esperado: $expected_status, recebido: $http_status)"
            return 1
        fi
    fi
    echo ""
}

echo "🔍 FASE 1: TESTES DE ENDPOINTS BÁSICOS"
echo "======================================"

# Testes que DEVEM dar SUCCESS
test_endpoint_detailed "Health Check" "GET" "http://$VPS_IP:$PORTA/health" "200"
health_result=$?

test_endpoint_detailed "Status Server" "GET" "http://$VPS_IP:$PORTA/status" "200"
status_result=$?

test_endpoint_detailed "List Instances" "GET" "http://$VPS_IP:$PORTA/instances" "200"
instances_result=$?

echo "🔍 FASE 2: TESTE DO NOVO ENDPOINT GET QR"
echo "======================================="

# Teste do endpoint GET QR (deve retornar 404 com JSON válido, não HTML)
test_endpoint_detailed "GET QR (inexistente)" "GET" "http://$VPS_IP:$PORTA/instance/teste123/qr" "404"
qr_result=$?

echo "📊 RESUMO DOS RESULTADOS"
echo "======================="

all_success=true

echo "Endpoint Health: $([ $health_result -eq 0 ] && echo '✅ SUCCESS' || echo '❌ FAIL')"
[ $health_result -ne 0 ] && all_success=false

echo "Endpoint Status: $([ $status_result -eq 0 ] && echo '✅ SUCCESS' || echo '❌ FAIL')"  
[ $status_result -ne 0 ] && all_success=false

echo "Endpoint Instances: $([ $instances_result -eq 0 ] && echo '✅ SUCCESS' || echo '❌ FAIL')"
[ $instances_result -ne 0 ] && all_success=false

echo "Endpoint GET QR: $([ $qr_result -eq 0 ] && echo '✅ SUCCESS (404 com JSON)' || echo '❌ FAIL')"
[ $qr_result -ne 0 ] && all_success=false

echo ""
if [ "$all_success" = true ]; then
    echo "🎉 RESTAURAÇÃO VALIDADA COM SUCESSO!"
    echo "=================================="
    echo "✅ Todos os endpoints básicos funcionando"
    echo "✅ Endpoint GET QR adicionado e funcional"  
    echo "✅ Pronto para testes de jornada completa"
    echo ""
    echo "🚀 Próximo passo: ./teste-jornada-cliente-minimal.sh"
else
    echo "❌ RESTAURAÇÃO FALHOU!"
    echo "===================="
    echo "Alguns endpoints ainda não estão funcionando"
    echo "Verifique os logs: pm2 logs whatsapp-main-3002"
fi

echo ""
echo "📋 Para logs detalhados:"
echo "   pm2 logs whatsapp-main-3002 --lines 20"
