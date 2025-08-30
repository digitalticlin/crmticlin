#!/bin/bash

# 📢 IMPLEMENTAR BROADCAST WORKER + EDGE FUNCTION
echo "📢 IMPLEMENTANDO BROADCAST WORKER + EDGE FUNCTION"
echo "Data: $(date)"
echo "================================================="

VPS_SERVER="root@vpswhatsapp"
VPS_PATH="~/whatsapp-server"

echo ""
echo "🔧 1. CRIANDO BROADCAST WORKER (PORTA 3004)"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📝 Criando broadcast-worker.js...'
cat > src/workers/broadcast-worker.js << 'BROADCAST_WORKER_EOF'
const express = require('express');
const Bull = require('bull');
const connectionManager = require('../utils/connection-manager');
const logger = require('../utils/logger');

const app = express();
const PORT = 3004;

app.use(express.json({ limit: '50mb' }));

// Redis connection
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Broadcast Queue
const broadcastQueue = new Bull('broadcast messages', redisUrl, {
  defaultJobOptions: {
    delay: 0,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 50,
    removeOnFail: 20,
  },
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    worker: 'broadcast-worker',
    port: PORT,
    timestamp: new Date().toISOString(),
    queue: {
      waiting: broadcastQueue.waiting(),
      active: broadcastQueue.active(),
      completed: broadcastQueue.completed(),
      failed: broadcastQueue.failed()
    }
  });
});

// Queue status
app.get('/queue-status', (req, res) => {
  res.json({
    success: true,
    worker: 'broadcast-worker',
    port: PORT,
    queue: 'broadcast_messages',
    timestamp: new Date().toISOString()
  });
});

