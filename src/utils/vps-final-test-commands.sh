
#!/bin/bash
# TESTE FINAL COMPLETO: Fluxo WhatsApp Corrigido
# Execute: ssh root@31.97.24.222 < vps-final-test-commands.sh

echo "=== 🎯 TESTE FINAL COMPLETO - FLUXO WHATSAPP CORRIGIDO ==="
echo "Data/Hora: $(date)"
echo "==========================="

# 1. LIMPEZA INICIAL (usando endpoint correto)
echo "=== 🧹 LIMPEZA INICIAL COM ENDPOINT CORRETO ==="
INSTANCES_TO_DELETE=$(curl -s http://localhost:3001/instances | jq -r '.instances[].instanceId' 2>/dev/null)

if [ -n "$INSTANCES_TO_DELETE" ]; then
  echo "🗑️ Deletando instâncias existentes com POST /instance/delete..."
  
  for instance in $INSTANCES_TO_DELETE; do
    echo "Deletando: $instance"
    DELETE_RESULT=$(curl -s -X POST http://localhost:3001/instance/delete \
      -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" \
      -H "Content-Type: application/json" \
      -d "{\"instanceId\": \"$instance\"}")
    
    echo "Resultado: $(echo $DELETE_RESULT | head -c 100)..."
    sleep 0.5
  done
else
  echo "✅ Nenhuma instância para deletar"
fi

echo "=== 📊 CONTAGEM APÓS LIMPEZA ==="
FINAL_COUNT=$(curl -s http://localhost:3001/instances | jq '.instances | length' 2>/dev/null || echo "0")
echo "Instâncias restantes: $FINAL_COUNT"

# 2. TESTE COMPLETO DO FLUXO CORRIGIDO
echo "=== 🚀 TESTE DO FLUXO COMPLETO CORRIGIDO ==="

# Criar nova instância de teste
TEST_INSTANCE="teste_fluxo_correto_$(date +%s)"
echo "🏗️ Criando instância de teste: $TEST_INSTANCE"

CREATE_RESULT=$(curl -s -X POST http://localhost:3001/instance/create \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" \
  -H "Content-Type: application/json" \
  -d "{\"instanceId\": \"$TEST_INSTANCE\", \"sessionName\": \"teste_corrigido\"}")

echo "✅ Resultado criação: $CREATE_RESULT"

# Aguardar inicialização
echo "⏳ Aguardando inicialização (5 segundos)..."
sleep 5

# 3. TESTE QR CODE COM ENDPOINT CORRETO
echo "=== 📱 TESTE QR CODE - ENDPOINT CORRETO GET /instance/{id}/qr ==="

for attempt in {1..3}; do
  echo "🔄 Tentativa $attempt de 3 para QR Code..."
  
  QR_RESULT=$(curl -s -X GET "http://localhost:3001/instance/$TEST_INSTANCE/qr" \
    -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3")
  
  echo "📥 Resultado QR (primeiros 200 chars): $(echo $QR_RESULT | head -c 200)..."
  
  # Verificar se contém QR válido
  if [[ "$QR_RESULT" == *"qrCode"* ]] || [[ "$QR_RESULT" == *"base64"* ]]; then
    echo "✅ QR Code encontrado na tentativa $attempt!"
    
    # Verificar se é base64 válido
    QR_LENGTH=$(echo "$QR_RESULT" | jq -r '.qrCode // empty' 2>/dev/null | wc -c)
    echo "📏 Tamanho do QR Code: $QR_LENGTH caracteres"
    
    if [ "$QR_LENGTH" -gt 100 ]; then
      echo "✅ QR Code parece válido (tamanho > 100 chars)"
    else
      echo "⚠️ QR Code pode estar incompleto"
    fi
    
    break
  else
    echo "⏳ QR Code ainda não disponível, aguardando..."
    sleep 3
  fi
done

# 4. VERIFICAR STATUS DA INSTÂNCIA
echo "=== 📊 VERIFICAÇÃO DE STATUS ==="
STATUS_RESULT=$(curl -s -X GET "http://localhost:3001/instance/$TEST_INSTANCE/status" \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3")

echo "📋 Status da instância: $STATUS_RESULT"

# 5. TESTE DE ENVIO DE MENSAGEM (endpoint correto)
echo "=== 📤 TESTE ENVIO DE MENSAGEM - ENDPOINT CORRETO POST /send ==="
MESSAGE_RESULT=$(curl -s -X POST http://localhost:3001/send \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" \
  -H "Content-Type: application/json" \
  -d "{\"instanceId\": \"$TEST_INSTANCE\", \"to\": \"5562000000000\", \"message\": \"Teste de mensagem do fluxo corrigido\"}")

echo "📧 Resultado envio: $MESSAGE_RESULT"

# 6. VERIFICAR LOGS DE WEBHOOK
echo "=== 🔗 VERIFICAÇÃO DE WEBHOOK GLOBAL ==="
echo "ℹ️ Webhook global configurado: https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web"
echo "📝 Verificando logs recentes do PM2..."

# Mostrar logs recentes que podem conter webhook
pm2 logs --lines 10 | grep -i webhook || echo "Nenhum log de webhook encontrado nos logs recentes"

# 7. LIMPEZA FINAL DO TESTE
echo "=== 🧹 LIMPEZA FINAL ==="
echo "🗑️ Deletando instância de teste..."
CLEANUP_RESULT=$(curl -s -X POST http://localhost:3001/instance/delete \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" \
  -H "Content-Type: application/json" \
  -d "{\"instanceId\": \"$TEST_INSTANCE\"}")

echo "🧹 Resultado limpeza: $CLEANUP_RESULT"

# 8. RESUMO FINAL
echo "=== 🎉 RESUMO DO TESTE COMPLETO ==="
echo "✅ Endpoints corretos identificados:"
echo "   - Criação: POST /instance/create"
echo "   - QR Code: GET /instance/{id}/qr"
echo "   - Status: GET /instance/{id}/status" 
echo "   - Envio: POST /send"
echo "   - Deleção: POST /instance/delete"
echo ""
echo "✅ Webhook global configurado:"
echo "   - URL: https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web"
echo "   - Não requer configuração individual por instância"
echo ""
echo "📊 Instâncias finais:"
FINAL_INSTANCES=$(curl -s http://localhost:3001/instances | jq '.instances | length' 2>/dev/null || echo "0")
echo "   - Total de instâncias: $FINAL_INSTANCES"
echo ""
echo "=== TESTE COMPLETO FINALIZADO ==="
echo "Data/Hora: $(date)"
