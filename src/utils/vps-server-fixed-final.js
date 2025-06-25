// WhatsApp Web.js Server - CORREÇÃO DEFINITIVA COM ENDPOINTS DE IMPORTAÇÃO
const express = require('express');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { exec } = require('child_process');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3002;
const API_TOKEN = '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';

// VERSION CONTROL
const SERVER_VERSION = '4.1.0-IMPORT-ENDPOINTS';
const BUILD_DATE = new Date().toISOString();

console.log(`🚀 Iniciando WhatsApp Server ${SERVER_VERSION} - COM ENDPOINTS DE IMPORTAÇÃO`);
console.log(`📅 Build: ${BUILD_DATE}`);

// Configurar CORS e parsing
app.use(cors());
app.use(express.json());

// Configuração Puppeteer VPS (PRESERVADA EXATA)
const VPS_PUPPETEER_CONFIG = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--single-process',
    '--disable-gpu',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-features=TranslateUI,VizDisplayCompositor',
    '--disable-ipc-flooding-protection',
    '--disable-extensions',
    '--disable-default-apps',
    '--disable-sync',
    '--disable-translate',
    '--disable-plugins',
    '--disable-plugins-discovery',
    '--disable-web-security',
    '--memory-pressure-off',
    '--max_old_space_size=512'
  ],
  ignoreHTTPSErrors: true,
  timeout: 60000
};

// Armazenamento de instâncias
const instances = new Map();

// Diretório de persistência
const SESSIONS_DIR = path.join(__dirname, '.wwebjs_auth');

// Middleware de autenticação (PRESERVADO EXATO)
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || token !== API_TOKEN) {
    return res.status(401).json({ 
      success: false, 
      error: 'Token de autenticação inválido',
      code: 'AUTH_FAILED'
    });
  }

  next();
}

// Garantir diretório de sessões (PRESERVADO EXATO)
async function ensureSessionDirectory() {
  try {
    if (!fs.existsSync(SESSIONS_DIR)) {
      fs.mkdirSync(SESSIONS_DIR, { recursive: true });
      console.log('📂 Diretório de sessões criado:', SESSIONS_DIR);
    }
  } catch (error) {
    console.error('❌ Erro ao criar diretório de sessões:', error);
  }
}

