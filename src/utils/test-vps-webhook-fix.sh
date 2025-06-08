
#!/bin/bash

echo "🔧 TESTE VPS - Correção do Webhook QR Code"
echo "========================================="

INSTANCE_ID="test_webhook_fix_$(date +%s)"
echo "📝 Instance ID: $INSTANCE_ID"
echo ""

# 1. Verificar status da VPS
echo "1️⃣ Verificando status da VPS..."
HEALTH_RESPONSE=$(curl -s -X GET http://31.97.24.222:3001/health \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3")

echo "Health Response: $HEALTH_RESPONSE"

# Verificar se tem a URL correta do webhook
if echo "$HEALTH_RESPONSE" | grep -q "whatsapp_qr_service"; then
  echo "✅ Webhook URL corrigida encontrada!"
else
  echo "❌ Webhook URL ainda incorreta"
fi
echo ""

# 2. Criar instância
echo "2️⃣ Criando instância..."
CREATE_RESPONSE=$(curl -s -X POST http://31.97.24.222:3001/instance/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" \
  -d "{
    \"instanceId\": \"$INSTANCE_ID\",
    \"sessionName\": \"test_session_$(date +%s)\",
    \"webhookUrl\": \"https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/whatsapp_qr_service\"
  }")

echo "Resposta criação: $CREATE_RESPONSE"
echo ""

# 3. Aguardar webhook ser enviado
echo "3️⃣ Aguardando webhook da VPS (10 segundos)..."
sleep 10

# 4. Verificar múltiplas vezes se QR Code foi gerado
echo "4️⃣ Testando QR Code em múltiplas tentativas..."
for i in {1..8}; do
  echo "   📱 Tentativa $i/8 (após $(($i * 3)) segundos total)..."
  sleep 3
  
  QR_RESPONSE=$(curl -s -X GET "http://31.97.24.222:3001/instance/$INSTANCE_ID/qr" \
    -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3")
  
  echo "   QR Response: $QR_RESPONSE"
  
  # Verificar se tem QR Code
  if echo "$QR_RESPONSE" | grep -q '"qrCode"'; then
    echo "   ✅ QR Code encontrado! Webhook funcionando!"
    break
  elif echo "$QR_RESPONSE" | grep -q '"success":false'; then
    echo "   ⏳ QR Code ainda não disponível..."
  else
    echo "   ❌ Resposta inesperada"
  fi
  
  # Verificar status da instância
  STATUS_RESPONSE=$(curl -s -X GET "http://31.97.24.222:3001/instance/$INSTANCE_ID/status" \
    -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3")
  
  echo "   📊 Status: $STATUS_RESPONSE"
  echo ""
done

# 5. Verificar logs da edge function
echo "5️⃣ ⚠️  IMPORTANTE: Verificar logs da edge function 'whatsapp_qr_service'"
echo "   Acesse: https://supabase.com/dashboard/project/kigyebrhfoljnydfipcr/functions/whatsapp_qr_service/logs"
echo ""

# 6. Limpar teste
echo "6️⃣ Limpando teste..."
DELETE_RESPONSE=$(curl -s -X DELETE "http://31.97.24.222:3001/instance/$INSTANCE_ID" \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3")

echo "Delete: $DELETE_RESPONSE"
echo ""

echo "🏁 Teste concluído!"
echo ""
echo "📋 CHECKLIST DE VERIFICAÇÃO:"
echo "   ✓ Health check mostra webhook_url correto?"
echo "   ✓ QR Code foi gerado na VPS?"
echo "   ✓ Webhook foi enviado para whatsapp_qr_service?"
echo "   ✓ Edge function processou o webhook?"
echo "   ✓ QR Code foi salvo no banco Supabase?"
