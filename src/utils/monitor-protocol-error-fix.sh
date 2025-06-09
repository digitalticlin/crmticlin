
#!/bin/bash

# Monitor para verificar se o Protocol error foi eliminado
echo "📊 MONITOR PROTOCOL ERROR - Verificação Contínua"
echo "==============================================="

VPS_IP="31.97.24.222"
PORTA="3002"
TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3"

echo "🎯 Objetivo: Verificar se 'Protocol error (Network.setUserAgentOverride)' foi eliminado"
echo "📅 Data: $(date)"

# Função para verificar logs por Protocol error
check_protocol_errors() {
    echo ""
    echo "🔍 Verificando logs por Protocol errors..."
    
    protocol_errors=$(pm2 logs whatsapp-main-3002 --lines 100 | grep -i "Protocol error.*setUserAgentOverride" | wc -l)
    
    if [ $protocol_errors -eq 0 ]; then
        echo "✅ SUCESSO: Nenhum Protocol error encontrado nos logs!"
    else
        echo "❌ FALHA: Encontrados $protocol_errors Protocol errors nos logs"
        echo "📋 Últimos erros:"
        pm2 logs whatsapp-main-3002 --lines 50 | grep -i "Protocol error.*setUserAgentOverride" | tail -5
    fi
    
    return $protocol_errors
}

# Função para testar criação de instância
test_instance_creation() {
    echo ""
    echo "🧪 Testando criação de instância..."
    
    TEST_INSTANCE="monitor_test_$(date +%s)"
    
    create_response=$(curl -s -X POST http://$VPS_IP:$PORTA/instance/create \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"instanceId\":\"$TEST_INSTANCE\",\"sessionName\":\"$TEST_INSTANCE\"}")
    
    create_success=$(echo "$create_response" | jq -r '.success' 2>/dev/null)
    
    if [ "$create_success" = "true" ]; then
        echo "✅ Instância criada com sucesso"
        
        # Aguardar e verificar status
        echo "⏳ Aguardando 45s para verificar status..."
        sleep 45
        
        status_response=$(curl -s http://$VPS_IP:$PORTA/instance/$TEST_INSTANCE/status \
            -H "Authorization: Bearer $TOKEN")
        
        status=$(echo "$status_response" | jq -r '.status' 2>/dev/null)
        error=$(echo "$status_response" | jq -r '.error' 2>/dev/null)
        
        echo "📋 Status final: $status"
        
        if [ "$error" != "null" ] && [ "$error" != "" ]; then
            if echo "$error" | grep -i "Protocol error.*setUserAgentOverride"; then
                echo "❌ FALHA: Protocol error ainda ocorre!"
                echo "📋 Erro: $error"
                
                # Limpar instância
                curl -s -X DELETE http://$VPS_IP:$PORTA/instance/$TEST_INSTANCE \
                    -H "Authorization: Bearer $TOKEN" > /dev/null
                
                return 1
            else
                echo "⚠️ Outro tipo de erro: $error"
            fi
        fi
        
        if [ "$status" = "ready" ] || [ "$status" = "qr_ready" ]; then
            echo "✅ SUCESSO: Instância funcionando sem Protocol error!"
        else
            echo "⚠️ Status: $status (verificar se é normal)"
        fi
        
        # Limpar instância
        curl -s -X DELETE http://$VPS_IP:$PORTA/instance/$TEST_INSTANCE \
            -H "Authorization: Bearer $TOKEN" > /dev/null
        
        return 0
    else
        echo "❌ Falha ao criar instância para teste"
        return 1
    fi
}

# Verificar se servidor está rodando
echo "🔍 Verificando se servidor está ativo..."
health_response=$(curl -s http://$VPS_IP:$PORTA/health)
server_success=$(echo "$health_response" | jq -r '.success' 2>/dev/null)

if [ "$server_success" != "true" ]; then
    echo "❌ Servidor não está respondendo adequadamente"
    echo "📋 Response: $health_response"
    exit 1
fi

echo "✅ Servidor ativo - versão: $(echo "$health_response" | jq -r '.version' 2>/dev/null)"

# Executar verificações
echo ""
echo "🔍 VERIFICAÇÃO 1: LOGS HISTÓRICOS"
echo "================================="
check_protocol_errors
logs_clean=$?

echo ""
echo "🔍 VERIFICAÇÃO 2: TESTE DE CRIAÇÃO"
echo "=================================="
test_instance_creation
creation_test=$?

echo ""
echo "🔍 VERIFICAÇÃO 3: DEEP FIX LOG"
echo "============================="
if [ -f "/tmp/whatsapp-deep-fix.log" ]; then
    echo "📋 Últimas entradas do deep fix log:"
    tail -10 /tmp/whatsapp-deep-fix.log 2>/dev/null || echo "Log vazio"
else
    echo "⚠️ Deep fix log não encontrado"
fi

# Resultado final
echo ""
echo "📊 RESULTADO FINAL DA VERIFICAÇÃO"
echo "================================="

if [ $logs_clean -eq 0 ] && [ $creation_test -eq 0 ]; then
    echo "🎉 SUCESSO TOTAL: PROTOCOL ERROR ELIMINADO!"
    echo "✅ Logs limpos - sem Protocol errors"
    echo "✅ Criação de instância funcionando"
    echo "✅ Sistema operacional e estável"
    echo ""
    echo "🚀 PRÓXIMA AÇÃO: Sistema pronto para produção!"
    exit 0
else
    echo "❌ AINDA HÁ PROBLEMAS:"
    
    if [ $logs_clean -ne 0 ]; then
        echo "   ❌ Protocol errors ainda aparecem nos logs"
    fi
    
    if [ $creation_test -ne 0 ]; then
        echo "   ❌ Teste de criação falhou ou com errors"
    fi
    
    echo ""
    echo "🔧 PRÓXIMA AÇÃO: Executar debug adicional"
    echo "   1. Verificar: pm2 logs whatsapp-main-3002"
    echo "   2. Verificar: tail -f /tmp/whatsapp-deep-fix.log"
    echo "   3. Considerar aplicar patch adicional"
    exit 1
fi

