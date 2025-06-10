
// WhatsApp VPS Server - LIVRE DE SYNTAXERROR v5.0.0-CORRIGIDO
const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3002;
const API_TOKEN = '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';

// VERSION CONTROL - CORRIGIDO
const SERVER_VERSION = '5.0.0-SYNTAXERROR-FIXED';
const BUILD_DATE = new Date().toISOString();

console.log('🚀 Iniciando WhatsApp Server ' + SERVER_VERSION + ' - SEM SYNTAXERROR');
console.log('📅 Build: ' + BUILD_DATE);

// Configurar CORS e parsing
app.use(cors());
app.use(express.json());

// Configuração Puppeteer VPS
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

// Middleware de autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || token !== API_TOKEN) {
    return res.status(401).json({ 
      success: false, 
      error: 'Token de autenticação inválido'
    });
  }

  next();
}

// Garantir diretório de sessões
async function ensureSessionDirectory() {
  try {
    if (!fs.existsSync(SESSIONS_DIR)) {
      fs.mkdirSync(SESSIONS_DIR, { recursive: true });
      console.log('📂 Diretório de sessões criado: ' + SESSIONS_DIR);
    }
  } catch (error) {
    console.error('❌ Erro ao criar diretório de sessões: ' + error.message);
  }
}

// CORREÇÃO: Função sendWebhook usando require tradicional (SEM DYNAMIC IMPORT)
async function sendWebhook(webhookUrl, data) {
  try {
    console.log('📤 Enviando webhook: ' + webhookUrl);
    
    // CORREÇÃO: Usar require tradicional do node-fetch se disponível
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
        'Authorization': 'Bearer ' + API_TOKEN
      },
      body: JSON.stringify(data),
      timeout: 10000
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error('HTTP ' + response.status + ': ' + errorText);
    }

    console.log('✅ Webhook enviado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao enviar webhook: ' + error.message);
  }
}

// Inicialização do cliente WhatsApp - CORRIGIDO
async function initializeWhatsAppClient(instanceId, sessionName, webhookUrl) {
  try {
    console.log('[' + instanceId + '] 🚀 Inicializando cliente WhatsApp...');
    
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

    console.log('[' + instanceId + '] ✅ Instância armazenada');
    
    // Timeout para evitar travamento
    const initTimeout = setTimeout(function() {
      console.log('[' + instanceId + '] ⏰ Timeout na inicialização - mantendo instância ativa');
      const instance = instances.get(instanceId);
      if (instance && instance.status === 'initializing') {
        instance.status = 'waiting_qr';
        instance.lastSeen = new Date().toISOString();
      }
    }, 120000);

    // Event handlers
    client.on('qr', async function(qr) {
      try {
        console.log('[' + instanceId + '] 📱 QR Code recebido!');
        
        const qrBase64 = await qrcode.toDataURL(qr, { type: 'png' });
        
        const instance = instances.get(instanceId);
        if (instance) {
          instance.qrCode = qrBase64;
          instance.status = 'qr_ready';
          instance.lastSeen = new Date().toISOString();
          
          console.log('[' + instanceId + '] ✅ QR Code salvo');
          
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
        console.error('[' + instanceId + '] ❌ Erro ao processar QR: ' + error.message);
        const instance = instances.get(instanceId);
        if (instance) {
          instance.status = 'qr_error';
          instance.error = error.message;
        }
      }
    });

    client.on('ready', function() {
      console.log('[' + instanceId + '] 🎉 Cliente pronto!');
      clearTimeout(initTimeout);
      const instance = instances.get(instanceId);
      if (instance) {
        instance.status = 'ready';
        instance.qrCode = null;
        instance.phone = client.info ? client.info.wid.user : null;
        instance.profileName = client.info ? client.info.pushname : null;
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

    client.on('authenticated', function() {
      console.log('[' + instanceId + '] 🔐 Cliente autenticado');
      clearTimeout(initTimeout);
      const instance = instances.get(instanceId);
      if (instance) {
        instance.status = 'authenticated';
        instance.lastSeen = new Date().toISOString();
      }
    });

    client.on('auth_failure', function(msg) {
      console.error('[' + instanceId + '] ❌ Falha de autenticação: ' + msg);
      const instance = instances.get(instanceId);
      if (instance) {
        instance.status = 'auth_failed';
        instance.error = msg;
        instance.lastSeen = new Date().toISOString();
      }
    });

    client.on('disconnected', function(reason) {
      console.log('[' + instanceId + '] 🔌 Desconectado: ' + reason);
      const instance = instances.get(instanceId);
      if (instance) {
        instance.status = 'disconnected';
        instance.error = reason;
        instance.lastSeen = new Date().toISOString();
      }
    });

    client.on('message_create', async function(message) {
      console.log('[' + instanceId + '] 💬 Nova mensagem: ' + message.from);
      
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
          console.error('[' + instanceId + '] ❌ Erro webhook: ' + error.message);
        }
      }
    });

    console.log('[' + instanceId + '] 🔄 Iniciando processo Puppeteer...');
    client.initialize().catch(function(error) {
      console.error('[' + instanceId + '] ❌ Erro na inicialização: ' + error.message);
      const instance = instances.get(instanceId);
      if (instance) {
        instance.status = 'init_error';
        instance.error = error.message;
        instance.lastSeen = new Date().toISOString();
      }
    });
    
  } catch (error) {
    console.error('[' + instanceId + '] ❌ Erro geral: ' + error.message);
    const instance = instances.get(instanceId);
    if (instance) {
      instance.status = 'error';
      instance.error = error.message;
      instance.lastSeen = new Date().toISOString();
    }
  }
}

// === ENDPOINTS DA API CORRIGIDOS ===

// Health check
app.get('/health', function(req, res) {
  console.log('📊 Health check solicitado');
  
  const instancesList = Array.from(instances.entries()).map(function(entry) {
    const id = entry[0];
    const instance = entry[1];
    return {
      id: id,
      status: instance.status,
      phone: instance.phone,
      hasQR: !!instance.qrCode,
      session: instance.sessionName
    };
  });

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
    syntax_error_fixed: true
  });
});

