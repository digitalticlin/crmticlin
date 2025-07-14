require("dotenv").config();
const express = require("express");
const logger = require('./logger');
const crypto = require('crypto');
const { default: makeWASocket, makeInMemoryStore, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

global.crypto = crypto;

const app = express();

// Configurar handler para exceções não tratadas
logger.setupUncaughtExceptionHandler();
const PORT = 3002;

// CONFIGURAÇÃO SUPABASE (Edge Functions públicas corretas)
const SUPABASE_PROJECT = 'rhjgagzstjzynvrakdyj';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUxMzEwMCwiZXhwIjoyMDY2MDg5MTAwfQ.48XYhDq4XdVTqNhIHdskd6iMcJem38aHzk6U1psfRRM';

// ✅ WEBHOOKS CONFIGURADOS PARA BACKEND + N8N
const WEBHOOKS = {
  // QR Code para Supabase
  QR_RECEIVER: `https://${SUPABASE_PROJECT}.supabase.co/functions/v1/webhook_qr_receiver`,
  // Conexão estabelecida para Supabase
  CONNECTION_SYNC: `https://${SUPABASE_PROJECT}.supabase.co/functions/v1/auto_whatsapp_sync`,
  // MENSAGENS: BACKEND + N8N (webhooks duplos)
  BACKEND_MESSAGES: `https://${SUPABASE_PROJECT}.supabase.co/functions/v1/webhook_whatsapp_web`,
  N8N_MESSAGES: `https://novo-ticlin-n8n.eirfpl.easypanel.host/webhook/ticlingeral` // ✅ N8N CONFIGURADO
};

// ✅ CORREÇÃO: Declarar INSTANCES_FILE antes de usar
const INSTANCES_FILE = path.join(__dirname, 'instances.json');

// Carregar instâncias salvas
function loadInstances() {
  try {
    if (fs.existsSync(INSTANCES_FILE)) {
      const savedInstances = JSON.parse(fs.readFileSync(INSTANCES_FILE, 'utf8'));
      logger.info(`📁 ${Object.keys(savedInstances).length} instâncias carregadas do arquivo`);
      return savedInstances;
    }
  } catch (error) {
    logger.info('⚠️ Erro ao carregar instâncias:', error.message);
  }
  return {};
}

const instances = loadInstances();

// STORE BAILEYS PARA PERSISTÊNCIA DE DADOS
const store = makeInMemoryStore({
  logger: undefined
});

// Configurar persistência do store
const STORE_FILE = path.join(__dirname, 'store.json');

// Carregar store existente
if (fs.existsSync(STORE_FILE)) {
  try {
    const storeData = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
    store.fromJSON(storeData);
    logger.info('📁 Store carregado do arquivo');
  } catch (error) {
    logger.info('⚠️ Erro ao carregar store, criando novo');
  }
}

// Salvar store a cada 30 segundos
setInterval(() => {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(store.toJSON(), null, 2));
  } catch (error) {
    logger.error('❌ Erro ao salvar store:', error.message);
  }
}, 30000);

logger.info('🗃️ Store Baileys inicializado com persistência');

// Salvar instâncias
function saveInstances() {
  try {
    const instancesToSave = {};
    Object.keys(instances).forEach(id => {
      const instance = instances[id];
      if (instance) {
        instancesToSave[id] = {
          instanceId: instance.instanceId,
          status: instance.status,
          connected: instance.connected,
          phone: instance.phone,
          profileName: instance.profileName,
          lastUpdate: instance.lastUpdate,
          createdByUserId: instance.createdByUserId
        };
      }
    });
    fs.writeFileSync(INSTANCES_FILE, JSON.stringify(instancesToSave, null, 2));
  } catch (error) {
    logger.error('❌ Erro ao salvar instâncias:', error.message);
  }
}

// Salvar instâncias a cada 10 segundos
setInterval(saveInstances, 10000);

logger.info('💾 Sistema de persistência de instâncias ativado');

