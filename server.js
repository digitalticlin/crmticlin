// SERVIDOR WHATSAPP ORIGINAL FUNCIONAL - SEM MÓDULOS CORROMPIDOS
const express = require('express');
const crypto = require('crypto');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

global.crypto = crypto;

const app = express();
const PORT = 3002;

// CONFIGURAÇÃO CORRIGIDA - Supabase Service Key para autenticação
const SUPABASE_PROJECT = 'rhjgagzstjzynvrakdyj';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUxMzEwMCwiZXhwIjoyMDY2MDg5MTAwfQ.48XYhDq4XdVTqNhIHdskd6iMcJem38aHzk6U1psfRRM';

const SUPABASE_WEBHOOKS = {
  QR_RECEIVER: `https://${SUPABASE_PROJECT}.supabase.co/functions/v1/webhook_qr_receiver`,
  AUTO_SYNC_INSTANCES: `https://${SUPABASE_PROJECT}.supabase.co/functions/v1/auto_sync_instances`,
  AUTO_WHATSAPP_SYNC: `https://${SUPABASE_PROJECT}.supabase.co/functions/v1/auto_whatsapp_sync`,
  MESSAGE_RECEIVER: `https://${SUPABASE_PROJECT}.supabase.co/functions/v1/whatsapp_message_service`
};

// Armazenamento global de instâncias
const instances = {};

// Configuração de diretório persistente
const AUTH_DIR = path.join(__dirname, 'auth_info');
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  console.log(`📁 Diretório de autenticação criado: ${AUTH_DIR}`);
}

// Middleware CORS e JSON
app.use(express.json({ limit: '50mb' }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// WEBHOOK MANAGER INLINE (funcional)
async function sendWebhook(webhookUrl, data, context = '') {
  try {
    console.log(`[Webhook ${context}] 📤 Enviando para: ${webhookUrl}`);
    
    const response = await axios.post(webhookUrl, data, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      timeout: 10000
    });

    console.log(`[Webhook ${context}] ✅ Enviado com sucesso`);
    return response.data;
    
  } catch (error) {
    console.error(`[Webhook ${context}] ❌ Erro:`, error.message);
    throw error;
  }
}

// CONNECTION MANAGER INLINE (funcional)
async function createInstance(instanceId, createdByUserId = null, isRecovery = false) {
  try {
    console.log(`[Connection Manager] 🚀 Criando instância: ${instanceId}`);
    
    const instanceDir = path.join(AUTH_DIR, instanceId);
    if (!fs.existsSync(instanceDir)) {
      fs.mkdirSync(instanceDir, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(instanceDir);
    
    const socket = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ['WhatsApp-Server', 'Chrome', '1.0.0']
    });

    // Armazenar instância
    instances[instanceId] = {
      instanceId,
      instanceName: instanceId,
      socket,
      status: 'connecting',
      connected: false,
      phone: null,
      profileName: null,
      qrCode: null,
      lastUpdate: new Date().toISOString(),
      attempts: 0,
      createdByUserId,
      error: null
    };

    // Event handlers
    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      const instance = instances[instanceId];
      
      if (!instance) return;

      if (qr) {
        console.log(`[${instanceId}] 📱 QR Code gerado`);
        
        try {
          const qrCodeDataURL = await QRCode.toDataURL(qr);
          instance.qrCode = qrCodeDataURL;
          instance.status = 'qr_ready';
          instance.lastUpdate = new Date().toISOString();

          // Enviar QR Code via webhook
          await sendWebhook(SUPABASE_WEBHOOKS.QR_RECEIVER, {
            event: 'qr.update',
            instanceName: instanceId,
            instanceId: instanceId,
            data: { qrCode: qrCodeDataURL },
            timestamp: new Date().toISOString()
          }, 'QR');

        } catch (error) {
          console.error(`[${instanceId}] ❌ Erro ao processar QR:`, error);
        }
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        
        console.log(`[${instanceId}] 🔌 Conexão fechada:`, lastDisconnect?.error?.message);
        
        if (instance) {
          instance.connected = false;
          instance.status = shouldReconnect ? 'reconnecting' : 'disconnected';
          instance.lastUpdate = new Date().toISOString();
        }

        if (shouldReconnect) {
          console.log(`[${instanceId}] 🔄 Reconectando...`);
          setTimeout(() => createInstance(instanceId, createdByUserId, true), 3000);
        }
      } else if (connection === 'open') {
        console.log(`[${instanceId}] ✅ Conectado com sucesso!`);
        
        const me = socket.user;
        instance.connected = true;
        instance.status = 'ready';
        instance.phone = me?.id?.split('@')[0] || null;
        instance.profileName = me?.name || null;
        instance.qrCode = null;
        instance.lastUpdate = new Date().toISOString();

        // Notificar conexão via webhook
        await sendWebhook(SUPABASE_WEBHOOKS.AUTO_SYNC_INSTANCES, {
          event: 'connection.update',
          instanceName: instanceId,
          instanceId: instanceId,
          data: { 
            status: 'ready',
            phone: instance.phone,
            profileName: instance.profileName
          },
          timestamp: new Date().toISOString()
        }, 'Connection');
      }
    });

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('messages.upsert', async (m) => {
      const instance = instances[instanceId];
      if (!instance) return;

      for (const msg of m.messages) {
        try {
          await sendWebhook(SUPABASE_WEBHOOKS.MESSAGE_RECEIVER, {
            event: 'messages.upsert',
            instanceName: instanceId,
            instanceId: instanceId,
            data: { messages: [msg] },
            timestamp: new Date().toISOString()
          }, 'Message');
        } catch (error) {
          console.error(`[${instanceId}] ❌ Erro webhook mensagem:`, error.message);
        }
      }
    });

    console.log(`[${instanceId}] ✅ Instância configurada`);
    
  } catch (error) {
    console.error(`[Connection Manager] ❌ Erro ao criar ${instanceId}:`, error);
    if (instances[instanceId]) {
      instances[instanceId].status = 'error';
      instances[instanceId].error = error.message;
    }
  }
}