// Status do servidor
app.get('/status', function(req, res) {
  console.log('📋 Status do servidor solicitado');
  
  const instancesList = Array.from(instances.entries()).map(function(entry) {
    const id = entry[0];
    const instance = entry[1];
    return {
      id: id,
      status: instance.status,
      phone: instance.phone,
      hasQR: !!instance.qrCode,
      session: instance.sessionName,
      lastSeen: instance.lastSeen,
      messageCount: instance.messages ? instance.messages.length : 0
    };
  });

  res.json({
    success: true,
    version: SERVER_VERSION,
    activeInstances: instances.size,
    totalInstances: instances.size,
    instances: instancesList,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    syntax_error_fixed: true
  });
});

// Listar instâncias
app.get('/instances', authenticateToken, function(req, res) {
  console.log('📋 Listando todas as instâncias...');
  
  const instancesList = [];
  
  for (const entry of instances.entries()) {
    const instanceId = entry[0];
    const instance = entry[1];
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
      messageCount: instance.messages ? instance.messages.length : 0
    });
  }
  
  console.log('📊 Encontradas ' + instancesList.length + ' instâncias');
  
  res.json({
    success: true,
    instances: instancesList,
    total: instancesList.length,
    server_version: SERVER_VERSION,
    timestamp: new Date().toISOString()
  });
});

// Criar instância
app.post('/instance/create', authenticateToken, async function(req, res) {
  try {
    const instanceId = req.body.instanceId;
    const sessionName = req.body.sessionName;
    const webhookUrl = req.body.webhookUrl;
    
    console.log('🔥 CRIAÇÃO: ' + instanceId + ' (' + sessionName + ')');
    
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
    
    console.log('[' + instanceId + '] ⚡ Resposta imediata - inicializando em background');
    
    setImmediate(function() {
      initializeWhatsAppClient(instanceId, sessionName, finalWebhookUrl);
    });
    
    res.json({
      success: true,
      instanceId: instanceId,
      sessionName: sessionName,
      status: 'creating',
      message: 'Instância sendo criada - aguarde 30s para QR code',
      webhookUrl: finalWebhookUrl,
      server_version: SERVER_VERSION
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar instância: ' + error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      server_version: SERVER_VERSION
    });
  }
});

