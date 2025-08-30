#!/bin/bash

# 🔧 CORREÇÃO RÁPIDA - Queue Status Error
# Fix: waiting() method not available

echo "🔧 CORREÇÃO RÁPIDA - QUEUE STATUS ERROR"
echo "Data: $(date)"
echo "======================================================"
echo "🎯 Problema: this.messageQueue.waiting is not a function"
echo "🔧 Solução: Corrigir métodos Bull Queue"
echo "======================================================"

VPS_SERVER="root@vpswhatsapp"
VPS_PATH="~/whatsapp-server"

# ============================================================
# 1. CORRIGIR MÉTODOS DO QUEUE MANAGER
# ============================================================

echo ""
echo "🔧 1. CORRIGINDO MÉTODOS BULL QUEUE"
echo "======================================================"

ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔧 Backup e correção do QueueManager...'
cp src/queues/queue-manager.js src/queues/queue-manager.js.backup-queue-fix

# Corrigir métodos do Bull Queue
cat > src/queues/queue-manager.js << 'QUEUE_MANAGER_FIXED_METHODS_EOF'
// QUEUE MANAGER CORRIGIDO - Métodos Bull Queue
const Queue = require('bull');
const Redis = require('ioredis');

class QueueManager {
  constructor() {
    this.redis = new Redis({
      host: 'localhost',
      port: 6379,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      lazyConnect: true,
      maxRetriesPerRequest: 3
    });

    // Criar filas com nomes únicos baseados em timestamp
    const timestamp = Date.now();
    
    this.messageQueue = new Queue(\`message-processing-\${timestamp}\`, {
      redis: { host: 'localhost', port: 6379 }
    });
    
    this.webhookQueue = new Queue(\`webhook-delivery-\${timestamp}\`, {
      redis: { host: 'localhost', port: 6379 }
    });
    
    this.broadcastQueue = new Queue(\`mass-broadcast-\${timestamp}\`, {
      redis: { host: 'localhost', port: 6379 }
    });

    // Flag para evitar inicialização dupla
    this.initialized = false;
    
    console.log('✅ QueueManager criado sem conflitos');
  }

  initializeQueues() {
    if (this.initialized) {
      console.log('⚠️ QueueManager já inicializado, ignorando');
      return;
    }

    try {
      // Configurar processamento apenas uma vez
      this.messageQueue.process('send_message', 5, this.processMessage.bind(this));
      this.webhookQueue.process('send_webhook', 3, this.processWebhook.bind(this));
      this.broadcastQueue.process('send_broadcast', 1, this.processBroadcast.bind(this));

      this.initialized = true;
      console.log('✅ Queue handlers configurados sem conflitos');
    } catch (error) {
      console.error('❌ Erro ao inicializar queues:', error.message);
    }
  }

  async processMessage(job) {
    const { instanceId, to, message, type = 'text' } = job.data;
    
    try {
      console.log(\`📤 Processando mensagem para \${to} via \${instanceId}\`);
      
      // Verificar se instância existe
      if (!global.instances || !global.instances[instanceId]) {
        throw new Error(\`Instância \${instanceId} não encontrada\`);
      }

      const instance = global.instances[instanceId];
      if (!instance.sock) {
        throw new Error(\`Instância \${instanceId} não está conectada\`);
      }

      let result;
      
      switch (type) {
        case 'text':
          result = await instance.sock.sendMessage(to, { text: message });
          break;
        case 'image':
          result = await instance.sock.sendMessage(to, { 
            image: { url: message.url }, 
            caption: message.caption 
          });
          break;
        default:
          throw new Error(\`Tipo não suportado: \${type}\`);
      }

      console.log(\`✅ Mensagem enviada para \${to}\`);
      return { success: true, messageId: result.key.id };
      
    } catch (error) {
      console.error(\`❌ Erro ao enviar mensagem:\`, error.message);
      throw error;
    }
  }

  async processWebhook(job) {
    const { url, method = 'POST', data } = job.data;
    
    try {
      console.log(\`🔄 Enviando webhook para \${url}\`);
      
      const axios = require('axios');
      const response = await axios({
        method,
        url,
        data,
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      console.log(\`✅ Webhook enviado: \${response.status}\`);
      return { success: true, status: response.status };
      
    } catch (error) {
      console.error(\`❌ Erro webhook:\`, error.message);
      throw error;
    }
  }

  async processBroadcast(job) {
    const { instanceId, contacts, message, delay = 1000 } = job.data;
    
    try {
      console.log(\`📢 Broadcast para \${contacts.length} contatos\`);
      
      if (!global.instances || !global.instances[instanceId]) {
        throw new Error(\`Instância \${instanceId} não encontrada\`);
      }

      const instance = global.instances[instanceId];
      const results = [];
      
      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        
        try {
          const result = await instance.sock.sendMessage(contact, { text: message });
          results.push({ contact, success: true, messageId: result.key.id });
          
          if (i < contacts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
        } catch (error) {
          results.push({ contact, success: false, error: error.message });
        }
      }

      const successful = results.filter(r => r.success).length;
      console.log(\`✅ Broadcast: \${successful}/\${contacts.length} enviados\`);
      
      return { success: true, results, total: contacts.length, successful };
      
    } catch (error) {
      console.error(\`❌ Erro no broadcast:\`, error.message);
      throw error;
    }
  }

  // Métodos para adicionar jobs às filas
  async addMessage(instanceId, messageData, priority = 0) {
    if (!this.initialized) {
      this.initializeQueues();
    }
    
    return await this.messageQueue.add('send_message', {
      instanceId,
      ...messageData
    }, {
      priority: priority,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 }
    });
  }

  async addWebhook(webhookData) {
    if (!this.initialized) {
      this.initializeQueues();
    }
    
    return await this.webhookQueue.add('send_webhook', webhookData, {
      attempts: 5,
      backoff: 'fixed',
      delay: 1000
    });
  }

  async addBroadcast(broadcastData) {
    if (!this.initialized) {
      this.initializeQueues();
    }
    
    return await this.broadcastQueue.add('send_broadcast', broadcastData, {
      attempts: 3,
      delay: 5000
    });
  }

  // CORREÇÃO: Status das filas usando métodos corretos
  async getQueueStats() {
    try {
      // Usar getWaiting(), getActive(), etc. (métodos corretos do Bull v4+)
      const messageWaiting = await this.messageQueue.getWaiting();
      const messageActive = await this.messageQueue.getActive();
      const messageCompleted = await this.messageQueue.getCompleted();
      const messageFailed = await this.messageQueue.getFailed();

      const webhookWaiting = await this.webhookQueue.getWaiting();
      const webhookActive = await this.webhookQueue.getActive();

      const broadcastWaiting = await this.broadcastQueue.getWaiting();
      const broadcastActive = await this.broadcastQueue.getActive();

      return {
        message: {
          waiting: messageWaiting.length,
          active: messageActive.length,
          completed: messageCompleted.length,
          failed: messageFailed.length
        },
        webhook: {
          waiting: webhookWaiting.length,
          active: webhookActive.length
        },
        broadcast: {
          waiting: broadcastWaiting.length,
          active: broadcastActive.length
        },
        total: {
          waiting: messageWaiting.length + webhookWaiting.length + broadcastWaiting.length,
          active: messageActive.length + webhookActive.length + broadcastActive.length
        }
      };
    } catch (error) {
      console.error('❌ Erro ao obter stats das filas:', error.message);
      return {
        error: error.message,
        message: { waiting: 0, active: 0, completed: 0, failed: 0 },
        webhook: { waiting: 0, active: 0 },
        broadcast: { waiting: 0, active: 0 },
        total: { waiting: 0, active: 0 }
      };
    }
  }
}

// Singleton para evitar múltiplas instâncias
let queueManagerInstance = null;

module.exports = {
  getInstance: () => {
    if (!queueManagerInstance) {
      queueManagerInstance = new QueueManager();
    }
    return queueManagerInstance;
  }
};
QUEUE_MANAGER_FIXED_METHODS_EOF

echo '✅ QueueManager corrigido com métodos Bull corretos'
"

# ============================================================
# 2. REINICIAR SERVIDOR PARA APLICAR CORREÇÃO
# ============================================================

echo ""
echo "🔄 2. APLICANDO CORREÇÃO"
echo "======================================================"

ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔄 Reiniciando servidor para aplicar correção...'
pm2 restart whatsapp-server

echo '⏳ Aguardando reinicialização (10 segundos)...'
sleep 10

echo '📊 Status após correção:'
pm2 status
"

# ============================================================
# 3. TESTAR CORREÇÃO
# ============================================================

echo ""
echo "🧪 3. TESTANDO CORREÇÃO"
echo "======================================================"

ssh $VPS_SERVER "
echo '🧪 Testando queue-status corrigido...'

curl -s http://localhost:3001/queue-status | jq . || curl -s http://localhost:3001/queue-status

echo ''
echo '🧪 Testando health check...'
curl -s http://localhost:3001/health | jq -r '.success, .mode, .port' || echo 'Erro no health check'

echo ''
echo '📋 Logs recentes:'
pm2 logs whatsapp-server --lines 5 --nostream
"

echo ""
echo "✅ CORREÇÃO DE QUEUE STATUS CONCLUÍDA!"
echo "======================================================"
echo "🔧 Métodos Bull Queue corrigidos"
echo "🔄 Servidor reiniciado"
echo "🧪 Testes executados"
echo ""
echo "🚀 Agora você pode testar:"
echo "  • curl http://localhost:3001/queue-status"
echo "  • curl http://localhost:3001/health"
echo "  • Criar instâncias WhatsApp"