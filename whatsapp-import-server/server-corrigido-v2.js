const express = require('express');
const crypto = require('crypto');
const { default: makeWASocket, makeInMemoryStore, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

global.crypto = crypto;

const app = express();
const PORT = 3002;

// CONFIGURAÇÃO SUPABASE (Edge Functions públicas corretas)
const SUPABASE_PROJECT = 'rhjgagzstjzynvrakdyj';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUxMzEwMCwiZXhwIjoyMDY2MDg5MTAwfQ.48XYhDq4XdVTqNhIHdskd6iMcJem38aHzk6U1psfRRM';

// ✅ WEBHOOKS SUPABASE - INCLUINDO NOVO WEBHOOK DE BACKUP
const SUPABASE_WEBHOOKS = {
  QR_RECEIVER: `https://${SUPABASE_PROJECT}.supabase.co/functions/v1/webhook_qr_receiver`,
  AUTO_SYNC_INSTANCES: `https://${SUPABASE_PROJECT}.supabase.co/functions/v1/auto_sync_instances`,
  AUTO_WHATSAPP_SYNC: `https://${SUPABASE_PROJECT}.supabase.co/functions/v1/auto_whatsapp_sync`,
  MESSAGE_RECEIVER: `https://${SUPABASE_PROJECT}.supabase.co/functions/v1/webhook_whatsapp_web`,
  MESSAGE_BACKUP: `https://${SUPABASE_PROJECT}.supabase.co/functions/v1/webhook_message_backup`
};

// ✅ CORREÇÃO: Declarar INSTANCES_FILE antes de usar
const INSTANCES_FILE = path.join(__dirname, 'instances.json');

// Carregar instâncias salvas
function loadInstances() {
  try {
    if (fs.existsSync(INSTANCES_FILE)) {
      const savedInstances = JSON.parse(fs.readFileSync(INSTANCES_FILE, 'utf8'));
      console.log(`📁 ${Object.keys(savedInstances).length} instâncias carregadas do arquivo`);
      return savedInstances;
    }
  } catch (error) {
    console.log('⚠️ Erro ao carregar instâncias:', error.message);
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
    console.log('📁 Store carregado do arquivo');
  } catch (error) {
    console.log('⚠️ Erro ao carregar store, criando novo');
  }
}

// Salvar store a cada 30 segundos
setInterval(() => {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(store.toJSON(), null, 2));
  } catch (error) {
    console.error('❌ Erro ao salvar store:', error.message);
  }
}, 30000);

console.log('🗃️ Store Baileys inicializado com persistência');

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
    console.error('❌ Erro ao salvar instâncias:', error.message);
  }
}

// Salvar instâncias a cada 10 segundos
setInterval(saveInstances, 10000);

console.log('💾 Sistema de persistência de instâncias ativado');

