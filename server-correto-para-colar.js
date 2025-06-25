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

// CONFIGURAÇÃO SUPABASE (Edge Functions públicas corretas)
const SUPABASE_PROJECT = 'rhjgagzstjzynvrakdyj';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUxMzEwMCwiZXhwIjoyMDY2MDg5MTAwfQ.48XYhDq4XdVTqNhIHdskd6iMcJem38aHzk6U1psfRRM';

const SUPABASE_WEBHOOKS = {
  QR_RECEIVER: `https://${SUPABASE_PROJECT}.supabase.co/functions/v1/webhook_qr_receiver`,
  AUTO_SYNC_INSTANCES: `https://${SUPABASE_PROJECT}.supabase.co/functions/v1/auto_sync_instances`,
  AUTO_WHATSAPP_SYNC: `https://${SUPABASE_PROJECT}.supabase.co/functions/v1/auto_whatsapp_sync`,
  MESSAGE_RECEIVER: `https://${SUPABASE_PROJECT}.supabase.co/functions/v1/whatsapp_message_service`
};

const instances = {};

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

// Função para enviar webhook para o Supabase
async function sendSupabaseWebhook(url, data, type = 'general') {
  try {
    console.log(`[Supabase Webhook ${type}] 📡 Enviando para: ${url}`);
    
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
    console.error(`[Supabase Webhook ${type}] ❌ Erro:`, error.response?.data || error.message);
    return false;
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

// Webhook: Mensagem recebida
async function notifyMessageReceived(instanceId, messageData, createdByUserId = null) {
  const data = {
    event: 'message_received',
    instanceId,
    instanceName: instanceId,
    from: messageData.from,
    message: { text: messageData.body },
    timestamp: messageData.timestamp ? new Date(messageData.timestamp * 1000).toISOString() : new Date().toISOString(),
    createdByUserId,
    data: messageData
  };
  await sendSupabaseWebhook(SUPABASE_WEBHOOKS.MESSAGE_RECEIVER, data, 'Message');
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

    socket.ev.on('messages.upsert', async (messageUpdate) => {
      const messages = messageUpdate.messages;

      for (const message of messages) {
        if (!message.key.fromMe && message.message) {
          console.log(`[${instanceId}] 📨 Nova mensagem recebida`);

          const messageBody = message.message.conversation ||
                             message.message.extendedTextMessage?.text ||
                             message.message.imageMessage?.caption ||
                             'Mídia recebida';

          const messageData = {
            from: message.key.remoteJid,
            body: messageBody,
            timestamp: message.messageTimestamp
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
    server: 'WhatsApp Baileys Server',
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

// Importar histórico (COM CORREÇÕES)
app.post('/instance/:instanceId/import-history', async (req, res) => {
  const { instanceId } = req.params;
  const { importType = 'both', batchSize = 50, lastSyncTimestamp } = req.body;
  
  console.log(`[Import History] 📥 Solicitação para ${instanceId}:`, { importType, batchSize, lastSyncTimestamp });

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
    const socket = instance.socket;
    const contacts = [];
    const messages = [];

    // IMPORTAR CONTATOS - COM FILTROS CORRIGIDOS
    if (importType === 'contacts' || importType === 'both') {
      try {
        console.log(`[Import History] 👥 Obtendo contatos reais para ${instanceId}...`);
        
        const store = socket.store || {};
        const contactsFromStore = store.contacts || {};
        
        console.log(`[Import History] 📊 Total de contatos no store: ${Object.keys(contactsFromStore).length}`);
        
        let contactCount = 0;
        for (const [jid, contact] of Object.entries(contactsFromStore)) {
          if (contactCount >= batchSize) break;
          
          // CORREÇÃO 1: Filtrar grupos
          if (jid.includes('@s.whatsapp.net') && !jid.includes('@g.us')) {
            const phone = jid.split('@')[0];
            
            contacts.push({
              phone: phone,
              // CORREÇÃO 2: Nome limpo  
              name: contact.name || contact.notify || contact.verifiedName || `Lead-${phone.substring(phone.length - 4)}`,
              profilePictureUrl: null,
              lastMessageTime: null,
              source: 'whatsapp_import',
              instanceId: instanceId
            });
            
            contactCount++;
          }
        }
        
        console.log(`[Import History] ✅ ${contacts.length} contatos reais obtidos`);
      } catch (contactError) {
        console.error(`[Import History] ❌ Erro ao obter contatos:`, contactError);
      }
    }

    // IMPORTAR MENSAGENS - COM FILTROS CORRIGIDOS
    if (importType === 'messages' || importType === 'both') {
      try {
        console.log(`[Import History] 💬 Obtendo mensagens reais para ${instanceId}...`);
        
        const store = socket.store || {};
        const chatsFromStore = store.chats || {};
        
        console.log(`[Import History] 📊 Total de chats no store: ${Object.keys(chatsFromStore).length}`);
        
        let messageCount = 0;
        const processedChats = Object.values(chatsFromStore)
          .filter(chat => !chat.id.includes('@g.us')) // CORREÇÃO: Excluir grupos
          .slice(0, 10);
        
        for (const chat of processedChats) {
          if (messageCount >= batchSize) break;
          
          try {
            const chatMessages = store.messages?.[chat.id] || [];
            const recentMessages = Array.from(chatMessages.values()).slice(-10);
            
            for (const msg of recentMessages) {
              if (messageCount >= batchSize) break;
              
              if (msg.message && msg.key) {
                const messageText = msg.message.conversation || 
                                 msg.message.extendedTextMessage?.text || 
                                 msg.message.imageMessage?.caption ||
                                 msg.message.videoMessage?.caption ||
                                 '[Mídia]';

                if (lastSyncTimestamp && msg.messageTimestamp) {
                  const msgTime = new Date(msg.messageTimestamp * 1000);
                  const syncTime = new Date(lastSyncTimestamp);
                  if (msgTime <= syncTime) continue;
                }

                messages.push({
                  messageId: msg.key.id,
                  from: msg.key.remoteJid,
                  fromMe: !!msg.key.fromMe,
                  body: messageText,
                  timestamp: msg.messageTimestamp ? 
                            new Date(msg.messageTimestamp * 1000).toISOString() : 
                            new Date().toISOString(),
                  messageType: Object.keys(msg.message)[0] || 'text',
                  instanceId: instanceId,
                  chatId: chat.id
                });
                
                messageCount++;
              }
            }
          } catch (chatError) {
            console.error(`[Import History] ⚠️ Erro ao processar chat ${chat.id}:`, chatError.message);
          }
        }
        
        console.log(`[Import History] ✅ ${messages.length} mensagens reais obtidas`);
      } catch (messageError) {
        console.error(`[Import History] ❌ Erro ao obter mensagens:`, messageError);
      }
    }

    const response = {
      success: true,
      instanceId,
      importType,
      contacts: contacts,
      messages: messages,
      totalContacts: contacts.length,
      totalMessages: messages.length,
      timestamp: new Date().toISOString(),
      nextBatchAvailable: contacts.length >= batchSize || messages.length >= batchSize,
      storeInfo: {
        totalContactsInStore: Object.keys(instance.socket?.store?.contacts || {}).length,
        totalChatsInStore: Object.keys(instance.socket?.store?.chats || {}).length,
        storeAvailable: !!instance.socket?.store
      }
    };

    console.log(`[Import History] 🎉 Importação REAL concluída para ${instanceId}:`, {
      contacts: contacts.length,
      messages: messages.length,
      storeAvailable: !!instance.socket?.store
    });

    res.json(response);

  } catch (error) {
    console.error(`[Import History] ❌ Erro geral na importação:`, error);
    res.status(500).json({
      success: false,
      error: 'Erro interno na importação de histórico',
      message: error.message,
      instanceId,
      timestamp: new Date().toISOString()
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

process.on('SIGINT', () => {
  console.log('🛑 Encerrando servidor...');
  Object.values(instances).forEach(instance => {
    if (instance.socket) {
      instance.socket.end();
    }
  });
  process.exit(0);
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

// Configuração do servidor com timeouts
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor WhatsApp rodando na porta ${PORT}`);
  console.log(`📡 Supabase Webhooks configurados:`);
  console.log(`   📱 QR: ${SUPABASE_WEBHOOKS.QR_RECEIVER}`);
  console.log(`   🔄 Sync Instances: ${SUPABASE_WEBHOOKS.AUTO_SYNC_INSTANCES}`);
  console.log(`   ✅ Connection: ${SUPABASE_WEBHOOKS.AUTO_WHATSAPP_SYNC}`);
  console.log(`   💬 Messages: ${SUPABASE_WEBHOOKS.MESSAGE_RECEIVER}`);
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
  console.log(`   POST /instance/:id/import-history - Importar histórico`);
  console.log(`   POST /instance/delete - Deletar instância`);
  console.log(`📁 Auth Dir: ${AUTH_DIR}`);
});

// Configurações de timeout do servidor
server.timeout = 30000; // 30 segundos
server.keepAliveTimeout = 5000; // 5 segundos
server.headersTimeout = 6000; // 6 segundos

console.log(`⏱️ Servidor configurado com timeouts:`)
console.log(`   📡 Request timeout: 30s`)
console.log(`   🔄 Keep alive: 5s`)
console.log(`   📝 Headers timeout: 6s`);