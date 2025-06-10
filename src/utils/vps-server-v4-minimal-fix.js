// WhatsApp Web.js Server V4.0 - CORREÇÃO MÍNIMA PRESERVANDO FUNCIONALIDADE
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

// VERSION CONTROL - CORREÇÃO MÍNIMA
const SERVER_VERSION = '4.1.0-MINIMAL-FIX';
const BUILD_DATE = new Date().toISOString();

console.log(`🚀 Iniciando WhatsApp Server ${SERVER_VERSION}`);
console.log(`📅 Build: ${BUILD_DATE}`);

// Configurar CORS e parsing
app.use(cors());
app.use(express.json());

// CORREÇÃO MÍNIMA: Função para sanitizar clientId apenas se necessário
function sanitizeClientId(instanceId) {
  if (!instanceId || typeof instanceId !== 'string') {
    throw new Error('Instance ID deve ser uma string válida');
  }
  
  // Sanitização mínima - apenas remover caracteres claramente problemáticos
  const sanitized = instanceId
    .replace(/[^a-zA-Z0-9_-]/g, '')  // Remove apenas caracteres não alfanuméricos
    .substring(0, 50);               // Limita tamanho
  
  if (!sanitized || sanitized.length < 1) {
    throw new Error('Instance ID resultou em string vazia após sanitização');
  }
  
  console.log(`🧹 [Sanitization] "${instanceId}" → "${sanitized}"`);
  return sanitized;
}

// Configuração Puppeteer VPS otimizada (PRESERVADA - NÃO MODIFICAR)
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

// Middleware de autenticação (PRESERVADO - NÃO MODIFICAR)
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

// Garantir diretório de sessões (PRESERVADO - NÃO MODIFICAR)
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

