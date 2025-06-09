
#!/bin/bash

# Teste rápido para verificar se as correções funcionaram
echo "🧪 TESTE RÁPIDO - Verificando correções"
echo "======================================"

echo "1. Status do PM2:"
pm2 status

echo ""
echo "2. Health check:"
curl -s http://localhost:3002/health | jq '{success, loopFixed, scopeFixed, version}'

echo ""
echo "3. Status completo:"
curl -s http://localhost:3002/status | jq '{success, fixes, uptime}'

echo ""
echo "4. Teste de criação de instância:"
curl -s -X POST http://localhost:3002/instance/create \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" \
  -H "Content-Type: application/json" \
  -d '{"instanceId":"teste_correcao","sessionName":"teste_correcao"}' | jq '{success, message}'

echo ""
echo "5. Verificando logs recentes (últimas 5 linhas):"
pm2 logs whatsapp-main-3002 --lines 5

echo ""
echo "✅ Teste concluído!"

