
// SERVIDOR WHATSAPP SEM PUPPETEER - USANDO BAILEYS
// NÍVEL 8 - CORREÇÃO COMPLETA
// Substitui server.js na VPS

const express = require('express');
const { DisconnectReason, useMultiFileAuthState, makeWASocket, MessageType, delay } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;

// Configurações
app.use(cors());
app.use(express.json());

// Armazenamento de instâncias
const instances = new Map();
const sessionsDir = path.join(__dirname, 'sessions');

// Criar diretório de sessões se não existir
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
}

console.log('🚀 WhatsApp Server BAILEYS (SEM PUPPETEER) iniciando...');

// Middleware de autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const expectedToken = process.env.VPS_API_TOKEN || '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';

  if (!token || token !== expectedToken) {
    return res.status(401).json({ 
      success: false, 
      error: 'Token de autenticação inválido' 
    });
  }

  next();
}

// ENDPOINT: Health Check
app.get('/health', (req, res) => {
  const activeInstances = Array.from(instances.values()).filter(i => i.status === 'connected').length;
  
  res.json({
    success: true,
    status: 'online',
    server: 'WhatsApp Server BAILEYS (SEM PUPPETEER)',
    version: '5.0.0-BAILEYS',
    timestamp: new Date().toISOString(),
    activeInstances,
    engine: 'BAILEYS',
    puppeteer: 'DISABLED',
    port: PORT,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage()
  });
});

// ENDPOINT: Criar Instância (COM BAILEYS)
app.post('/instance/create', authenticateToken, async (req, res) => {
  const { instanceId, sessionName, webhookUrl } = req.body;

  if (!instanceId) {
    return res.status(400).json({
      success: false,
      error: 'instanceId é obrigatório'
    });
  }

  try {
    console.log(`📱 Criando instância Baileys: ${instanceId}`);

    // Verificar se já existe
    if (instances.has(instanceId)) {
      return res.status(409).json({
        success: false,
        error: 'Instância já existe'
      });
    }

    // Criar nova instância
    const instanceData = {
      instanceId,
      sessionName: sessionName || instanceId,
      webhookUrl,
      status: 'creating',
      socket: null,
      qrCode: null,
      phone: null,
      profileName: null,
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      messageCount: 0,
      error: null
    };

    instances.set(instanceId, instanceData);

    // Inicializar Baileys (assíncrono)
    initializeBaileysInstance(instanceId, webhookUrl)
      .catch(error => {
        console.error(`❌ Erro ao inicializar Baileys ${instanceId}:`, error);
        const instance = instances.get(instanceId);
        if (instance) {
          instance.status = 'error';
          instance.error = error.message;
        }
      });

    res.json({
      success: true,
      instanceId,
      sessionName: sessionName || instanceId,
      webhookUrl,
      status: 'creating',
      message: 'Instância Baileys criada - inicializando',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Erro ao criar instância ${instanceId}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// FUNÇÃO: Inicializar instância Baileys
async function initializeBaileysInstance(instanceId, webhookUrl) {
  try {
    console.log(`🔄 Inicializando Baileys para: ${instanceId}`);

    const sessionDir = path.join(sessionsDir, instanceId);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    const socket = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: { level: 'error', log: () => {} }, // Logs mínimos
      connectTimeoutMs: 30000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 10000,
      generateHighQualityLinkPreview: false,
      syncFullHistory: false,
      shouldSyncHistoryMessage: () => false
    });

    const instance = instances.get(instanceId);
    if (!instance) return;

    instance.socket = socket;

    // Event: Credenciais atualizadas
    socket.ev.on('creds.update', saveCreds);

    // Event: Estado de conexão
    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      console.log(`🔗 Conexão ${instanceId}:`, connection);

      if (qr) {
        try {
          const qrCodeDataURL = await qrcode.toDataURL(qr);
          instance.qrCode = qrCodeDataURL;
          instance.status = 'waiting_scan';
          
          console.log(`📱 QR Code gerado para ${instanceId}`);
          
          // Webhook notificação QR
          if (webhookUrl) {
            sendWebhook(webhookUrl, {
              event: 'qr.update',
              instance: instanceId,
              qrCode: qrCodeDataURL
            });
          }
        } catch (error) {
          console.error(`❌ Erro ao gerar QR Code ${instanceId}:`, error);
          instance.error = error.message;
        }
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        
        console.log(`❌ Conexão fechada ${instanceId}, reconectar:`, shouldReconnect);
        
        if (shouldReconnect) {
          instance.status = 'reconnecting';
          // Reconectar após delay
          setTimeout(() => initializeBaileysInstance(instanceId, webhookUrl), 5000);
        } else {
          instance.status = 'disconnected';
          instance.socket = null;
        }
      } else if (connection === 'open') {
        console.log(`✅ Conectado ${instanceId}`);
        
        instance.status = 'connected';
        instance.qrCode = null;
        instance.lastSeen = new Date().toISOString();
        
        // Obter informações do perfil
        try {
          const user = socket.user;
          if (user) {
            instance.phone = user.id.split(':')[0];
            instance.profileName = user.name || user.notify || 'WhatsApp User';
          }
        } catch (error) {
          console.log(`⚠️ Erro ao obter perfil ${instanceId}:`, error.message);
        }

        // Webhook notificação conectado
        if (webhookUrl) {
          sendWebhook(webhookUrl, {
            event: 'connection.update',
            instance: instanceId,
            status: 'connected',
            phone: instance.phone,
            profileName: instance.profileName
          });
        }
      }
    });

    // Event: Mensagens recebidas
    socket.ev.on('messages.upsert', (m) => {
      const messages = m.messages;
      for (const message of messages) {
        if (!message.key.fromMe && webhookUrl) {
          instance.messageCount++;
          
          sendWebhook(webhookUrl, {
            event: 'messages.upsert',
            instance: instanceId,
            data: message
          });
        }
      }
    });

  } catch (error) {
    console.error(`❌ Erro fatal Baileys ${instanceId}:`, error);
    const instance = instances.get(instanceId);
    if (instance) {
      instance.status = 'error';
      instance.error = error.message;
    }
  }
}

// ENDPOINT: Obter QR Code
app.get('/instance/:instanceId/qr', authenticateToken, (req, res) => {
  const { instanceId } = req.params;
  const instance = instances.get(instanceId);

  if (!instance) {
    return res.status(404).json({
      success: false,
      error: 'Instância não encontrada',
      instanceId
    });
  }

  if (instance.qrCode) {
    res.json({
      success: true,
      qrCode: instance.qrCode,
      instanceId,
      timestamp: new Date().toISOString()
    });
  } else if (instance.status === 'connected') {
    res.json({
      success: false,
      error: 'Instância já conectada',
      status: 'connected',
      instanceId
    });
  } else {
    res.json({
      success: false,
      error: 'QR Code não disponível',
      status: instance.status,
      instanceId,
      message: instance.status === 'creating' ? 'Ainda inicializando' : 'Aguarde a geração do QR Code',
      timestamp: new Date().toISOString()
    });
  }
});

// ENDPOINT: Status da Instância
app.get('/instance/:instanceId', authenticateToken, (req, res) => {
  const { instanceId } = req.params;
  const instance = instances.get(instanceId);

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
    phone: instance.phone,
    profileName: instance.profileName,
    hasQR: !!instance.qrCode,
    error: instance.error,
    createdAt: instance.createdAt,
    lastSeen: instance.lastSeen,
    messageCount: instance.messageCount,
    timestamp: new Date().toISOString()
  });
});

