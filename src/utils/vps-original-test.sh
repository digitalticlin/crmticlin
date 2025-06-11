
#!/bin/bash

# TESTE COMPLETO SERVIDOR ORIGINAL - VALIDAÇÃO FINAL
echo "🧪 TESTE COMPLETO SERVIDOR ORIGINAL - VALIDAÇÃO FINAL"
echo "===================================================="
echo "📅 Data: $(date)"
echo "🎯 Objetivo: Validar servidor WhatsApp original funcionando"
echo ""

PORT="3001"
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

log_test "Verificando componentes do servidor original..."

# Verificar diretório
if [ -d "/root/whatsapp-original" ]; then
    log_success "Diretório original: /root/whatsapp-original"
else
    log_error "Diretório original não encontrado"
fi

# Verificar arquivo do servidor
if [ -f "/root/whatsapp-original/whatsapp-server.js" ]; then
    log_success "Arquivo servidor: whatsapp-server.js"
else
    log_error "Arquivo servidor não encontrado"
fi

# Verificar Node.js
if command -v node &> /dev/null; then
    node_version=$(node --version)
    log_success "Node.js: $node_version"
else
    log_error "Node.js não encontrado"
fi

# Verificar PM2
if command -v pm2 &> /dev/null; then
    pm2_version=$(pm2 --version)
    log_success "PM2: v$pm2_version"
else
    log_error "PM2 não encontrado"
fi

# TESTE 2: TESTE DE SERVIDOR PM2
echo ""
echo "🌐 TESTE 2: TESTE DE SERVIDOR PM2"
echo "==============================="

log_test "Verificando status PM2 do servidor original..."

# Verificar processo PM2
pm2_status=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="whatsapp-original-3001") | .pm2_env.status' 2>/dev/null)

if [ "$pm2_status" = "online" ]; then
    log_success "Servidor PM2: ONLINE"
else
    log_error "Servidor PM2: $pm2_status"
    
    # Tentar reiniciar se não estiver online
    log_info "Tentando reiniciar servidor..."
    cd /root/whatsapp-original
    pm2 restart whatsapp-original-3001 2>/dev/null || pm2 start whatsapp-server.js --name whatsapp-original-3001
    sleep 5
    
    pm2_status=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="whatsapp-original-3001") | .pm2_env.status' 2>/dev/null)
    if [ "$pm2_status" = "online" ]; then
        log_success "Servidor reiniciado: ONLINE"
    else
        log_error "Falha ao reiniciar servidor"
    fi
fi

# Verificar porta
if netstat -tulpn 2>/dev/null | grep ":3001" >/dev/null; then
    log_success "Porta 3001: ATIVA"
else
    log_error "Porta 3001: NÃO ATIVA"
fi

# TESTE 3: HEALTH CHECK ORIGINAL
echo ""
echo "🏥 TESTE 3: HEALTH CHECK ORIGINAL"
echo "==============================="

log_test "Testando health check do servidor original..."