// Inicialização do cliente WhatsApp (PRESERVADA EXATA)
async function initializeWhatsAppClient(instanceId, sessionName, webhookUrl = null) {
  try {
    console.log(`[${instanceId}] 🚀 Inicializando cliente WhatsApp...`);
    
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: sessionName,
        dataPath: SESSIONS_DIR
      }),
      puppeteer: VPS_PUPPETEER_CONFIG
    });

    // Armazenar cliente imediatamente
    instances.set(instanceId, {
      client,
      sessionName,
      webhookUrl,
      status: 'initializing',
      createdAt: new Date().toISOString(),
      qrCode: null,
      phone: null,
      profileName: null,
      lastSeen: new Date().toISOString(),
      messages: []
    });

    console.log(`[${instanceId}] ✅ Instância armazenada`);
    
    // Timeout para evitar travamento
    const initTimeout = setTimeout(() => {
      console.log(`[${instanceId}] ⏰ Timeout na inicialização`);
      const instance = instances.get(instanceId);
      if (instance && instance.status === 'initializing') {
        instance.status = 'waiting_qr';
        instance.lastSeen = new Date().toISOString();
      }
    }, 45000);

    // Event handlers (PRESERVADOS EXATOS)
    client.on('qr', async (qr) => {
      try {
        console.log(`[${instanceId}] 📱 QR Code recebido!`);
        
        const qrBase64 = await qrcode.toDataURL(qr, { type: 'png' });
        
        const instance = instances.get(instanceId);
        if (instance) {
          instance.qrCode = qrBase64;
          instance.status = 'qr_ready';
          instance.lastSeen = new Date().toISOString();
          
          console.log(`[${instanceId}] ✅ QR Code salvo`);
          
          if (webhookUrl) {
            sendWebhook(webhookUrl, {
              event: 'qr.update',
              instanceName: sessionName,
              instanceId: instanceId,
              data: { qrCode: qrBase64 },
              timestamp: new Date().toISOString()
            }).catch(console.error);
          }
        }
      } catch (error) {
        console.error(`[${instanceId}] ❌ Erro ao processar QR:`, error);
        const instance = instances.get(instanceId);
        if (instance) {
          instance.status = 'qr_error';
          instance.error = error.message;
        }
      }
    });

    client.on('ready', () => {
      console.log(`[${instanceId}] 🎉 Cliente pronto!`);
      clearTimeout(initTimeout);
      const instance = instances.get(instanceId);
      if (instance) {
        instance.status = 'ready';
        instance.qrCode = null;
        instance.phone = client.info?.wid?.user || null;
        instance.profileName = client.info?.pushname || null;
        instance.lastSeen = new Date().toISOString();
        
        if (webhookUrl) {
          sendWebhook(webhookUrl, {
            event: 'connection.update',
            instanceName: sessionName,
            instanceId: instanceId,
            data: { 
              status: 'ready',
              phone: instance.phone,
              profileName: instance.profileName
            },
            timestamp: new Date().toISOString()
          }).catch(console.error);
        }
      }
    });

    client.on('authenticated', () => {
      console.log(`[${instanceId}] 🔐 Cliente autenticado`);
      clearTimeout(initTimeout);
      const instance = instances.get(instanceId);
      if (instance) {
        instance.status = 'authenticated';
        instance.lastSeen = new Date().toISOString();
      }
    });

    client.on('auth_failure', (msg) => {
      console.error(`[${instanceId}] ❌ Falha de autenticação:`, msg);
      const instance = instances.get(instanceId);
      if (instance) {
        instance.status = 'auth_failed';
        instance.error = msg;
        instance.lastSeen = new Date().toISOString();
      }
    });

    client.on('disconnected', (reason) => {
      console.log(`[${instanceId}] 🔌 Desconectado:`, reason);
      const instance = instances.get(instanceId);
      if (instance) {
        instance.status = 'disconnected';
        instance.error = reason;
        instance.lastSeen = new Date().toISOString();
      }
    });

    client.on('message_create', async (message) => {
      console.log(`[${instanceId}] 💬 Nova mensagem:`, {
        from: message.from,
        fromMe: message.fromMe,
        body: message.body?.substring(0, 50) + '...'
      });
      
      const instance = instances.get(instanceId);
      if (instance) {
        instance.messages.push({
          id: message.id._serialized || message.id,
          from: message.from,
          fromMe: message.fromMe,
          body: message.body,
          timestamp: new Date().toISOString()
        });
        
        if (instance.messages.length > 50) {
          instance.messages = instance.messages.slice(-50);
        }
      }
      
      if (webhookUrl) {
        try {
          await sendWebhook(webhookUrl, {
            event: 'messages.upsert',
            instanceName: sessionName,
            instanceId: instanceId,
            data: { 
              messages: [{
                key: {
                  id: message.id._serialized || message.id,
                  remoteJid: message.fromMe ? message.to : message.from,
                  fromMe: message.fromMe
                },
                message: {
                  conversation: message.body
                }
              }] 
            },
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error(`[${instanceId}] ❌ Erro webhook:`, error.message);
        }
      }
    });

    console.log(`[${instanceId}] 🔄 Iniciando processo Puppeteer...`);
    client.initialize().catch(error => {
      console.error(`[${instanceId}] ❌ Erro na inicialização:`, error.message);
      const instance = instances.get(instanceId);
      if (instance) {
        instance.status = 'init_error';
        instance.error = error.message;
        instance.lastSeen = new Date().toISOString();
      }
    });
    
  } catch (error) {
    console.error(`[${instanceId}] ❌ Erro geral:`, error.message);
    const instance = instances.get(instanceId);
    if (instance) {
      instance.status = 'error';
      instance.error = error.message;
      instance.lastSeen = new Date().toISOString();
    }
  }
}

