// SERVIDOR WHATSAPP COMPLETO - IMPLEMENTAÇÃO ROBUSTA CORRIGIDA
const express = require('express');
const crypto = require('crypto');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('baileys');
const QRCode = require('qrcode');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Módulos isolados para importação
const DiagnosticsManager = require('./src/utils/diagnostics-manager');
const ImportManagerRobust = require('./src/utils/import-manager-robust');
const WebhookManager = require('./src/utils/webhook-manager');
const ConnectionManager = require('./src/utils/connection-manager');

global.crypto = crypto;

const app = express();
const PORT = 3001; // NOVA VPS PORTA

// CONFIGURAÇÃO CORRIGIDA - Supabase Service Key para autenticação
const SUPABASE_PROJECT = 'rhjgagzstjzynvrakdyj';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUxMzEwMCwiZXhwIjoyMDY2MDg5MTAwfQ.48XYhDq4XdVTqNhIHdskd6iMcJem38aHzk6U1psfRRM';

// TOKEN DE AUTENTICAÇÃO VPS
const VPS_AUTH_TOKEN = process.env.VPS_API_TOKEN || 'bJyn3eUPFTRFNCxxLNd8KH5bI4Zg7bpUk7ADO6kXf49026a1';

const SUPABASE_WEBHOOKS = {
  QR_RECEIVER: process.env.QR_RECEIVER_WEBHOOK || 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_qr_receiver',
  CONNECTION_SYNC: process.env.CONNECTION_SYNC_WEBHOOK || 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/auto_whatsapp_sync',
  BACKEND_MESSAGES: process.env.BACKEND_MESSAGES_WEBHOOK || 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_whatsapp_web',
  N8N_MESSAGES: process.env.N8N_MESSAGES_WEBHOOK || 'https://novo-ticlin-n8n.eirfpl.easypanel.host/webhook/ticlingeral'
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

// Middleware de autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const apiTokenHeader = req.headers['x-api-token'];

  const token = authHeader?.split(' ')[1] || apiTokenHeader;

  // Permitir acesso livre ao health check
  if (req.path === '/health' || req.path === '/status') {
    return next();
  }

  if (!token || token !== VPS_AUTH_TOKEN) {
    return res.status(401).json({
      success: false,
      error: 'Token de autenticação inválido ou ausente',
      timestamp: new Date().toISOString()
    });
  }

  next();
}

// Inicializar gerenciadores modulares
const webhookManager = new WebhookManager(SUPABASE_WEBHOOKS, SUPABASE_SERVICE_KEY);
const connectionManager = new ConnectionManager(instances, AUTH_DIR, webhookManager);
const diagnosticsManager = new DiagnosticsManager(instances);
const importManagerRobust = new ImportManagerRobust(instances);

// ENDPOINTS PRINCIPAIS

// Health Check Robusto
app.get('/health', (req, res) => {
  const memoryUsage = process.memoryUsage();
  const activeInstances = Object.values(instances).filter(i => i.connected).length;

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT,
    server: 'WhatsApp Server Robust Implementation',
    version: '7.0.0-ROBUST-COMPLETE',
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
      },
      crypto: typeof crypto !== 'undefined' ? 'available' : 'missing'
    },
    webhooks: {
      configured: Object.keys(SUPABASE_WEBHOOKS).length,
      authenticated: !!SUPABASE_SERVICE_KEY,
      endpoints: SUPABASE_WEBHOOKS
    },
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
    server: 'WhatsApp Server Robust Implementation',
    version: '7.0.0-ROBUST-COMPLETE',
    port: PORT,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    activeInstances: instancesList.filter(i => i.connected).length,
    totalInstances: instancesList.length,
    instances: instancesList,
    memory: process.memoryUsage(),
    webhooks: SUPABASE_WEBHOOKS,
    auth_directory: AUTH_DIR,
    corrections_applied: {
      port_binding: true,
      webhook_auth: true,
      persistent_auth: true,
      modular_import: true,
      connection_stability: true,
      robust_data_access: true
    }
  });
});

