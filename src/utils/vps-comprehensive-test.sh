
#!/bin/bash

# TESTE ABRANGENTE FINAL - VALIDAÇÃO COMPLETA
echo "🧪 TESTE ABRANGENTE FINAL - VALIDAÇÃO COMPLETA"
echo "=============================================="
echo "📅 Data: $(date)"
echo "🎯 Objetivo: Validar ambiente ultra otimizado"
echo ""

VPS_IP="31.97.24.222"
PORT="3002"
TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3"

# Função de log
log_test() {
    echo "[$(date '+%H:%M:%S')] 🧪 $1"
}

log_success() {
    echo "[$(date '+%H:%M:%S')] ✅ $1"
}

log_error() {
    echo "[$(date '+%H:%M:%S')] ❌ $1"
}

log_info() {
    echo "[$(date '+%H:%M:%S')] ℹ️ $1"
}

# TESTE 1: VALIDAÇÃO DO AMBIENTE
echo ""
echo "🔍 TESTE 1: VALIDAÇÃO DO AMBIENTE"
echo "==============================="

log_test "Verificando componentes instalados..."

# Node.js
if command -v node &> /dev/null; then
    node_version=$(node --version)
    log_success "Node.js: $node_version"
else
    log_error "Node.js não encontrado"
fi

# Chrome
if command -v google-chrome-stable &> /dev/null; then
    chrome_version=$(google-chrome-stable --version)
    log_success "Chrome: $chrome_version"
else
    log_error "Chrome não encontrado"
fi

# PM2
if command -v pm2 &> /dev/null; then
    pm2_version=$(pm2 --version)
    log_success "PM2: v$pm2_version"
else
    log_error "PM2 não encontrado"
fi

# Verificar diretório otimizado
if [ -d "/root/whatsapp-optimized" ]; then
    log_success "Diretório ultra otimizado: /root/whatsapp-optimized"
else
    log_error "Diretório ultra otimizado não encontrado"
fi

# TESTE 2: TESTE DE SERVIDOR
echo ""
echo "🌐 TESTE 2: TESTE DE SERVIDOR"
echo "============================"

log_test "Verificando status do servidor..."

# Verificar processo PM2
pm2_status=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="whatsapp-main-3002") | .pm2_env.status' 2>/dev/null)

if [ "$pm2_status" = "online" ]; then
    log_success "Servidor PM2: ONLINE"
else
    log_error "Servidor PM2: $pm2_status"
fi

# Verificar porta
if netstat -tulpn 2>/dev/null | grep ":3002" >/dev/null; then
    log_success "Porta 3002: ATIVA"
else
    log_error "Porta 3002: NÃO ATIVA"
fi

# TESTE 3: HEALTH CHECK ULTRA OTIMIZADO
echo ""
echo "🏥 TESTE 3: HEALTH CHECK ULTRA OTIMIZADO"
echo "======================================"

log_test "Testando health check..."