// CORREÇÃO: Função sendWebhook usando require() ao invés de dynamic import
async function sendWebhook(webhookUrl, data) {
  try {
    // CORREÇÃO: Usar require() tradicional ao invés de dynamic import
    let fetch;
    try {
      fetch = require('node-fetch');
    } catch (error) {
      console.log('⚠️ node-fetch não disponível, pulando webhook');
      return;
    }
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify(data),
      timeout: 10000
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    console.log('✅ Webhook enviado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao enviar webhook:', error.message);
  }
}

// NOVO: Função para extrair histórico de mensagens do WhatsApp Web.js
async function extractWhatsAppHistory(client, importType = 'both', batchSize = 50) {
  try {
    console.log(`📚 Extraindo histórico: ${importType}, limite: ${batchSize}`);
    
    const result = {
      contacts: [],
      messages: []
    };

    if (importType === 'contacts' || importType === 'both') {
      // Extrair contatos
      const contacts = await client.getContacts();
      console.log(`👥 Encontrados ${contacts.length} contatos`);
      
      result.contacts = contacts.slice(0, batchSize).map(contact => ({
        id: contact.id._serialized,
        name: contact.name || contact.pushname || `Contato-${contact.number}`,
        pushname: contact.pushname,
        phone: contact.number,
        isMyContact: contact.isMyContact,
        isUser: contact.isUser,
        isGroup: contact.isGroup,
        profilePicUrl: contact.profilePicUrl || null
      }));
    }

    if (importType === 'messages' || importType === 'both') {
      // Extrair mensagens dos chats mais recentes
      const chats = await client.getChats();
      console.log(`💬 Encontrados ${chats.length} chats`);
      
      let totalMessages = 0;
      
      for (const chat of chats.slice(0, Math.min(10, chats.length))) {
        if (totalMessages >= batchSize) break;
        
        try {
          const messages = await chat.fetchMessages({ 
            limit: Math.min(5, batchSize - totalMessages) 
          });
          
          for (const message of messages) {
            if (totalMessages >= batchSize) break;
            
            result.messages.push({
              id: message.id._serialized,
              from: message.from,
              to: message.to,
              body: message.body,
              timestamp: message.timestamp * 1000, // Converter para milliseconds
              fromMe: message.fromMe,
              type: message.type,
              chatId: chat.id._serialized,
              chatName: chat.name || 'Chat Privado',
              hasMedia: message.hasMedia,
              mediaType: message.type !== 'chat' ? message.type : null
            });
            
            totalMessages++;
          }
        } catch (chatError) {
          console.error(`⚠️ Erro ao extrair mensagens do chat ${chat.name}:`, chatError.message);
          continue;
        }
      }
      
      console.log(`📤 Total de mensagens extraídas: ${totalMessages}`);
    }

    return result;
  } catch (error) {
    console.error('❌ Erro na extração do histórico:', error);
    throw error;
  }
}

// === ENDPOINTS DA API ===

// CORREÇÃO: Health check com JSON válido
app.get('/health', (req, res) => {
  const instancesList = Array.from(instances.entries()).map(([id, instance]) => ({
    id,
    status: instance.status,
    phone: instance.phone,
    hasQR: !!instance.qrCode,
    session: instance.sessionName
  }));

  res.json({
    success: true,
    status: 'online',
    server: 'WhatsApp VPS Server',
    version: SERVER_VERSION,
    build_date: BUILD_DATE,
    port: PORT,
    timestamp: new Date().toISOString(),
    active_instances: instances.size,
    instances: instancesList,
    import_endpoints: true
  });
});

