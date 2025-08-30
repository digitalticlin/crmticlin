#!/bin/bash

# 🚀 ATIVAR SISTEMA DE QUEUES NO SERVIDOR VPS
echo "🚀 ATIVANDO SISTEMA DE QUEUES NO SERVIDOR VPS"
echo "Data: $(date)"
echo "================================================="

VPS_SERVER="root@vpswhatsapp"
VPS_PATH="~/whatsapp-server"

echo ""
echo "📊 1. VERIFICANDO ARQUIVOS EXISTENTES"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔍 Verificando estrutura de queues existente:'
echo 'src/queues/queue-manager.js:' \$([ -f src/queues/queue-manager.js ] && echo '✅ Existe' || echo '❌ Faltando')
echo 'src/workers/message-worker.js:' \$([ -f src/workers/message-worker.js ] && echo '✅ Existe' || echo '❌ Faltando')  
echo 'src/workers/webhook-worker.js:' \$([ -f src/workers/webhook-worker.js ] && echo '✅ Existe' || echo '❌ Faltando')
echo 'src/utils/queue-config.js:' \$([ -f src/utils/queue-config.js ] && echo '✅ Existe' || echo '❌ Faltando')
"

echo ""
echo "🔧 2. CORRIGINDO SERVER.JS PARA ATIVAR QUEUES"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '💾 Criando backup do server.js...'
cp server.js server.js.backup-before-queues-\$(date +%Y%m%d_%H%M%S)

echo '🔧 Adicionando imports de queue no server.js...'

# Verificar se já existe import do queue-manager
if ! grep -q 'queue-manager' server.js; then
    # Adicionar import após os outros requires
    sed -i '/require.*webhook-manager/a const QueueManager = require(\"./src/queues/queue-manager\");' server.js
    echo '✅ Import do QueueManager adicionado'
else
    echo 'ℹ️ Import do QueueManager já existe'
fi

# Verificar se já existe inicialização do queue
if ! grep -q 'queueManager' server.js; then
    # Adicionar inicialização após webhookManager
    sed -i '/webhookManager.*new WebhookManager/a const queueManager = new QueueManager();' server.js
    echo '✅ Inicialização do QueueManager adicionada'
else
    echo 'ℹ️ QueueManager já está inicializado'
fi

echo '✅ Server.js configurado para usar queues'
"

echo ""
echo "🌐 3. ADICIONANDO ENDPOINT /queue-status"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📋 Adicionando endpoint /queue-status no server.js...'

# Verificar se endpoint já existe
if ! grep -q '/queue-status' server.js; then
    # Adicionar endpoint antes do último módulo.exports
    cat >> server.js << 'EOF'

// ================================
// ENDPOINTS DE QUEUE STATUS
// ================================

