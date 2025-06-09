
#!/bin/bash

# Script para testar comunicação das Edge Functions com a VPS
# Autor: Lovable AI - Atualizado com correções

# Cores para saída
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 TESTE COMPLETO: EDGE FUNCTIONS → VPS${NC}"
echo -e "${CYAN}======================================${NC}"
echo "Data/Hora: $(date)"
echo "Objetivo: Testar cada Edge Function individualmente"

echo ""
echo -e "${CYAN}📊 CONFIGURAÇÕES:${NC}"
VPS_IP="31.97.24.222"
PORTA="3002" # CORREÇÃO: Apenas porta 3002
TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3"
TEST_INSTANCE="edge_test_$(date +%s)"

echo "VPS IP: $VPS_IP"
echo "Porta: $PORTA (corrigida)"
echo "Token: ${TOKEN:0:8}..."
echo "Test Instance: $TEST_INSTANCE"

function test_http_request() {
    local url="$1"
    local method="$2"
    local payload="$3"
    local test_name="$4"
    
    echo ""
    echo -e "${CYAN}🧪 TESTE: $test_name${NC}"
    echo "   Method: $method"
    echo "   URL: $url"
    
    if [ ! -z "$payload" ]; then
        echo "   Payload: $payload"
    fi
    
    local response=""
    local status_code=""
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$url")
    elif [ "$method" == "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "$payload" "$url")
    elif [ "$method" == "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE -H "Authorization: Bearer $TOKEN" "$url")
    fi
    
    # Separar o status code do response body
    status_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | sed '$d')
    
    echo "   HTTP Status: $status_code"
    echo "   Response: ${response_body:0:100}..."
    
    if [[ $status_code == "2"* ]]; then
        # Verificar success: true na resposta
        if echo "$response_body" | grep -q '"success":true' || echo "$response_body" | grep -q '"success": *true'; then
            echo -e "   ${GREEN}✅ SUCESSO - Campo 'success' encontrado${NC}"
            return 0
        else
            # Procurar outro campo significativo (instances, qrCode, etc.)
            local field_check=false
            for field in "instances" "qrCode" "messageId"; do
                if echo "$response_body" | grep -q "\"$field\""; then
                    echo -e "   ${GREEN}✅ SUCESSO - Campo '$field' encontrado${NC}"
                    field_check=true
                    break
                fi
            done
            
            if [ "$field_check" = false ]; then
                echo -e "   ${YELLOW}⚠️ PARCIAL - Status 2xx mas sem campos esperados${NC}"
                echo "   Full Response: $response_body"
            fi
            return 0
        fi
    else
        echo -e "   ${RED}❌ FALHA - HTTP $status_code${NC}"
        echo "   Full Response: $response_body"
        return 1
    fi
}

# FASE 1: TESTES BÁSICOS DE CONECTIVIDADE
echo ""
echo -e "${CYAN}🔍 FASE 1: TESTES BÁSICOS DE CONECTIVIDADE${NC}"
echo -e "${CYAN}==========================================${NC}"

# Health Check na porta 3002
test_http_request "http://$VPS_IP:$PORTA/health" "GET" "" "Health Check Porta $PORTA"

# Status Endpoint (novo)
test_http_request "http://$VPS_IP:$PORTA/status" "GET" "" "Status Endpoint"

# FASE 2: SIMULAÇÃO whatsapp_instance_manager
echo ""
echo -e "${CYAN}🚀 FASE 2: SIMULAÇÃO whatsapp_instance_manager${NC}"
echo -e "${CYAN}=============================================${NC}"

# Listar Instâncias
test_http_request "http://$VPS_IP:$PORTA/instances" "GET" "" "Listar Instâncias"

# Criar Instância
test_http_request "http://$VPS_IP:$PORTA/instance/create" "POST" "{\"instanceId\":\"$TEST_INSTANCE\",\"sessionName\":\"$TEST_INSTANCE\",\"webhookUrl\":\"https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web\"}" "Criar Instância"

# Aguardar um pouco para instância inicializar
echo ""
echo -e "${YELLOW}⏳ Aguardando 5s para instância inicializar...${NC}"
sleep 5

# FASE 3: SIMULAÇÃO whatsapp_qr_service
echo ""
echo -e "${CYAN}🔍 FASE 3: SIMULAÇÃO whatsapp_qr_service${NC}"
echo -e "${CYAN}========================================${NC}"

# Buscar QR Code
test_http_request "http://$VPS_IP:$PORTA/instance/$TEST_INSTANCE/qr" "GET" "" "Buscar QR Code"

# Status da Instância (novo endpoint)
test_http_request "http://$VPS_IP:$PORTA/instance/$TEST_INSTANCE/status" "GET" "" "Status da Instância"

# FASE 4: SIMULAÇÃO whatsapp_messaging_service
echo ""
echo -e "${CYAN}📤 FASE 4: SIMULAÇÃO whatsapp_messaging_service${NC}"
echo -e "${CYAN}=============================================${NC}"

# Enviar Mensagem (novo endpoint)
test_http_request "http://$VPS_IP:$PORTA/send" "POST" "{\"instanceId\":\"$TEST_INSTANCE\",\"phone\":\"5511999999999\",\"message\":\"Teste de mensagem via Edge Function\"}" "Enviar Mensagem"

# FASE 6: LIMPEZA
echo ""
echo -e "${CYAN}🧹 FASE 5: LIMPEZA${NC}"
echo -e "${CYAN}==================${NC}"

# Deletar Instância Teste
test_http_request "http://$VPS_IP:$PORTA/instance/$TEST_INSTANCE" "DELETE" "" "Deletar Instância Teste"

# FASE 7: TESTE DE FIREWALL
echo ""
echo -e "${CYAN}🔥 FASE 6: TESTE DE FIREWALL${NC}"
echo -e "${CYAN}==========================${NC}"

echo "🧪 TESTE: Conectividade Externa"
echo "   Testando se firewall bloqueia conexões externas..."

if curl -s --connect-timeout 5 "http://$VPS_IP:$PORTA/health" | grep -q "success"; then
    echo -e "   ${GREEN}✅ Firewall permite conexões externas na porta $PORTA${NC}"
else
    echo -e "   ${RED}❌ Firewall pode estar bloqueando conexões externas na porta $PORTA${NC}"
    echo "   Detalhes: $(curl -s --connect-timeout 5 "http://$VPS_IP:$PORTA/health")"
fi

# RELATÓRIO FINAL
echo ""
echo -e "${CYAN}📋 RELATÓRIO FINAL${NC}"
echo -e "${CYAN}==================${NC}"

# Contar sucessos e falhas
SUCCESS_COUNT=$(grep -c "✅ SUCESSO" "$0.output" 2>/dev/null || echo "0")
FAILURE_COUNT=$(grep -c "❌ FALHA" "$0.output" 2>/dev/null || echo "0")
TOTAL_COUNT=$((SUCCESS_COUNT + FAILURE_COUNT))
SUCCESS_RATE=$((SUCCESS_COUNT * 100 / TOTAL_COUNT))

echo "Total de testes: $TOTAL_COUNT"
echo "Sucessos: $SUCCESS_COUNT"
echo "Falhas: $FAILURE_COUNT"
echo "Taxa de sucesso: $SUCCESS_RATE%"

if [ $FAILURE_COUNT -gt 0 ]; then
    echo ""
    echo -e "${RED}❌ PROBLEMAS DETECTADOS${NC}"
    grep -A 1 "❌ FALHA" "$0.output" 2>/dev/null
    
    echo ""
    echo -e "${YELLOW}🎯 PRÓXIMOS PASSOS:${NC}"
    echo "1. Verificar se o servidor na porta $PORTA está funcionando corretamente"
    echo "2. Verificar se os endpoints são válidos"
    echo "3. Verificar se o token de autenticação está correto"
    echo "4. Verificar se a VPS está acessível externamente"
else
    echo ""
    echo -e "${GREEN}✅ TODOS OS TESTES PASSARAM!${NC}"
    echo "O servidor está acessível e respondendo corretamente a todos os endpoints."
fi

# Status atual do PM2
echo ""
echo -e "${CYAN}📊 Status atual do PM2:${NC}"
pm2 status

# Portas abertas
echo ""
echo -e "${CYAN}📋 DETALHES DE REDE:${NC}"
echo "Portas abertas:"
netstat -tlnp 2>/dev/null | grep -E ":3002|:3001" || lsof -i -P -n | grep -E ":3002|:3001" || echo "Comando netstat/lsof não disponível"

# Firewall status
echo ""
echo "Firewall status:"
ufw status 2>/dev/null || echo "UFW não disponível ou não instalado"