// CORREÇÃO: Status do servidor com JSON válido
app.get('/status', (req, res) => {
  console.log('📋 Status do servidor solicitado');
  
  const instancesList = Array.from(instances.entries()).map(([id, instance]) => ({
    id,
    status: instance.status,
    phone: instance.phone,
    hasQR: !!instance.qrCode,
    session: instance.sessionName,
    lastSeen: instance.lastSeen,
    messageCount: instance.messages?.length || 0
  }));

  res.json({
    success: true,
    version: SERVER_VERSION,
    activeInstances: instances.size,
    totalInstances: instances.size,
    puppeteerConfig: 'VPS_OPTIMIZED',
    instances: instancesList,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    import_ready: true
  });
});

// Listar instâncias (PRESERVADO EXATO)
app.get('/instances', authenticateToken, (req, res) => {
  console.log('📋 Listando todas as instâncias...');
  
  const instancesList = [];
  
  for (const [instanceId, instance] of instances.entries()) {
    instancesList.push({
      instanceId: instanceId,
      status: instance.status,
      sessionName: instance.sessionName,
      phone: instance.phone,
      profileName: instance.profileName,
      lastSeen: instance.lastSeen,
      hasQR: !!instance.qrCode,
      error: instance.error || null,
      createdAt: instance.createdAt,
      messageCount: instance.messages?.length || 0
    });
  }
  
  console.log(`📊 Encontradas ${instancesList.length} instâncias`);
  
  res.json({
    success: true,
    instances: instancesList,
    total: instancesList.length,
    server_version: SERVER_VERSION,
    timestamp: new Date().toISOString()
  });
});

// Criar instância (PRESERVADO EXATO)
app.post('/instance/create', authenticateToken, async (req, res) => {
  try {
    const { instanceId, sessionName, webhookUrl } = req.body;
    
    console.log(`🔥 CRIAÇÃO: ${instanceId} (${sessionName})`);
    
    if (!instanceId || !sessionName) {
      return res.status(400).json({
        success: false,
        error: 'instanceId e sessionName são obrigatórios'
      });
    }
    
    if (instances.has(instanceId)) {
      return res.status(409).json({
        success: false,
        error: 'Instância já existe',
        instanceId: instanceId
      });
    }
    
    const finalWebhookUrl = webhookUrl || 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web';
    
    console.log(`[${instanceId}] ⚡ Resposta imediata - inicializando em background`);
    
    setImmediate(() => {
      initializeWhatsAppClient(instanceId, sessionName, finalWebhookUrl);
    });
    
    res.json({
      success: true,
      instanceId,
      sessionName,
      status: 'creating',
      message: 'Instância sendo criada - aguarde 30s para QR code',
      webhookUrl: finalWebhookUrl,
      server_version: SERVER_VERSION
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar instância:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      server_version: SERVER_VERSION
    });
  }
});

