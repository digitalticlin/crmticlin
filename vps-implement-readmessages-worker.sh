#!/bin/bash

# 👁️ IMPLEMENTAR READ MESSAGES WORKER - SINCRONIZAÇÃO CRM-WHATSAPP
echo "👁️ IMPLEMENTANDO READ MESSAGES WORKER - SINCRONIZAÇÃO CRM-WHATSAPP"
echo "Data: $(date)"
echo "================================================="

VPS_SERVER="root@vpswhatsapp"
VPS_PATH="~/whatsapp-server"

echo ""
echo "🔧 1. CRIANDO READ MESSAGES WORKER (PORTA 3005)"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📝 Criando readmessages-worker.js...'
cat > src/workers/readmessages-worker.js << 'READMESSAGES_WORKER_EOF'
const express = require('express');
const Bull = require('bull');
const connectionManager = require('../utils/connection-manager');
const logger = require('../utils/logger');

const app = express();
const PORT = 3005;

app.use(express.json({ limit: '50mb' }));

// Redis connection
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Read Messages Queue
const readQueue = new Bull('read messages', redisUrl, {
  defaultJobOptions: {
    delay: 0,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    worker: 'readmessages-worker',
    port: PORT,
    timestamp: new Date().toISOString(),
    queue: {
      waiting: readQueue.waiting(),
      active: readQueue.active(),
      completed: readQueue.completed(),
      failed: readQueue.failed()
    }
  });
});

// Queue status
app.get('/queue-status', (req, res) => {
  res.json({
    success: true,
    worker: 'readmessages-worker',
    port: PORT,
    queue: 'read_messages',
    timestamp: new Date().toISOString()
  });
});

