#!/bin/bash

echo "🚀 SCRIPT TESTE COMPLETO - CORREÇÃO E IMPORTAÇÃO"
echo "==============================================="

echo "📍 Executando em: $(pwd)"
echo "⏰ Iniciado em: $(date)"
echo ""

# 1. APLICAR CORREÇÃO
echo "🔧 1. Aplicando correção de extração..."
node fix-extracao-completa.js
echo ""

# 2. REINICIAR SERVIDOR
echo "🔄 2. Reiniciando servidor..."
pm2 restart whatsapp-server

# 3. AGUARDAR ESTABILIZAÇÃO
echo "⏳ 3. Aguardando estabilização (10s)..."
sleep 10

# 4. VERIFICAR STATUS
echo "📊 4. Verificando status do servidor..."
pm2 status whatsapp-server
echo ""

# 5. VERIFICAR PORTA
echo "🌐 5. Verificando se porta 3002 está respondendo..."
curl -s http://localhost:3002/status | head -3
echo ""

# 6. RECRIAR INSTÂNCIA
echo "🔗 6. Recriando instância..."
curl -X POST http://localhost:3002/instance/create \
  -H "Content-Type: application/json" \
  -d '{"instanceId": "contatoluizantoniooliveira", "createdByUserId": "user123"}'
echo ""

# 7. AGUARDAR CONEXÃO
echo "⏳ 7. Aguardando conexão (30s)..."
sleep 30

# 8. VERIFICAR INSTÂNCIA
echo "📱 8. Verificando instância criada..."
curl -s http://localhost:3002/instances | jq '.'
echo ""

# 9. TESTE DE IMPORTAÇÃO
echo "📥 9. EXECUTANDO TESTE DE IMPORTAÇÃO..."
echo "========================================="
curl -X POST http://localhost:3002/instance/contatoluizantoniooliveira/import-history \
  -H "Content-Type: application/json" \
  -d '{"importType": "both", "batchSize": 10, "lastSyncTimestamp": null}' | jq '.'
echo ""

# 10. LOGS DETALHADOS
echo "📜 10. Logs dos últimos 20 eventos..."
pm2 logs whatsapp-server --lines 20 --nostream

echo ""
echo "✅ TESTE COMPLETO FINALIZADO!"
echo "=============================="
echo ""
echo "🎯 RESULTADOS ESPERADOS:"
echo "- Instância: ready + connected"
echo "- Contatos extraídos: 2 (Lead-2287, Lead-2114)"  
echo "- Messages: Várias mensagens importadas"
echo "- Store: storeAvailable = true"
echo ""
echo "🔍 Se contatos = 0, verificar logs para debug" 