// ENDPOINT: Listar Instâncias
app.get('/instances', authenticateToken, (req, res) => {
  const instancesList = Array.from(instances.values()).map(instance => ({
    instanceId: instance.instanceId,
    status: instance.status,
    sessionName: instance.sessionName,
    phone: instance.phone,
    profileName: instance.profileName,
    lastSeen: instance.lastSeen,
    hasQR: !!instance.qrCode,
    error: instance.error,
    createdAt: instance.createdAt,
    messageCount: instance.messageCount
  }));

  res.json({
    success: true,
    instances: instancesList,
    total: instancesList.length,
    timestamp: new Date().toISOString()
  });
});

// ENDPOINT: Enviar Mensagem
app.post('/send', authenticateToken, async (req, res) => {
  const { instanceId, phone, message } = req.body;

  if (!instanceId || !phone || !message) {
    return res.status(400).json({
      success: false,
      error: 'instanceId, phone e message são obrigatórios'
    });
  }

  const instance = instances.get(instanceId);
  if (!instance || !instance.socket) {
    return res.status(404).json({
      success: false,
      error: 'Instância não encontrada ou não conectada'
    });
  }

  try {
    const formattedPhone = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
    
    await instance.socket.sendMessage(formattedPhone, { text: message });
    
    instance.messageCount++;
    
    res.json({
      success: true,
      instanceId,
      phone,
      message: 'Mensagem enviada com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Erro ao enviar mensagem ${instanceId}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ENDPOINT: Deletar Instância
app.post('/instance/delete', authenticateToken, async (req, res) => {
  const { instanceId } = req.body;

  if (!instanceId) {
    return res.status(400).json({
      success: false,
      error: 'instanceId é obrigatório'
    });
  }

  try {
    const instance = instances.get(instanceId);
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instância não encontrada'
      });
    }

    // Fechar socket se existir
    if (instance.socket) {
      try {
        await instance.socket.logout();
        instance.socket.end();
      } catch (error) {
        console.log(`⚠️ Erro ao fechar socket ${instanceId}:`, error.message);
      }
    }

    // Remover sessão
    const sessionDir = path.join(sessionsDir, instanceId);
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    }

    // Remover da memória
    instances.delete(instanceId);

    console.log(`🗑️ Instância deletada: ${instanceId}`);

    res.json({
      success: true,
      instanceId,
      message: 'Instância deletada com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Erro ao deletar instância ${instanceId}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// FUNÇÃO: Enviar Webhook
async function sendWebhook(webhookUrl, data) {
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  } catch (error) {
    console.error('❌ Erro ao enviar webhook:', error.message);
  }
}

// Error handler
app.use((error, req, res, next) => {
  console.error('❌ Erro no servidor:', error);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint não encontrado',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WhatsApp Server BAILEYS rodando na porta ${PORT}`);
  console.log(`📡 Health: http://localhost:${PORT}/health`);
  console.log(`🔧 Criar: POST http://localhost:${PORT}/instance/create`);
  console.log(`📱 QR Code: GET http://localhost:${PORT}/instance/{id}/qr`);
  console.log(`💬 Enviar: POST http://localhost:${PORT}/send`);
  console.log(`🗑️ Deletar: POST http://localhost:${PORT}/instance/delete`);
  console.log(`✅ PUPPETEER ELIMINADO - USANDO BAILEYS`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Encerrando servidor Baileys...');
  
  // Fechar todas as instâncias
  for (const [instanceId, instance] of instances) {
    if (instance.socket) {
      try {
        instance.socket.end();
      } catch (error) {
        console.log(`⚠️ Erro ao fechar ${instanceId}:`, error.message);
      }
    }
  }
  
  process.exit(0);
});

module.exports = app;