// Configurar diretório de persistência
const AUTH_DIR = path.join(__dirname, 'auth_info');
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  logger.info('📁 Diretório auth_info criado');
}

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// ✅ FUNÇÃO PARA FILTRAR MENSAGENS DE GRUPOS
function isGroupMessage(message) {
  const remoteJid = message.key?.remoteJid;
  return remoteJid?.endsWith('@g.us') || remoteJid?.includes('@g.us');
}

// ✅ FUNÇÃO PARA ENVIAR WEBHOOK COM RETRY
async function sendWebhook(url, data, type = 'general', maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`[Webhook ${type}] 📡 Enviando para: ${url} (Tentativa ${attempt})`);

      const response = await axios.post(url, data, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY
        }
      });

      logger.info(`[Webhook ${type}] ✅ Sucesso: ${response.status}`);
      return true;
    } catch (error) {
      logger.error(`[Webhook ${type}] ❌ Erro (Tentativa ${attempt}/${maxRetries}):`, error.response?.data || error.message);

      if (attempt === maxRetries) {
        logger.error(`[Webhook ${type}] 🚨 Falha após ${maxRetries} tentativas`);
        return false;
      }

      // Aguardar antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// Webhook: Enviar QR Code
async function notifyQRCodeGenerated(instanceId, qrCode) {
  const data = {
    event: 'qr_update',
    instanceId,
    instanceName: instanceId,
    qrCode,
    timestamp: new Date().toISOString()
  };
  await sendWebhook(WEBHOOKS.QR_RECEIVER, data, 'QR');
}

// Webhook: Conexão estabelecida
async function notifyConnectionEstablished(instanceId, phone, profileName) {
  const data = {
    event: 'connection_established',
    instanceId,
    instanceName: instanceId,
    status: 'connected',
    phone,
    profileName,
    timestamp: new Date().toISOString()
  };
  await sendWebhook(WEBHOOKS.CONNECTION_SYNC, data, 'Connection');
}

// ✅ WEBHOOK DUPLO: BACKEND + N8N (CONFORME SUA ARQUITETURA)
async function notifyMessageReceived(instanceId, messageData, createdByUserId = null) {
  try {
    // Tentar obter foto de perfil do remetente
    let profilePictureUrl = null;
    try {
      const instance = instances[instanceId];
      if (instance && instance.socket && messageData.from) {
        const cleanPhone = messageData.from.split('@')[0];
        profilePictureUrl = await instance.socket.profilePictureUrl(messageData.from, 'image');
      }
    } catch (error) {
      // Foto de perfil não disponível
      profilePictureUrl = null;
    }

    const webhookData = {
      event: 'message_received',
      instanceId,
      instanceName: instanceId,
      messageData: {
        ...messageData,
        profilePictureUrl,
        createdByUserId
      },
      messageDirection: messageData.fromMe ? 'outgoing' : 'incoming',
      timestamp: new Date().toISOString()
    };

    // ✅ ENVIO DUPLO: BACKEND + N8N (PARALELO)
    const promises = [
      sendWebhook(WEBHOOKS.BACKEND_MESSAGES, webhookData, 'Backend'),
    ];

    // ✅ ENVIO PARA N8N (SEMPRE ATIVO)
    promises.push(sendWebhook(WEBHOOKS.N8N_MESSAGES, webhookData, 'N8N'));

    // Executar em paralelo
    await Promise.allSettled(promises);

  } catch (error) {
    logger.error(`[${instanceId}] ❌ Erro ao enviar webhook de mensagem:`, error);
  }
}

// ✅ FUNÇÃO PRINCIPAL: Criar instância WhatsApp
async function createWhatsAppInstance(instanceId, createdByUserId = null) {
  try {
    logger.info(`🚀 Criando instância: ${instanceId}`);

    if (instances[instanceId]) {
      logger.info(`⚠️ Instância ${instanceId} já existe`);
      return instances[instanceId];
    }

    const authDir = path.join(AUTH_DIR, instanceId);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    const socket = makeWASocket({
      auth: state,
      logger: undefined,
      printQRInTerminal: false,
      browser: ['WhatsApp Server', 'Chrome', '1.0.0'],
      generateHighQualityLinkPreview: true,
      defaultQueryTimeoutMs: 60000
    });

    socket.store = store;
    store.bind(socket.ev);

    instances[instanceId] = {
      instanceId,
      socket,
      status: 'connecting',
      connected: false,
      qrCode: null,
      phone: null,
      profileName: null,
      lastUpdate: new Date().toISOString(),
      attempts: 0,
      createdByUserId
    };

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const qrCodeDataURL = await QRCode.toDataURL(qr);
          instances[instanceId].qrCode = qrCodeDataURL;
          instances[instanceId].status = 'waiting_qr';
          logger.info(`[${instanceId}] 📱 QR Code gerado`);
          await notifyQRCodeGenerated(instanceId, qrCodeDataURL);
        } catch (error) {
          logger.error(`[${instanceId}] ❌ Erro ao gerar QR Code:`, error);
        }
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        logger.info(`[${instanceId}] 🔌 Conexão fechada. Reconectar: ${shouldReconnect}`);

        if (shouldReconnect) {
          instances[instanceId].attempts = (instances[instanceId].attempts || 0) + 1;
          if (instances[instanceId].attempts < 5) {
            logger.info(`[${instanceId}] 🔄 Tentativa de reconexão ${instances[instanceId].attempts}/5`);
            setTimeout(() => createWhatsAppInstance(instanceId, createdByUserId), 5000);
          } else {
            logger.error(`[${instanceId}] ❌ Máximo de tentativas de reconexão atingido`);
            instances[instanceId].status = 'failed';
          }
        } else {
          delete instances[instanceId];
          logger.info(`[${instanceId}] 🚪 Instância desconectada permanentemente`);
        }
      } else if (connection === 'open') {
        logger.info(`[${instanceId}] ✅ Conectado com sucesso!`);
        instances[instanceId].status = 'ready';
        instances[instanceId].connected = true;
        instances[instanceId].qrCode = null;
        instances[instanceId].attempts = 0;

        const phoneNumber = socket.user?.id?.split('@')[0];
        const profileName = socket.user?.name || socket.user?.verifiedName || 'Usuário';

        instances[instanceId].phone = phoneNumber;
        instances[instanceId].profileName = profileName;

        await notifyConnectionEstablished(instanceId, phoneNumber, profileName);
      }
    });

    // ✅ HANDLER DE MENSAGENS: INCOMING + OUTGOING PARA BACKEND + N8N
    socket.ev.on('messages.upsert', async (messageUpdate) => {
      const messages = messageUpdate.messages;

      for (const message of messages) {
        if (message.message) {
          // ✅ FILTRO CRÍTICO: Ignorar mensagens de grupos
          if (isGroupMessage(message)) {
            logger.info(`[${instanceId}] 🚫 Mensagem de grupo ignorada: ${message.key?.remoteJid}`);
            continue;
          }

          // ✅ BILATERAL: Processar incoming E outgoing
          const isOutgoing = message.key?.fromMe || false;
          const direction = isOutgoing ? 'ENVIADA PARA' : 'RECEBIDA DE';

          // ✅ EXTRAÇÃO COMPLETA DE MÍDIA (TEXTO, IMAGEM, ÁUDIO, VÍDEO)
          let messageText = '';
          let mediaType = 'text';
          let mediaUrl = null;
          let mediaCaption = null;
          let fileName = null;

          const msg = message.message;

          if (msg.conversation) {
            messageText = msg.conversation;
            mediaType = 'text';
          } else if (msg.extendedTextMessage?.text) {
            messageText = msg.extendedTextMessage.text;
            mediaType = 'text';
          } else if (msg.imageMessage) {
            messageText = msg.imageMessage.caption || '[Imagem]';
            mediaCaption = msg.imageMessage.caption;
            mediaType = 'image';
            mediaUrl = msg.imageMessage.url || msg.imageMessage.directPath;
            fileName = 'image.' + (msg.imageMessage.mimetype?.split('/')[1] || 'jpg');
          } else if (msg.videoMessage) {
            messageText = msg.videoMessage.caption || '[Vídeo]';
            mediaCaption = msg.videoMessage.caption;
            mediaType = 'video';
            mediaUrl = msg.videoMessage.url || msg.videoMessage.directPath;
            fileName = 'video.' + (msg.videoMessage.mimetype?.split('/')[1] || 'mp4');
          } else if (msg.audioMessage) {
            messageText = '[Áudio]';
            mediaType = 'audio';
            mediaUrl = msg.audioMessage.url || msg.audioMessage.directPath;
            fileName = 'audio.' + (msg.audioMessage.mimetype?.split('/')[1] || 'ogg');
          } else if (msg.documentMessage) {
            messageText = msg.documentMessage.caption || msg.documentMessage.fileName || '[Documento]';
            mediaCaption = msg.documentMessage.caption;
            mediaType = 'document';
            mediaUrl = msg.documentMessage.url || msg.documentMessage.directPath;
            fileName = msg.documentMessage.fileName || 'document';
          } else if (msg.stickerMessage) {
            messageText = '[Sticker]';
            mediaType = 'sticker';
            mediaUrl = msg.stickerMessage.url || msg.stickerMessage.directPath;
          } else {
            messageText = '[Mensagem de mídia]';
            mediaType = 'unknown';
          }

          logger.info(`[${instanceId}] 📨 Mensagem ${direction} (${mediaType.toUpperCase()}): ${message.key.remoteJid} | ${messageText.substring(0, 50)}`);

          const messageData = {
            from: message.key.remoteJid,
            body: messageText,
            timestamp: message.messageTimestamp,
            fromMe: isOutgoing,
            direction: direction,
            mediaType: mediaType,
            mediaUrl: mediaUrl,
            mediaCaption: mediaCaption,
            fileName: fileName,
            messageId: message.key.id
          };

          // ✅ ENVIO PARA BACKEND + N8N
          await notifyMessageReceived(instanceId, messageData, createdByUserId);
        }
      }
    });

    return socket;
  } catch (error) {
    logger.error(`❌ Erro ao criar instância ${instanceId}:`, error);
    throw error;
  }
}

