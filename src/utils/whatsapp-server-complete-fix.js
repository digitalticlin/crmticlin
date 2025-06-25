// SERVIDOR WHATSAPP COMPLETO - CORREÇÃO TOTAL COM IMPORTAÇÃO MODULAR
const express = require('express');
const crypto = require('crypto');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Módulos isolados para importação
const ImportManager = require('./import-manager');
const ImportManagerCorrected = require('./import-manager-corrected');
const DiagnosticsManager = require('./diagnostics-manager');
const WebhookManager = require('./webhook-manager');
const ConnectionManager = require('./connection-manager');

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

// Inicializar gerenciadores modulares
const webhookManager = new WebhookManager(SUPABASE_WEBHOOKS, SUPABASE_SERVICE_KEY);
const connectionManager = new ConnectionManager(instances, AUTH_DIR, webhookManager);
const importManager = new ImportManager(instances);
const importManagerCorrected = new ImportManagerCorrected(instances);
const diagnosticsManager = new DiagnosticsManager(instances);

// ENDPOINTS PRINCIPAIS

// Health Check Robusto
app.get('/health', (req, res) => {
  const memoryUsage = process.memoryUsage();
  const activeInstances = Object.values(instances).filter(i => i.connected).length;
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT,
    server: 'WhatsApp Server Complete Fix',
    version: '6.0.0-COMPLETE-FIX',
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
    server: 'WhatsApp Server Complete Fix',
    version: '6.0.0-COMPLETE-FIX',
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
      connection_stability: true
    }
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

// Criar Instância com Recovery
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
app.get('/instance/:instanceId/debug-data', (req, res) => {
  const { instanceId } = req.params;
  
  console.log(`[Debug Data] 🔍 Solicitação de diagnóstico para: ${instanceId}`);

  diagnosticsManager.getInstanceDataStructure(instanceId)
    .then(diagnostics => {
      const compatibility = diagnosticsManager.getCompatibilityReport(diagnostics);
      
      res.json({
        success: true,
        instanceId,
        diagnostics,
        compatibility,
        timestamp: new Date().toISOString()
      });
    })
    .catch(error => {
      console.error(`[Debug Data] ❌ Erro no diagnóstico:`, error);
      
      res.status(500).json({
        success: false,
        error: 'Erro no diagnóstico de dados',
        message: error.message,
        instanceId,
        timestamp: new Date().toISOString()
      });
    });
});

// ENDPOINT DE IMPORTAÇÃO CORRIGIDO
app.post('/instance/:instanceId/import-history-corrected', async (req, res) => {
  const { instanceId } = req.params;
  const { importType = 'both', batchSize = 50, lastSyncTimestamp } = req.body;
  
  console.log(`[Import Corrected] 📥 Solicitação para ${instanceId}:`, { 
    importType, 
    batchSize, 
    lastSyncTimestamp 
  });

  try {
    // Usar o ImportManagerCorrected
    const result = await importManagerCorrected.importHistory(instanceId, {
      importType,
      batchSize,
      lastSyncTimestamp
    });

    console.log(`[Import Corrected] ✅ Importação concluída:`, {
      instanceId,
      contacts: result.contacts?.length || 0,
      messages: result.messages?.length || 0,
      success: result.success,
      source: result.metadata?.dataSource
    });

    res.json(result);

  } catch (error) {
    console.error(`[Import Corrected] ❌ Erro na importação:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Erro na importação de histórico corrigida',
      message: error.message,
      instanceId,
      timestamp: new Date().toISOString()
    });
  }
});

// ENDPOINT DE IMPORTAÇÃO MODULAR - MANTIDO PARA COMPATIBILIDADE
app.post('/instance/:instanceId/import-history', async (req, res) => {
  const { instanceId } = req.params;
  const { importType = 'both', batchSize = 50, lastSyncTimestamp } = req.body;
  
  console.log(`[Import Modular] 📥 Solicitação para ${instanceId}:`, { 
    importType, 
    batchSize, 
    lastSyncTimestamp 
  });

  try {
    // Usar o ImportManager original
    const result = await importManager.importHistory(instanceId, {
      importType,
      batchSize,
      lastSyncTimestamp
    });

    console.log(`[Import Modular] ✅ Importação concluída:`, {
      instanceId,
      contacts: result.contacts?.length || 0,
      messages: result.messages?.length || 0,
      success: result.success
    });

    res.json(result);

  } catch (error) {
    console.error(`[Import Modular] ❌ Erro na importação:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Erro na importação de histórico',
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

  // Sincronização a cada 15 minutos (reduzido de 10 para evitar spam)
  syncInterval = setInterval(async () => {
    console.log('[Periodic Sync] 🔄 Iniciando sincronização...');
    
    const instancesData = Object.values(instances)
      .filter(inst => inst && inst.instanceId) // Filtrar instâncias válidas
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
          version: '6.0.0-COMPLETE-FIX'
        }
      };
      
      await webhookManager.sendWebhook('AUTO_SYNC_INSTANCES', data, 'Sync');
    }
  }, 15 * 60 * 1000); // 15 minutos
}

// Graceful Shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Encerrando servidor...');
  
  // Cancelar sincronização periódica
  if (syncInterval) {
    clearInterval(syncInterval);
  }
  
  // Fechar todas as instâncias
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
  // Não encerrar o processo para manter estabilidade
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
  // Log mas não encerrar
});

