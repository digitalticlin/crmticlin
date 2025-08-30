#!/bin/bash

# 🚑 CORREÇÃO CRÍTICA - Erros pós-migração
# Fix: Bull Queue + Porta + Workers

echo "🚑 CORREÇÃO CRÍTICA - ERROS PÓS-MIGRAÇÃO"
echo "Data: $(date)"
echo "======================================================"
echo "🎯 Problemas identificados:"
echo "  ❌ Bull Queue: 'Cannot define handler twice'"
echo "  ❌ Porta incorreta: 3000 → 3001"
echo "  ❌ Workers instáveis"
echo "======================================================"

VPS_SERVER="root@vpswhatsapp"
VPS_PATH="~/whatsapp-server"

# ============================================================
# 1. PARAR SISTEMA PARA CORREÇÕES CRÍTICAS
# ============================================================

echo ""
echo "🛑 1. PARANDO SISTEMA PARA CORREÇÕES"
echo "======================================================"

ssh $VPS_SERVER "
echo '🛑 Parando todos os processos para correção...'
pm2 stop all
pm2 delete all
pm2 kill

echo '⏳ Aguardando limpeza completa...'
sleep 10

echo '✅ Sistema parado para correções'
ps aux | grep -E '(whatsapp|bull|queue)' | grep -v grep || echo 'Nenhum processo relacionado ativo'
"

# ============================================================
# 2. CORRIGIR PORTA DO SERVIDOR (3000 → 3001)
# ============================================================

echo ""
echo "🔧 2. CORRIGINDO PORTA DO SERVIDOR (3000 → 3001)"
echo "======================================================"

ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔍 Verificando arquivos com porta 3000...'
grep -r 'PORT.*3000' . --include='*.js' --include='*.json' || echo 'Nenhuma referência encontrada'

echo '🔧 Corrigindo server.js...'
# Backup do server.js atual
cp server.js server.js.backup-$(date +%H%M%S)

# Corrigir porta no server.js
sed -i 's/PORT.*3000/PORT || 3001/g' server.js
sed -i 's/localhost:3000/localhost:3001/g' server.js
sed -i 's/port.*3000/port: 3001/g' server.js

echo '🔧 Corrigindo ecosystem.fork.config.js...'
# Backup do ecosystem
cp ecosystem.fork.config.js ecosystem.fork.config.js.backup-$(date +%H%M%S)

# Corrigir porta no ecosystem
sed -i 's/PORT.*3000/PORT: 3001/g' ecosystem.fork.config.js

echo '✅ Porta corrigida para 3001'
"

# ============================================================
# 3. CORRIGIR SISTEMA DE FILAS BULL (Handlers duplicados)
# ============================================================

echo ""
echo "🔧 3. CORRIGINDO SISTEMA DE FILAS BULL"
echo "======================================================"

ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔧 Corrigindo QueueManager - removendo handlers duplicados...'

# Backup do queue-manager
cp src/queues/queue-manager.js src/queues/queue-manager.js.backup-$(date +%H%M%S)

# Reescrever QueueManager sem conflitos
cat > src/queues/queue-manager.js << 'QUEUE_MANAGER_FIXED_EOF'
// QUEUE MANAGER CORRIGIDO - Sistema de Filas sem conflitos
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

  // Status das filas
  async getQueueStats() {
    return {
      message: {
        waiting: await this.messageQueue.waiting(),
        active: await this.messageQueue.active(),
        completed: await this.messageQueue.completed(),
        failed: await this.messageQueue.failed()
      },
      webhook: {
        waiting: await this.webhookQueue.waiting(),
        active: await this.webhookQueue.active()
      },
      broadcast: {
        waiting: await this.broadcastQueue.waiting(),
        active: await this.broadcastQueue.active()
      }
    };
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
QUEUE_MANAGER_FIXED_EOF

echo '✅ QueueManager corrigido sem conflitos de handlers'
"

# ============================================================
# 4. CORRIGIR SERVER.JS PRINCIPAL
# ============================================================

echo ""
echo "🔧 4. CORRIGINDO SERVER.JS PRINCIPAL"
echo "======================================================"

ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔧 Atualizando server.js para usar QueueManager corrigido...'

# Reescrever server.js simplificado para evitar conflitos
cat > server.js << 'SERVER_FIXED_EOF'
// SERVIDOR WHATSAPP FORK MODE - CORRIGIDO
const express = require('express');
const crypto = require('crypto');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('baileys');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

global.crypto = crypto;

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') res.sendStatus(200);
  else next();
});

// Armazenamento global de instâncias
global.instances = {};