// ================================
// ENDPOINTS DA API
// ================================

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT,
    instances: Object.keys(instances).length,
    crypto: typeof crypto !== 'undefined' ? 'available' : 'unavailable',
    webhooks: {
      backend_enabled: true,
      n8n_enabled: true,
      endpoints: Object.keys(WEBHOOKS).length,
      urls: WEBHOOKS
    }
  });
});

// Status do servidor
app.get('/status', (req, res) => {
  const instancesData = Object.values(instances).map(inst => ({
    instanceId: inst.instanceId,
    status: inst.status,
    connected: inst.connected,
    phone: inst.phone,
    profileName: inst.profileName
  }));

  res.json({
    success: true,
    status: 'online',
    server: 'WhatsApp Server - BACKEND + N8N Integration',
    port: PORT,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    activeInstances: instancesData.length,
    instances: instancesData,
    memory: process.memoryUsage(),
    webhooks: WEBHOOKS
  });
});

// Listar instâncias
app.get('/instances', (req, res) => {
  const instancesData = Object.values(instances).map(inst => ({
    instanceId: inst.instanceId,
    status: inst.status,
    connected: inst.connected,
    phone: inst.phone,
    profileName: inst.profileName,
    hasQrCode: !!inst.qrCode
  }));

  res.json({
    success: true,
    instances: instancesData,
    total: instancesData.length
  });
});

