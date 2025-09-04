require("dotenv").config();
let syncInterval = null;
require("./mute-logs");
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
// const ReadMessagesWorker = require('./src/utils/read-messages-worker'); // Temporariamente desabilitado para corrigir 502

global.crypto = crypto;

const app = express();
app.use((req,res,next)=>{res.setHeader("Access-Control-Allow-Origin","*");res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");res.setHeader("Access-Control-Allow-Headers","Content-Type,Authorization");if(req.method==="OPTIONS"){res.sendStatus(204);return;} next();});
const PORT = process.env.PORT || 3001;

// CONFIGURAÇÃO CORRIGIDA - Supabase Service Key para autenticação
const SUPABASE_PROJECT = process.env.SUPABASE_PROJECT_ID;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// TOKEN DE AUTENTICAÇÃO VPS
const VPS_AUTH_TOKEN = process.env.VPS_API_TOKEN;

const SUPABASE_WEBHOOKS = {
// DESABILITADO:   AUTO_SYNC_INSTANCES: process.env.AUTO_SYNC_INSTANCES,
  QR_RECEIVER: process.env.QR_RECEIVER_WEBHOOK,
// DESABILITADO:   CONNECTION_SYNC: process.env.CONNECTION_SYNC_WEBHOOK,
  BACKEND_MESSAGES: process.env.BACKEND_MESSAGES_WEBHOOK,
  N8N_MESSAGES: process.env.N8N_MESSAGES_WEBHOOK,
  PROFILE_PIC: process.env.PROFILE_PIC_WEBHOOK
};

// Armazenamento global de instâncias
const instances = {};

// Cache de fotos de perfil já enviadas
const sentProfilePics = new Map();
let bulkSyncInProgress = false;

// Configuração de diretório persistente
const AUTH_DIR = process.env.AUTH_DIR || path.join(__dirname, 'auth_info');
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
// const readMessagesWorker = new ReadMessagesWorker(instances, webhookManager); // Temporariamente desabilitado
const readMessagesWorker = {
  markAsReadWhenOpenConversation: async () => ({ success: false, error: 'ReadMessagesWorker temporariamente desabilitado' }),
  markSpecificMessagesAsRead: async () => ({ success: false, error: 'ReadMessagesWorker temporariamente desabilitado' }),
  getQueueStats: () => ({ totalChats: 0, totalMessages: 0, chats: [] }),
  clearQueue: () => ({ cleared: 0 })
};

// ================================
// FUNCIONALIDADES FOTO DE PERFIL
// ================================

// Função para buscar foto de perfil via Baileys
async function getProfilePictureUrl(instanceId, phone) {
  try {
    const instance = instances[instanceId];
    if (!instance || !instance.socket || !instance.connected) {
      console.log(`⚠️ Instância ${instanceId} não disponível para buscar foto de perfil`);
      return null;
    }

    // Formatar número para Baileys
    const formattedJid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;

    // Buscar foto de perfil via Baileys
    const profilePicUrl = await instance.socket.profilePictureUrl(formattedJid, 'image');

    console.log(`📸 Foto de perfil encontrada para ${phone}: ${profilePicUrl ? 'SIM' : 'NÃO'}`);
    return profilePicUrl;
  } catch (error) {
    console.log(`📸 Erro ao buscar foto de perfil para ${phone}:`, error.message);
    return null;
  }
}

// Função para enviar foto para Edge Function
async function sendProfilePicToEdgeFunction(leadId, phone, profilePicUrl, instanceId) {
  try {
    console.log(`📤 Enviando foto de perfil para Edge Function - Lead: ${leadId}`);

    const response = await axios.post(SUPABASE_WEBHOOKS.PROFILE_PIC, {
      lead_id: leadId,
      phone: phone,
      profile_pic_url: profilePicUrl,
      instance_id: instanceId
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      timeout: 10000
    });

    if (response.data.success) {
      console.log(`✅ Foto de perfil enviada com sucesso para lead ${leadId}`);
      return true;
    } else {
      console.error(`❌ Falha ao enviar foto de perfil:`, response.data);
      return false;
    }
  } catch (error) {
    console.error(`❌ Erro ao enviar foto para Edge Function:`, error.message);
    return false;
  }
}

// Função para processar foto de perfil de um novo lead
async function processNewLeadProfilePic(instanceId, phone, leadData) {
  try {
    const cacheKey = `${instanceId}:${phone}`;

    // Verificar se já foi processado
    if (sentProfilePics.has(cacheKey)) {
      console.log(`📸 Foto de perfil já processada para ${phone}`);
      return;
    }

    // Buscar foto de perfil
    const profilePicUrl = await getProfilePictureUrl(instanceId, phone);

    if (profilePicUrl) {
      // Enviar para Edge Function
      const success = await sendProfilePicToEdgeFunction(
        leadData.lead_id,
        phone,
        profilePicUrl,
        instanceId
      );

      if (success) {
        // Adicionar ao cache
        sentProfilePics.set(cacheKey, {
          url: profilePicUrl,
          timestamp: Date.now(),
          leadId: leadData.lead_id
        });
        console.log(`✅ Processamento completo - foto enviada para ${phone}`);
      }
    } else {
      // Marcar como processado mesmo sem foto (para não tentar novamente)
      sentProfilePics.set(cacheKey, {
        url: null,
        timestamp: Date.now(),
        leadId: leadData.lead_id
      });
      console.log(`📸 Nenhuma foto encontrada para ${phone}`);
    }
  } catch (error) {
    console.error(`❌ Erro no processamento da foto de perfil:`, error);
  }
}

// Função para processar lote de leads (sincronização em massa)
async function processBatchProfilePics(instanceId, phoneList, batchSize = 50) {
  try {
    console.log(`📸 Iniciando processamento em lote - ${phoneList.length} phones`);

    const results = {
      processed: 0,
      success: 0,
      errors: 0,
      notFound: 0
    };

    for (let i = 0; i < phoneList.length; i += batchSize) {
      const batch = phoneList.slice(i, i + batchSize);
      console.log(`📦 Processando lote ${Math.floor(i/batchSize) + 1} - ${batch.length} itens`);

      for (const phoneData of batch) {
        try {
          const { phone, lead_id } = phoneData;
          const cacheKey = `${instanceId}:${phone}`;

          // Pular se já foi processado
          if (sentProfilePics.has(cacheKey)) {
            results.processed++;
            continue;
          }

          // Buscar foto de perfil
          const profilePicUrl = await getProfilePictureUrl(instanceId, phone);

          if (profilePicUrl) {
            // Enviar para Edge Function
            const success = await sendProfilePicToEdgeFunction(
              lead_id,
              phone,
              profilePicUrl,
              instanceId
            );

            if (success) {
              sentProfilePics.set(cacheKey, {
                url: profilePicUrl,
                timestamp: Date.now(),
                leadId: lead_id
              });
              results.success++;
            } else {
              results.errors++;
            }
          } else {
            // Marcar como processado sem foto
            sentProfilePics.set(cacheKey, {
              url: null,
              timestamp: Date.now(),
              leadId: lead_id
            });
            results.notFound++;
          }

          results.processed++;

          // Rate limiting - pausa entre requisições
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`❌ Erro no processamento de ${phoneData.phone}:`, error.message);
          results.errors++;
        }
      }

      // Pausa entre lotes
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`📊 Processamento em lote concluído:`, results);
    return results;
  } catch (error) {
    console.error(`❌ Erro no processamento em lote:`, error);
    throw error;
  }
}

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

// ================================
// ENDPOINTS FOTO DE PERFIL
// ================================

// Processar foto de perfil individual
app.post('/instance/:instanceId/process-profile-pic', authenticateToken, async (req, res) => {
  const { instanceId } = req.params;
  const { phone, lead_id } = req.body;

  if (!phone || !lead_id) {
    return res.status(400).json({
      success: false,
      error: 'phone e lead_id são obrigatórios'
    });
  }

  const instance = instances[instanceId];
  if (!instance) {
    return res.status(404).json({
      success: false,
      error: 'Instância não encontrada',
      instanceId
    });
  }

  if (!instance.connected || !instance.socket) {
    return res.status(400).json({
      success: false,
      error: 'Instância não está conectada',
      status: instance.status,
      instanceId
    });
  }

  try {
    console.log(`📸 Processando foto de perfil individual - ${phone}`);

    await processNewLeadProfilePic(instanceId, phone, { lead_id });

    res.json({
      success: true,
      message: 'Foto de perfil processada com sucesso',
      phone,
      lead_id,
      instanceId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`❌ Erro ao processar foto de perfil:`, error);
    res.status(500).json({
      success: false,
      error: 'Erro ao processar foto de perfil',
      message: error.message,
      phone,
      instanceId
    });
  }
});

// Sincronização em massa de fotos de perfil
app.post('/instance/:instanceId/sync-profile-pics-bulk', authenticateToken, async (req, res) => {
  const { instanceId } = req.params;
  const { phone_list, batch_size = 50 } = req.body;

  if (!phone_list || !Array.isArray(phone_list)) {
    return res.status(400).json({
      success: false,
      error: 'phone_list deve ser um array com objetos {phone, lead_id}'
    });
  }

  const instance = instances[instanceId];
  if (!instance) {
    return res.status(404).json({
      success: false,
      error: 'Instância não encontrada',
      instanceId
    });
  }

  if (!instance.connected || !instance.socket) {
    return res.status(400).json({
      success: false,
      error: 'Instância não está conectada',
      status: instance.status,
      instanceId
    });
  }

  // Verificar se já existe um processo em andamento
  if (bulkSyncInProgress) {
    return res.status(429).json({
      success: false,
      error: 'Sincronização em massa já está em andamento',
      message: 'Aguarde o processo atual finalizar'
    });
  }

  try {
    console.log(`📸 Iniciando sincronização em massa - ${phone_list.length} leads`);
    bulkSyncInProgress = true;

    // Processar em background para não travar a resposta
    processBatchProfilePics(instanceId, phone_list, batch_size)
      .then(results => {
        console.log(`✅ Sincronização em massa concluída:`, results);
        bulkSyncInProgress = false;
      })
      .catch(error => {
        console.error(`❌ Erro na sincronização em massa:`, error);
        bulkSyncInProgress = false;
      });

    // Resposta imediata
    res.json({
      success: true,
      message: 'Sincronização em massa iniciada em background',
      total_leads: phone_list.length,
      batch_size,
      instanceId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`❌ Erro ao iniciar sincronização em massa:`, error);
    bulkSyncInProgress = false;
    res.status(500).json({
      success: false,
      error: 'Erro ao iniciar sincronização em massa',
      message: error.message,
      instanceId
    });
  }
});

// Status da sincronização em massa
app.get('/bulk-sync-status', authenticateToken, (req, res) => {
  res.json({
    success: true,
    bulk_sync_in_progress: bulkSyncInProgress,
    cache_size: sentProfilePics.size,
    timestamp: new Date().toISOString()
  });
});

// ================================
// 📱 ENDPOINTS READ MESSAGES
// ================================

// Marcar mensagens como lidas quando usuário abre conversa no CRM
app.post('/instance/:instanceId/mark-read-conversation', authenticateToken, async (req, res) => {
  const { instanceId } = req.params;
  const { phone, user_id } = req.body;
  const logPrefix = `[MarkRead ${instanceId}]`;

  if (!phone) {
    return res.status(400).json({
      success: false,
      error: 'phone é obrigatório'
    });
  }

  try {
    console.log(`${logPrefix} 📱 Usuário ${user_id || 'N/A'} abriu conversa com ${phone}`);

    const result = await readMessagesWorker.markAsReadWhenOpenConversation(instanceId, phone, user_id);

    if (result.success) {
      res.json({
        success: true,
        message: 'Mensagens marcadas como lidas',
        phone,
        instanceId,
        unreadCount: result.unreadCount || 0,
        queued: result.queued || 0,
        syncedWithMobile: true,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        phone,
        instanceId,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error(`${logPrefix} ❌ Erro:`, error);
    res.status(500).json({
      success: false,
      error: 'Erro ao marcar mensagens como lidas',
      message: error.message,
      phone,
      instanceId,
      timestamp: new Date().toISOString()
    });
  }
});

// Marcar mensagens específicas como lidas
app.post('/instance/:instanceId/mark-read-messages', authenticateToken, async (req, res) => {
  const { instanceId } = req.params;
  const { phone, message_ids, user_id } = req.body;
  const logPrefix = `[MarkReadSpecific ${instanceId}]`;

  if (!phone || !message_ids || !Array.isArray(message_ids)) {
    return res.status(400).json({
      success: false,
      error: 'phone e message_ids (array) são obrigatórios'
    });
  }

  try {
    console.log(`${logPrefix} 🎯 Marcando ${message_ids.length} mensagens específicas como lidas`);

    const chatJid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
    const result = await readMessagesWorker.markSpecificMessagesAsRead(instanceId, chatJid, message_ids);

    if (result.success) {
      res.json({
        success: true,
        message: 'Mensagens específicas marcadas como lidas',
        phone,
        instanceId,
        messagesMarked: result.messagesRead,
        syncedWithMobile: true,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        phone,
        instanceId,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error(`${logPrefix} ❌ Erro:`, error);
    res.status(500).json({
      success: false,
      error: 'Erro ao marcar mensagens específicas como lidas',
      message: error.message,
      phone,
      instanceId,
      timestamp: new Date().toISOString()
    });
  }
});

// Obter estatísticas da fila de read messages
app.get('/read-messages-stats', authenticateToken, (req, res) => {
  try {
    const stats = readMessagesWorker.getQueueStats();

    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas de read messages:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter estatísticas',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Limpar fila de read messages (manutenção)
app.delete('/read-messages-queue', authenticateToken, (req, res) => {
  try {
    const result = readMessagesWorker.clearQueue();

    res.json({
      success: true,
      message: 'Fila de read messages limpa',
      itemsCleared: result.cleared,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao limpar fila de read messages:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao limpar fila',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Enviar Mensagem
app.post('/send', authenticateToken, async (req, res) => {
  const { instanceId, phone, message, mediaType, mediaUrl, ptt, filename, seconds, waveform } = req.body;

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
    let messageResult;

    // ✅ SUPORTE COMPLETO A MÍDIA E DATAURL
    if (mediaType && mediaType !== 'text' && mediaUrl) {
      console.log(`🎬 Enviando mídia tipo: ${mediaType}`);

      // Detectar tipos especiais
      const isDataUrl = mediaType.includes('_dataurl');
      const baseType = mediaType.replace('_dataurl', '');

      if (isDataUrl) {
        console.log('📱 Detectada DataURL, processando...');
      }

      switch (baseType.toLowerCase()) {
        case 'image':
           if (mediaUrl.startsWith('data:')) {
             // ✅ DataURL → Buffer (para Baileys)
             console.log('📱 Convertendo DataURL para Buffer...');
             const base64Data = mediaUrl.split(',')[1];
             const buffer = Buffer.from(base64Data, 'base64');
             messageResult = await instance.socket.sendMessage(formattedPhone, {
               image: buffer,
               // caption removida
             });
           } else {
             // URL HTTP normal
             messageResult = await instance.socket.sendMessage(formattedPhone, {
               image: { url: mediaUrl },
               // caption removida
             });
           }
           break;

        case 'video':
          if (mediaUrl.startsWith('data:')) {
            // ✅ DataURL → Buffer para vídeos
            console.log('📹 Convertendo vídeo DataURL para Buffer...');
            const base64Data = mediaUrl.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            messageResult = await instance.socket.sendMessage(formattedPhone, {
              video: buffer,
              fileName: 'video.mp4' // nome fixo
            });
          } else {
            // URL HTTP normal
            messageResult = await instance.socket.sendMessage(formattedPhone, {
              video: { url: mediaUrl },
              // caption removida
            });
          }
          break;

        case 'audio':
          if (mediaUrl.startsWith('data:')) {
            // ✅ DataURL → Buffer para áudios
            console.log('🎵 Convertendo áudio DataURL para Buffer...');
            const base64Data = mediaUrl.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');

            // ✅ CORREÇÃO PRINCIPAL: PROCESSAR METADADOS PTT
            // Detectar mimetype do DataURL
            const mimeMatch = mediaUrl.match(/data:([^;]+)/);
            const detectedMimeType = mimeMatch ? mimeMatch[1] : 'audio/mpeg';

            console.log(`🎙️ Metadados PTT recebidos: ptt=${ptt}, filename=${filename}, seconds=${seconds}`);
            console.log(`🎵 MIME type detectado: ${detectedMimeType}`);

            // Construir opções de áudio baseado nos metadados
            const audioOptions = {
              audio: buffer,
              fileName: filename || 'audio.mp3',
              mimetype: detectedMimeType
            };

            // ✅ ADICIONAR SUPORTE A PTT NATIVO
            if (ptt === true) {
              console.log('🎙️ ENVIANDO COMO ÁUDIO NATIVO PTT (Push-to-Talk)');
              audioOptions.ptt = true;

              // Adicionar duração se disponível
              if (seconds) {
                audioOptions.seconds = parseInt(seconds);
              }

              // Adicionar waveform se disponível (opcional)
              if (waveform) {
                audioOptions.waveform = waveform;
              }
            } else {
              console.log('🎵 Enviando como áudio normal (não-PTT)');
            }

            messageResult = await instance.socket.sendMessage(formattedPhone, audioOptions);
          } else {
            // URL HTTP normal - comportamento original
            messageResult = await instance.socket.sendMessage(formattedPhone, {
              audio: { url: mediaUrl },
              ptt: true
            });
          }
          break;

        case 'document':
          if (mediaUrl.startsWith('data:')) {
            // ✅ DataURL → Buffer para documentos
            console.log('📄 Convertendo documento DataURL para Buffer...');
            const base64Data = mediaUrl.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');

            // Detectar MIME type do DataURL
            const mimeMatch = mediaUrl.match(/data:([^;]+)/);
            const mimeType = mimeMatch ? mimeMatch[1] : 'application/pdf';

            messageResult = await instance.socket.sendMessage(formattedPhone, {
              document: buffer,
              fileName: 'documento.pdf', // nome fixo
              mimetype: mimeType
            });
          } else {
            // URL HTTP normal
            messageResult = await instance.socket.sendMessage(formattedPhone, {
              document: { url: mediaUrl },
              fileName: 'documento.pdf', // nome fixo
              mimetype: 'application/pdf'
            });
          }
          break;

        default:
          console.log('⚠️  Tipo de mídia não reconhecido, enviando como texto');
          messageResult = await instance.socket.sendMessage(formattedPhone, { text: message });
      }
    } else {
      // Mensagem de texto padrão
      messageResult = await instance.socket.sendMessage(formattedPhone, { text: message });
    }

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

// Sincronização periódica e de startup desativadas: manter apenas webhooks por evento

// Graceful Shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Encerrando servidor...');

  if (typeof syncInterval !== "undefined" && syncInterval) { clearInterval(syncInterval); }

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
      console.log(`🌐 Acesso: http://${process.env.SERVER_HOST || 'localhost'}:${PORT}`);
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
      console.log(`   📸 POST /instance/:id/process-profile-pic - Processar foto individual`);
      console.log(`   📸 POST /instance/:id/sync-profile-pics-bulk - Sincronização em massa`);
      console.log(`   📸 GET  /bulk-sync-status - Status da sincronização`);
      console.log(`   POST /queue/add-message - Enviar mensagem (via queue)`);
      console.log(`   POST /queue/add-broadcast - Envio em massa (broadcast)`);
      console.log(`   POST /queue/mark-as-read - Marcar mensagens como lidas`);
      console.log(`   POST /send - Enviar mensagem (endpoint original)`);
      console.log(`   POST /instance/:id/mark-read-conversation - Marcar mensagens como lidas`);
      console.log(`   POST /instance/:id/mark-read-messages - Marcar mensagens específicas como lidas`);
      console.log(`   GET  /read-messages-stats - Estatísticas da fila de read messages`);
      console.log(`   DELETE /read-messages-queue - Limpar fila de read messages`);
    });

    server.timeout = 60000;

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

// ================================
// 📦 ENDPOINTS ESSENCIAIS DE QUEUE
// ================================

// 📢 ENDPOINT BROADCAST: Envio em massa (para broadcast_messaging_service)
app.post('/queue/add-broadcast', authenticateToken, async (req, res) => {
  const { instanceId, contacts, message, mediaType, mediaUrl, rateLimitMs, campaignId } = req.body;

  console.log(`🔥 [BROADCAST] Recebida solicitação:`, {
    instanceId,
    contactsCount: Array.isArray(contacts) ? contacts.length : 1,
    messageLength: message?.length || 0,
    mediaType: mediaType || 'text',
    hasMediaUrl: !!mediaUrl,
    campaignId
  });

  if (!instanceId || !contacts || !message) {
    return res.status(400).json({
      success: false,
      error: 'instanceId, contacts e message são obrigatórios',
      timestamp: new Date().toISOString()
    });
  }

  // Verificar se instância existe
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
    const contactsArray = Array.isArray(contacts) ? contacts : [contacts];
    const rateLimit = rateLimitMs || 2000; // 2s padrão entre envios

    console.log(`📢 [BROADCAST] Processando ${contactsArray.length} contatos com rate limit de ${rateLimit}ms`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Processar envios com rate limiting
    for (let i = 0; i < contactsArray.length; i++) {
      const contact = contactsArray[i];
      const phone = contact.phone || contact;

      try {
        // Formatar número de telefone
        const formattedPhone = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;

        console.log(`📤 [BROADCAST] Enviando ${i + 1}/${contactsArray.length} para ${phone.substring(0, 6)}****`);

        // Preparar mensagem personalizada se necessário
        let personalizedMessage = message;
        if (contact.name && message.includes('{nome}')) {
          personalizedMessage = message.replace(/\{nome\}/g, contact.name);
        }

        // Enviar mensagem
        let messageResult;
        if (mediaType && mediaType !== 'text' && mediaUrl) {
          // Com mídia
          if (mediaUrl.startsWith('data:')) {
            const base64Data = mediaUrl.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');

            switch (mediaType.toLowerCase()) {
              case 'image':
                messageResult = await instance.socket.sendMessage(formattedPhone, {
                  image: buffer,
                  caption: personalizedMessage
                });
                break;
              case 'document':
                messageResult = await instance.socket.sendMessage(formattedPhone, {
                  document: buffer,
                  fileName: 'documento.pdf',
                  caption: personalizedMessage
                });
                break;
              default:
                messageResult = await instance.socket.sendMessage(formattedPhone, {
                  text: personalizedMessage
                });
            }
          } else {
            // URL externa
            switch (mediaType.toLowerCase()) {
              case 'image':
                messageResult = await instance.socket.sendMessage(formattedPhone, {
                  image: { url: mediaUrl },
                  caption: personalizedMessage
                });
                break;
              default:
                messageResult = await instance.socket.sendMessage(formattedPhone, {
                  text: personalizedMessage
                });
            }
          }
        } else {
          // Só texto
          messageResult = await instance.socket.sendMessage(formattedPhone, {
            text: personalizedMessage
          });
        }

        // Adicionar ao cache
        connectionManager.addSentMessageToCache(instanceId, messageResult.key.id, formattedPhone);

        results.push({
          phone,
          status: 'success',
          messageId: messageResult.key.id
        });
        successCount++;

        console.log(`✅ [BROADCAST] Sucesso ${i + 1}/${contactsArray.length}`);

      } catch (contactError) {
        console.error(`❌ [BROADCAST] Erro no contato ${phone}:`, contactError.message);
        results.push({
          phone,
          status: 'error',
          error: contactError.message
        });
        errorCount++;
      }

      // Rate limiting - pausar entre envios (exceto no último)
      if (i < contactsArray.length - 1) {
        await new Promise(resolve => setTimeout(resolve, rateLimit));
      }
    }

    res.json({
      success: true,
      message: 'Broadcast processado',
      campaignId,
      instanceId,
      summary: {
        total: contactsArray.length,
        success: successCount,
        errors: errorCount
      },
      results: results.slice(0, 10), // Retornar só os primeiros 10 para não sobrecarregar
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ [BROADCAST] Erro geral:`, error);
    res.status(500).json({
      success: false,
      error: 'Erro no processamento do broadcast',
      message: error.message,
      instanceId,
      timestamp: new Date().toISOString()
    });
  }
});

// 👁️ ENDPOINT MARK AS READ: Marcar mensagens como lidas (para readmessages_service)
app.post('/queue/mark-as-read', authenticateToken, async (req, res) => {
  const { instanceId, conversationId, messageIds, userId } = req.body;

  console.log(`🔥 [MARK READ] Recebida solicitação:`, {
    instanceId,
    conversationId: conversationId?.substring(0, 15) + '****',
    messageIdsCount: Array.isArray(messageIds) ? messageIds.length : 1,
    userId
  });

  if (!instanceId || !conversationId || !messageIds) {
    return res.status(400).json({
      success: false,
      error: 'instanceId, conversationId e messageIds são obrigatórios',
      timestamp: new Date().toISOString()
    });
  }

  // Verificar se instância existe
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
    const messageIdsArray = Array.isArray(messageIds) ? messageIds : [messageIds];
    const chatJid = conversationId.includes('@') ? conversationId : `${conversationId}@s.whatsapp.net`;

    console.log(`👁️ [MARK READ] Marcando ${messageIdsArray.length} mensagens como lidas para ${chatJid.substring(0, 15)}****`);

    // Usar ReadMessagesWorker se disponível
    if (readMessagesWorker) {
      const result = await readMessagesWorker.markSpecificMessagesAsRead(instanceId, chatJid, messageIdsArray);

      if (result.success) {
        res.json({
          success: true,
          message: 'Mensagens marcadas como lidas',
          instanceId,
          conversationId: chatJid,
          messagesMarked: result.messagesRead,
          method: 'worker',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          instanceId,
          conversationId: chatJid,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      // Fallback: usar Baileys diretamente
      await instance.socket.readMessages([{
        remoteJid: chatJid,
        id: messageIdsArray,
        participant: undefined
      }]);

      res.json({
        success: true,
        message: 'Mensagens marcadas como lidas',
        instanceId,
        conversationId: chatJid,
        messagesMarked: messageIdsArray.length,
        method: 'direct',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error(`❌ [MARK READ] Erro:`, error);
    res.status(500).json({
      success: false,
      error: 'Erro ao marcar mensagens como lidas',
      message: error.message,
      instanceId,
      timestamp: new Date().toISOString()
    });
  }
});

// Status das filas (simples)
app.get('/queue-status', (req, res) => {
  console.log('📦 Queue status solicitado');
  res.json({
    success: true,
    status: 'queues_basic',
    port: 3001,
    integration: 'CRM_READY',
    timestamp: new Date().toISOString()
  });
});

// 🚀 ENDPOINT QUEUE: Receber mensagens das Edge Functions
app.post('/queue/add-message', authenticateToken, async (req, res) => {
  const { instanceId, phone, message, mediaType, mediaUrl, ptt, filename, seconds, waveform, audioMimeType } = req.body;

  console.log(`🔥 [QUEUE] Recebida mensagem via /queue/add-message:`, {
    instanceId,
    phone: phone?.substring(0, 4) + '****',
    messageLength: message?.length || 0,
    mediaType: mediaType || 'text',
    hasMediaUrl: !!mediaUrl,
    isPTT: !!ptt
  });

  if (!instanceId || !phone || !message) {
    return res.status(400).json({
      success: false,
      error: 'instanceId, phone e message são obrigatórios',
      timestamp: new Date().toISOString()
    });
  }

  // Verificar se instância existe
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
    console.log(`📤 [QUEUE→SEND] Processando via ${instanceId} para ${phone}: ${message.substring(0, 50)}...`);

    // Formatar número de telefone
    const formattedPhone = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;

    // ✅ DETECTAR GRUPO SEM VALIDAÇÃO AUTOMÁTICA
    const isGroup = formattedPhone.endsWith('@g.us');
    if (isGroup) {
      console.log(`📱 [QUEUE] Detectado envio para grupo: ${formattedPhone.substring(0, 15)}****`);
      console.log(`⚡ [QUEUE] Pulando validação automática para evitar timeout do Baileys`);
    }

    // ✅ CONFIGURAR TIMEOUT ESPECÍFICO PARA GRUPOS
    const sendTimeout = isGroup ? 60000 : 30000; // 60s para grupos, 30s para contatos

    // Enviar mensagem via Baileys
    let messageResult;

    // ✅ SUPORTE COMPLETO A MÍDIA E DATAURL
    if (mediaType && mediaType !== 'text' && mediaUrl) {
      console.log(`🎬 [QUEUE] Enviando mídia tipo: ${mediaType}`);

      // Detectar tipos especiais
      const isDataUrl = mediaType.includes('_dataurl');
      const baseType = mediaType.replace('_dataurl', '');

      if (isDataUrl) {
        console.log('📱 [QUEUE] Detectada DataURL, processando...');
      }

      switch (baseType.toLowerCase()) {
        case 'image':
           if (mediaUrl.startsWith('data:')) {
             // ✅ DataURL → Buffer (para Baileys)
             console.log('📱 [QUEUE] Convertendo DataURL para Buffer...');
             const base64Data = mediaUrl.split(',')[1];
             const buffer = Buffer.from(base64Data, 'base64');

             if (isGroup) {
               // ✅ ENVIO OTIMIZADO PARA GRUPOS
               messageResult = await Promise.race([
                 instance.socket.sendMessage(formattedPhone, {
                   image: buffer
                 }, {
                   messageOptions: {
                     ephemeral: false,
                     linkPreview: false
                   }
                 }),
                 new Promise((_, reject) =>
                   setTimeout(() => reject(new Error(`Timeout sending image to group (${sendTimeout}ms)`)), sendTimeout)
                 )
               ]);
             } else {
               messageResult = await Promise.race([
                 instance.socket.sendMessage(formattedPhone, {
                   image: buffer
                 }),
                 new Promise((_, reject) =>
                   setTimeout(() => reject(new Error(`Timeout sending image to contact (${sendTimeout}ms)`)), sendTimeout)
                 )
               ]);
             }
           } else {
             // URL HTTP normal
             if (isGroup) {
               messageResult = await Promise.race([
                 instance.socket.sendMessage(formattedPhone, {
                   image: { url: mediaUrl }
                 }, {
                   messageOptions: {
                     ephemeral: false,
                     linkPreview: false
                   }
                 }),
                 new Promise((_, reject) =>
                   setTimeout(() => reject(new Error(`Timeout sending image to group (${sendTimeout}ms)`)), sendTimeout)
                 )
               ]);
             } else {
               messageResult = await Promise.race([
                 instance.socket.sendMessage(formattedPhone, {
                   image: { url: mediaUrl }
                 }),
                 new Promise((_, reject) =>
                   setTimeout(() => reject(new Error(`Timeout sending image to contact (${sendTimeout}ms)`)), sendTimeout)
                 )
               ]);
             }
           }
           break;

        case 'audio':
          if (mediaUrl.startsWith('data:')) {
            // ✅ DataURL → Buffer para áudios
            console.log('🎵 [QUEUE] Convertendo áudio DataURL para Buffer...');
            const base64Data = mediaUrl.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');

            // ✅ CORREÇÃO PRINCIPAL: PROCESSAR METADADOS PTT
            // Detectar mimetype do DataURL ou usar fornecido
            const mimeMatch = mediaUrl.match(/data:([^;]+)/);
            const detectedMimeType = audioMimeType || (mimeMatch ? mimeMatch[1] : 'audio/mpeg');

            console.log(`🎙️ [QUEUE] Metadados PTT recebidos: ptt=${ptt}, filename=${filename}, seconds=${seconds}`);
            console.log(`🎵 [QUEUE] MIME type usado: ${detectedMimeType}`);

            // Construir opções de áudio baseado nos metadados
            const audioOptions = {
              audio: buffer,
              fileName: filename || 'audio.mp3',
              mimetype: detectedMimeType
            };

            // ✅ ADICIONAR SUPORTE A PTT NATIVO
            if (ptt === true) {
              console.log('🎙️ [QUEUE] ENVIANDO COMO ÁUDIO NATIVO PTT (Push-to-Talk)');
              audioOptions.ptt = true;

              // Adicionar duração se disponível
              if (seconds) {
                audioOptions.seconds = parseInt(seconds);
              }

              // Adicionar waveform se disponível (opcional)
              if (waveform) {
                audioOptions.waveform = waveform;
              }
            } else {
              console.log('🎵 [QUEUE] Enviando como áudio normal (não-PTT)');
            }

            if (isGroup) {
              messageResult = await Promise.race([
                instance.socket.sendMessage(formattedPhone, audioOptions, {
                  messageOptions: {
                    ephemeral: false,
                    linkPreview: false
                  }
                }),
                new Promise((_, reject) =>
                  setTimeout(() => reject(new Error(`Timeout sending audio to group (${sendTimeout}ms)`)), sendTimeout)
                )
              ]);
            } else {
              messageResult = await Promise.race([
                instance.socket.sendMessage(formattedPhone, audioOptions),
                new Promise((_, reject) =>
                  setTimeout(() => reject(new Error(`Timeout sending audio to contact (${sendTimeout}ms)`)), sendTimeout)
                )
              ]);
            }
          }
          break;

        case 'video':
          if (mediaUrl.startsWith('data:')) {
            // ✅ DataURL → Buffer para vídeos
            console.log('📹 [QUEUE] Convertendo vídeo DataURL para Buffer...');
            const base64Data = mediaUrl.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');

            if (isGroup) {
              messageResult = await Promise.race([
                instance.socket.sendMessage(formattedPhone, {
                  video: buffer,
                  fileName: 'video.mp4'
                }, {
                  messageOptions: {
                    ephemeral: false,
                    linkPreview: false
                  }
                }),
                new Promise((_, reject) =>
                  setTimeout(() => reject(new Error(`Timeout sending video to group (${sendTimeout}ms)`)), sendTimeout)
                )
              ]);
            } else {
              messageResult = await Promise.race([
                instance.socket.sendMessage(formattedPhone, {
                  video: buffer,
                  fileName: 'video.mp4'
                }),
                new Promise((_, reject) =>
                  setTimeout(() => reject(new Error(`Timeout sending video to contact (${sendTimeout}ms)`)), sendTimeout)
                )
              ]);
            }
          }
          break;

        case 'document':
          if (mediaUrl.startsWith('data:')) {
            // ✅ DataURL → Buffer para documentos
            console.log('📄 [QUEUE] Convertendo documento DataURL para Buffer...');
            const base64Data = mediaUrl.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');

            // Detectar MIME type do DataURL
            const mimeMatch = mediaUrl.match(/data:([^;]+)/);
            const mimeType = mimeMatch ? mimeMatch[1] : 'application/pdf';

            if (isGroup) {
              messageResult = await Promise.race([
                instance.socket.sendMessage(formattedPhone, {
                  document: buffer,
                  fileName: 'documento.pdf',
                  mimetype: mimeType
                }, {
                  messageOptions: {
                    ephemeral: false,
                    linkPreview: false
                  }
                }),
                new Promise((_, reject) =>
                  setTimeout(() => reject(new Error(`Timeout sending document to group (${sendTimeout}ms)`)), sendTimeout)
                )
              ]);
            } else {
              messageResult = await Promise.race([
                instance.socket.sendMessage(formattedPhone, {
                  document: buffer,
                  fileName: 'documento.pdf',
                  mimetype: mimeType
                }),
                new Promise((_, reject) =>
                  setTimeout(() => reject(new Error(`Timeout sending document to contact (${sendTimeout}ms)`)), sendTimeout)
                )
              ]);
            }
          }
          break;

        default:
          console.log('⚠️ [QUEUE] Tipo de mídia não reconhecido, enviando como texto');
          if (isGroup) {
            messageResult = await Promise.race([
              instance.socket.sendMessage(formattedPhone, { text: message }, {
                messageOptions: {
                  ephemeral: false,
                  linkPreview: false
                }
              }),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Timeout sending fallback text to group (${sendTimeout}ms)`)), sendTimeout)
              )
            ]);
          } else {
            messageResult = await Promise.race([
              instance.socket.sendMessage(formattedPhone, { text: message }),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Timeout sending fallback text to contact (${sendTimeout}ms)`)), sendTimeout)
              )
            ]);
          }
      }
    } else {
      // Mensagem de texto com configuração otimizada para grupos
      console.log(`💬 [QUEUE] Enviando mensagem de texto ${isGroup ? '(GRUPO)' : '(CONTATO)'} - Timeout: ${sendTimeout}ms`);

      if (isGroup) {
        // ✅ CONFIGURAÇÃO OTIMIZADA PARA GRUPOS - EVITA VALIDAÇÃO AUTOMÁTICA
        messageResult = await Promise.race([
          instance.socket.sendMessage(formattedPhone, {
            text: message
          }, {
            // Opções para evitar validações automáticas do Baileys
            messageOptions: {
              ephemeral: false,
              linkPreview: false
            }
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout sending to group (${sendTimeout}ms)`)), sendTimeout)
          )
        ]);
      } else {
        // Envio normal para contatos individuais
        messageResult = await Promise.race([
          instance.socket.sendMessage(formattedPhone, { text: message }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout sending to contact (${sendTimeout}ms)`)), sendTimeout)
          )
        ]);
      }
    }

    // Adicionar ao cache para evitar reenvio de webhook
    connectionManager.addSentMessageToCache(instanceId, messageResult.key.id, formattedPhone);

    console.log(`✅ [QUEUE] Mensagem enviada com sucesso via ${instanceId}`);

    res.json({
      success: true,
      messageId: messageResult.key.id,
      instanceId,
      phone: formattedPhone,
      message: message,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ [QUEUE] Erro ao enviar mensagem via ${instanceId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Erro ao enviar mensagem',
      message: error.message,
      instanceId,
      timestamp: new Date().toISOString()
    });
  }
});