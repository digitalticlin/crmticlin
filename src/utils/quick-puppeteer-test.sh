
#!/bin/bash

# Script de teste rápido para verificar se a correção funcionou
echo "🧪 TESTE RÁPIDO: Correção Puppeteer"
echo "==================================="

echo "1. Verificando status do servidor..."
curl -s http://localhost:3002/health | jq '{version, puppeteerFixed, puppeteerConfig, chromePath}'

echo ""
echo "2. Testando criação de instância de teste..."
curl -s -X POST http://localhost:3002/instance/create \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" \
  -H "Content-Type: application/json" \
  -d '{"instanceId":"teste_puppeteer","sessionName":"teste_puppeteer"}' | jq '.success, .message'

echo ""
echo "3. Aguardando 10s para QR Code..."
sleep 10

echo ""
echo "4. Verificando se QR Code foi gerado..."
curl -s http://localhost:3002/instance/teste_puppeteer/qr \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" | jq '{success, hasQrCode: (.qrCode != null)}'

echo ""
echo "5. Limpando instância de teste..."
curl -s -X DELETE http://localhost:3002/instance/teste_puppeteer \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" | jq '.success'

echo ""
echo "6. Verificando logs do PM2..."
pm2 logs whatsapp-main-3002 --lines 10

echo ""
echo "✅ Teste concluído!"
echo "Se 'puppeteerFixed: true' e 'hasQrCode: true', a correção funcionou!"