// NOVO: Status individual da instância
app.get('/instance/:instanceId/status', authenticateToken, (req, res) => {
  try {
    const { instanceId } = req.params;
    
    console.log(`📊 Status solicitado para instância: ${instanceId}`);
    
    const instance = instances.get(instanceId);
    
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instância não encontrada',
        instanceId: instanceId
      });
    }
    
    const response = {
      success: true,
      instanceId,
      status: instance.status,
      phone: instance.phone,
      profileName: instance.profileName,
      hasQR: !!instance.qrCode,
      lastSeen: instance.lastSeen,
      error: instance.error || null,
      createdAt: instance.createdAt,
      messageCount: instance.messages?.length || 0,
      connected: instance.status === 'ready',
      canImport: instance.status === 'ready' && instance.client
    };
    
    console.log(`✅ Status retornado para ${instanceId}:`, {
      status: response.status,
      connected: response.connected,
      canImport: response.canImport
    });
    
    res.json(response);
  } catch (error) {
    console.error('❌ Erro ao obter status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// NOVO: Endpoint de importação de histórico
app.post('/instance/:instanceId/import-history', authenticateToken, async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { importType = 'both', batchSize = 50, lastSyncTimestamp } = req.body;
    
    console.log(`📚 Importação de histórico solicitada:`, {
      instanceId,
      importType,
      batchSize,
      lastSync: lastSyncTimestamp
    });
    
    const instance = instances.get(instanceId);
    
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instância não encontrada',
        instanceId: instanceId
      });
    }
    
    if (!instance.client) {
      return res.status(400).json({
        success: false,
        error: 'Cliente WhatsApp não disponível',
        status: instance.status
      });
    }
    
    if (instance.status !== 'ready') {
      return res.status(400).json({
        success: false,
        error: `Instância não está pronta. Status: ${instance.status}`,
        currentStatus: instance.status
      });
    }
    
    console.log(`🚀 Iniciando extração do histórico para ${instanceId}`);
    
    // Extrair histórico do WhatsApp
    const historyData = await extractWhatsAppHistory(
      instance.client, 
      importType, 
      parseInt(batchSize)
    );
    
    const response = {
      success: true,
      instanceId,
      importType,
      contacts: historyData.contacts || [],
      messages: historyData.messages || [],
      summary: {
        contactsCount: historyData.contacts?.length || 0,
        messagesCount: historyData.messages?.length || 0,
        totalImported: (historyData.contacts?.length || 0) + (historyData.messages?.length || 0)
      },
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ Histórico extraído com sucesso:`, {
      instanceId,
      contacts: response.summary.contactsCount,
      messages: response.summary.messagesCount,
      total: response.summary.totalImported
    });
    
    res.json(response);
    
  } catch (error) {
    console.error(`❌ Erro na importação de histórico:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Erro interno na extração do histórico'
    });
  }
});