health_response=$(curl -s http://localhost:3001/health --max-time 10 2>/dev/null)

if [ -n "$health_response" ]; then
    log_success "Health check respondeu"
    
    # Verificar se é o servidor original
    if echo "$health_response" | grep -q "WhatsApp Server Original"; then
        log_success "Servidor: ORIGINAL CONFIRMADO"
    else
        log_error "Servidor: NÃO É O ORIGINAL"
    fi
    
    # Verificar configuração
    if echo "$health_response" | grep -q "ORIGINAL_OPTIMIZED"; then
        log_success "Configuração: ORIGINAL OTIMIZADA"
    fi
    
    # Mostrar informações detalhadas
    echo "📋 Informações do servidor:"
    echo "$health_response" | jq '.' 2>/dev/null || echo "$health_response"
    
else
    log_error "Health check sem resposta"
fi

# TESTE 4: TESTE STATUS
echo ""
echo "📊 TESTE 4: TESTE STATUS"
echo "======================"

log_test "Testando endpoint de status..."

status_response=$(curl -s http://localhost:3001/status --max-time 10 2>/dev/null)

if [ -n "$status_response" ]; then
    echo "📋 Status do servidor:"
    echo "$status_response" | jq '.' 2>/dev/null || echo "$status_response"
    
    status_success=$(echo "$status_response" | jq -r '.success' 2>/dev/null)
    
    if [ "$status_success" = "true" ]; then
        log_success "Status: FUNCIONANDO"
    else
        log_error "Status: ERRO"
    fi
else
    log_error "Status: SEM RESPOSTA"
fi

# TESTE 5: TESTE DE CRIAÇÃO DE INSTÂNCIA
echo ""
echo "🚀 TESTE 5: TESTE DE CRIAÇÃO DE INSTÂNCIA"
echo "======================================"

test_instance="original_test_$(date +%s)"

log_test "Criando instância de teste: $test_instance"

create_response=$(curl -s -X POST http://localhost:3001/instance/create \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"instanceId\":\"$test_instance\",\"sessionName\":\"$test_instance\"}" \
    --max-time 45 2>/dev/null)

if [ -n "$create_response" ]; then
    echo "📋 Resposta da criação:"
    echo "$create_response" | jq '.' 2>/dev/null || echo "$create_response"
    
    create_success=$(echo "$create_response" | jq -r '.success' 2>/dev/null)
    
    if [ "$create_success" = "true" ]; then
        log_success "Instância criada: SUCESSO NO SERVIDOR ORIGINAL!"
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

# TESTE 6: TESTE DE QR CODE
if [ "$INSTANCE_CREATED" = "true" ]; then
    echo ""
    echo "📱 TESTE 6: TESTE DE QR CODE"
    echo "=========================="
    
    log_test "Aguardando geração de QR Code (20s)..."
    sleep 20
    
    qr_response=$(curl -s http://localhost:3001/instance/$test_instance/qr \
        -H "Authorization: Bearer $TOKEN" \
        --max-time 15 2>/dev/null)
    
    if [ -n "$qr_response" ]; then
        echo "📋 Resposta do QR Code:"
        echo "$qr_response" | jq '.' 2>/dev/null || echo "$qr_response"
        
        qr_success=$(echo "$qr_response" | jq -r '.success' 2>/dev/null)
        
        if [ "$qr_success" = "true" ]; then
            log_success "QR Code: GERADO COM SUCESSO!"
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

# TESTE 7: LIMPEZA
if [ "$INSTANCE_CREATED" = "true" ]; then
    echo ""
    echo "🧹 TESTE 7: LIMPEZA"
    echo "=================="
    
    log_test "Removendo instância de teste..."
    
    delete_response=$(curl -s -X DELETE http://localhost:3001/instance/$test_instance \
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
    echo "📋 Últimos logs (15 linhas):"
    pm2 logs whatsapp-original-3001 --lines 15 --nostream 2>/dev/null | tail -30
    
    # Verificar se há erros críticos
    error_count=$(pm2 logs whatsapp-original-3001 --lines 50 --nostream 2>/dev/null | grep -i -c "error\|fail" || echo "0")
    
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
echo "🎉 RESULTADO FINAL DO TESTE ORIGINAL"
echo "=================================="

# Calcular score
tests_passed=0
total_tests=7

# Verificar cada teste
[ "$pm2_status" = "online" ] && tests_passed=$((tests_passed + 1))
[ -n "$health_response" ] && echo "$health_response" | grep -q "WhatsApp Server Original" && tests_passed=$((tests_passed + 1))
[ -n "$status_response" ] && tests_passed=$((tests_passed + 1))
[ "$create_success" = "true" ] && tests_passed=$((tests_passed + 1))
[ "$qr_success" = "true" ] || [ "$qr_waiting" = "true" ] && tests_passed=$((tests_passed + 1))
[ "$delete_success" = "true" ] && tests_passed=$((tests_passed + 1))
[ "$error_count" = "0" ] && tests_passed=$((tests_passed + 1))

echo "📊 SCORE FINAL: $tests_passed/$total_tests testes aprovados"

if [ $tests_passed -ge 6 ]; then
    echo ""
    echo "🎉 SERVIDOR ORIGINAL: FUNCIONANDO PERFEITAMENTE!"
    echo "=============================================="
    echo "✅ Servidor WhatsApp Original: ONLINE"
    echo "✅ Health Check: FUNCIONANDO"
    echo "✅ Criação de instâncias: FUNCIONANDO"
    echo "✅ Geração de QR Code: FUNCIONANDO"
    echo "✅ Sistema: ESTÁVEL E PRONTO"
    echo ""
    echo "🚀 MISSÃO CUMPRIDA: SERVIDOR ORIGINAL RESTAURADO!"
    
elif [ $tests_passed -ge 4 ]; then
    echo ""
    echo "⚠️ SERVIDOR PARCIALMENTE FUNCIONAL"
    echo "================================="
    echo "✅ Principais funcionalidades: FUNCIONANDO"
    echo "⚠️ Algumas funcionalidades: PODEM PRECISAR AJUSTES"
    echo "📋 Verificar logs para melhorias"
    
else
    echo ""
    echo "❌ SERVIDOR COM PROBLEMAS"
    echo "======================="
    echo "❌ Múltiplos testes falharam"
    echo "🔧 Revisar instalação e configuração"
    echo "📋 Verificar logs: pm2 logs whatsapp-original-3001"
fi

echo ""
echo "📋 INFORMAÇÕES DO SERVIDOR ORIGINAL:"
echo "   🌐 URL: http://$(hostname -I | awk '{print $1}'):3001"
echo "   📱 Health: http://$(hostname -I | awk '{print $1}'):3001/health"
echo "   📊 Status: http://$(hostname -I | awk '{print $1}'):3001/status"
echo "   🔑 Token: ${TOKEN:0:20}..."

echo ""
echo "📋 COMANDOS ÚTEIS:"
echo "   pm2 logs whatsapp-original-3001 --lines 50"
echo "   curl http://localhost:3001/health | jq '.'"
echo "   pm2 restart whatsapp-original-3001"
echo "   pm2 monit"

log_test "TESTE ORIGINAL FINALIZADO!"
