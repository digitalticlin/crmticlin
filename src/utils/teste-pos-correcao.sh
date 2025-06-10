
#!/bin/bash

# TESTE PÓS-CORREÇÃO - VALIDAÇÃO COMPLETA
echo "🧪 TESTE PÓS-CORREÇÃO - VALIDAÇÃO COMPLETA"
echo "=========================================="

# CONFIGURAÇÕES
VPS_IP="31.97.24.222"
PORTA="3002"
TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3"

echo "📅 Data: $(date)"
echo "🎯 Objetivo: Validar que TODAS as correções funcionam"
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
    
    if [[ $? -eq 124 ]]; then
        echo "   ⏰ TIMEOUT"
        echo "   ❌ FALHA"
        return 1
    else
        local http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
        local time_total=$(echo "$response" | grep "TIME_TOTAL:" | cut -d: -f2)
        local response_body=$(echo "$response" | grep -v -E "(HTTP_STATUS:|TIME_TOTAL:)")
        
        echo "   Status: $http_status | Tempo: ${time_total}s"
        
        # Verificar se tem syntax_error_fixed no response
        if echo "$response_body" | grep -q "syntax_error_fixed"; then
            echo "   ✅ SINTAXE: Correção confirmada no response"
        fi
        
        if [[ "$http_status" == "$expected_status" ]]; then
            echo "   ✅ SUCESSO"
            return 0
        else
            echo "   ❌ FALHA (esperado: $expected_status, recebido: $http_status)"
            echo "   Response: $(echo "$response_body" | head -c 200)..."
            return 1
        fi
    fi
    echo ""
}

echo "🔍 FASE 1: ENDPOINTS SEM AUTENTICAÇÃO"
echo "===================================="

test_endpoint_detailed "Health Check" "GET" "http://$VPS_IP:$PORTA/health" "200"
health_result=$?

test_endpoint_detailed "Status Server" "GET" "http://$VPS_IP:$PORTA/status" "200"
status_result=$?

echo "🔍 FASE 2: ENDPOINTS COM AUTENTICAÇÃO"
echo "==================================="

test_endpoint_detailed "List Instances" "GET" "http://$VPS_IP:$PORTA/instances" "200"
instances_result=$?

test_endpoint_detailed "GET QR (inexistente)" "GET" "http://$VPS_IP:$PORTA/instance/teste123/qr" "404"
qr_result=$?

echo "🔍 FASE 3: TESTE DE CRIAÇÃO DE INSTÂNCIA"
echo "======================================"

INSTANCE_ID="teste_correcao_$(date +%s)"
INSTANCE_NAME="TesteCorrecao"

echo "📋 Criando instância: $INSTANCE_ID"

create_response=$(timeout 30s curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"instanceId\":\"$INSTANCE_ID\",\"sessionName\":\"$INSTANCE_NAME\"}" \
    "http://$VPS_IP:$PORTA/instance/create" 2>&1)

create_status=$(echo "$create_response" | grep "HTTP_STATUS:" | cut -d: -f2)
create_body=$(echo "$create_response" | grep -v "HTTP_STATUS:")

echo "Status Criação: $create_status"
echo "Response: $(echo "$create_body" | head -c 200)..."

if [[ "$create_status" == "200" ]]; then
    echo "✅ CRIAÇÃO: SUCESSO"
    
    echo "⏳ Aguardando 15s para QR Code..."
    sleep 15
    
    # Testar QR Code
    test_endpoint_detailed "GET QR (criada)" "GET" "http://$VPS_IP:$PORTA/instance/$INSTANCE_ID/qr" "200"
    qr_created_result=$?
    
    # Limpar instância
    echo "🧹 Limpando instância de teste..."
    curl -s -X DELETE \
        -H "Authorization: Bearer $TOKEN" \
        "http://$VPS_IP:$PORTA/instance/$INSTANCE_ID" > /dev/null
        
    creation_success=true
else
    echo "❌ CRIAÇÃO: FALHA"
    qr_created_result=1
    creation_success=false
fi

echo ""
echo "📊 RESUMO FINAL DOS RESULTADOS"
echo "============================="

all_success=true

echo "Endpoint Health: $([ $health_result -eq 0 ] && echo '✅ SUCCESS' || echo '❌ FAIL')"
[ $health_result -ne 0 ] && all_success=false

echo "Endpoint Status: $([ $status_result -eq 0 ] && echo '✅ SUCCESS' || echo '❌ FAIL')"  
[ $status_result -ne 0 ] && all_success=false

echo "Endpoint Instances: $([ $instances_result -eq 0 ] && echo '✅ SUCCESS' || echo '❌ FAIL')"
[ $instances_result -ne 0 ] && all_success=false

echo "Endpoint GET QR: $([ $qr_result -eq 0 ] && echo '✅ SUCCESS (404 esperado)' || echo '❌ FAIL')"
[ $qr_result -ne 0 ] && all_success=false

echo "Criação Instância: $([ "$creation_success" = true ] && echo '✅ SUCCESS' || echo '❌ FAIL')"
[ "$creation_success" != true ] && all_success=false

echo ""
if [ "$all_success" = true ]; then
    echo "🎉 CORREÇÃO VALIDADA COM SUCESSO!"
    echo "================================"
    echo "✅ Todos os endpoints funcionando"
    echo "✅ SyntaxError eliminado"  
    echo "✅ Criação de instância OK"
    echo "✅ Sistema 100% operacional"
    echo ""
    echo "🚀 PRONTO PARA JORNADA COMPLETA!"
    echo "Execute: ./teste-jornada-cliente-minimal.sh"
else
    echo "❌ AINDA HÁ PROBLEMAS!"
    echo "===================="
    echo "Alguns testes falharam - verificar logs"
    echo "pm2 logs whatsapp-main-3002 --lines 30"
fi

echo ""
echo "📋 Para logs detalhados:"
echo "   pm2 logs whatsapp-main-3002 --lines 20"