// GET QR Code (PRESERVADO EXATO)
app.get('/instance/:instanceId/qr', authenticateToken, (req, res) => {
  try {
    const { instanceId } = req.params;
    
    console.log(`📱 GET QR Code para instância: ${instanceId}`);
    
    const instance = instances.get(instanceId);
    
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instância não encontrada',
        instanceId: instanceId
      });
    }
    
    if (instance.qrCode) {
      res.json({
        success: true,
        qrCode: instance.qrCode,
        status: instance.status,
        instanceId: instanceId,
        timestamp: new Date().toISOString(),
        has_qr_code: true
      });
    } else {
      res.json({
        success: false,
        error: 'QR Code ainda não disponível',
        status: instance.status,
        message: instance.status === 'ready' ? 'Instância já conectada' : 
                instance.status === 'initializing' ? 'Aguarde - inicializando cliente' :
                instance.status === 'waiting_qr' ? 'Cliente carregado - gerando QR' :
                'QR Code sendo gerado',
        instanceId: instanceId,
        has_qr_code: false,
        info: {
          created_at: instance.createdAt,
          last_seen: instance.lastSeen,
          current_status: instance.status
        }
      });
    }
  } catch (error) {
    console.error('❌ Erro ao obter QR Code:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST QR Code (PRESERVADO EXATO)
app.post('/instance/qr', authenticateToken, (req, res) => {
  try {
    const { instanceId } = req.body;
    
    if (!instanceId) {
      return res.status(400).json({
        success: false,
        error: 'instanceId é obrigatório'
      });
    }
    
    const instance = instances.get(instanceId);
    
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instância não encontrada'
      });
    }
    
    if (instance.qrCode) {
      res.json({
        success: true,
        qrCode: instance.qrCode,
        status: instance.status,
        instanceId: instanceId,
        timestamp: new Date().toISOString(),
        has_qr_code: true
      });
    } else {
      res.json({
        success: false,
        error: 'QR Code ainda não disponível',
        status: instance.status,
        message: instance.status === 'ready' ? 'Instância já conectada' : 
                instance.status === 'initializing' ? 'Aguarde - inicializando cliente' :
                instance.status === 'waiting_qr' ? 'Cliente carregado - gerando QR' :
                'QR Code sendo gerado',
        instanceId: instanceId,
        has_qr_code: false,
        info: {
          created_at: instance.createdAt,
          last_seen: instance.lastSeen,
          current_status: instance.status
        }
      });
    }
  } catch (error) {
    console.error('❌ Erro ao obter QR Code:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Enviar mensagem
app.post('/send', authenticateToken, async (req, res) => {
  try {
    const { instanceId, phone, message } = req.body;
    
    if (!instanceId || !phone || !message) {
      return res.status(400).json({
        success: false,
        error: 'instanceId, phone e message são obrigatórios'
      });
    }
    
    const instance = instances.get(instanceId);
    if (!instance || !instance.client) {
      return res.status(404).json({
        success: false,
        error: 'Instância não encontrada ou não conectada'
      });
    }
    
    if (instance.status !== 'ready') {
      return res.status(400).json({
        success: false,
        error: 'Instância não está pronta. Status: ' + instance.status
      });
    }
    
    const formattedPhone = phone.includes('@') ? phone : phone + '@s.whatsapp.net';
    
    const sentMessage = await instance.client.sendMessage(formattedPhone, message);
    
    console.log(`[${instanceId}] 📤 Mensagem enviada para ${phone}`);
    
    res.json({
      success: true,
      messageId: sentMessage.id._serialized || sentMessage.id,
      timestamp: new Date().toISOString(),
      phone: formattedPhone
    });
    
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Deletar instância
app.delete('/instance/:instanceId', authenticateToken, async (req, res) => {
  try {
    const { instanceId } = req.params;
    
    const instance = instances.get(instanceId);
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instância não encontrada'
      });
    }
    
    if (instance.client) {
      try {
        await instance.client.destroy();
        console.log(`[${instanceId}] 🗑️ Cliente destruído`);
      } catch (error) {
        console.error(`[${instanceId}] ⚠️ Erro ao destruir:`, error);
      }
    }
    
    instances.delete(instanceId);
    
    console.log(`[${instanceId}] ✅ Instância removida completamente`);
    
    res.json({
      success: true,
      message: 'Instância deletada com sucesso',
      instanceId: instanceId
    });
    
  } catch (error) {
    console.error('❌ Erro ao deletar instância:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handler
app.use((error, req, res, next) => {
  console.error('❌ Erro no servidor:', error);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    timestamp: new Date().toISOString(),
    version: SERVER_VERSION
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Encerrando servidor...');
  
  for (const [instanceId, instance] of instances.entries()) {
    if (instance.client) {
      try {
        await instance.client.destroy();
        console.log(`[${instanceId}] 🔌 Cliente desconectado`);
      } catch (error) {
        console.error(`[${instanceId}] ❌ Erro ao desconectar:`, error);
      }
    }
  }
  
  console.log('✅ Shutdown concluído');
  process.exit(0);
});

// Inicializar servidor
async function startServer() {
  await ensureSessionDirectory();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 WhatsApp VPS Server (CORREÇÃO INCREMENTAL) na porta ${PORT}`);
    console.log(`📊 Health: http://31.97.24.222:${PORT}/health`);
    console.log(`📋 Status: http://31.97.24.222:${PORT}/status`);
    console.log(`📱 Instances: http://31.97.24.222:${PORT}/instances`);
    console.log(`🔑 Token: ${API_TOKEN.substring(0, 10)}...`);
    console.log(`📱 Versão: ${SERVER_VERSION}`);
    console.log(`✅ CORREÇÕES IMPLEMENTADAS:`);
    console.log(`📊 - Endpoint /status corrigido (JSON válido)`);
    console.log(`🔍 - Endpoint /instance/:id/status implementado`);
    console.log(`📚 - Endpoint /instance/:id/import-history implementado`);
    console.log(`🔧 - Sistema de extração de histórico do WhatsApp Web.js`);
    console.log(`📝 - Logs estruturados para debugging`);
  });
}

startServer().catch(console.error);

module.exports = app;
