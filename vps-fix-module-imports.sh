#!/bin/bash

# 🔧 CORRIGIR IMPORTS QUEBRADOS NO SERVIDOR VPS
echo "🔧 CORRIGINDO IMPORTS QUEBRADOS NO SERVIDOR VPS"
echo "Data: $(date)"
echo "================================================="

VPS_SERVER="root@vpswhatsapp"
VPS_PATH="~/whatsapp-server"

echo ""
echo "📝 1. REMOVENDO IMPORTS QUEBRADOS DO SERVER.JS"
echo "================================================="

ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔍 Verificando server.js atual...'
if [ -f server.js ]; then
    echo '✅ server.js encontrado'
    
    # Criar backup
    echo '💾 Criando backup...'
    cp server.js server.js.backup.\$(date +%Y%m%d_%H%M%S)
    
    # Remover linha problemática do ReadMessagesWorker
    echo '🗑️ Removendo import do ReadMessagesWorker...'
    sed -i '/read-messages-worker/d' server.js
    
    # Verificar se existem outras linhas problemáticas
    echo '🔍 Verificando outros imports problemáticos...'
    if grep -q 'ReadMessagesWorker' server.js; then
        sed -i '/ReadMessagesWorker/d' server.js
        echo '✅ Referências ao ReadMessagesWorker removidas'
    fi
    
    # Remover inicialização do worker quebrado
    if grep -q 'readMessagesWorker' server.js; then
        sed -i '/readMessagesWorker/d' server.js
        echo '✅ Inicialização do readMessagesWorker removida'
    fi
    
    echo '✅ Imports corrigidos!'
    
else
    echo '❌ server.js não encontrado!'
    exit 1
fi
"

echo ""
echo "🚀 2. REINICIANDO SERVIDOR"
echo "================================================="

ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔄 Parando processo atual...'
pm2 stop whatsapp-server 2>/dev/null || true
pm2 delete whatsapp-server 2>/dev/null || true

echo '⏳ Aguardando 3 segundos...'
sleep 3

echo '🚀 Iniciando servidor corrigido...'
pm2 start server.js --name whatsapp-server --time

echo '⏳ Aguardando 5 segundos para inicialização...'
sleep 5

echo '📊 Status do PM2:'
pm2 status

echo ''
echo '🧪 Testando servidor:'
curl -s http://localhost:3001/health | head -5 || echo '❌ Servidor ainda não responde'
"

echo ""
echo "📋 3. VERIFICAÇÃO FINAL"
echo "================================================="

ssh $VPS_SERVER "
cd $VPS_PATH

echo '📊 Status final:'
pm2 status

echo ''
echo '📋 Logs recentes (últimas 10 linhas):'
pm2 logs whatsapp-server --lines 10 --nostream | tail -10

echo ''
echo '🌐 Teste de conectividade:'
curl -s http://localhost:3001/health > /dev/null
if [ \$? -eq 0 ]; then
    echo '✅ SERVIDOR FUNCIONANDO!'
    echo '🔗 Health Check: curl http://localhost:3001/health'
    echo '📱 Instâncias: curl http://localhost:3001/instances'
else
    echo '❌ Servidor ainda com problemas'
    echo '🔍 Verificar logs: pm2 logs whatsapp-server'
fi
"

echo ""
echo "✅ CORREÇÃO CONCLUÍDA!"
echo "================================================="
echo "🔧 Imports problemáticos removidos"
echo "🚀 Servidor reiniciado"
echo "📊 Execute pm2 status no VPS para verificar"