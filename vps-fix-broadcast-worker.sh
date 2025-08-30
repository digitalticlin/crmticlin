#!/bin/bash

# 🔧 CORRIGIR BROADCAST WORKER EM ERRO
echo "🔧 CORRIGINDO BROADCAST WORKER EM ERRO"
echo "Data: $(date)"
echo "================================================="

VPS_SERVER="root@vpswhatsapp"
VPS_PATH="~/whatsapp-server"

echo ""
echo "🔍 1. DIAGNOSTICANDO ERRO DO BROADCAST WORKER"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📋 Status atual:'
pm2 status | grep broadcast-worker

echo ''
echo '📋 Logs do broadcast-worker:'
pm2 logs broadcast-worker --lines 20 --nostream
"

echo ""
echo "🛑 2. PARANDO E LIMPANDO BROADCAST WORKER"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🛑 Parando broadcast-worker...'
pm2 delete broadcast-worker 2>/dev/null || true

echo '⏳ Aguardando 3 segundos...'
sleep 3

echo '📊 Status após limpeza:'
pm2 status
"

echo ""
echo "🔧 3. VERIFICANDO DEPENDÊNCIAS E ARQUIVO"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📝 Verificando se arquivo existe:'
ls -la src/workers/broadcast-worker.js

echo '📝 Verificando primeira linha do arquivo:'
head -5 src/workers/broadcast-worker.js

echo '📝 Testando sintaxe Node.js:'
node -c src/workers/broadcast-worker.js && echo '✅ Sintaxe OK' || echo '❌ Erro de sintaxe'
"

echo ""
echo "🚀 4. REINICIANDO BROADCAST WORKER"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🚀 Reiniciando broadcast-worker...'
pm2 start ecosystem.config.js --only broadcast-worker

echo '⏳ Aguardando 5 segundos...'
sleep 5

echo '📊 Status final:'
pm2 status

echo ''
echo '🧪 Testando broadcast worker:'
curl -s http://localhost:3004/health | head -3 && echo '✅ Broadcast Worker OK' || echo '❌ Ainda com problema'

echo ''
echo '📋 Se ainda houver erro, verificar logs:'
echo 'pm2 logs broadcast-worker --lines 10'
"

echo ""
echo "✅ DIAGNÓSTICO E CORREÇÃO BROADCAST WORKER CONCLUÍDO!"
echo "================================================="