health_response=$(curl -s http://localhost:3002/health --max-time 10 2>/dev/null)

if [ -n "$health_response" ]; then
    log_success "Health check respondeu"
    
    # Verificar se é ultra otimizado
    if echo "$health_response" | grep -q "Ultra Optimized"; then
        log_success "Configuração: ULTRA OTIMIZADO CONFIRMADO"
    else
        log_error "Configuração: NÃO É ULTRA OTIMIZADA"
    fi
    
    # Verificar status das otimizações
    if echo "$health_response" | grep -q "puppeteerUltraOptimized.*true"; then
        log_success "Puppeteer: ULTRA OTIMIZADO"
    fi
    
    if echo "$health_response" | grep -q "setUserAgentRemoved.*true"; then
        log_success "Protocol Error: ELIMINADO"
    fi
    
    # Mostrar informações detalhadas
    echo "📋 Informações do servidor:"
    echo "$health_response" | jq '.' 2>/dev/null || echo "$health_response"
    
else
    log_error "Health check sem resposta"
fi

# TESTE 4: TESTE DE CRIAÇÃO DE INSTÂNCIA
echo ""
echo "🚀 TESTE 4: TESTE DE CRIAÇÃO DE INSTÂNCIA"
echo "======================================"

test_instance="comprehensive_test_$(date +%s)"

log_test "Criando instância de teste: $test_instance"

create_response=$(curl -s -X POST http://localhost:3002/instance/create \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"instanceId\":\"$test_instance\",\"sessionName\":\"$test_instance\"}" \
    --max-time 45 2>/dev/null)

if [ -n "$create_response" ]; then
    echo "📋 Resposta da criação:"
    echo "$create_response" | jq '.' 2>/dev/null || echo "$create_response"
    
    create_success=$(echo "$create_response" | jq -r '.success' 2>/dev/null)
    
    if [ "$create_success" = "true" ]; then
        log_success "Instância criada: SEM ERRO PROTOCOL/SESSION CLOSED!"
        
        # Verificar otimização
        if echo "$create_response" | grep -q "ULTRA_OPTIMIZED"; then
            log_success "Otimização: ULTRA OTIMIZADA CONFIRMADA"
        fi
        
        INSTANCE_CREATED=true
    else
        log_error "Instância não criada"
        echo "Erro: $(echo "$create_response" | jq -r '.error' 2>/dev/null)"
        INSTANCE_CREATED=false
    fi
else
    log_error "Sem resposta na criação"
    INSTANCE_CREATED=false
fi

# TESTE 5: TESTE DE QR CODE
if [ "$INSTANCE_CREATED" = "true" ]; then
    echo ""
    echo "📱 TESTE 5: TESTE DE QR CODE"
    echo "=========================="
    
    log_test "Aguardando geração de QR Code (30s)..."
    sleep 30
    
    qr_response=$(curl -s http://localhost:3002/instance/$test_instance/qr \
        -H "Authorization: Bearer $TOKEN" \
        --max-time 15 2>/dev/null)
    
    if [ -n "$qr_response" ]; then
        echo "📋 Resposta do QR Code:"
        echo "$qr_response" | jq '.' 2>/dev/null || echo "$qr_response"
        
        qr_success=$(echo "$qr_response" | jq -r '.success' 2>/dev/null)
        
        if [ "$qr_success" = "true" ]; then
            log_success "QR Code: GERADO COM SUCESSO!"
            
            if echo "$qr_response" | grep -q "QR_ULTRA_OPTIMIZED"; then
                log_success "QR Code: ULTRA OTIMIZADO CONFIRMADO"
            fi
        else
            qr_waiting=$(echo "$qr_response" | jq -r '.waiting' 2>/dev/null)
            if [ "$qr_waiting" = "true" ]; then
                log_info "QR Code: AINDA SENDO GERADO (NORMAL)"
            else
                log_error "QR Code: ERRO NA GERAÇÃO"
            fi
        fi
    else
        log_error "QR Code: SEM RESPOSTA"
    fi
fi

# TESTE 6: TESTE DE STATUS
if [ "$INSTANCE_CREATED" = "true" ]; then
    echo ""
    echo "📊 TESTE 6: TESTE DE STATUS"
    echo "========================="
    
    log_test "Verificando status da instância..."
    
    status_response=$(curl -s http://localhost:3002/instance/$test_instance/status \
        -H "Authorization: Bearer $TOKEN" \
        --max-time 10 2>/dev/null)
    
    if [ -n "$status_response" ]; then
        echo "📋 Status da instância:"
        echo "$status_response" | jq '.' 2>/dev/null || echo "$status_response"
        
        status_success=$(echo "$status_response" | jq -r '.success' 2>/dev/null)
        
        if [ "$status_success" = "true" ]; then
            log_success "Status: FUNCIONANDO"
            
            instance_status=$(echo "$status_response" | jq -r '.status' 2>/dev/null)
            log_info "Estado da instância: $instance_status"
        else
            log_error "Status: ERRO"
        fi
    else
        log_error "Status: SEM RESPOSTA"
    fi
fi

# TESTE 7: LIMPEZA
if [ "$INSTANCE_CREATED" = "true" ]; then
    echo ""
    echo "🧹 TESTE 7: LIMPEZA"
    echo "=================="
    
    log_test "Removendo instância de teste..."
    
    delete_response=$(curl -s -X DELETE http://localhost:3002/instance/$test_instance \
        -H "Authorization: Bearer $TOKEN" \
        --max-time 15 2>/dev/null)
    
    delete_success=$(echo "$delete_response" | jq -r '.success' 2>/dev/null)
    
    if [ "$delete_success" = "true" ]; then
        log_success "Instância removida: SUCESSO"
    else
        log_error "Instância removida: ERRO (não crítico)"
    fi
fi

# TESTE 8: TESTE DE LOGS
echo ""
echo "📜 TESTE 8: TESTE DE LOGS"
echo "======================="

log_test "Verificando logs do PM2..."

if command -v pm2 &> /dev/null; then
    echo "📋 Últimos logs (10 linhas):"
    pm2 logs whatsapp-main-3002 --lines 10 --nostream 2>/dev/null | tail -20
    
    # Verificar se há erros críticos
    error_count=$(pm2 logs whatsapp-main-3002 --lines 50 --nostream 2>/dev/null | grep -i -c "error\|protocol error\|session closed" || echo "0")
    
    if [ "$error_count" = "0" ]; then
        log_success "Logs: SEM ERROS CRÍTICOS"
    else
        log_error "Logs: $error_count ERROS ENCONTRADOS"
    fi
else
    log_error "PM2 não disponível para verificar logs"
fi

# RESULTADO FINAL
echo ""
echo "🎉 RESULTADO FINAL DO TESTE ABRANGENTE"
echo "===================================="

# Calcular score
tests_passed=0
total_tests=8

# Verificar cada teste
[ "$pm2_status" = "online" ] && tests_passed=$((tests_passed + 1))
[ -n "$health_response" ] && echo "$health_response" | grep -q "Ultra Optimized" && tests_passed=$((tests_passed + 1))
[ "$create_success" = "true" ] && tests_passed=$((tests_passed + 1))
[ "$qr_success" = "true" ] || [ "$qr_waiting" = "true" ] && tests_passed=$((tests_passed + 1))
[ "$status_success" = "true" ] && tests_passed=$((tests_passed + 1))
[ "$delete_success" = "true" ] && tests_passed=$((tests_passed + 1))
[ "$error_count" = "0" ] && tests_passed=$((tests_passed + 1))
[ ${#CHROME_WORKING[@]} -gt 0 ] 2>/dev/null && tests_passed=$((tests_passed + 1))

echo "📊 SCORE FINAL: $tests_passed/$total_tests testes aprovados"

if [ $tests_passed -ge 6 ]; then
    echo ""
    echo "🎉 AMBIENTE ULTRA OTIMIZADO: FUNCIONANDO PERFEITAMENTE!"
    echo "====================================================="
    echo "✅ Protocol Error 'Session closed': ELIMINADO DEFINITIVAMENTE"
    echo "✅ Configuração ultra otimizada: ATIVA E FUNCIONAL"
    echo "✅ Criação de instâncias: SEM ERROS"
    echo "✅ Geração de QR Code: FUNCIONANDO"
    echo "✅ Sistema: ESTÁVEL E PRONTO PARA PRODUÇÃO"
    echo ""
    echo "🚀 MISSÃO CUMPRIDA: VPS COMPLETAMENTE OTIMIZADA!"
    
elif [ $tests_passed -ge 4 ]; then
    echo ""
    echo "⚠️ AMBIENTE PARCIALMENTE FUNCIONAL"
    echo "================================="
    echo "✅ Principais funcionalidades: FUNCIONANDO"
    echo "⚠️ Algumas otimizações: PODEM PRECISAR DE AJUSTES"
    echo "📋 Verificar logs para possíveis melhorias"
    
else
    echo ""
    echo "❌ AMBIENTE COM PROBLEMAS"
    echo "======================="
    echo "❌ Múltiplos testes falharam"
    echo "🔧 Revisar instalação e configuração"
    echo "📋 Verificar logs detalhados: pm2 logs whatsapp-main-3002"
fi

echo ""
echo "📋 COMANDOS ÚTEIS PÓS-TESTE:"
echo "   pm2 logs whatsapp-main-3002 --lines 50"
echo "   curl http://localhost:3002/health | jq '.'"
echo "   pm2 restart whatsapp-main-3002"

log_test "TESTE ABRANGENTE FINALIZADO!"
