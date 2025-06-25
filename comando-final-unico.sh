#!/bin/bash

echo "🚀 CORREÇÃO FINAL E TESTE - COMANDO ÚNICO"
echo "========================================="

# 1. Aplicar correção final
echo "🔧 Aplicando correção final..."
node correcao-final-definitiva.js

# 2. Reiniciar servidor
echo "🔄 Reiniciando servidor..."
pm2 restart whatsapp-server
sleep 10

# 3. Verificar status
echo "📊 Status:"
pm2 status whatsapp-server

# 4. Recriar instância
echo "🔗 Recriando instância..."
curl -X POST http://localhost:3002/instance/create \
  -H "Content-Type: application/json" \
  -d '{"instanceId": "contatoluizantoniooliveira", "createdByUserId": "user123"}'
echo ""

# 5. Aguardar conexão
echo "⏳ Aguardando conexão (30s)..."
sleep 30

# 6. TESTE FINAL
echo "🎯 TESTE FINAL DE IMPORTAÇÃO:"
echo "============================="
curl -X POST http://localhost:3002/instance/contatoluizantoniooliveira/import-history \
  -H "Content-Type: application/json" \
  -d '{"importType": "both", "batchSize": 10, "lastSyncTimestamp": null}' | jq '.'

echo ""
echo "📜 Logs recentes:"
pm2 logs whatsapp-server --lines 10 --nostream

echo ""
echo "✅ TESTE CONCLUÍDO!" 