async function deleteInstance(instanceId) {
  try {
    console.log(`[Connection Manager] 🗑️ Deletando instância: ${instanceId}`);
    
    const instance = instances[instanceId];
    if (instance?.socket) {
      instance.socket.end();
    }
    
    delete instances[instanceId];
    
    const instanceDir = path.join(AUTH_DIR, instanceId);
    if (fs.existsSync(instanceDir)) {
      fs.rmSync(instanceDir, { recursive: true, force: true });
    }
    
    console.log(`[Connection Manager] ✅ Instância ${instanceId} deletada`);
    
  } catch (error) {
    console.error(`[Connection Manager] ❌ Erro ao deletar ${instanceId}:`, error);
    throw error;
  }
}

// ENDPOINTS PRINCIPAIS (todos funcionais)

// Health Check Robusto
app.get('/health', (req, res) => {
  const memoryUsage = process.memoryUsage();
  const activeInstances = Object.values(instances).filter(i => i.connected).length;
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT,
    server: 'WhatsApp Server Original Funcional',
    version: '6.0.0-STABLE-ROLLBACK',
    instances: {
      total: Object.keys(instances).length,
      active: activeInstances,
      connecting: Object.values(instances).filter(i => i.status === 'connecting').length,
      error: Object.values(instances).filter(i => i.status === 'error').length
    },
    system: {
      uptime: Math.floor(process.uptime()),
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB'
      }
    },
    webhooks: SUPABASE_WEBHOOKS,
    directories: {
      auth: AUTH_DIR,
      exists: fs.existsSync(AUTH_DIR)
    }
  });
});

// Status Detalhado
app.get('/status', (req, res) => {
  const instancesList = Object.values(instances).map(inst => ({
    instanceId: inst.instanceId,
    instanceName: inst.instanceName,
    status: inst.status,
    connected: inst.connected,
    phone: inst.phone,
    profileName: inst.profileName,
    lastUpdate: inst.lastUpdate,
    connectionAttempts: inst.attempts || 0,
    hasQrCode: !!inst.qrCode,
    error: inst.error || null,
    createdByUserId: inst.createdByUserId
  }));

  res.json({
    success: true,
    status: 'online',
    server: 'WhatsApp Server Original Funcional',
    version: '6.0.0-STABLE-ROLLBACK',
    port: PORT,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    activeInstances: instancesList.filter(i => i.connected).length,
    totalInstances: instancesList.length,
    instances: instancesList,
    memory: process.memoryUsage(),
    webhooks: SUPABASE_WEBHOOKS,
    auth_directory: AUTH_DIR
  });
});

// Listar Instâncias
app.get('/instances', (req, res) => {
  const instancesList = Object.values(instances).map(inst => ({
    instanceId: inst.instanceId,
    instanceName: inst.instanceName,
    status: inst.status,
    phone: inst.phone,
    profileName: inst.profileName,
    connected: inst.connected,
    lastUpdate: inst.lastUpdate,
    connectionAttempts: inst.attempts || 0,
    createdByUserId: inst.createdByUserId,
    hasQrCode: !!inst.qrCode,
    error: inst.error || null
  }));

  res.json({
    success: true,
    instances: instancesList,
    total: instancesList.length,
    connected: instancesList.filter(i => i.connected).length,
    timestamp: new Date().toISOString()
  });
});

