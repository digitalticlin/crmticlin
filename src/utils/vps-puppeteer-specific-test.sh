
#!/bin/bash

# TESTE ESPECÍFICO PUPPETEER - DIAGNÓSTICO DE TRAVAMENTO
echo "🔬 TESTE ESPECÍFICO PUPPETEER - DIAGNÓSTICO DE TRAVAMENTO"
echo "======================================================="

VPS_IP="31.97.24.222"
PORTA="3002"
TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3"

echo "📅 Data: $(date)"
echo "🎯 Objetivo: Identificar onde trava o Puppeteer na criação de instâncias"
echo ""

function test_with_timeout() {
    local name="$1"
    local url="$2"
    local method="$3"
    local payload="$4"
    local timeout="$5"
    
    echo ""
    echo "🧪 TESTE COM TIMEOUT: $name (${timeout}s)"
    echo "URL: $url"
    
    local start_time=$(date +%s)
    
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
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [[ $? -eq 124 ]]; then
        echo "   ⏰ TIMEOUT após ${timeout}s - TRAVOU AQUI!"
        echo "   🎯 Duração real: ${duration}s"
        return 1
    else
        local http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
        local time_total=$(echo "$response" | grep "TIME_TOTAL:" | cut -d: -f2)
        local response_body=$(echo "$response" | grep -v -E "(HTTP_STATUS:|TIME_TOTAL:)")
        
        echo "   ✅ Status: $http_status"
        echo "   ⏱️ Tempo total: ${time_total}s (timeout: ${timeout}s)"
        echo "   📋 Response: $(echo "$response_body" | head -c 150)..."
        return 0
    fi
}

echo "🔍 FASE 1: TESTE BÁSICO DE CONECTIVIDADE"
echo "======================================="

test_with_timeout "Health Check Básico" \
    "http://$VPS_IP:$PORTA/health" \
    "GET" \
    "" \
    "10"

test_with_timeout "Status Check" \
    "http://$VPS_IP:$PORTA/status" \
    "GET" \
    "" \
    "10"

echo ""
echo "🔍 FASE 2: TESTE DIAGNÓSTICO PUPPETEER"
echo "====================================="

# Criar endpoint de diagnóstico se não existir
test_with_timeout "Diagnóstico Puppeteer (se disponível)" \
    "http://$VPS_IP:$PORTA/diagnostic/puppeteer" \
    "GET" \
    "" \
    "15"

echo ""
echo "🔍 FASE 3: TESTE CRIAÇÃO COM TIMEOUTS ESCALONADOS"
echo "==============================================="

TEST_INSTANCE="diagnostic_test_$(date +%s)"

# Teste 1: Timeout agressivo (20s)
echo "📋 Teste 1: Criação com timeout 20s"
test_with_timeout "Criação Rápida (20s)" \
    "http://$VPS_IP:$PORTA/instance/create" \
    "POST" \
    "{\"instanceId\":\"${TEST_INSTANCE}_fast\",\"sessionName\":\"DiagnosticFast\",\"webhookUrl\":\"https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web\",\"timeout\":20000}" \
    "25"

if [ $? -ne 0 ]; then
    echo "   🎯 TRAVOU EM 20s - Problema na inicialização Puppeteer!"
fi

# Teste 2: Timeout médio (45s) 
echo ""
echo "📋 Teste 2: Criação com timeout 45s"
test_with_timeout "Criação Média (45s)" \
    "http://$VPS_IP:$PORTA/instance/create" \
    "POST" \
    "{\"instanceId\":\"${TEST_INSTANCE}_medium\",\"sessionName\":\"DiagnosticMedium\",\"webhookUrl\":\"https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web\",\"timeout\":45000}" \
    "50"

if [ $? -ne 0 ]; then
    echo "   🎯 TRAVOU EM 45s - Problema mais profundo!"
fi

# Teste 3: Timeout longo (90s)
echo ""
echo "📋 Teste 3: Criação com timeout 90s"
test_with_timeout "Criação Longa (90s)" \
    "http://$VPS_IP:$PORTA/instance/create" \
    "POST" \
    "{\"instanceId\":\"${TEST_INSTANCE}_long\",\"sessionName\":\"DiagnosticLong\",\"webhookUrl\":\"https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web\",\"timeout\":90000}" \
    "95"

echo ""
echo "🔍 FASE 4: ANÁLISE PROCESSOS CHROME"
echo "=================================="

echo "📋 Verificando processos Chrome órfãos:"
ps aux | grep -i chrome | grep -v grep || echo "✅ Nenhum processo Chrome ativo"

echo ""
echo "📋 Verificando uso de memória:"
free -h

echo ""
echo "📋 Verificando logs PM2 recentes:"
pm2 logs whatsapp-main-3002 --lines 10

echo ""
echo "🔍 FASE 5: TESTE MODO MINIMALISTA"
echo "==============================="

# Teste com configuração ultra minimalista
test_with_timeout "Criação Ultra Minimalista" \
    "http://$VPS_IP:$PORTA/instance/create" \
    "POST" \
    "{\"instanceId\":\"${TEST_INSTANCE}_minimal\",\"sessionName\":\"Minimal\",\"minimal\":true,\"timeout\":15000}" \
    "20"

echo ""
echo "📊 DIAGNÓSTICO PUPPETEER ESPECÍFICO CONCLUÍDO"
echo "============================================="

echo ""
echo "🎯 ANÁLISE DOS RESULTADOS:"
echo "   • Se travou em 20s: Problema na inicialização básica do Puppeteer"
echo "   • Se travou em 45s: Problema no carregamento do WhatsApp Web"
echo "   • Se travou em 90s: Problema na estabilização da sessão"
echo "   • Se não travou: Problema era de timeout insuficiente"

echo ""
echo "📋 PRÓXIMOS PASSOS BASEADOS NO RESULTADO:"
echo "   1. Se travou em qualquer timeout: Implementar configuração mais agressiva"
echo "   2. Se há processos Chrome órfãos: Implementar cleanup automático"
echo "   3. Se memória baixa: Otimizar uso de recursos"
echo "   4. Se logs mostram erro específico: Corrigir configuração Puppeteer"

echo ""
echo "🧹 LIMPEZA DE INSTÂNCIAS DE TESTE"
echo "==============================="

for instance in "${TEST_INSTANCE}_fast" "${TEST_INSTANCE}_medium" "${TEST_INSTANCE}_long" "${TEST_INSTANCE}_minimal"; do
    echo "🗑️ Removendo instância: $instance"
    curl -s -X DELETE \
        -H "Authorization: Bearer $TOKEN" \
        "http://$VPS_IP:$PORTA/instance/$instance" > /dev/null 2>&1
done

echo ""
echo "✅ TESTE ESPECÍFICO PUPPETEER FINALIZADO!"
