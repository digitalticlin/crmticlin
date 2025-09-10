#!/bin/bash

# VERIFICAÇÃO DE WEBHOOKS SUPABASE
# Execute este script para testar se os webhooks estão funcionando

echo "🌐 VERIFICAÇÃO DE WEBHOOKS SUPABASE"
echo "==================================="
echo

# Configurações
SUPABASE_URL="https://rhjgagzstjzynvrakdyj.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTMxMDAsImV4cCI6MjA2NjA4OTEwMH0.kHDKEkZVALFEfvKWvJNH1Gkl_uEtJF7FiwOYqEVyeJI"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)

echo "📡 1. TESTANDO WEBHOOK QR RECEIVER"
echo "================================="
echo

echo "🚀 Enviando webhook QR para digitalticlin..."
curl -X POST "$SUPABASE_URL/functions/v1/webhook_qr_receiver" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -d '{
    "event": "qr.update",
    "instanceName": "digitalticlin",
    "data": {
      "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      "status": "qr_generated"
    },
    "timestamp": "'$TIMESTAMP'"
  }'
echo
echo

echo "📡 2. TESTANDO WEBHOOK AUTO SYNC"
echo "==============================="
echo

echo "🚀 Enviando webhook de conexão para digitalticlin..."
curl -X POST "$SUPABASE_URL/functions/v1/auto_whatsapp_sync" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -d '{
    "event": "connection.update",
    "instanceName": "digitalticlin",
    "data": {
      "status": "connected",
      "phone": "5511999999999",
      "profileName": "Digital Ticlin Test"
    },
    "timestamp": "'$TIMESTAMP'"
  }'
echo
echo

echo "📡 3. TESTANDO WEBHOOK MESSAGES"
echo "=============================="
echo

echo "🚀 Enviando webhook de mensagem para digitalticlin..."
curl -X POST "$SUPABASE_URL/functions/v1/webhook_whatsapp_web" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -d '{
    "event": "messages.upsert",
    "instanceName": "digitalticlin",
    "data": {
      "messages": [{
        "key": {
          "id": "test-message-123",
          "remoteJid": "5511999999999@s.whatsapp.net",
          "fromMe": true
        },
        "message": {
          "conversation": "Teste de webhook de mensagem"
        },
        "messageTimestamp": "'$(date +%s)'"
      }]
    },
    "timestamp": "'$TIMESTAMP'"
  }'
echo
echo

echo "📊 4. VERIFICANDO STATUS DAS INSTÂNCIAS NO SUPABASE"
echo "=================================================="
echo

echo "🔍 Consultando instâncias no banco..."
curl -X GET "$SUPABASE_URL/rest/v1/whatsapp_instances?select=*&instance_name=eq.digitalticlin" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json"
echo
echo

echo "📝 5. VERIFICANDO LOGS DAS EDGE FUNCTIONS"
echo "========================================="
echo

echo "🔍 Para verificar logs das Edge Functions:"
echo "1. Acesse o dashboard do Supabase"
echo "2. Vá em Functions > Edge Functions"
echo "3. Clique em cada função para ver os logs:"
echo "   - webhook_qr_receiver"
echo "   - auto_whatsapp_sync"
echo "   - webhook_whatsapp_web"
echo

echo "📋 6. COMANDOS PARA INVESTIGAR MAIS"
echo "==================================="
echo

echo "🔍 Verificar se instância existe no banco:"
echo "curl -X GET '$SUPABASE_URL/rest/v1/whatsapp_instances?select=*&instance_name=eq.digitalticlin' \\"
echo "  -H 'Authorization: Bearer $ANON_KEY' \\"
echo "  -H 'apikey: $ANON_KEY'"
echo

echo "🔍 Verificar mensagens recentes:"
echo "curl -X GET '$SUPABASE_URL/rest/v1/whatsapp_messages?select=*&instance_name=eq.digitalticlin&order=created_at.desc&limit=5' \\"
echo "  -H 'Authorization: Bearer $ANON_KEY' \\"
echo "  -H 'apikey: $ANON_KEY'"
echo

echo "🔍 Verificar logs de webhook:"
echo "curl -X GET '$SUPABASE_URL/rest/v1/webhook_logs?select=*&instance_name=eq.digitalticlin&order=created_at.desc&limit=10' \\"
echo "  -H 'Authorization: Bearer $ANON_KEY' \\"
echo "  -H 'apikey: $ANON_KEY'"
echo

echo "🎯 RESULTADO ESPERADO"
echo "===================="
echo "✅ Webhooks QR: Deve retornar HTTP 200"
echo "✅ Webhooks Sync: Deve retornar HTTP 200"
echo "✅ Webhooks Messages: Deve retornar HTTP 200"
echo "✅ Instância digitalticlin: Deve aparecer no banco"
echo "✅ Status: Deve estar atualizado"
echo

echo "🚨 SE HOUVER PROBLEMAS:"
echo "======================"
echo "❌ HTTP 404: Instância não encontrada no banco"
echo "❌ HTTP 500: Erro interno na Edge Function"
echo "❌ Timeout: Problema de conectividade"
echo "❌ Sem dados: Webhooks não estão chegando"
echo

echo "📋 PRÓXIMOS PASSOS:"
echo "=================="
echo "1. Execute este script"
echo "2. Verifique se todos os webhooks retornam HTTP 200"
echo "3. Confirme se a instância aparece no banco"
echo "4. Teste criação real de instância na VPS"
echo "5. Monitore logs das Edge Functions" 