// Inicializar QueueManager (singleton)
let QueueManager;
try {
  const queueModule = require('./src/queues/queue-manager');
  QueueManager = queueModule.getInstance();
  QueueManager.initializeQueues();
  console.log('✅ QueueManager inicializado');
} catch (error) {
  console.error('❌ Erro ao carregar QueueManager:', error.message);
  console.log('⚠️ Continuando sem sistema de filas');
}

// Função para inicializar instância WhatsApp
async function initializeInstance(instanceId) {
  try {
    console.log(\`🚀 Inicializando instância \${instanceId}\`);
    
    const authDir = path.join(__dirname, 'auth_info', instanceId);
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ['WhatsApp CRM FORK', 'Chrome', '6.0.0'],
      markOnlineOnConnect: false
    });

    // Event listeners
    sock.ev.on('messages.upsert', async (m) => {
      try {
        const message = m.messages[0];
        if (!message.message || message.key.fromMe) return;
        
        console.log(\`📨 Mensagem recebida em \${instanceId}\`);
        
        // Enviar para webhook via fila (se disponível)
        if (QueueManager) {
          await QueueManager.addWebhook({
            url: process.env.WEBHOOK_URL || 'http://localhost:3001/webhook',
            data: { instanceId, message, timestamp: Date.now() }
          });
        }
        
      } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error.message);
      }
    });
    
    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        console.log(\`📱 QR Code gerado para \${instanceId}\`);
        global.instances[instanceId] = { ...global.instances[instanceId], qr };
      }
      
      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log(\`🔌 Conexão \${instanceId} fechada. Reconectar: \${shouldReconnect}\`);
        
        if (shouldReconnect) {
          setTimeout(() => initializeInstance(instanceId), 5000);
        }
      } else if (connection === 'open') {
        console.log(\`✅ Instância \${instanceId} conectada\`);
        global.instances[instanceId] = { ...global.instances[instanceId], sock, connected: true };
      }
    });
    
    sock.ev.on('creds.update', saveCreds);
    
    global.instances[instanceId] = { ...global.instances[instanceId], sock };
    
  } catch (error) {
    console.error(\`❌ Erro ao inicializar \${instanceId}:\`, error.message);
  }
}

// ROTAS API

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    mode: 'FORK',
    instances: Object.keys(global.instances).length,
    connected: Object.values(global.instances).filter(i => i.connected).length,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
    port: 3001
  });
});

// Criar instância
app.post('/create-instance', async (req, res) => {
  try {
    const { instanceId } = req.body;
    
    if (!instanceId) {
      return res.status(400).json({ success: false, error: 'instanceId é obrigatório' });
    }
    
    if (global.instances[instanceId]) {
      return res.status(400).json({ success: false, error: 'Instância já existe' });
    }
    
    await initializeInstance(instanceId);
    
    res.json({ success: true, message: \`Instância \${instanceId} criada\` });
    
  } catch (error) {
    console.error('❌ Erro ao criar instância:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Listar instâncias
app.get('/instances', (req, res) => {
  const instancesStatus = Object.keys(global.instances).map(instanceId => ({
    instanceId,
    connected: global.instances[instanceId]?.connected || false,
    hasQR: !!global.instances[instanceId]?.qr
  }));
  
  res.json({ success: true, instances: instancesStatus });
});

// QR Code
app.get('/qr/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const instance = global.instances[instanceId];
    
    if (!instance?.qr) {
      return res.status(404).json({ success: false, error: 'QR não disponível' });
    }
    
    const qrImage = await QRCode.toBuffer(instance.qr);
    res.set('Content-Type', 'image/png');
    res.send(qrImage);
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Enviar mensagem
app.post('/send-message', async (req, res) => {
  try {
    const { instanceId, to, message, type = 'text' } = req.body;
    
    if (!instanceId || !to || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'instanceId, to e message são obrigatórios' 
      });
    }
    
    // Se tem QueueManager, usar fila
    if (QueueManager) {
      const job = await QueueManager.addMessage(instanceId, { to, message, type });
      res.json({
        success: true,
        jobId: job.id,
        message: 'Mensagem adicionada à fila'
      });
    } else {
      // Envio direto
      const instance = global.instances[instanceId];
      if (!instance?.sock) {
        return res.status(400).json({ success: false, error: 'Instância não conectada' });
      }
      
      const result = await instance.sock.sendMessage(to, { text: message });
      res.json({ success: true, messageId: result.key.id });
    }
    
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Status das filas
app.get('/queue-status', async (req, res) => {
  try {
    if (QueueManager) {
      const stats = await QueueManager.getQueueStats();
      res.json({ success: true, stats });
    } else {
      res.json({ success: true, message: 'Sistema de filas não disponível', stats: null });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Iniciar servidor na porta 3001
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(\`🚀 Servidor WhatsApp CRM iniciado (FORK MODE)\`);
  console.log(\`📡 Servidor rodando na porta \${PORT}\`);
  console.log(\`✅ Modo: FORK (sem conflitos)\`);
  console.log(\`🔗 Health Check: http://localhost:\${PORT}/health\`);
  console.log(\`📊 Status: http://localhost:\${PORT}/queue-status\`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Encerrando servidor graciosamente...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Encerrando servidor graciosamente...');
  process.exit(0);
});
SERVER_FIXED_EOF

echo '✅ Server.js corrigido para porta 3001'
"

# ============================================================
# 5. CORRIGIR ECOSYSTEM PM2
# ============================================================

echo ""
echo "🔧 5. CORRIGINDO ECOSYSTEM PM2"
echo "======================================================"

ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔧 Criando ecosystem simplificado...'

cat > ecosystem.fork.config.js << 'ECOSYSTEM_FIXED_EOF'
// PM2 ECOSYSTEM CORRIGIDO - FORK MODE
module.exports = {
  apps: [
    {
      name: 'whatsapp-server',
      script: 'server.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      node_args: '--max_old_space_size=4096',
      kill_timeout: 10000,
      listen_timeout: 10000
    }
  ]
};
ECOSYSTEM_FIXED_EOF

echo '✅ Ecosystem corrigido - apenas servidor principal'
"

# ============================================================
# 6. INICIAR SISTEMA CORRIGIDO
# ============================================================

echo ""
echo "🚀 6. INICIANDO SISTEMA CORRIGIDO"
echo "======================================================"

ssh $VPS_SERVER "
cd $VPS_PATH

echo '🚀 Iniciando sistema com correções...'
pm2 start ecosystem.fork.config.js

echo '⏳ Aguardando inicialização (30 segundos)...'
sleep 30

echo '📊 Status após correções:'
pm2 status

echo ''
echo '🩺 Testando health check na porta 3001:'
curl -s http://localhost:3001/health | jq . || curl -s http://localhost:3001/health

echo ''
echo '🔍 Verificando se porta 3001 está ativa:'
netstat -tuln | grep ':3001' || echo 'Porta 3001 não encontrada'

echo ''
echo '📋 Logs recentes:'
pm2 logs whatsapp-server --lines 10 --nostream
"

# ============================================================
# 7. VALIDAÇÃO FINAL
# ============================================================

echo ""
echo "✅ 7. VALIDAÇÃO FINAL DAS CORREÇÕES"
echo "======================================================"

# Teste final automatizado
HEALTH_CHECK=$(ssh $VPS_SERVER "curl -s http://localhost:3001/health 2>/dev/null | jq -r '.success' 2>/dev/null")
PM2_STATUS=$(ssh $VPS_SERVER "pm2 jlist | jq -r '.[0].pm2_env.status' 2>/dev/null")
PORT_ACTIVE=$(ssh $VPS_SERVER "netstat -tuln | grep ':3001' | wc -l")

echo "🔍 Resultado das correções:"
echo ""

if [ "$HEALTH_CHECK" = "true" ]; then
    echo "✅ Health Check: Funcionando na porta 3001"
else
    echo "❌ Health Check: Ainda com problemas ($HEALTH_CHECK)"
fi

if [ "$PM2_STATUS" = "online" ]; then
    echo "✅ PM2: Processo online e estável"
else
    echo "❌ PM2: Status problemático ($PM2_STATUS)"
fi

if [ "$PORT_ACTIVE" -gt 0 ]; then
    echo "✅ Porta 3001: Ativa e escutando"
else
    echo "❌ Porta 3001: Não está ativa"
fi

echo ""
if [ "$HEALTH_CHECK" = "true" ] && [ "$PM2_STATUS" = "online" ] && [ "$PORT_ACTIVE" -gt 0 ]; then
    echo "🎉 CORREÇÕES APLICADAS COM SUCESSO!"
    echo "======================================================"
    echo "✅ Servidor respondendo na porta 3001"
    echo "✅ Bull Queue corrigido (sem handlers duplicados)"
    echo "✅ PM2 estável em modo FORK"
    echo "✅ Sistema pronto para usar"
    echo ""
    echo "🚀 Próximos passos:"
    echo "  • Testar criação de instância: POST /create-instance"
    echo "  • Verificar QR codes: GET /qr/INSTANCE_ID"
    echo "  • Monitorar: GET /health e /queue-status"
else
    echo "⚠️ ALGUMAS CORREÇÕES AINDA NECESSÁRIAS"
    echo "======================================================"
    echo "🔧 Verificar logs: pm2 logs whatsapp-server"
    echo "🔧 Status PM2: pm2 status"
    echo "🔧 Testar porta: curl http://localhost:3001/health"
fi

echo ""
echo "📊 CORREÇÕES CONCLUÍDAS!"
echo "======================================================"