// Configurar diretório de persistência
const AUTH_DIR = path.join(__dirname, 'auth_info');
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  console.log('📁 Diretório auth_info criado');
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
async function sendSupabaseWebhook(url, data, type = 'general', maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Supabase Webhook ${type}] 📡 Enviando para: ${url} (Tentativa ${attempt})`);

      const response = await axios.post(url, data, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY
        }
      });

      console.log(`[Supabase Webhook ${type}] ✅ Sucesso: ${response.status}`);
      return true;
    } catch (error) {
      console.error(`[Supabase Webhook ${type}] ❌ Erro (Tentativa ${attempt}/${maxRetries}):`, error.response?.data || error.message);
      
      if (attempt === maxRetries) {
        console.error(`[Supabase Webhook ${type}] 🚨 Falha após ${maxRetries} tentativas`);
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
  await sendSupabaseWebhook(SUPABASE_WEBHOOKS.QR_RECEIVER, data, 'QR');
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
  await sendSupabaseWebhook(SUPABASE_WEBHOOKS.AUTO_WHATSAPP_SYNC, data, 'Connection');
}

// ✅ WEBHOOK DUPLO: Mensagem recebida - PRINCIPAL + BACKUP
async function notifyMessageReceived(instanceId, messageData, createdByUserId = null) {
  try {
    // Tentar obter foto de perfil do remetente
    let profilePictureUrl = null;
    try {
      const instance = instances[instanceId];
      if (instance && instance.socket && messageData.from) {
        const cleanPhone = messageData.from.split('@')[0];
        if (cleanPhone && cleanPhone.length > 5) {
          profilePictureUrl = await instance.socket.profilePictureUrl(messageData.from, 'image');
        }
      }
    } catch (profileError) {
      console.log(`📸 Não foi possível obter foto de perfil para ${messageData.from}`);
    }

    const data = {
      event: 'message_received',
      instanceId,
      instanceName: instanceId,
      from: messageData.from,
      message: { text: messageData.body },
      timestamp: messageData.timestamp ? new Date(messageData.timestamp * 1000).toISOString() : new Date().toISOString(),
      createdByUserId,
      messageStatus: 'delivered',
      messageDirection: messageData.fromMe ? 'outgoing' : 'incoming',
      profilePictureUrl: profilePictureUrl,
      hasProfilePicture: !!profilePictureUrl,
      data: messageData
    };

    // ✅ ENVIAR PARA WEBHOOK PRINCIPAL
    const primarySuccess = await sendSupabaseWebhook(SUPABASE_WEBHOOKS.MESSAGE_RECEIVER, data, 'Message');
    
    // ✅ ENVIAR PARA WEBHOOK BACKUP
    const backupSuccess = await sendSupabaseWebhook(SUPABASE_WEBHOOKS.MESSAGE_BACKUP, data, 'Backup');
    
    // Log do resultado
    if (primarySuccess && backupSuccess) {
      console.log(`[Webhook] ✅ Mensagem enviada com sucesso para ambos os webhooks`);
    } else if (primarySuccess) {
      console.log(`[Webhook] ⚠️ Mensagem enviada apenas para webhook principal`);
    } else if (backupSuccess) {
      console.log(`[Webhook] ⚠️ Mensagem enviada apenas para webhook backup`);
    } else {
      console.log(`[Webhook] ❌ Falha em ambos os webhooks`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao notificar mensagem:', error.message);
  }
}

// Função para criar instância WhatsApp
async function createWhatsAppInstance(instanceId, createdByUserId = null) {
  try {
    console.log(`🚀 Criando instância: ${instanceId}`);

    const authDir = path.join(AUTH_DIR, instanceId);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    const socket = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ['WhatsApp CRM', 'Chrome', '1.0.0'],
      connectTimeoutMs: 30000,
      defaultQueryTimeoutMs: 30000,
      receiveFullHistory: false,
      syncFullHistory: false
    });

    // CONECTAR SOCKET AO STORE
    store.bind(socket.ev);

    // Definir store no socket para acesso posterior
    socket.store = store;

    instances[instanceId] = {
      socket,
      instanceId,
      instanceName: instanceId,
      status: 'connecting',
      phone: null,
      profileName: null,
      connected: false,
      qrCode: null,
      lastUpdate: new Date(),
      attempts: 0,
      createdByUserId
    };

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      console.log(`[${instanceId}] 🔄 Connection update:`, connection);

      instances[instanceId].lastUpdate = new Date();

      if (qr) {
        console.log(`[${instanceId}] 📱 QR Code gerado`);
        try {
          const qrCodeDataURL = await QRCode.toDataURL(qr);
          instances[instanceId].qrCode = qrCodeDataURL;
          instances[instanceId].status = 'waiting_qr';
          await notifyQRCodeGenerated(instanceId, qrCodeDataURL);
        } catch (error) {
          console.error(`[${instanceId}] ❌ Erro ao gerar QR Code:`, error);
        }
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log(`[${instanceId}] 🔴 Conexão fechada. Reconectar:`, shouldReconnect);

        if (shouldReconnect) {
          instances[instanceId].attempts = (instances[instanceId].attempts || 0) + 1;
          if (instances[instanceId].attempts < 5) {
            setTimeout(() => createWhatsAppInstance(instanceId, createdByUserId), 3000);
          }
        } else {
          instances[instanceId].status = 'logged_out';
          instances[instanceId].connected = false;
        }
      } else if (connection === 'open') {
        console.log(`[${instanceId}] ✅ Conectado com sucesso!`);
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

    // ✅ HANDLER DE MENSAGENS COM FILTRO DE GRUPOS
    socket.ev.on('messages.upsert', async (messageUpdate) => {
      const messages = messageUpdate.messages;

      for (const message of messages) {
        if (message.message) {
          // ✅ FILTRO CRÍTICO: Ignorar mensagens de grupos
          if (isGroupMessage(message)) {
            console.log(`[${instanceId}] 🚫 Mensagem de grupo ignorada: ${message.key?.remoteJid}`);
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

          console.log(`[${instanceId}] 📨 Mensagem ${direction} (${mediaType.toUpperCase()}): ${message.key.remoteJid} | ${messageText.substring(0, 50)}`);

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

          await notifyMessageReceived(instanceId, messageData, createdByUserId);
        }
      }
    });

    return socket;
  } catch (error) {
    console.error(`❌ Erro ao criar instância ${instanceId}:`, error);
    throw error;
  }
}

// ENDPOINTS DA API

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT,
    instances: Object.keys(instances).length,
    crypto: typeof crypto !== 'undefined' ? 'available' : 'unavailable',
    webhooks: {
      supabase_enabled: true,
      endpoints: Object.keys(SUPABASE_WEBHOOKS).length,
      urls: SUPABASE_WEBHOOKS
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
    server: 'WhatsApp Baileys Server - BILATERAL + MÍDIA COMPLETA + FILTRO GRUPOS',
    port: PORT,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    activeInstances: instancesData.length,
    instances: instancesData,
    memory: process.memoryUsage(),
    webhooks: SUPABASE_WEBHOOKS
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
    console.error('Erro ao criar instância:', error);
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
      message: 'Instância não encontrada'
    });
  }

  res.json({
    success: true,
    instanceId: instance.instanceId,
    status: instance.status,
    phone: instance.phone,
    profileName: instance.profileName,
    connected: instance.connected,
    lastUpdate: instance.lastUpdate,
    connectionAttempts: instance.attempts || 0,
    createdByUserId: instance.createdByUserId
  });
});

// Enviar mensagem
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
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instância não encontrada'
      });
    }

    if (!instance.connected || !instance.socket) {
      return res.status(400).json({
        success: false,
        error: 'Instância não está conectada'
      });
    }

    const chatId = phone.includes('@') ? phone : `${phone}@c.us`;
    const messageResult = await instance.socket.sendMessage(chatId, { text: message });

    res.json({
      success: true,
      messageId: messageResult.key.id,
      message: 'Mensagem enviada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Deletar instância
app.post('/instance/delete', (req, res) => {
  const { instanceId } = req.body;

  if (!instanceId) {
    return res.status(400).json({
      success: false,
      error: 'instanceId é obrigatório'
    });
  }

  if (instances[instanceId]) {
    if (instances[instanceId].socket) {
      instances[instanceId].socket.end();
    }
    delete instances[instanceId];

    const authDir = path.join(AUTH_DIR, instanceId);
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true });
    }

    res.json({
      success: true,
      message: 'Instância deletada com sucesso'
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Instância não encontrada'
    });
  }
});

// Deletar instância (método alternativo)
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

// ✅ ENDPOINT PARA RECRIAR INSTÂNCIAS AUTOMATICAMENTE
app.post('/recreate-instances', async (req, res) => {
  try {
    console.log('🔄 Iniciando recriação automática de instâncias...');
    
    // Verificar diretórios auth_info existentes
    const authDirs = fs.readdirSync(AUTH_DIR).filter(dir => {
      const fullPath = path.join(AUTH_DIR, dir);
      return fs.statSync(fullPath).isDirectory();
    });
    
    console.log(`📁 Encontrados ${authDirs.length} diretórios de autenticação:`, authDirs);
    
    const recreatedInstances = [];
    
    for (const instanceId of authDirs) {
      try {
        console.log(`🚀 Recriando instância: ${instanceId}`);
        
        // Verificar se já existe
        if (instances[instanceId]) {
          console.log(`⚠️ Instância ${instanceId} já existe, pulando...`);
          continue;
        }
        
        // Criar instância
        await createWhatsAppInstance(instanceId);
        recreatedInstances.push(instanceId);
        
        console.log(`✅ Instância ${instanceId} recriada com sucesso`);
        
        // Aguardar 2 segundos entre criações
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Erro ao recriar instância ${instanceId}:`, error.message);
      }
    }
    
    res.json({
      success: true,
      message: 'Recriação de instâncias concluída',
      totalFound: authDirs.length,
      totalRecreated: recreatedInstances.length,
      recreatedInstances: recreatedInstances,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro na recriação de instâncias:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Tratamento de erros globais
process.on('uncaughtException', (error) => {
  console.error('🚨 Erro não capturado:', error);
  // Não encerrar o processo, apenas logar
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Promise rejeitada não tratada:', reason);
  // Não encerrar o processo, apenas logar
});

process.on('SIGINT', () => {
  console.log('🛑 Encerrando servidor...');
  Object.values(instances).forEach(instance => {
    if (instance.socket) {
      instance.socket.end();
    }
  });
  process.exit(0);
});

// Configuração do servidor com timeouts
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor WhatsApp rodando na porta ${PORT}`);
  console.log(`📡 Supabase Webhooks configurados:`);
  console.log(`   📱 QR: ${SUPABASE_WEBHOOKS.QR_RECEIVER}`);
  console.log(`   🔄 Sync Instances: ${SUPABASE_WEBHOOKS.AUTO_SYNC_INSTANCES}`);
  console.log(`   ✅ Connection: ${SUPABASE_WEBHOOKS.AUTO_WHATSAPP_SYNC}`);
  console.log(`   💬 Messages: ${SUPABASE_WEBHOOKS.MESSAGE_RECEIVER}`);
  console.log(`   🔄 Backup: ${SUPABASE_WEBHOOKS.MESSAGE_BACKUP}`);
  console.log(`🛡️ Crypto: ${typeof crypto !== 'undefined' ? 'DISPONÍVEL' : 'INDISPONÍVEL'}`);
  console.log(`⚡ Edge Functions: ${Object.keys(SUPABASE_WEBHOOKS).length} endpoints públicos`);
  console.log(`🆕 Endpoints disponíveis:`);
  console.log(`   GET /health - Health check`);
  console.log(`   GET /status - Status do servidor`);
  console.log(`   GET /instances - Listar instâncias`);
  console.log(`   POST /instance/create - Criar instância`);
  console.log(`   GET /instance/:id/qr - Obter QR Code`);
  console.log(`   GET /instance/:id - Status da instância`);
  console.log(`   POST /send - Enviar mensagem`);
  console.log(`   POST /instance/delete - Deletar instância`);
  console.log(`   GET /debug/store/:id - Debug do store`);
  console.log(`   POST /recreate-instances - Recriar instâncias automaticamente`);
  console.log(`📁 Auth Dir: ${AUTH_DIR}`);
  console.log(`🚫 Filtro de grupos: ATIVADO`);
  console.log(`🔄 Webhook duplo: ATIVADO`);
});

// ✅ RECONEXÃO AUTOMÁTICA MELHORADA
setTimeout(() => {
  const savedInstances = Object.keys(instances);
  if (savedInstances.length > 0) {
    console.log(`🔄 Reconectando ${savedInstances.length} instâncias salvas...`);
    savedInstances.forEach(instanceId => {
      console.log(`🔌 Reconectando instância: ${instanceId}`);
      createWhatsAppInstance(instanceId, instances[instanceId].createdByUserId);
    });
  } else {
    console.log('📝 Nenhuma instância salva encontrada');
    
    // Verificar se há diretórios auth_info para recriar
    try {
      const authDirs = fs.readdirSync(AUTH_DIR).filter(dir => {
        const fullPath = path.join(AUTH_DIR, dir);
        return fs.statSync(fullPath).isDirectory();
      });
      
      if (authDirs.length > 0) {
        console.log(`🔍 Encontrados ${authDirs.length} diretórios de autenticação`);
        console.log(`💡 Use POST /recreate-instances para recriar automaticamente`);
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar diretórios auth_info:', error.message);
    }
  }
}, 5000);

// Configurações de timeout do servidor
server.timeout = 30000; // 30 segundos
server.keepAliveTimeout = 5000; // 5 segundos
server.headersTimeout = 6000; // 6 segundos

console.log(`⏱️ Servidor configurado com timeouts:`);
console.log(`   📡 Request timeout: 30s`);
console.log(`   🔄 Keep alive: 5s`);
console.log(`   📝 Headers timeout: 6s`); 