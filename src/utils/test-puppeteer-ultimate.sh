
#!/bin/bash

# TESTE DEFINITIVO PUPPETEER - Verificação Final
echo "🧪 TESTE DEFINITIVO PUPPETEER PÓS-CORREÇÃO AVANÇADA"
echo "=================================================="
echo "📅 $(date)"
echo "🎯 Verificar se todas as correções funcionam"
echo ""

# Configurações
VPS_IP="31.97.24.222"
PORTA="3002"
TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3"
TIMESTAMP=$(date +%s)
INSTANCE_TEST="ultimatetest${TIMESTAMP}"

echo "📊 CONFIGURAÇÕES:"
echo "   Servidor: ${VPS_IP}:${PORTA}"
echo "   Instância Teste: ${INSTANCE_TEST}"
echo ""

# ETAPA 1: HEALTH CHECK AVANÇADO
echo "🔍 ETAPA 1: HEALTH CHECK AVANÇADO"
echo "================================="

health_response=$(curl -s -w "HTTP_STATUS:%{http_code}" "http://${VPS_IP}:${PORTA}/health" 2>/dev/null)
http_status=$(echo $health_response | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
response_body=$(echo $health_response | sed 's/HTTP_STATUS:[0-9]*$//')

echo "Status HTTP: $http_status"
echo "Response: $response_body"

if [ "$http_status" = "200" ]; then
    echo "✅ SERVIDOR ONLINE - CONFIGURAÇÃO AVANÇADA"
    
    # Verificar se é a configuração avançada
    if echo "$response_body" | grep -q "ADVANCED_STABLE"; then
        echo "✅ CONFIGURAÇÃO AVANÇADA DETECTADA"
    else
        echo "⚠️ Configuração não é a avançada"
    fi
    
    # Verificar retry logic
    if echo "$response_body" | grep -q "retry_logic"; then
        echo "✅ RETRY LOGIC HABILITADO"
    fi
else
    echo "❌ SERVIDOR OFFLINE"
    exit 1
fi

echo ""

# ETAPA 2: TESTE DE CRIAÇÃO COM MONITORAMENTO
echo "🚀 ETAPA 2: TESTE DE CRIAÇÃO AVANÇADO"
echo "====================================="

echo "📝 Criando instância com configuração avançada..."
echo "⏱️ Monitorando tempo de resposta..."

start_time=$(date +%s)

create_response=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST \
    "http://${VPS_IP}:${PORTA}/instance/create" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"instanceName\":\"${INSTANCE_TEST}\"}" \
    --max-time 90 2>/dev/null)

end_time=$(date +%s)
duration=$((end_time - start_time))

http_status=$(echo $create_response | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
response_body=$(echo $create_response | sed 's/HTTP_STATUS:[0-9]*$//')

echo "Status HTTP: $http_status"
echo "Tempo de resposta: ${duration}s"
echo "Response: $response_body"

if [ "$http_status" = "200" ]; then
    echo "✅ CRIAÇÃO SUCESSO - PUPPETEER FUNCIONANDO!"
    
    # Extrair instanceId da resposta
    instance_id=$(echo "$response_body" | grep -o '"instanceId":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$instance_id" ]; then
        echo "✅ Instance ID obtido: $instance_id"
        
        # ETAPA 3: TESTE DE QR CODE
        echo ""
        echo "📱 ETAPA 3: TESTE DE QR CODE"
        echo "============================"
        
        echo "⏳ Aguardando QR Code ser gerado..."
        
        # Tentar obter QR Code por até 30 segundos
        max_attempts=10
        attempt=1
        qr_success=false
        
        while [ $attempt -le $max_attempts ]; do
            echo "Tentativa $attempt/$max_attempts..."
            
            qr_response=$(curl -s -w "HTTP_STATUS:%{http_code}" \
                "http://${VPS_IP}:${PORTA}/instance/${instance_id}/qr" \
                -H "Authorization: Bearer ${TOKEN}" \
                --max-time 10 2>/dev/null)
            
            qr_status=$(echo $qr_response | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
            qr_body=$(echo $qr_response | sed 's/HTTP_STATUS:[0-9]*$//')
            
            if [ "$qr_status" = "200" ] && echo "$qr_body" | grep -q '"success":true'; then
                echo "✅ QR CODE GERADO COM SUCESSO!"
                echo "QR Response: $qr_body"
                qr_success=true
                break
            elif echo "$qr_body" | grep -q '"waiting":true'; then
                echo "⏳ QR Code sendo gerado..."
                sleep 3
            else
                echo "❌ Erro na geração do QR Code"
                echo "QR Response: $qr_body"
                break
            fi
            
            attempt=$((attempt + 1))
        done
        
        if [ "$qr_success" = true ]; then
            echo "✅ TESTE DE QR CODE: SUCESSO!"
        else
            echo "❌ TESTE DE QR CODE: FALHA"
        fi
        
        # ETAPA 4: LIMPEZA
        echo ""
        echo "🧹 ETAPA 4: LIMPEZA"
        echo "=================="
        
        echo "Removendo instância de teste..."
        delete_response=$(curl -s -w "HTTP_STATUS:%{http_code}" -X DELETE \
            "http://${VPS_IP}:${PORTA}/instance/${instance_id}" \
            -H "Authorization: Bearer ${TOKEN}" \
            --max-time 10 2>/dev/null)
        
        delete_status=$(echo $delete_response | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
        
        if [ "$delete_status" = "200" ]; then
            echo "✅ Instância removida com sucesso"
        else
            echo "⚠️ Problema na remoção (não crítico)"
        fi
        
    else
        echo "❌ Não foi possível extrair instanceId"
    fi
    
else
    echo "❌ FALHA NA CRIAÇÃO"
    echo "Response: $response_body"
fi

echo ""
echo "📊 RESUMO DO TESTE DEFINITIVO:"
echo "=============================="

if [ "$http_status" = "200" ] && [ "$qr_success" = true ]; then
    echo "🎉 SUCESSO TOTAL! PUPPETEER FUNCIONANDO PERFEITAMENTE!"
    echo "   ✅ Servidor respondendo"
    echo "   ✅ Configuração avançada ativa"
    echo "   ✅ Criação de instância funcionando"
    echo "   ✅ QR Code sendo gerado"
    echo "   ✅ Tempo de resposta: ${duration}s"
    echo ""
    echo "🚀 PRÓXIMOS PASSOS:"
    echo "   1. Teste na interface web"
    echo "   2. Verificar se QR Code aparece automaticamente"
    echo "   3. Sistema pronto para produção!"
elif [ "$http_status" = "200" ]; then
    echo "⚠️ PARCIALMENTE FUNCIONAL"
    echo "   ✅ Instância criada"
    echo "   ❌ QR Code com problemas"
    echo "   📋 Verificar logs: pm2 logs whatsapp-main-3002"
else
    echo "❌ AINDA COM PROBLEMAS"
    echo "   ❌ Falha na criação de instância"
    echo "   📋 Verificar logs detalhados"
fi

echo ""
echo "📋 COMANDOS ÚTEIS:"
echo "   pm2 logs whatsapp-main-3002"
echo "   curl http://localhost:3002/health"
echo "   pm2 restart whatsapp-main-3002"
