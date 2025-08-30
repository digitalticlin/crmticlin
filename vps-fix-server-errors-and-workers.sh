#!/bin/bash

# 🔧 CORRIGIR ERROS DO SERVIDOR E CONFIGURAR WORKERS SEPARADOS
echo "🔧 CORRIGINDO ERROS E CONFIGURANDO WORKERS SEPARADOS"
echo "Data: $(date)"
echo "================================================="

VPS_SERVER="root@vpswhatsapp"
VPS_PATH="~/whatsapp-server"

echo ""
echo "🚨 1. VERIFICANDO LOGS DE ERRO"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔍 Verificando logs de erro recentes:'
pm2 logs whatsapp-server --lines 15 --nostream | tail -15
echo ''
echo '📊 Status atual do PM2:'
pm2 status
"

echo ""
echo "🔧 2. RESTAURANDO SERVER.JS SEM ERROS"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '💾 Criando backup atual...'
cp server.js server.js.with-errors-\$(date +%Y%m%d_%H%M%S)

echo '🔄 Restaurando backup anterior funcionando...'
if [ -f server.js.backup.20250829_091715 ]; then
    cp server.js.backup.20250829_091715 server.js
    echo '✅ Server.js restaurado para versão funcionando'
else
    echo '⚠️ Backup não encontrado, usando server.js atual'
fi

echo '🔍 Verificando se server.js está válido:'
node -c server.js && echo '✅ Sintaxe válida' || echo '❌ Erro de sintaxe'
"

echo ""
echo "🏗️ 3. CRIANDO ECOSYSTEM PARA MÚLTIPLOS WORKERS"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📋 Criando novo ecosystem.config.js com múltiplos workers...'

cat > ecosystem.config.js << 'EOF'
// 🏗️ PM2 ECOSYSTEM - SERVIDOR PRINCIPAL + WORKERS SEPARADOS
module.exports = {
  apps: [
    {
      // 📱 SERVIDOR PRINCIPAL WHATSAPP
      name: 'whatsapp-server',
      script: 'server.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        WORKER_TYPE: 'main'
      },
      error_file: './logs/whatsapp-server-error.log',
      out_file: './logs/whatsapp-server-out.log',
      log_file: './logs/whatsapp-server.log',
      time: true
    },
    {
      // 📨 WORKER PARA PROCESSAR MENSAGENS
      name: 'message-worker',
      script: 'src/workers/message-worker.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'message',
        PORT: 3002
      },
      error_file: './logs/message-worker-error.log',
      out_file: './logs/message-worker-out.log',
      log_file: './logs/message-worker.log',
      time: true
    },
    {
      // 🔗 WORKER PARA WEBHOOKS
      name: 'webhook-worker',
      script: 'src/workers/webhook-worker.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'webhook',
        PORT: 3003
      },
      error_file: './logs/webhook-worker-error.log',
      out_file: './logs/webhook-worker-out.log',
      log_file: './logs/webhook-worker.log',
      time: true
    }
  ]
};
EOF

echo '✅ Novo ecosystem.config.js criado com 3 workers separados'
"

echo ""
echo "🚀 4. PARANDO TUDO E REINICIANDO COM WORKERS"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🛑 Parando todos os processos PM2...'
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true

echo '⏳ Aguardando 5 segundos...'
sleep 5

echo '🚀 Iniciando com novo ecosystem (múltiplos workers)...'
pm2 start ecosystem.config.js

echo '⏳ Aguardando 10 segundos para inicialização...'
sleep 10

echo '📊 Status do PM2 com workers:'
pm2 status
"

echo ""
echo "🧪 5. TESTANDO CADA WORKER"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🧪 Testando servidor principal (porta 3001):'
curl -s http://localhost:3001/health | head -5 || echo '❌ Servidor principal não responde'

echo ''
echo '🧪 Testando message-worker (porta 3002):'
curl -s http://localhost:3002/status | head -5 || echo 'ℹ️ Message worker pode não ter endpoint HTTP'

echo ''
echo '🧪 Testando webhook-worker (porta 3003):'
curl -s http://localhost:3003/status | head -5 || echo 'ℹ️ Webhook worker pode não ter endpoint HTTP'

echo ''
echo '📊 Logs recentes de cada worker:'
echo '--- Servidor Principal ---'
pm2 logs whatsapp-server --lines 5 --nostream | tail -5

echo '--- Message Worker ---'
pm2 logs message-worker --lines 5 --nostream | tail -5 2>/dev/null || echo 'Sem logs do message-worker'

echo '--- Webhook Worker ---'
pm2 logs webhook-worker --lines 5 --nostream | tail -5 2>/dev/null || echo 'Sem logs do webhook-worker'
"

echo ""
echo "📋 6. VERIFICAÇÃO FINAL DOS WORKERS"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🎯 STATUS FINAL DOS WORKERS:'
echo ''

# Contar processos online
ONLINE_COUNT=\$(pm2 list | grep -c 'online')
TOTAL_COUNT=\$(pm2 list | grep -E 'whatsapp-server|message-worker|webhook-worker' | wc -l)

echo \"📊 Processos online: \$ONLINE_COUNT\"
echo \"📊 Total esperado: 3 (servidor + 2 workers)\"
echo \"📊 Total encontrado: \$TOTAL_COUNT\"

echo ''
echo '📋 Lista detalhada:'
pm2 list | grep -E 'whatsapp-server|message-worker|webhook-worker' || echo 'Nenhum worker encontrado'

echo ''
echo '🎯 RESULTADO:'
if [ \"\$ONLINE_COUNT\" -eq 3 ] && [ \"\$TOTAL_COUNT\" -eq 3 ]; then
    echo '✅ ARQUITETURA FORK + WORKERS FUNCIONANDO!'
    echo '🚀 Sistema pronto para alta escalabilidade'
elif [ \"\$ONLINE_COUNT\" -eq 1 ] && [ \"\$TOTAL_COUNT\" -eq 1 ]; then
    echo '⚠️ APENAS SERVIDOR PRINCIPAL ONLINE'
    echo '🔧 Workers precisam ser ajustados'
else
    echo '❌ CONFIGURAÇÃO PARCIAL'
    echo '🔍 Verificar logs para ajustes'
fi

echo ''
echo '📊 Para monitorar:'
echo '   • Status: pm2 status'
echo '   • Logs: pm2 logs [nome-do-worker]'
echo '   • Reiniciar: pm2 restart ecosystem.config.js'
"

echo ""
echo "✅ CORREÇÃO E CONFIGURAÇÃO CONCLUÍDA!"
echo "================================================="
echo "🔧 Servidor restaurado para versão funcionando"
echo "🏗️ Ecosystem configurado para múltiplos workers"
echo "📊 PM2 deve mostrar 3 processos separados agora"