// Listar Instâncias
app.get('/instances', authenticateToken, (req, res) => {
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

// Criar Instância com Recovery
app.post('/instance/create', authenticateToken, async (req, res) => {
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

    await connectionManager.createInstance(instanceId, createdByUserId);

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

// NOVO ENDPOINT: Diagnóstico detalhado da estrutura de dados
app.get('/instance/:instanceId/debug-data', async (req, res) => {
  const { instanceId } = req.params;

  console.log(`[Debug Data] 🔍 Solicitação de diagnóstico para: ${instanceId}`);

  try {
    const diagnostics = await diagnosticsManager.getInstanceDataStructure(instanceId);
    const compatibility = diagnosticsManager.getCompatibilityReport(diagnostics);

    res.json({
      success: true,
      instanceId,
      diagnostics,
      compatibility,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`[Debug Data] ❌ Erro no diagnóstico:`, error);

    res.status(500).json({
      success: false,
      error: 'Erro no diagnóstico de dados',
      message: error.message,
      instanceId,
      timestamp: new Date().toISOString()
    });
  }
});

// ENDPOINT DE IMPORTAÇÃO ROBUSTA
app.post('/instance/:instanceId/import-history-robust', async (req, res) => {
  const { instanceId } = req.params;
  const { importType = 'both', batchSize = 50, lastSyncTimestamp } = req.body;

  console.log(`[Import Robust] 📥 Solicitação para ${instanceId}:`, {
    importType,
    batchSize,
    lastSyncTimestamp
  });

  try {
    const result = await importManagerRobust.importHistory(instanceId, {
      importType,
      batchSize,
      lastSyncTimestamp
    });

    console.log(`[Import Robust] ✅ Importação concluída:`, {
      instanceId,
      contacts: result.contacts?.length || 0,
      messages: result.messages?.length || 0,
      success: result.success,
      strategiesUsed: result.metadata?.strategiesUsed
    });

    res.json(result);

  } catch (error) {
    console.error(`[Import Robust] ❌ Erro na importação:`, error);

    res.status(500).json({
      success: false,
      error: 'Erro na importação robusta de histórico',
      message: error.message,
      instanceId,
      timestamp: new Date().toISOString()
    });
  }
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
    await connectionManager.deleteInstance(instanceId);

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

// Enviar Mensagem
app.post('/send', authenticateToken, async (req, res) => {
  const { instanceId, phone, message } = req.body;

  if (!instanceId || !phone || !message) {
    return res.status(400).json({
      success: false,
      error: 'instanceId, phone e message são obrigatórios',
      timestamp: new Date().toISOString()
    });
  }

  const instance = instances[instanceId];
  if (!instance) {
    return res.status(404).json({
      success: false,
      error: 'Instância não encontrada',
      instanceId,
      timestamp: new Date().toISOString()
    });
  }

  if (!instance.connected || !instance.socket) {
    return res.status(400).json({
      success: false,
      error: 'Instância não está conectada',
      status: instance.status,
      instanceId,
      timestamp: new Date().toISOString()
    });
  }

  try {
    console.log(`📤 Enviando mensagem via ${instanceId} para ${phone}: ${message.substring(0, 50)}...`);

    // Formatar número de telefone
    const formattedPhone = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;

    // Enviar mensagem via Baileys
    const messageResult = await instance.socket.sendMessage(formattedPhone, { text: message });

    // Adicionar ao cache para evitar reenvio de webhook
    connectionManager.addSentMessageToCache(instanceId, messageResult.key.id, formattedPhone);

    console.log(`✅ Mensagem enviada com sucesso via ${instanceId}`);

    res.json({
      success: true,
      messageId: messageResult.key.id,
      instanceId,
      phone: formattedPhone,
      message: message,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Erro ao enviar mensagem via ${instanceId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Erro ao enviar mensagem',
      message: error.message,
      instanceId,
      timestamp: new Date().toISOString()
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
          await connectionManager.createInstance(instanceId, null, true);
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

// Sincronização Periódica com Melhor Controle
let syncInterval;
function startPeriodicSync() {
  // Cancelar sincronização anterior se existir
  if (syncInterval) {
    clearInterval(syncInterval);
  }

  // Sincronização a cada 15 minutos
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
          ip: '31.97.163.57',
          port: PORT,
          uptime: process.uptime(),
          version: '7.0.0-ROBUST-COMPLETE'
        }
      };

      await webhookManager.sendWebhook('AUTO_SYNC_INSTANCES', data, 'Sync');
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
    console.log('🔧 Iniciando servidor com implementação robusta...');

    await recoverExistingInstances();

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('✅ SERVIDOR WHATSAPP ROBUSTO IMPLEMENTADO!');
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`🌐 Acesso: http://31.97.163.57:${PORT}`);
      console.log(`📡 Supabase Webhooks configurados`);
      console.log(`🔧 Versão: 7.0.0-ROBUST-COMPLETE`);
      console.log(`📋 Endpoints disponíveis:`);
      console.log(`   GET  /health - Health check detalhado`);
      console.log(`   GET  /status - Status completo do servidor`);
      console.log(`   GET  /instances - Listar todas as instâncias`);
      console.log(`   POST /instance/create - Criar nova instância`);
      console.log(`   GET  /instance/:id/qr - Obter QR Code`);
      console.log(`   GET  /instance/:id/status - Status da instância`);
      console.log(`   GET  /instance/:id/debug-data - Diagnóstico robusta`);
      console.log(`   POST /instance/:id/import-history-robust - Importação robusta`);
      console.log(`   GET  /instance/:id - Detalhes da instância`);
      console.log(`   DELETE /instance/:id - Deletar instância`);
      console.log(`   POST /send - Enviar mensagem`);
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
          ip: '31.97.163.57',
          port: PORT,
          uptime: process.uptime(),
          version: '7.0.0-ROBUST-COMPLETE'
        }
        };

        await webhookManager.sendWebhook('AUTO_SYNC_INSTANCES', data, 'Startup');
      }
    }, 30000);

  } catch (error) {
    console.error('❌ Erro fatal na inicialização:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, instances, webhookManager, connectionManager, diagnosticsManager, importManagerRobust };

// CORREÇÃO: Função de limpeza periódica para evitar acúmulo
function cleanupFailedInstances() {
  const now = Date.now();
  const CLEANUP_INTERVAL = 300000; // 5 minutos
  
  for (const [instanceId, instance] of Object.entries(instances)) {
    const timeSinceLastUpdate = now - new Date(instance.lastUpdate).getTime();
    
    // Remover instâncias que falharam há mais de 5 minutos
    if (instance.status === 'failed' && timeSinceLastUpdate > CLEANUP_INTERVAL) {
      console.log(`[Cleanup] 🧹 Removendo instância expirada: ${instanceId}`);
      delete instances[instanceId];
    }
    
    // Remover instâncias órfãs sem socket
    if (!instance.socket && timeSinceLastUpdate > CLEANUP_INTERVAL) {
      console.log(`[Cleanup] 🧹 Removendo instância órfã: ${instanceId}`);
      delete instances[instanceId];
    }
  }
}

// Executar limpeza a cada 5 minutos
setInterval(cleanupFailedInstances, 300000);

// CORREÇÃO: Função de limpeza periódica para evitar acúmulo
function cleanupFailedInstances() {
  const now = Date.now();
  const CLEANUP_INTERVAL = 300000; // 5 minutos
  
  for (const [instanceId, instance] of Object.entries(instances)) {
    const timeSinceLastUpdate = now - new Date(instance.lastUpdate).getTime();
    
    // Remover instâncias que falharam há mais de 5 minutos
    if (instance.status === 'failed' && timeSinceLastUpdate > CLEANUP_INTERVAL) {
      console.log(`[Cleanup] 🧹 Removendo instância expirada: ${instanceId}`);
      delete instances[instanceId];
    }
    
    // Remover instâncias órfãs sem socket
    if (!instance.socket && timeSinceLastUpdate > CLEANUP_INTERVAL) {
      console.log(`[Cleanup] 🧹 Removendo instância órfã: ${instanceId}`);
      delete instances[instanceId];
    }
  }
}

// Executar limpeza a cada 5 minutos
setInterval(cleanupFailedInstances, 300000);