// Process broadcast messages
broadcastQueue.process('send-broadcast', async (job) => {
  const { 
    instanceId, 
    campaignId, 
    contacts, 
    message, 
    mediaType = 'text',
    mediaUrl = null,
    rateLimitMs = 2000 
  } = job.data;

  logger.info(\`[BROADCAST] Processando campanha \${campaignId} para \${contacts.length} contatos\`);

  try {
    // Get instance
    const instance = connectionManager.getInstance(instanceId);
    if (!instance || !instance.socket || instance.socket.user?.id === null) {
      throw new Error(\`Instância \${instanceId} não conectada\`);
    }

    const results = {
      success: 0,
      failed: 0,
      total: contacts.length,
      errors: []
    };

    // Process each contact with rate limiting
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      
      try {
        // Progress update
        job.progress(Math.round((i / contacts.length) * 100));

        // Format phone number
        const phoneNumber = contact.replace(/\D/g, '');
        const remoteJid = phoneNumber.includes('@') ? phoneNumber : \`\${phoneNumber}@s.whatsapp.net\`;

        // Send message based on type
        let sentMessage;
        if (mediaType === 'text') {
          sentMessage = await instance.socket.sendMessage(remoteJid, { 
            text: message 
          });
        } else if (mediaType === 'image') {
          sentMessage = await instance.socket.sendMessage(remoteJid, {
            image: { url: mediaUrl },
            caption: message
          });
        } else if (mediaType === 'document') {
          sentMessage = await instance.socket.sendMessage(remoteJid, {
            document: { url: mediaUrl },
            mimetype: 'application/pdf',
            fileName: 'documento.pdf',
            caption: message
          });
        }

        if (sentMessage) {
          results.success++;
          logger.info(\`[BROADCAST] \${campaignId}: ✓ Enviado para \${phoneNumber}\`);
        } else {
          results.failed++;
          results.errors.push(\`\${phoneNumber}: Falha no envio\`);
        }

        // Rate limiting - wait between sends
        if (i < contacts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, rateLimitMs));
        }

      } catch (error) {
        results.failed++;
        results.errors.push(\`\${contact}: \${error.message}\`);
        logger.error(\`[BROADCAST] \${campaignId}: ❌ Erro para \${contact}:\`, error.message);
      }
    }

    // Final progress
    job.progress(100);

    logger.info(\`[BROADCAST] \${campaignId}: Concluído - \${results.success} sucessos, \${results.failed} falhas\`);
    
    return {
      success: true,
      campaignId,
      results,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    logger.error(\`[BROADCAST] \${campaignId}: Erro geral:\`, error);
    throw error;
  }
});

// Error handling
broadcastQueue.on('completed', (job, result) => {
  logger.info(\`[BROADCAST] Job \${job.id} completed:\`, result);
});

broadcastQueue.on('failed', (job, err) => {
  logger.error(\`[BROADCAST] Job \${job.id} failed:\`, err.message);
});

// Start server
app.listen(PORT, () => {
  logger.info(\`📢 Broadcast Worker iniciado na porta \${PORT}\`);
  logger.info(\`🔄 Processando fila: broadcast messages\`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('📢 Broadcast Worker: Parando graciosamente...');
  await broadcastQueue.close();
  process.exit(0);
});

module.exports = app;
BROADCAST_WORKER_EOF

echo '✅ broadcast-worker.js criado!'
"

echo ""
echo "⚙️ 2. ATUALIZANDO ECOSYSTEM.CONFIG.JS"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📝 Adicionando broadcast-worker ao ecosystem.config.js...'

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
    }
  ]
};
ECOSYSTEM_EOF

echo '✅ ecosystem.config.js atualizado!'
"

echo ""
echo "🔄 3. ADICIONANDO ENDPOINTS BROADCAST AO SERVER PRINCIPAL"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📝 Fazendo backup do server.js...'
cp server.js server.js.backup

echo '📝 Adicionando endpoints broadcast...'

# Add broadcast endpoints before the final app.listen
sed -i '/^app.listen/i\\
\\
\/\/ ===== BROADCAST ENDPOINTS =====\\
const broadcastQueue = new Bull(\"broadcast messages\", redisUrl, {\\
  defaultJobOptions: {\\
    delay: 0,\\
    attempts: 3,\\
    backoff: { type: \"exponential\", delay: 2000 },\\
    removeOnComplete: 50,\\
    removeOnFail: 20,\\
  },\\
});\\
\\
\/\/ Add broadcast to queue\\
app.post(\"/queue/add-broadcast\", async (req, res) => {\\
  try {\\
    const { instanceId, campaignId, contacts, message, mediaType, mediaUrl, rateLimitMs } = req.body;\\
\\
    if (!instanceId || !campaignId || !contacts || !message) {\\
      return res.status(400).json({\\
        success: false,\\
        error: \"Campos obrigatórios: instanceId, campaignId, contacts, message\"\\
      });\\
    }\\
\\
    \/\/ Add to broadcast queue\\
    const job = await broadcastQueue.add(\"send-broadcast\", {\\
      instanceId,\\
      campaignId,\\
      contacts: Array.isArray(contacts) ? contacts : [contacts],\\
      message,\\
      mediaType: mediaType || \"text\",\\
      mediaUrl: mediaUrl || null,\\
      rateLimitMs: rateLimitMs || 2000,\\
      timestamp: new Date().toISOString()\\
    });\\
\\
    logger.info(\`[QUEUE] Broadcast adicionado: \${campaignId} para \${contacts.length} contatos\`);\\
\\
    res.json({\\
      success: true,\\
      campaignId,\\
      jobId: job.id,\\
      queued: Array.isArray(contacts) ? contacts.length : 1,\\
      timestamp: new Date().toISOString()\\
    });\\
\\
  } catch (error) {\\
    logger.error(\"[QUEUE] Erro ao adicionar broadcast:\", error);\\
    res.status(500).json({\\
      success: false,\\
      error: error.message\\
    });\\
  }\\
});\\
\\
\/\/ Get broadcast campaign status\\
app.get(\"/broadcast-status/:campaignId\", async (req, res) => {\\
  try {\\
    const { campaignId } = req.params;\\
\\
    \/\/ Get jobs from broadcast queue\\
    const waiting = await broadcastQueue.getWaiting();\\
    const active = await broadcastQueue.getActive();\\
    const completed = await broadcastQueue.getCompleted();\\
    const failed = await broadcastQueue.getFailed();\\
\\
    \/\/ Find jobs for this campaign\\
    const allJobs = [...waiting, ...active, ...completed, ...failed];\\
    const campaignJobs = allJobs.filter(job => job.data.campaignId === campaignId);\\
\\
    if (campaignJobs.length === 0) {\\
      return res.status(404).json({\\
        success: false,\\
        error: \"Campanha não encontrada\"\\
      });\\
    }\\
\\
    const job = campaignJobs[0];\\
    const status = {\\
      campaignId,\\
      status: await job.getState(),\\
      progress: job.progress(),\\
      data: job.data,\\
      result: job.returnvalue || null,\\
      timestamp: new Date().toISOString()\\
    };\\
\\
    res.json({\\
      success: true,\\
      ...status\\
    });\\
\\
  } catch (error) {\\
    logger.error(\"[BROADCAST] Erro ao buscar status:\", error);\\
    res.status(500).json({\\
      success: false,\\
      error: error.message\\
    });\\
  }\\
});\\
' server.js

echo '✅ Endpoints broadcast adicionados ao server.js!'
"

echo ""
echo "🚀 4. INICIANDO BROADCAST WORKER"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🚀 Iniciando broadcast-worker...'
pm2 start ecosystem.config.js --only broadcast-worker

echo '⏳ Aguardando 5 segundos...'
sleep 5

echo '📊 Status dos processos:'
pm2 status

echo ''
echo '🧪 Testando broadcast worker:'
curl -s http://localhost:3004/health | head -3 && echo '✅ Broadcast Worker OK' || echo '❌ Problema no Broadcast Worker'
curl -s http://localhost:3001/health | head -3 && echo '✅ Server Principal OK' || echo '❌ Problema no Server'
"

echo ""
echo "✅ BROADCAST WORKER IMPLEMENTADO!"
echo "================================================="
echo "🎯 Próximos passos:"
echo "1. ✅ Broadcast Worker (porta 3004) - CONCLUÍDO"
echo "2. 📤 Criar Edge Function broadcast_messaging_service" 
echo "3. 🧪 Testar sistema completo de broadcast"