// INICIALIZAÇÃO DO SERVIDOR
async function startServer() {
  try {
    console.log('🔧 Iniciando servidor com correções completas...');
    
    // Recuperar instâncias existentes
    await recoverExistingInstances();
    
    // Iniciar servidor na porta 3002 com bind correto
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('✅ SERVIDOR WHATSAPP CORRIGIDO COMPLETAMENTE!');
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`🌐 Acesso: http://31.97.24.222:${PORT}`);
      console.log(`📡 Supabase Webhooks autenticados:`);
      console.log(`   📱 QR: ${SUPABASE_WEBHOOKS.QR_RECEIVER}`);
      console.log(`   🔄 Sync: ${SUPABASE_WEBHOOKS.AUTO_SYNC_INSTANCES}`);
      console.log(`   ✅ Connection: ${SUPABASE_WEBHOOKS.AUTO_WHATSAPP_SYNC}`);
      console.log(`   💬 Messages: ${SUPABASE_WEBHOOKS.MESSAGE_RECEIVER}`);
      console.log(`🔑 Autenticação: Service Key configurada`);
      console.log(`📁 Auth Dir: ${AUTH_DIR}`);
      console.log(`🛡️ Crypto: ${typeof crypto !== 'undefined' ? 'DISPONÍVEL' : 'INDISPONÍVEL'}`);
      console.log(`⚡ Funcionalidades:`);
      console.log(`   ✅ Port binding corrigido`);
      console.log(`   ✅ Webhook authentication corrigido`);
      console.log(`   ✅ Persistent auth configurado`);
      console.log(`   ✅ Modular import system implementado`);
      console.log(`   ✅ Connection stability melhorado`);
      console.log(`   ✅ Auto recovery implementado`);
      console.log(`📋 Endpoints disponíveis:`);
      console.log(`   GET  /health - Health check detalhado`);
      console.log(`   GET  /status - Status completo do servidor`);
      console.log(`   GET  /instances - Listar todas as instâncias`);
      console.log(`   POST /instance/create - Criar nova instância`);
      console.log(`   GET  /instance/:id/qr - Obter QR Code`);
      console.log(`   GET  /instance/:id/status - Status da instância`);
      console.log(`   POST /instance/:id/import-history - Importar histórico (MODULAR)`);
      console.log(`   POST /instance/:id/import-history-corrected - Importar histórico corrigido`);
      console.log(`   GET  /instance/:id - Detalhes da instância`);
      console.log(`   DELETE /instance/:id - Deletar instância`);
    });

    // Configurar timeout do servidor
    server.timeout = 60000; // 60 segundos

    // Iniciar sincronização periódica
    startPeriodicSync();

    // Fazer primeiro sync após 30 segundos
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
            version: '6.0.0-COMPLETE-FIX'
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

// Inicializar
startServer();

module.exports = { app, instances, webhookManager, connectionManager, importManager, importManagerCorrected, diagnosticsManager };
