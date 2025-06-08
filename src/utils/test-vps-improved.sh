
#!/bin/bash

echo "🧪 TESTE MELHORADO VPS - Criação e QR Code"
echo "==========================================="

INSTANCE_ID="test_qr_$(date +%s)"
echo "📝 Instance ID: $INSTANCE_ID"
echo ""

# 1. Criar instância
echo "1️⃣ Criando instância..."
CREATE_RESPONSE=$(curl -s -X POST http://31.97.24.222:3001/instance/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" \
  -d "{
    \"instanceId\": \"$INSTANCE_ID\",
    \"sessionName\": \"test_session_$(date +%s)\",
    \"webhookUrl\": \"https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/whatsapp_qr_service\"
  }")

echo "Resposta: $CREATE_RESPONSE"
echo ""

# 2. Aguardar e tentar múltiplas vezes
echo "2️⃣ Testando QR Code em intervalos..."
for i in {1..5}; do
  echo "   Tentativa $i/5 (após $(($i * 2)) segundos)..."
  sleep 2
  
  QR_RESPONSE=$(curl -s -X GET "http://31.97.24.222:3001/instance/$INSTANCE_ID/qr" \
    -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3")
  
  echo "   QR Response: $QR_RESPONSE"
  
  # Verificar se tem QR Code
  if echo "$QR_RESPONSE" | grep -q '"qrCode"'; then
    echo "   ✅ QR Code encontrado!"
    break
  elif echo "$QR_RESPONSE" | grep -q '"success":false'; then
    echo "   ⏳ QR Code ainda não disponível..."
  else
    echo "   ❌ Resposta inesperada"
  fi
  echo ""
done

# 3. Verificar status final
echo "3️⃣ Status final da instância:"
STATUS_RESPONSE=$(curl -s -X GET "http://31.97.24.222:3001/instance/$INSTANCE_ID/status" \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3")

echo "Status: $STATUS_RESPONSE"
echo ""

# 4. Listar todas as instâncias
echo "4️⃣ Listando todas as instâncias:"
LIST_RESPONSE=$(curl -s -X GET "http://31.97.24.222:3001/instances" \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3")

echo "Instâncias: $LIST_RESPONSE"
echo ""

# 5. Limpar teste
echo "5️⃣ Limpando teste..."
DELETE_RESPONSE=$(curl -s -X DELETE "http://31.97.24.222:3001/instance/$INSTANCE_ID" \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3")

echo "Delete: $DELETE_RESPONSE"
echo ""
echo "🏁 Teste concluído!"
