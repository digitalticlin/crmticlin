#!/bin/bash

# 🔧 FIX VPS SERVER CRASH - MÓDULO READ-MESSAGES-WORKER AUSENTE
# Corrige o erro MODULE_NOT_FOUND que está impedindo o servidor de iniciar

VPS_SERVER="root@vpswhatsapp.ticlin.com.br"
VPS_PATH="/root/whatsapp-server"

echo "🔧 CORREÇÃO VPS - ERRO MODULE_NOT_FOUND read-messages-worker"
echo "=========================================================="
echo ""

echo "📊 1. BACKUP DO SERVER.JS ATUAL"
echo "==============================="
ssh $VPS_SERVER "cd $VPS_PATH && cp server.js server.js.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup criado"

echo ""
echo "📊 2. APLICAR CORREÇÃO NO SERVER.JS"
echo "===================================="
ssh $VPS_SERVER "cd $VPS_PATH && 
# Comentar a importação problemática
sed -i 's/const ReadMessagesWorker = require/\/\/ const ReadMessagesWorker = require/' server.js

# Comentar a inicialização e criar stub
sed -i '/const readMessagesWorker = new ReadMessagesWorker/c\
// const readMessagesWorker = new ReadMessagesWorker(instances, webhookManager); // Temporariamente desabilitado\
const readMessagesWorker = {\
  markAsReadWhenOpenConversation: async () => ({ success: false, error: \"ReadMessagesWorker temporariamente desabilitado\" }),\
  markSpecificMessagesAsRead: async () => ({ success: false, error: \"ReadMessagesWorker temporariamente desabilitado\" }),\
  getQueueStats: () => ({ totalChats: 0, totalMessages: 0, chats: [] }),\
  clearQueue: () => ({ cleared: 0 })\
};' server.js

echo '✅ Correções aplicadas no server.js'
"

echo ""
echo "📊 3. VERIFICAR CORREÇÕES APLICADAS"
echo "===================================="
ssh $VPS_SERVER "cd $VPS_PATH && 
echo '🔍 Verificando se as correções foram aplicadas:'
echo '1. Importação comentada:'
grep -n 'ReadMessagesWorker.*require' server.js | head -2
echo ''
echo '2. Stub criado:'
grep -n 'ReadMessagesWorker temporariamente desabilitado' server.js | head -1
"

echo ""
echo "📊 4. PARAR SERVIDOR ATUAL"
echo "=========================="
ssh $VPS_SERVER "
echo '🛑 Parando whatsapp-server...'
pm2 stop whatsapp-server
pm2 delete whatsapp-server
echo '✅ Servidor parado'
"

echo ""
echo "📊 5. INICIAR SERVIDOR CORRIGIDO"
echo "================================="
ssh $VPS_SERVER "cd $VPS_PATH &&
echo '🚀 Iniciando servidor com correções...'
pm2 start server.js --name whatsapp-server --max-memory-restart 1000M
echo '✅ Servidor iniciado'
"

echo ""
echo "📊 6. VERIFICAR STATUS"
echo "======================"
ssh $VPS_SERVER "
echo '📋 Status PM2:'
pm2 status

echo ''
echo '🌐 Testando porta 3001:'
nc -zv localhost 3001 && echo '✅ Porta 3001 acessível' || echo '❌ Porta 3001 inacessível'

echo ''
echo '📊 Logs do servidor (últimas 10 linhas):'
pm2 logs whatsapp-server --lines 10 --nostream
"

echo ""
echo "📋 7. TESTE DE CONECTIVIDADE"
echo "============================"
ssh $VPS_SERVER "
echo '🌐 Testando health endpoint:'
curl -s http://localhost:3001/health | head -5 || echo '❌ Health check falhou'

echo ''
echo '🎯 Testando queue endpoint:'
curl -s -X POST http://localhost:3001/queue/add-message \
  -H 'Content-Type: application/json' \
  -d '{\"test\": \"true\"}' | head -5 || echo '❌ Queue endpoint falhou'
"

echo ""
echo "✅ CORREÇÃO CONCLUÍDA!"
echo "======================"
echo "🔧 Ações realizadas:"
echo "   1. Backup do server.js criado"
echo "   2. Importação ReadMessagesWorker comentada"
echo "   3. Stub funcional criado para evitar erros"
echo "   4. Servidor reiniciado com PM2"
echo "   5. Testes de conectividade realizados"
echo ""
echo "📝 PRÓXIMOS PASSOS:"
echo "   1. Teste o envio de mensagem via Edge Function"
echo "   2. Se funcionar, o problema está resolvido"
echo "   3. Implemente ReadMessagesWorker corretamente depois"
echo ""