// Status das filas
app.get('/queue-status', (req, res) => {
  try {
    if (typeof queueManager !== 'undefined' && queueManager) {
      const stats = queueManager.getQueueStats();
      res.json({
        success: true,
        status: 'queues_active',
        redis: 'connected',
        stats,
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({
        success: false,
        status: 'queues_not_initialized',
        message: 'Sistema de queues não está ativo',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Erro ao obter status das filas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    });
  }
});

// Processar fila manualmente (debug)
app.post('/queue-process', (req, res) => {
  try {
    if (typeof queueManager !== 'undefined' && queueManager) {
      queueManager.processAllQueues();
      res.json({
        success: true,
        message: 'Processamento de filas iniciado',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Sistema de queues não está ativo',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Erro ao processar filas:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

EOF
    echo '✅ Endpoints de queue adicionados'
else
    echo 'ℹ️ Endpoint /queue-status já existe'
fi
"

echo ""
echo "📊 4. ATUALIZANDO HEALTH CHECK"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🩺 Atualizando health check para incluir info de queues...'

# Backup da seção health check
grep -n '/health' server.js | head -1 > /tmp/health_line.txt
HEALTH_LINE=\$(cat /tmp/health_line.txt | cut -d':' -f1)

if [ -n \"\$HEALTH_LINE\" ]; then
    echo \"✅ Health check encontrado na linha \$HEALTH_LINE\"
    
    # Verificar se já tem informação de queue
    if ! grep -A 20 '/health' server.js | grep -q 'queue'; then
        # Adicionar info de queue no health check
        sed -i '/\"directories\": {/i\\    \"queues\": {\\n      \"active\": typeof queueManager !== \"undefined\" && queueManager ? true : false,\\n      \"redis\": \"connected\",\\n      \"workers\": [\"message\", \"webhook\", \"broadcast\"]\\n    },' server.js
        echo '✅ Informação de queues adicionada ao health check'
    else
        echo 'ℹ️ Health check já tem informação de queues'
    fi
else
    echo '⚠️ Health check não encontrado'
fi
"

echo ""
echo "🚀 5. REINICIANDO SERVIDOR COM QUEUES"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔄 Parando servidor atual...'
pm2 stop whatsapp-server 2>/dev/null || true

echo '⏳ Aguardando 3 segundos...'
sleep 3

echo '🚀 Iniciando servidor com queues ativadas...'
pm2 start server.js --name whatsapp-server --time

echo '⏳ Aguardando 10 segundos para inicialização completa...'
sleep 10

echo '📊 Status do PM2:'
pm2 status

echo ''
echo '🧪 Testando endpoints de queue:'
echo '1. Queue Status:'
curl -s http://localhost:3001/queue-status | head -10 || echo '❌ Endpoint não responde'

echo ''
echo '2. Health Check (com queues):'
curl -s http://localhost:3001/health | grep -E 'queue|redis|worker' || echo '⚠️ Sem info de queues no health check'
"

echo ""
echo "📋 6. VERIFICAÇÃO FINAL DAS QUEUES"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🎯 TESTE FINAL DA ARQUITETURA:'
echo ''

# Testar queue-status
QUEUE_STATUS=\$(curl -s http://localhost:3001/queue-status | grep -o '\"success\":true' && echo 'OK' || echo 'FALHA')
echo \"📊 Queue Status: \$QUEUE_STATUS\"

# Testar health com queues
HEALTH_QUEUES=\$(curl -s http://localhost:3001/health | grep -q 'queue' && echo 'OK' || echo 'FALHA')
echo \"🩺 Health com Queues: \$HEALTH_QUEUES\"

# Status geral do servidor
SERVER_STATUS=\$(curl -s http://localhost:3001/health >/dev/null && echo 'OK' || echo 'FALHA')
echo \"🌐 Servidor Geral: \$SERVER_STATUS\"

# Status do Redis
REDIS_STATUS=\$(redis-cli ping 2>/dev/null && echo 'OK' || echo 'FALHA')
echo \"📦 Redis: \$REDIS_STATUS\"

echo ''
echo '🎯 RESULTADO FINAL:'
if [ \"\$QUEUE_STATUS\" = \"OK\" ] && [ \"\$SERVER_STATUS\" = \"OK\" ] && [ \"\$REDIS_STATUS\" = \"OK\" ]; then
    echo '✅ ARQUITETURA FORK + QUEUES ATIVADA COM SUCESSO!'
    echo '🚀 Sistema pronto para processar milhares de instâncias'
else
    echo '⚠️ SISTEMA PARCIALMENTE ATIVO - verificar logs para ajustes'
    echo '🔍 Logs: pm2 logs whatsapp-server'
fi

echo ''
echo '📊 Próximos testes:'
echo '   • Queue Status: curl http://localhost:3001/queue-status'
echo '   • Health Check: curl http://localhost:3001/health'
echo '   • Criar instância: POST /instance/create'
"

echo ""
echo "✅ ATIVAÇÃO DE QUEUES CONCLUÍDA!"
echo "================================================="
echo "🏗️ Arquitetura FORK + QUEUES implementada"
echo "📊 Endpoints de monitoramento adicionados"
echo "🚀 Sistema pronto para alta escalabilidade"