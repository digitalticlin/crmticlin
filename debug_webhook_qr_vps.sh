#!/bin/bash

# 🔍 SCRIPT DE DEBUG: Webhook QR HTTP 404
# Execute na VPS: bash debug_webhook_qr_vps.sh

echo "🔍 DEBUG WEBHOOK QR HTTP 404 - VPS WhatsApp"
echo "==========================================="

# 1. Verificar configuração do webhook no server.js
echo "📋 CONFIGURAÇÃO ATUAL DO WEBHOOK QR:"
echo "===================================="

# Extrair URL do webhook QR do ambiente
QR_WEBHOOK_URL=$(grep "QR_RECEIVER" /root/whatsapp-server/.env 2>/dev/null || echo "Não encontrado no .env")
echo "🔗 URL configurada no .env: $QR_WEBHOOK_URL"

# 2. Testar conectividade com o webhook
echo ""
echo "🌐 TESTE DE CONECTIVIDADE COM WEBHOOK:"
echo "====================================="

if [[ "$QR_WEBHOOK_URL" != "Não encontrado no .env" ]]; then
    echo "📡 Testando conectividade com: $QR_WEBHOOK_URL"
    
    # Teste básico de conectividade
    curl -v -X POST "$QR_WEBHOOK_URL" \
         -H "Content-Type: application/json" \
         -H "Authorization: Bearer test" \
         -d '{"test": "connectivity"}' \
         --connect-timeout 10 \
         --max-time 30 2>&1 | head -20
else
    echo "❌ URL do webhook não configurada no .env"
fi

# 3. Verificar se o endpoint existe no Supabase
echo ""
echo "🔍 VERIFICAÇÃO DA EDGE FUNCTION:"
echo "================================"

EXPECTED_URL="https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_qr_receiver"
echo "📍 URL esperada: $EXPECTED_URL"

echo "📡 Testando endpoint Supabase..."
curl -v -X POST "$EXPECTED_URL" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer test" \
     -d '{"test": "edge_function"}' \
     --connect-timeout 10 \
     --max-time 30 2>&1 | head -15

# 4. Verificar logs do servidor para ver tentativas de webhook
echo ""
echo "📋 LOGS DE TENTATIVAS DE WEBHOOK (últimas 20 linhas):"
echo "===================================================="
pm2 logs whatsapp-server --lines 20 --nostream | grep -i "webhook\|qr\|http"

# 5. Verificar se há QR codes sendo gerados
echo ""
echo "📱 INSTÂNCIAS GERANDO QR CODES:"
echo "==============================="
curl -s "http://localhost:3001/instances" 2>/dev/null | grep -o '"status":"waiting_qr"' | wc -l
echo "Instâncias aguardando QR: $(curl -s "http://localhost:3001/instances" 2>/dev/null | grep -o '"status":"waiting_qr"' | wc -l || echo "0")"

# 6. Testar geração manual de QR para debug
echo ""
echo "🧪 TESTE MANUAL DE GERAÇÃO QR (para debug):"
echo "==========================================="

# Criar instância de teste temporária
TEST_INSTANCE="debug_qr_test_$(date +%s)"
echo "🔧 Criando instância de teste: $TEST_INSTANCE"

curl -s -X POST "http://localhost:3001/instance/create" \
     -H "Content-Type: application/json" \
     -d "{\"instanceId\": \"$TEST_INSTANCE\", \"createdByUserId\": \"debug\"}" | head -10

sleep 2

# Tentar gerar QR
echo "📱 Gerando QR para teste..."
curl -s -X POST "http://localhost:3001/instance/$TEST_INSTANCE/qr" \
     -H "Content-Type: application/json" | head -10

# 7. Verificar variáveis de ambiente relacionadas ao webhook
echo ""
echo "🔧 VARIÁVEIS DE AMBIENTE RELACIONADAS:"
echo "====================================="
echo "QR_RECEIVER_WEBHOOK: $(printenv QR_RECEIVER_WEBHOOK || echo 'Não definida')"
echo "SUPABASE_PROJECT_ID: $(printenv SUPABASE_PROJECT_ID || echo 'Não definida')"

# 8. Limpar instância de teste
echo ""
echo "🧹 Limpando instância de teste..."
curl -s -X DELETE "http://localhost:3001/instance/$TEST_INSTANCE/delete" >/dev/null
rm -rf "/root/whatsapp-server/auth_info/$TEST_INSTANCE" 2>/dev/null

echo ""
echo "✅ DEBUG CONCLUÍDO!"
echo ""
echo "🔍 POSSÍVEIS CAUSAS DO HTTP 404:"
echo "1. Edge Function não deployada ou com erro"
echo "2. URL incorreta no webhook"
echo "3. Problema de autenticação Supabase"
echo "4. Timeout na requisição"
echo ""
echo "💡 PRÓXIMOS PASSOS:"
echo "- Verificar deploy da Edge Function webhook_qr_receiver"
echo "- Confirmar URL no Supabase Dashboard"
echo "- Testar Edge Function diretamente no Supabase"