// Criar Instância
app.post('/instance/create', async (req, res) => {
  const { instanceId, createdByUserId } = req.body;

  if (!instanceId) {
    return res.status(400).json({
      success: false,
      error: 'instanceId é obrigatório'
    });
  }

  if (instances[instanceId]) {
    return res.status(409).json({
      success: false,
      error: 'Instância já existe',
      status: instances[instanceId].status
    });
  }

  try {
    console.log(`🚀 Criando instância: ${instanceId} (User: ${createdByUserId})`);
    
    await createInstance(instanceId, createdByUserId);
    
    res.json({
      success: true,
      instanceId,
      instanceName: instanceId,
      status: 'creating',
      message: 'Instância criada com sucesso - inicializando',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`❌ Erro ao criar instância ${instanceId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar instância',
      message: error.message,
      instanceId
    });
  }
});

// QR Code
app.get('/instance/:instanceId/qr', (req, res) => {
  const { instanceId } = req.params;
  const instance = instances[instanceId];

  if (!instance) {
    return res.status(404).json({
      success: false,
      error: 'Instância não encontrada',
      instanceId
    });
  }

  if (instance.connected) {
    return res.json({
      success: false,
      connected: true,
      status: instance.status,
      phone: instance.phone,
      profileName: instance.profileName,
      message: 'Instância já está conectada'
    });
  }

  if (instance.qrCode) {
    res.json({
      success: true,
      qrCode: instance.qrCode,
      status: instance.status,
      instanceId,
      timestamp: new Date().toISOString()
    });
  } else {
    res.json({
      success: false,
      waiting: true,
      status: instance.status,
      message: instance.status === 'error' ? 'Erro na instância' :
               instance.status === 'connecting' ? 'Conectando - aguarde' :
               'QR Code sendo gerado',
      instanceId,
      timestamp: new Date().toISOString()
    });
  }
});

// Status Individual da Instância
app.get('/instance/:instanceId/status', (req, res) => {
  const { instanceId } = req.params;
  const instance = instances[instanceId];

  if (!instance) {
    return res.status(404).json({
      success: false,
      error: 'Instância não encontrada',
      instanceId
    });
  }

  res.json({
    success: true,
    instanceId: instance.instanceId,
    instanceName: instance.instanceName,
    status: instance.status,
    phone: instance.phone,
    profileName: instance.profileName,
    connected: instance.connected,
    lastUpdate: instance.lastUpdate,
    connectionAttempts: instance.attempts || 0,
    createdByUserId: instance.createdByUserId,
    hasQrCode: !!instance.qrCode,
    error: instance.error || null,
    timestamp: new Date().toISOString(),
    auth_persisted: fs.existsSync(path.join(AUTH_DIR, instanceId))
  });
});

// Obter Instância
app.get('/instance/:instanceId', (req, res) => {
  const { instanceId } = req.params;
  const instance = instances[instanceId];

  if (!instance) {
    return res.status(404).json({
      success: false,
      error: 'Instância não encontrada',
      instanceId
    });
  }

  res.json({
    success: true,
    instanceId: instance.instanceId,
    instanceName: instance.instanceName,
    status: instance.status,
    phone: instance.phone,
    profileName: instance.profileName,
    connected: instance.connected,
    lastUpdate: instance.lastUpdate,
    connectionAttempts: instance.attempts || 0,
    createdByUserId: instance.createdByUserId,
    hasQrCode: !!instance.qrCode,
    error: instance.error || null
  });
});

// Deletar Instância
app.delete('/instance/:instanceId', async (req, res) => {
  const { instanceId } = req.params;

  try {
    await deleteInstance(instanceId);
    
    res.json({
      success: true,
      message: 'Instância removida com sucesso',
      instanceId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`❌ Erro ao deletar instância ${instanceId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar instância',
      message: error.message,
      instanceId
    });
  }
});

// Recuperação Automática de Instâncias na Inicialização
async function recoverExistingInstances() {
  console.log('🔄 Verificando instâncias persistentes...');
  
  try {
    if (!fs.existsSync(AUTH_DIR)) return;
    
    const authDirs = fs.readdirSync(AUTH_DIR).filter(dir => {
      const fullPath = path.join(AUTH_DIR, dir);
      return fs.statSync(fullPath).isDirectory();
    });

    console.log(`📁 Encontrados ${authDirs.length} diretórios de autenticação:`, authDirs);

    for (const instanceId of authDirs) {
      if (!instances[instanceId]) {
        console.log(`🔧 Recuperando instância: ${instanceId}`);
        try {
          await createInstance(instanceId, null, true);
          console.log(`✅ Instância ${instanceId} recuperada`);
        } catch (error) {
          console.error(`❌ Erro ao recuperar ${instanceId}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro na recuperação de instâncias:', error);
  }
}

// Sincronização Periódica
let syncInterval;
function startPeriodicSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
  }

  syncInterval = setInterval(async () => {
    console.log('[Periodic Sync] 🔄 Iniciando sincronização...');
    
    const instancesData = Object.values(instances)
      .filter(inst => inst && inst.instanceId)
      .map(inst => ({
        instanceId: inst.instanceId,
        instanceName: inst.instanceName,
        status: inst.status,
        phone: inst.phone,
        profileName: inst.profileName,
        connected: inst.connected,
        lastUpdate: inst.lastUpdate,
        connectionAttempts: inst.attempts || 0,
        createdByUserId: inst.createdByUserId
      }));

    if (instancesData.length > 0) {
      const data = {
        event: 'periodic_sync',
        timestamp: new Date().toISOString(),
        instances: instancesData,
        total: instancesData.length,
        vps_info: {
          ip: '31.97.24.222',
          port: PORT,
          uptime: process.uptime(),
          version: '6.0.0-STABLE-ROLLBACK'
        }
      };
      
      try {
        await sendWebhook(SUPABASE_WEBHOOKS.AUTO_SYNC_INSTANCES, data, 'Sync');
      } catch (error) {
        console.error('[Periodic Sync] ❌ Erro:', error.message);
      }
    }
  }, 15 * 60 * 1000);
}

// Graceful Shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Encerrando servidor...');
  
  if (syncInterval) {
    clearInterval(syncInterval);
  }
  
  const shutdownPromises = Object.values(instances).map(instance => {
    if (instance.socket) {
      return new Promise(resolve => {
        try {
          instance.socket.end();
          setTimeout(resolve, 1000);
        } catch (error) {
          console.error(`Erro ao fechar ${instance.instanceId}:`, error.message);
          resolve();
        }
      });
    }
    return Promise.resolve();
  });

  await Promise.all(shutdownPromises);
  console.log('✅ Todas as instâncias fechadas');
  process.exit(0);
});

// Tratamento de Erros Não Capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Exceção não capturada:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
});

// INICIALIZAÇÃO DO SERVIDOR
async function startServer() {
  try {
    console.log('🔧 Iniciando servidor com rollback funcional...');
    
    await recoverExistingInstances();
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('✅ SERVIDOR WHATSAPP FUNCIONAL RESTAURADO!');
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`🌐 Acesso: http://31.97.24.222:${PORT}`);
      console.log(`📡 Supabase Webhooks configurados`);
      console.log(`🔧 Versão: 6.0.0-STABLE-ROLLBACK`);
      console.log(`📋 Endpoints funcionais:`);
      console.log(`   GET  /health - Health check detalhado`);
      console.log(`   GET  /status - Status completo do servidor`);
      console.log(`   GET  /instances - Listar todas as instâncias`);
      console.log(`   POST /instance/create - Criar nova instância`);
      console.log(`   GET  /instance/:id/qr - Obter QR Code`);
      console.log(`   GET  /instance/:id/status - Status da instância`);
      console.log(`   GET  /instance/:id - Detalhes da instância`);
      console.log(`   DELETE /instance/:id - Deletar instância`);
    });

    server.timeout = 60000;
    startPeriodicSync();

    setTimeout(async () => {
      console.log('🔄 Executando primeira sincronização...');
      const instancesData = Object.values(instances).map(inst => ({
        instanceId: inst.instanceId,
        instanceName: inst.instanceName,
        status: inst.status,
        phone: inst.phone,
        profileName: inst.profileName,
        connected: inst.connected,
        lastUpdate: inst.lastUpdate,
        connectionAttempts: inst.attempts || 0,
        createdByUserId: inst.createdByUserId
      }));

      if (instancesData.length > 0) {
        const data = {
          event: 'startup_sync',
          timestamp: new Date().toISOString(),
          instances: instancesData,
          total: instancesData.length,
          vps_info: {
            ip: '31.97.24.222',
            port: PORT,
            uptime: process.uptime(),
            version: '6.0.0-STABLE-ROLLBACK'
          }
        };
        
        try {
          await sendWebhook(SUPABASE_WEBHOOKS.AUTO_SYNC_INSTANCES, data, 'Startup');
        } catch (error) {
          console.error('[Startup Sync] ❌ Erro:', error.message);
        }
      }
    }, 30000);

  } catch (error) {
    console.error('❌ Erro fatal na inicialização:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, instances };


