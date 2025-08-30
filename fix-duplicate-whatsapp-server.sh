#!/bin/bash

# 🔧 CORRIGIR PROCESSOS DUPLICADOS DO WHATSAPP-SERVER
echo "🔧 CORRIGINDO PROCESSOS DUPLICADOS DO WHATSAPP-SERVER"
echo "Data: $(date)"
echo "================================================="

VPS_SERVER="root@vpswhatsapp"
VPS_PATH="~/whatsapp-server"

echo ""
echo "🔍 1. VERIFICANDO PROCESSOS DUPLICADOS"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📋 Status atual do PM2:'
pm2 status

echo ''
echo '🔍 Contando processos whatsapp-server:'
WHATSAPP_PROCESSES=\$(pm2 list | grep 'whatsapp-server' | wc -l)
echo \"Total de processos whatsapp-server: \$WHATSAPP_PROCESSES\"

if [ \"\$WHATSAPP_PROCESSES\" -gt 1 ]; then
    echo '❌ PROBLEMA: Múltiplos processos whatsapp-server detectados'
    echo '🔧 Iniciando correção...'
else
    echo '✅ OK: Apenas 1 processo whatsapp-server encontrado'
    exit 0
fi
"

echo ""
echo "🛑 2. PARANDO TODOS OS PROCESSOS WHATSAPP-SERVER"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🛑 Parando TODOS os processos whatsapp-server...'
pm2 delete whatsapp-server 2>/dev/null || true

echo '⏳ Aguardando 5 segundos...'
sleep 5

echo '📊 Status após limpeza:'
pm2 status
"

echo ""
echo "🚀 3. INICIANDO APENAS 1 PROCESSO PRINCIPAL"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🚀 Iniciando APENAS 1 processo whatsapp-server...'
pm2 start server.js --name whatsapp-server --time

echo '⏳ Aguardando 10 segundos para inicialização...'
sleep 10

echo '📊 Status final correto:'
pm2 status

echo ''
echo '🧪 Verificando funcionamento:'
curl -s http://localhost:3001/health | head -3 && echo '✅ Servidor principal OK' || echo '❌ Problema no servidor'
curl -s http://localhost:3001/queue-status | head -3 && echo '✅ Sistema de filas OK' || echo '❌ Problema nas filas'
"

echo ""
echo "📋 4. VERIFICAÇÃO FINAL DA ARQUITETURA"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🎯 ARQUITETURA FINAL CORRETA:'
echo ''

# Contar cada tipo de processo
WHATSAPP_COUNT=\$(pm2 list | grep -c 'whatsapp-server.*online')
MESSAGE_COUNT=\$(pm2 list | grep -c 'message-worker.*online')
WEBHOOK_COUNT=\$(pm2 list | grep -c 'webhook-worker.*online')

echo \"📱 Whatsapp-server: \$WHATSAPP_COUNT (deve ser 1)\"
echo \"📨 Message-worker: \$MESSAGE_COUNT (deve ser 1)\"
echo \"🔗 Webhook-worker: \$WEBHOOK_COUNT (deve ser 1)\"
echo \"📊 Total esperado: 3 processos\"

echo ''
if [ \"\$WHATSAPP_COUNT\" -eq 1 ] && [ \"\$MESSAGE_COUNT\" -eq 1 ] && [ \"\$WEBHOOK_COUNT\" -eq 1 ]; then
    echo '🎉 ✅ ARQUITETURA CORRETA!'
    echo '📊 1 processo principal + 2 workers = FORK + QUEUES funcionando'
else
    echo '⚠️ ARQUITETURA AINDA PRECISA DE AJUSTES'
fi
"

echo ""
echo "✅ CORREÇÃO DE PROCESSOS DUPLICADOS CONCLUÍDA!"
echo "================================================="
echo "🎯 Deve haver apenas 1 whatsapp-server + workers"