
#!/bin/bash

# TESTE DE ENDPOINTS BÁSICOS - SCRIPT BASH VÁLIDO
echo "🧪 TESTE DE ENDPOINTS BÁSICOS"
echo "=============================="

# CONFIGURAÇÕES
VPS_IP="31.97.24.222"
PORTA="3002"
TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3"

echo "📅 Data: $(date)"
echo "🎯 Objetivo: Validar endpoints básicos (health, status, instances)"
echo ""

# Função para teste simples
function test_endpoint() {
    local name="$1"
    local url="$2"
    
    echo -n "🧪 Testando $name... "
    
    response=$(timeout 10s curl -s -w "%{http_code}" \
        -H "Authorization: Bearer $TOKEN" \
        "$url" 2>/dev/null)
    
    if [[ $? -eq 0 ]]; then
        http_code="${response: -3}"
        if [[ "$http_code" == "200" ]]; then
            echo "✅ SUCCESS ($http_code)"
            return 0
        else
            echo "❌ FAIL ($http_code)"
            return 1
        fi
    else
        echo "❌ TIMEOUT/ERROR"
        return 1
    fi
}

echo "📊 Testando endpoints básicos..."
echo ""

# Testes básicos
test_endpoint "Health" "http://$VPS_IP:$PORTA/health"
health_result=$?

test_endpoint "Status" "http://$VPS_IP:$PORTA/status" 
status_result=$?

test_endpoint "Instances" "http://$VPS_IP:$PORTA/instances"
instances_result=$?

# Teste do novo endpoint GET QR (404 é esperado para instância inexistente)
echo -n "🧪 Testando GET QR (404 esperado)... "
response=$(timeout 10s curl -s -w "%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    "http://$VPS_IP:$PORTA/instance/teste123/qr" 2>/dev/null)

if [[ $? -eq 0 ]]; then
    http_code="${response: -3}"
    if [[ "$http_code" == "404" ]]; then
        echo "✅ SUCCESS ($http_code - esperado)"
        qr_result=0
    else
        echo "❌ FAIL ($http_code)"
        qr_result=1
    fi
else
    echo "❌ TIMEOUT/ERROR"
    qr_result=1
fi

echo ""
echo "📊 RESULTADO DOS TESTES:"
echo "======================="

if [[ $health_result -eq 0 && $status_result -eq 0 && $instances_result -eq 0 && $qr_result -eq 0 ]]; then
    echo "✅ TODOS OS TESTES PASSARAM!"
    echo "✅ Health: SUCCESS"
    echo "✅ Status: SUCCESS" 
    echo "✅ Instances: SUCCESS"
    echo "✅ GET QR: SUCCESS (404 esperado)"
    echo ""
    echo "🎉 CORREÇÃO INCREMENTAL VALIDADA!"
    echo "Funcionalidade básica restaurada + endpoint GET QR adicionado"
else
    echo "❌ ALGUNS TESTES FALHARAM!"
    echo "Health: $([ $health_result -eq 0 ] && echo 'SUCCESS' || echo 'FAIL')"
    echo "Status: $([ $status_result -eq 0 ] && echo 'SUCCESS' || echo 'FAIL')"
    echo "Instances: $([ $instances_result -eq 0 ] && echo 'SUCCESS' || echo 'FAIL')"
    echo "GET QR: $([ $qr_result -eq 0 ] && echo 'SUCCESS' || echo 'FAIL')"
    echo ""
    echo "Verifique os logs: pm2 logs whatsapp-main-3002"
fi

echo ""
echo "📋 Para logs detalhados:"
echo "   pm2 logs whatsapp-main-3002 --lines 20"