// Criar instância
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
      error: 'Instância já existe'
    });
  }

  try {
    await createWhatsAppInstance(instanceId, createdByUserId);
    res.json({
      success: true,
      message: 'Instância criada com sucesso',
      instanceId: instanceId
    });
  } catch (error) {
    logger.error('Erro ao criar instância:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Obter QR Code
app.get('/instance/:instanceId/qr', (req, res) => {
  const { instanceId } = req.params;
  const instance = instances[instanceId];

  if (!instance) {
    return res.status(404).json({
      success: false,
      error: 'Instância não encontrada'
    });
  }

  if (!instance.qrCode) {
    return res.status(404).json({
      success: false,
      error: 'QR Code não disponível'
    });
  }

  res.json({
    success: true,
    qrCode: instance.qrCode,
    status: instance.status
  });
});

// Status de instância específica
app.get('/instance/:instanceId', (req, res) => {
  const { instanceId } = req.params;
  const instance = instances[instanceId];

  if (!instance) {
    return res.status(404).json({
      success: false,
      error: 'Instância não encontrada'
    });
  }

  res.json({
    success: true,
    instanceId: instance.instanceId,
    status: instance.status,
    connected: instance.connected,
    phone: instance.phone,
    profileName: instance.profileName,
    hasQrCode: !!instance.qrCode
  });
});

// ✅ ENVIAR MENSAGEM (SEM WEBHOOK DE RETORNO - EVITA LOOPS)
app.post('/send', async (req, res) => {
  try {
    const { instanceId, phone, message } = req.body;

    if (!instanceId || !phone || !message) {
      return res.status(400).json({
        success: false,
        error: 'instanceId, phone e message são obrigatórios'
      });
    }

    const instance = instances[instanceId];
    if (!instance || !instance.connected) {
      return res.status(404).json({
        success: false,
        error: 'Instância não encontrada ou não conectada'
      });
    }

    const formattedPhone = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
    
    // ✅ ENVIAR MENSAGEM (VPS NÃO GERA WEBHOOK PARA MENSAGENS ENVIADAS VIA API)
    const result = await instance.socket.sendMessage(formattedPhone, { text: message });

    logger.info(`[${instanceId}] ✅ Mensagem enviada para ${phone}: ${message.substring(0, 50)}`);

    res.json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      messageId: result.key.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Erro ao enviar mensagem:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Deletar instância (POST)
app.post('/instance/delete', (req, res) => {
  const { instanceId } = req.body;

  if (!instanceId) {
    return res.status(400).json({
      success: false,
      error: 'instanceId é obrigatório'
    });
  }

  if (!instances[instanceId]) {
    return res.status(404).json({
      success: false,
      error: 'Instância não encontrada'
    });
  }

  try {
    if (instances[instanceId].socket) {
      instances[instanceId].socket.end();
    }
    delete instances[instanceId];

    const authDir = path.join(AUTH_DIR, instanceId);
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true });
    }

    logger.info(`[${instanceId}] 🗑️ Instância deletada com sucesso`);

    res.json({
      success: true,
      message: 'Instância removida com sucesso'
    });
  } catch (error) {
    logger.error(`Erro ao deletar instância ${instanceId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Instância não encontrada'
    });
  }
});

// Deletar instância (DELETE)
app.delete('/instance/:instanceId', (req, res) => {
  const { instanceId } = req.params;

  if (instances[instanceId]) {
    if (instances[instanceId].socket) {
      instances[instanceId].socket.end();
    }
    delete instances[instanceId];

    const authDir = path.join(AUTH_DIR, instanceId);
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true });
    }
  }

  res.json({
    success: true,
    message: 'Instância removida'
  });
});

// ENDPOINT DEBUG - VERIFICAR STORE
app.get('/debug/store/:instanceId', (req, res) => {
  try {
    const { instanceId } = req.params;
    const instance = instances[instanceId];

    if (!instance) {
      return res.status(404).json({ error: 'Instância não encontrada' });
    }

    const socketStore = instance.socket?.store || store;

    res.json({
      success: true,
      instanceId,
      storeInfo: {
        storeAvailable: !!socketStore,
        totalContacts: Object.keys(socketStore.contacts || {}).length,
        totalChats: Object.keys(socketStore.chats || {}).length,
        totalMessages: Object.keys(socketStore.messages || {}).length,
        contactSample: Object.keys(socketStore.contacts || {}).slice(0, 3),
        chatSample: Object.keys(socketStore.chats || {}).slice(0, 3)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar store', message: error.message });
  }
});

// ✅ REMOVIDO: ENDPOINT /recreate-instances (CAUSAVA LOOPS INFINITOS)

// ================================
// CONFIGURAÇÕES DO SERVIDOR
// ================================

// Tratamento de erros globais
process.on('uncaughtException', (error) => {
  logger.error('🚨 Erro não capturado:', error);
  // Não encerrar o processo, apenas logar
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('🚨 Promise rejeitada não tratada:', reason);
  // Não encerrar o processo, apenas logar
});

process.on('SIGINT', () => {
  logger.info('🛑 Encerrando servidor...');
  Object.values(instances).forEach(instance => {
    if (instance.socket) {
      instance.socket.end();
    }
  });
  process.exit(0);
});

// Configuração do servidor com timeouts
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Servidor WhatsApp rodando na porta ${PORT}`);
  logger.info(`📡 Webhooks configurados:`);
  logger.info(`   📱 QR: ${WEBHOOKS.QR_RECEIVER}`);
  logger.info(`   ✅ Connection: ${WEBHOOKS.CONNECTION_SYNC}`);
  logger.info(`   💬 Backend: ${WEBHOOKS.BACKEND_MESSAGES}`);
  logger.info(`   🤖 N8N: ${WEBHOOKS.N8N_MESSAGES}`);
  logger.info(`🛡️ Crypto: ${typeof crypto !== 'undefined' ? 'DISPONÍVEL' : 'INDISPONÍVEL'}`);
  logger.info(`⚡ Integração: BACKEND + N8N`);
  logger.info(`🆕 Endpoints disponíveis:`);
  logger.info(`   GET /health - Health check`);
  logger.info(`   GET /status - Status do servidor`);
  logger.info(`   GET /instances - Listar instâncias`);
  logger.info(`   POST /instance/create - Criar instância`);
  logger.info(`   GET /instance/:id/qr - Obter QR Code`);
  logger.info(`   GET /instance/:id - Status da instância`);
  logger.info(`   POST /send - Enviar mensagem`);
  logger.info(`   POST /instance/delete - Deletar instância`);
  logger.info(`   DELETE /instance/:id - Deletar instância`);
  logger.info(`   GET /debug/store/:id - Debug do store`);
  logger.info(`📁 Auth Dir: ${AUTH_DIR}`);
  logger.info(`🚫 Filtro de grupos: ATIVADO`);
  logger.info(`🔄 Webhook duplo: BACKEND + N8N`);
  logger.info(`❌ Endpoint /recreate-instances: REMOVIDO (previne loops)`);
});

// ✅ RECONEXÃO AUTOMÁTICA SIMPLIFICADA (SEM RECREATE AUTOMÁTICO)
setTimeout(() => {
  const savedInstances = Object.keys(instances);
  if (savedInstances.length > 0) {
    logger.info(`🔄 Reconectando ${savedInstances.length} instâncias salvas...`);
    savedInstances.forEach(instanceId => {
      logger.info(`🔌 Reconectando instância: ${instanceId}`);
      createWhatsAppInstance(instanceId, instances[instanceId].createdByUserId);
    });
  } else {
    logger.info('📝 Nenhuma instância salva encontrada');
    logger.info('💡 Use POST /instance/create para criar novas instâncias');
  }
}, 5000);

// Configurações de timeout do servidor
server.timeout = 30000; // 30 segundos
server.keepAliveTimeout = 5000; // 5 segundos
server.headersTimeout = 6000; // 6 segundos

logger.info(`⏱️ Servidor configurado com timeouts:`);
logger.info(`   📡 Request timeout: 30s`);
logger.info(`   🔄 Keep alive: 5s`);
logger.info(`   📝 Headers timeout: 6s`); 