// Process read messages
readQueue.process('mark-messages-read', async (job) => {
  const { 
    instanceId, 
    conversationId, 
    messageIds,
    userId 
  } = job.data;

  logger.info(\`[READ] Marcando \${messageIds.length} mensagens como lidas - Conversa: \${conversationId}\`);

  try {
    // Get instance
    const instance = connectionManager.getInstance(instanceId);
    if (!instance || !instance.socket || instance.socket.user?.id === null) {
      throw new Error(\`Instância \${instanceId} não conectada\`);
    }

    // Filter only received messages (exclude sent messages)
    const receivedMessages = messageIds.filter(msgId => {
      // Skip messages that are likely sent by us
      // Baileys sent messages usually have different ID patterns
      return !msgId.includes('_sent_') && !msgId.startsWith('BAE5');
    });

    if (receivedMessages.length === 0) {
      logger.info(\`[READ] Nenhuma mensagem recebida para marcar como lida - Conversa: \${conversationId}\`);
      return { 
        success: true, 
        markedCount: 0, 
        skippedSent: messageIds.length,
        conversationId 
      };
    }

    // Mark messages as read in WhatsApp
    await instance.socket.readMessages(receivedMessages);

    logger.info(\`[READ] ✓ Marcadas \${receivedMessages.length} mensagens como lidas - Conversa: \${conversationId}\`);
    
    return {
      success: true,
      conversationId,
      markedCount: receivedMessages.length,
      skippedSent: messageIds.length - receivedMessages.length,
      userId,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    logger.error(\`[READ] Erro ao marcar mensagens como lidas - Conversa: \${conversationId}:\`, error);
    throw error;
  }
});

// Error handling
readQueue.on('completed', (job, result) => {
  logger.info(\`[READ] Job \${job.id} completed:\`, result);
});

readQueue.on('failed', (job, err) => {
  logger.error(\`[READ] Job \${job.id} failed:\`, err.message);
});

// Start server
app.listen(PORT, () => {
  logger.info(\`👁️ ReadMessages Worker iniciado na porta \${PORT}\`);
  logger.info(\`🔄 Processando fila: read messages\`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('👁️ ReadMessages Worker: Parando graciosamente...');
  await readQueue.close();
  process.exit(0);
});

module.exports = app;
READMESSAGES_WORKER_EOF

echo '✅ readmessages-worker.js criado!'
"

echo ""
echo "⚙️ 2. ATUALIZANDO ECOSYSTEM.CONFIG.JS"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📝 Adicionando readmessages-worker ao ecosystem.config.js...'

# Backup
cp ecosystem.config.js ecosystem.config.js.backup

# Update ecosystem config
cat > ecosystem.config.js << 'ECOSYSTEM_EOF'
module.exports = {
  apps: [
    {
      name: 'whatsapp-server',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'message-worker', 
      script: 'src/workers/message-worker.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      }
    },
    {
      name: 'webhook-worker',
      script: 'src/workers/webhook-worker.js', 
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: 3003
      }
    },
    {
      name: 'broadcast-worker',
      script: 'src/workers/broadcast-worker.js',
      instances: 1,
      exec_mode: 'fork', 
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3004
      }
    },
    {
      name: 'readmessages-worker',
      script: 'src/workers/readmessages-worker.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: 3005
      }
    }
  ]
};
ECOSYSTEM_EOF

echo '✅ ecosystem.config.js atualizado!'
"

echo ""
echo "🔄 3. ADICIONANDO ENDPOINTS READ MESSAGES AO SERVER PRINCIPAL"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📝 Fazendo backup do server.js...'
cp server.js server.js.backup

echo '📝 Adicionando endpoints read messages...'

# Add read messages endpoints before the final app.listen
sed -i '/^app.listen/i\\
\\
\/\/ ===== READ MESSAGES ENDPOINTS =====\\
const readQueue = new Bull(\"read messages\", redisUrl, {\\
  defaultJobOptions: {\\
    delay: 0,\\
    attempts: 2,\\
    backoff: { type: \"exponential\", delay: 1000 },\\
    removeOnComplete: 100,\\
    removeOnFail: 50,\\
  },\\
});\\
\\
\/\/ Mark messages as read in WhatsApp\\
app.post(\"/queue/mark-as-read\", async (req, res) => {\\
  try {\\
    const { instanceId, conversationId, messageIds, userId } = req.body;\\
\\
    if (!instanceId || !conversationId || !messageIds || !Array.isArray(messageIds)) {\\
      return res.status(400).json({\\
        success: false,\\
        error: \"Campos obrigatórios: instanceId, conversationId, messageIds (array)\"\\
      });\\
    }\\
\\
    \/\/ Filter only received messages (exclude sent messages)\\
    const receivedMessages = messageIds.filter(msgId => {\\
      return !msgId.includes(\"_sent_\") && !msgId.startsWith(\"BAE5\");\\
    });\\
\\
    if (receivedMessages.length === 0) {\\
      return res.json({\\
        success: true,\\
        conversationId,\\
        markedCount: 0,\\
        skippedSent: messageIds.length,\\
        message: \"Nenhuma mensagem recebida para marcar como lida\"\\
      });\\
    }\\
\\
    \/\/ Add to read queue\\
    const job = await readQueue.add(\"mark-messages-read\", {\\
      instanceId,\\
      conversationId,\\
      messageIds: receivedMessages,\\
      userId: userId || \"system\",\\
      timestamp: new Date().toISOString()\\
    });\\
\\
    logger.info(\`[QUEUE] ReadMessages adicionado: \${conversationId} - \${receivedMessages.length} mensagens\`);\\
\\
    res.json({\\
      success: true,\\
      conversationId,\\
      jobId: job.id,\\
      markedCount: receivedMessages.length,\\
      skippedSent: messageIds.length - receivedMessages.length,\\
      timestamp: new Date().toISOString()\\
    });\\
\\
  } catch (error) {\\
    logger.error(\"[QUEUE] Erro ao adicionar read messages:\", error);\\
    res.status(500).json({\\
      success: false,\\
      error: error.message\\
    });\\
  }\\
});\\
\\
\/\/ Get read status for conversation\\
app.get(\"/read-status/:conversationId\", async (req, res) => {\\
  try {\\
    const { conversationId } = req.params;\\
\\
    \/\/ Get jobs from read queue\\
    const waiting = await readQueue.getWaiting();\\
    const active = await readQueue.getActive();\\
    const completed = await readQueue.getCompleted();\\
    const failed = await readQueue.getFailed();\\
\\
    \/\/ Find jobs for this conversation\\
    const allJobs = [...waiting, ...active, ...completed, ...failed];\\
    const conversationJobs = allJobs.filter(job => job.data.conversationId === conversationId);\\
\\
    if (conversationJobs.length === 0) {\\
      return res.status(404).json({\\
        success: false,\\
        error: \"Conversa não encontrada na fila de leitura\"\\
      });\\
    }\\
\\
    const recentJob = conversationJobs[0];\\
    const status = {\\
      conversationId,\\
      status: await recentJob.getState(),\\
      progress: recentJob.progress(),\\
      data: recentJob.data,\\
      result: recentJob.returnvalue || null,\\
      timestamp: new Date().toISOString()\\
    };\\
\\
    res.json({\\
      success: true,\\
      ...status\\
    });\\
\\
  } catch (error) {\\
    logger.error(\"[READ] Erro ao buscar status de leitura:\", error);\\
    res.status(500).json({\\
      success: false,\\
      error: error.message\\
    });\\
  }\\
});\\
' server.js

echo '✅ Endpoints read messages adicionados ao server.js!'
"

echo ""
echo "🚀 4. INICIANDO READ MESSAGES WORKER"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🚀 Iniciando readmessages-worker...'
pm2 start ecosystem.config.js --only readmessages-worker

echo '⏳ Aguardando 5 segundos...'
sleep 5

echo '📊 Status dos processos:'
pm2 status

echo ''
echo '🧪 Testando read messages worker:'
curl -s http://localhost:3005/health | head -3 && echo '✅ ReadMessages Worker OK' || echo '❌ Problema no ReadMessages Worker'
curl -s http://localhost:3001/health | head -3 && echo '✅ Server Principal OK' || echo '❌ Problema no Server'
"

echo ""
echo "✅ READ MESSAGES WORKER IMPLEMENTADO!"
echo "================================================="
echo "🎯 Próximos passos:"
echo "1. ✅ ReadMessages Worker (porta 3005) - CONCLUÍDO"
echo "2. 📤 Criar Edge Function readmessages_service" 
echo "3. 🧪 Testar sincronização CRM-WhatsApp"
echo "4. 🎨 Integrar com frontend do CRM"