// GET QR Code endpoint
app.get('/instance/:instanceId/qr', authenticateToken, function(req, res) {
  try {
    const instanceId = req.params.instanceId;
    
    console.log('📱 GET QR Code para instância: ' + instanceId);
    
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
    console.error('❌ Erro ao obter QR Code: ' + error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST QR Code
app.post('/instance/qr', authenticateToken, function(req, res) {
  try {
    const instanceId = req.body.instanceId;
    
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
    console.error('❌ Erro ao obter QR Code: ' + error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Status da instância
app.get('/instance/:instanceId/status', authenticateToken, function(req, res) {
  try {
    const instanceId = req.params.instanceId;
    
    const instance = instances.get(instanceId);
    
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instância não encontrada'
      });
    }
    
    res.json({
      success: true,
      instanceId: instanceId,
      status: instance.status,
      phone: instance.phone,
      profileName: instance.profileName,
      hasQR: !!instance.qrCode,
      lastSeen: instance.lastSeen,
      error: instance.error || null,
      createdAt: instance.createdAt,
      messageCount: instance.messages ? instance.messages.length : 0
    });
  } catch (error) {
    console.error('❌ Erro ao obter status: ' + error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Enviar mensagem
app.post('/send', authenticateToken, async function(req, res) {
  try {
    const instanceId = req.body.instanceId;
    const phone = req.body.phone;
    const message = req.body.message;
    
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
    
    console.log('[' + instanceId + '] 📤 Mensagem enviada para ' + phone);
    
    res.json({
      success: true,
      messageId: sentMessage.id._serialized || sentMessage.id,
      timestamp: new Date().toISOString(),
      phone: formattedPhone
    });
    
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem: ' + error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Deletar instância
app.delete('/instance/:instanceId', authenticateToken, async function(req, res) {
  try {
    const instanceId = req.params.instanceId;
    
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
        console.log('[' + instanceId + '] 🗑️ Cliente destruído');
      } catch (error) {
        console.error('[' + instanceId + '] ⚠️ Erro ao destruir: ' + error.message);
      }
    }
    
    instances.delete(instanceId);
    
    console.log('[' + instanceId + '] ✅ Instância removida completamente');
    
    res.json({
      success: true,
      message: 'Instância deletada com sucesso',
      instanceId: instanceId
    });
    
  } catch (error) {
    console.error('❌ Erro ao deletar instância: ' + error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handler
app.use(function(error, req, res, next) {
  console.error('❌ Erro no servidor: ' + error.message);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    timestamp: new Date().toISOString(),
    version: SERVER_VERSION
  });
});

// Graceful shutdown
process.on('SIGINT', async function() {
  console.log('🛑 Encerrando servidor...');
  
  for (const entry of instances.entries()) {
    const instanceId = entry[0];
    const instance = entry[1];
    if (instance.client) {
      try {
        await instance.client.destroy();
        console.log('[' + instanceId + '] 🔌 Cliente desconectado');
      } catch (error) {
        console.error('[' + instanceId + '] ❌ Erro ao desconectar: ' + error.message);
      }
    }
  }
  
  console.log('✅ Shutdown concluído');
  process.exit(0);
});

// Inicializar servidor
async function startServer() {
  await ensureSessionDirectory();
  
  app.listen(PORT, '0.0.0.0', function() {
    console.log('🚀 WhatsApp VPS Server (SEM SYNTAXERROR) na porta ' + PORT);
    console.log('📊 Health: http://31.97.24.222:' + PORT + '/health');
    console.log('📋 Status: http://31.97.24.222:' + PORT + '/status');
    console.log('📱 Instances: http://31.97.24.222:' + PORT + '/instances');
    console.log('🔑 Token: ' + API_TOKEN.substring(0, 10) + '...');
    console.log('📱 Versão: ' + SERVER_VERSION);
    console.log('✅ CORREÇÕES: SyntaxError eliminado, require() tradicional, strings concatenadas');
  });
}

startServer().catch(console.error);

module.exports = app;
