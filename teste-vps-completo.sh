#!/bin/bash

# TESTE COMPLETO VPS - Investigação de Estabilidade + Teste de Webhooks
# Execute este script diretamente na VPS

echo "🔍 TESTE COMPLETO VPS - Investigação + Webhooks"
echo "==============================================="
echo

# 1. INVESTIGAÇÃO DE ESTABILIDADE
echo "📊 1. INVESTIGAÇÃO DE ESTABILIDADE"
echo "=================================="
echo

echo "🕐 Status atual do PM2:"
pm2 status whatsapp-server
echo

echo "📈 Detalhes do processo:"
pm2 show whatsapp-server | grep -E "(uptime|restarts|status|memory|cpu)"
echo

echo "📝 Logs recentes (últimas 15 linhas):"
pm2 logs whatsapp-server --lines 15
echo

echo "🔍 Instâncias ativas no servidor:"
curl -s http://localhost:3001/instances | jq '.' 2>/dev/null || curl -s http://localhost:3001/instances
echo

echo "🗂️ Arquivos de sessão existentes:"
ls -la /root/whatsapp-server/auth_info/ 2>/dev/null || echo "Diretório não existe"
echo

# 2. TESTE DE WEBHOOK COM DIGITALTICLIN
echo "📡 2. TESTE DE WEBHOOK COM DIGITALTICLIN"
echo "======================================="
echo

echo "🚀 Criando/Testando instância digitalticlin..."
curl -X POST http://localhost:3001/instance/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer bJyn3eUPFTRFNCxxLNd8KH5bI4Zg7bpUk7ADO6kXf49026a1" \
  -d '{
    "instanceId": "digitalticlin",
    "webhookUrl": "https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_whatsapp_web"
  }'
echo
echo

echo "⏳ Aguardando 5 segundos para geração do QR..."
sleep 5
echo

echo "📱 Verificando QR Code:"
curl -s http://localhost:3001/instance/digitalticlin/qr \
  -H "Authorization: Bearer bJyn3eUPFTRFNCxxLNd8KH5bI4Zg7bpUk7ADO6kXf49026a1" | jq '.'
echo

echo "🔍 Status da instância:"
curl -s http://localhost:3001/instance/digitalticlin/status \
  -H "Authorization: Bearer bJyn3eUPFTRFNCxxLNd8KH5bI4Zg7bpUk7ADO6kXf49026a1" | jq '.'
echo

echo "📊 Lista de instâncias após criação:"
curl -s http://localhost:3001/instances | jq '.'
echo

# 3. TESTE DE ENVIO DE MENSAGEM (se conectada)
echo "💬 3. TESTE DE ENVIO DE MENSAGEM"
echo "==============================="
echo

echo "📤 Tentando enviar mensagem teste..."
curl -X POST http://localhost:3001/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer bJyn3eUPFTRFNCxxLNd8KH5bI4Zg7bpUk7ADO6kXf49026a1" \
  -d '{
    "instanceId": "digitalticlin",
    "phone": "5511999999999",
    "message": "Teste de webhook - Status da instância"
  }'
echo
echo

# 4. MONITORAMENTO DE LOGS EM TEMPO REAL
echo "📊 4. MONITORAMENTO DE LOGS"
echo "=========================="
echo

echo "📝 Últimos logs (incluindo webhooks):"
pm2 logs whatsapp-server --lines 20 | grep -E "(webhook|digitalticlin|QR|connection|sync)"
echo

echo "🔍 Verificando se há loops infinitos:"
pm2 logs whatsapp-server --lines 30 | grep -E "(reconexão|reconnect|close|connecting)" | tail -10
echo

# 5. ANÁLISE DE SAÚDE DO SERVIDOR
echo "🏥 5. ANÁLISE DE SAÚDE DO SERVIDOR"
echo "================================="
echo

echo "📊 Health Check detalhado:"
curl -s http://localhost:3001/health | jq '.'
echo

echo "🔧 Diagnóstico da instância digitalticlin:"
curl -s http://localhost:3001/instance/digitalticlin/debug-data \
  -H "Authorization: Bearer bJyn3eUPFTRFNCxxLNd8KH5bI4Zg7bpUk7ADO6kXf49026a1" | jq '.'
echo

# 6. VERIFICAÇÃO DE WEBHOOKS NAS EDGES
echo "🌐 6. VERIFICAÇÃO DE WEBHOOKS NAS EDGES"
echo "======================================"
echo

echo "📡 Testando webhook QR Receiver:"
curl -X POST https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_qr_receiver \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTMxMDAsImV4cCI6MjA2NjA4OTEwMH0.kHDKEkZVALFEfvKWvJNH1Gkl_uEtJF7FiwOYqEVyeJI" \
  -d '{
    "event": "qr.update",
    "instanceName": "digitalticlin",
    "data": {"qrCode": "test-qr-code"},
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
  }'
echo
echo

echo "📡 Testando webhook Auto Sync:"
curl -X POST https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/auto_whatsapp_sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTMxMDAsImV4cCI6MjA2NjA4OTEwMH0.kHDKEkZVALFEfvKWvJNH1Gkl_uEtJF7FiwOYqEVyeJI" \
  -d '{
    "event": "connection.update",
    "instanceName": "digitalticlin",
    "data": {"status": "connected", "phone": "5511999999999"},
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
  }'
echo
echo

echo "🎯 CONCLUSÃO DO TESTE"
echo "===================="
echo "✅ Investigação de estabilidade: COMPLETA"
echo "✅ Teste de webhook digitalticlin: COMPLETO"
echo "✅ Verificação de endpoints: COMPLETA"
echo
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Verifique se há restarts adicionais após este teste"
echo "2. Observe se os webhooks chegaram no Supabase"
echo "3. Confirme se a instância digitalticlin está funcionando"
echo
echo "🔄 Para monitorar em tempo real:"
echo "   pm2 logs whatsapp-server --lines 0"
echo
echo "📊 Para verificar estabilidade:"
echo "   watch -n 2 'pm2 status whatsapp-server'" 