// Inicialização do cliente WhatsApp - CORREÇÃO MÍNIMA CLIENTID
async function initializeWhatsAppClient(instanceId, sessionName, webhookUrl = null) {
  try {
    console.log(`[${instanceId}] 🚀 Inicializando cliente WhatsApp...`);
    
    // CORREÇÃO MÍNIMA: Sanitizar clientId apenas se contém caracteres problemáticos
    let sanitizedClientId = sessionName;
    try {
      sanitizedClientId = sanitizeClientId(sessionName);
      if (sanitizedClientId !== sessionName) {
        console.log(`[${instanceId}] 🧹 Client ID sanitizado: "${sessionName}" → "${sanitizedClientId}"`);
      }
    } catch (sanitizeError) {
      console.error(`[${instanceId}] ❌ Erro na sanitização clientId:`, sanitizeError.message);
      // Se sanitização falhar, usar instanceId como fallback
      sanitizedClientId = instanceId.replace(/[^a-zA-Z0-9_-]/g, '');
    }
    
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: sanitizedClientId,
        dataPath: SESSIONS_DIR
      }),
      puppeteer: VPS_PUPPETEER_CONFIG
    });

    // Armazenar cliente imediatamente com status 'initializing'
    instances.set(instanceId, {
      client,
      sessionName,
      sanitizedClientId,
      webhookUrl,
      status: 'initializing',
      createdAt: new Date().toISOString(),
      qrCode: null,
      phone: null,
      profileName: null,
      lastSeen: new Date().toISOString(),
      messages: []
    });

    console.log(`[${instanceId}] ✅ Instância armazenada com CLIENT ID: "${sanitizedClientId}"`);

    
    // Timeout para evitar travamento
    const initTimeout = setTimeout(() => {
      console.log(`[${instanceId}] ⏰ Timeout na inicialização - mantendo como disponível`);
      const instance = instances.get(instanceId);
      if (instance && instance.status === 'initializing') {
        instance.status = 'waiting_qr';
        instance.lastSeen = new Date().toISOString();
      }
    }, 45000);

    // Event handlers
    client.on('qr', async (qr) => {
      try {
        console.log(`[${instanceId}] 📱 QR Code recebido!`);
        
        const qrBase64 = await qrcode.toDataURL(qr, { type: 'png' });
        
        const instance = instances.get(instanceId);
        if (instance) {
          instance.qrCode = qrBase64;
          instance.status = 'qr_ready';
          instance.lastSeen = new Date().toISOString();
          
          console.log(`[${instanceId}] ✅ QR Code salvo (${qrBase64.length} chars)`);
          
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
      console.log(`[${instanceId}] 🎉 Cliente conectado e pronto!`);
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

    console.log(`[${instanceId}] 🔄 Iniciando processo Puppeteer em background...`);
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

async function sendWebhook(webhookUrl, data) {
  try {
    const fetch = (await import('node-fetch')).default;
    
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

// === ENDPOINTS DA API (PRESERVADOS - NÃO MODIFICAR) ===

// Health check (PRESERVADO EXATO)
app.get('/health', (req, res) => {
  const instancesList = Array.from(instances.entries()).map(([id, instance]) => ({
    id,
    status: instance.status,
    phone: instance.phone,
    hasQR: !!instance.qrCode,
    session: instance.sessionName,
    sanitizedClientId: instance.sanitizedClientId
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
    vps_optimized: true,
    client_id_sanitization: true
  });
});

// Status do servidor (PRESERVADO EXATO)
app.get('/status', (req, res) => {
  const instancesList = Array.from(instances.entries()).map(([id, instance]) => ({
    id,
    status: instance.status,
    phone: instance.phone,
    hasQR: !!instance.qrCode,
    session: instance.sessionName,
    sanitizedClientId: instance.sanitizedClientId,
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
    client_id_sanitization: true
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
      sanitizedClientId: instance.sanitizedClientId,
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

// Criar instância (PRESERVADO COM CORREÇÃO MÍNIMA)
app.post('/instance/create', authenticateToken, async (req, res) => {
  try {
    const { instanceId, sessionName, webhookUrl } = req.body;
    
    console.log(`🔥 CRIAÇÃO COM CORREÇÃO MÍNIMA: ${instanceId} (${sessionName})`);
    
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
    
    console.log(`[${instanceId}] ⚡ Resposta imediata - inicializando em background com correção mínima`);
    
    setImmediate(() => {
      initializeWhatsAppClient(instanceId, sessionName, finalWebhookUrl);
    });
    
    res.json({
      success: true,
      instanceId,
      sessionName,
      status: 'creating',
      message: 'Instância sendo criada com correção mínima - aguarde 30s para QR code',
      webhookUrl: finalWebhookUrl,
      server_version: SERVER_VERSION,
      client_id_fixed: true
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
        has_qr_code: true,
        sanitized_client_id: instance.sanitizedClientId
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
        sanitized_client_id: instance.sanitizedClientId,
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

// ADIÇÃO MÍNIMA: Endpoint GET para QR Code (ERA O QUE ESTAVA FALTANDO)
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
        has_qr_code: true,
        sanitized_client_id: instance.sanitizedClientId
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
        sanitized_client_id: instance.sanitizedClientId,
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

app.get('/instance/:instanceId/status', authenticateToken, (req, res) => {
  try {
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
      instanceId,
      status: instance.status,
      phone: instance.phone,
      profileName: instance.profileName,
      hasQR: !!instance.qrCode,
      lastSeen: instance.lastSeen,
      error: instance.error || null,
      createdAt: instance.createdAt,
      messageCount: instance.messages?.length || 0,
      sanitizedClientId: instance.sanitizedClientId
    });
  } catch (error) {
    console.error('❌ Erro ao obter status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

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

app.use((error, req, res, next) => {
  console.error('❌ Erro no servidor:', error);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    timestamp: new Date().toISOString(),
    version: SERVER_VERSION
  });
});

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

async function startServer() {
  await ensureSessionDirectory();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 WhatsApp VPS Server (CORREÇÃO MÍNIMA) na porta ${PORT}`);
    console.log(`📊 Health: http://31.97.24.222:${PORT}/health`);
    console.log(`📋 Status: http://31.97.24.222:${PORT}/status`);
    console.log(`📱 Instances: http://31.97.24.222:${PORT}/instances`);
    console.log(`🔑 Token: ${API_TOKEN.substring(0, 10)}...`);
    console.log(`📱 Versão: ${SERVER_VERSION}`);
    console.log(`✅ CORREÇÕES MÍNIMAS: Endpoint GET QR adicionado, sanitização clientId mínima`);
  });
}

startServer().catch(console.error);

module.exports = app;
