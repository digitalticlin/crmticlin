
// WhatsApp Web.js Server - CORREÇÃO COMPLETA IMPLEMENTADA
const express = require('express');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;
const API_TOKEN = process.env.API_TOKEN || '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';

// SERVIDOR VERSÃO: 5.0.0-CORREÇÃO-COMPLETA
const SERVER_VERSION = '5.0.0-CORRECTED-COMPLETE';
const BUILD_DATE = new Date().toISOString();

console.log(`🚀 Iniciando WhatsApp Server ${SERVER_VERSION} - CORREÇÃO COMPLETA`);
console.log(`📅 Build: ${BUILD_DATE}`);
console.log(`🎯 Porta: ${PORT}`);

// Configurar CORS e parsing
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Token']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Configuração Puppeteer CORRIGIDA para VPS
const PUPPETEER_CONFIG = {
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

// CORREÇÃO: Garantir diretório de sessões
async function ensureSessionDirectory() {
  try {
    if (!fs.existsSync(SESSIONS_DIR)) {
      fs.mkdirSync(SESSIONS_DIR, { recursive: true });
      console.log('📂 Diretório de sessões criado:', SESSIONS_DIR);
    }
    console.log('✅ Diretório de sessões verificado');
  } catch (error) {
    console.error('❌ Erro ao criar diretório de sessões:', error);
    throw error;
  }
}

// CORREÇÃO: Middleware de autenticação robusto
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['x-api-token'];
  const token = authHeader && authHeader.replace('Bearer ', '');

  if (!token || token !== API_TOKEN) {
    console.log('❌ Token inválido:', token ? token.substring(0, 10) + '...' : 'missing');
    return res.status(401).json({ 
      success: false, 
      error: 'Token de autenticação inválido',
      code: 'AUTH_FAILED',
      timestamp: new Date().toISOString()
    });
  }

  console.log('✅ Token autenticado');
  next();
}

// CORREÇÃO: Função para enviar webhook
async function sendWebhook(webhookUrl, data) {
  if (!webhookUrl) return;
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    console.log(`🔗 Enviando webhook para: ${webhookUrl}`);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify(data),
      timeout: 10000
    });

    if (response.ok) {
      console.log('✅ Webhook enviado com sucesso');
    } else {
      console.error('❌ Erro no webhook:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Erro ao enviar webhook:', error.message);
  }
}

// CORREÇÃO: Inicialização do cliente WhatsApp robusta
async function initializeWhatsAppClient(instanceId, sessionName, webhookUrl = null) {
  try {
    console.log(`[${instanceId}] 🚀 Inicializando cliente WhatsApp...`);
    
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: sessionName,
        dataPath: SESSIONS_DIR
      }),
      puppeteer: PUPPETEER_CONFIG
    });

    // Armazenar instância imediatamente
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

    // Event handlers CORRIGIDOS
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
            await sendWebhook(webhookUrl, {
              event: 'qr.update',
              instanceName: sessionName,
              instanceId: instanceId,
              data: { qrCode: qrBase64 },
              timestamp: new Date().toISOString()
            });
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

    client.on('ready', async () => {
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
          await sendWebhook(webhookUrl, {
            event: 'connection.update',
            instanceName: sessionName,
            instanceId: instanceId,
            data: { 
              status: 'ready',
              phone: instance.phone,
              profileName: instance.profileName
            },
            timestamp: new Date().toISOString()
          });
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
    await client.initialize();
    
  } catch (error) {
    console.error(`[${instanceId}] ❌ Erro na inicialização:`, error.message);
    const instance = instances.get(instanceId);
    if (instance) {
      instance.status = 'error';
      instance.error = error.message;
      instance.lastSeen = new Date().toISOString();
    }
    throw error;
  }
}

// ENDPOINTS CORRIGIDOS

// Health check ROBUSTO
app.get('/health', (req, res) => {
  try {
    res.json({
      success: true,
      status: 'online',
      server: 'WhatsApp Web.js Server CORRECTED',
      version: SERVER_VERSION,
      timestamp: new Date().toISOString(),
      activeInstances: instances.size,
      puppeteerConfig: 'VPS_OPTIMIZED_CORRECTED',
      port: PORT,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      correctionApplied: true
    });
  } catch (error) {
    console.error('❌ Erro no health check:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Status do servidor DETALHADO
app.get('/status', (req, res) => {
  try {
    res.json({
      success: true,
      status: 'online',
      uptime: process.uptime(),
      activeInstances: instances.size,
      memoryUsage: process.memoryUsage(),
      persistenceDir: SESSIONS_DIR,
      puppeteerConfig: 'VPS_OPTIMIZED_CORRECTED',
      version: SERVER_VERSION,
      buildDate: BUILD_DATE,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro no status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Listar instâncias MELHORADO
app.get('/instances', authenticateToken, (req, res) => {
  try {
    const instancesList = [];
    
    for (const [instanceId, instance] of instances.entries()) {
      instancesList.push({
        instanceId: instance.instanceId || instanceId,
        status: instance.status,
        sessionName: instance.sessionName,
        phone: instance.phone,
        profileName: instance.profileName,
        companyId: instance.companyId,
        lastSeen: instance.lastSeen,
        hasQR: !!instance.qrCode,
        error: instance.error || null,
        createdAt: instance.createdAt,
        messageCount: instance.messages?.length || 0
      });
    }
    
    res.json({
      success: true,
      instances: instancesList,
      total: instancesList.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao listar instâncias:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Criar instância CORRIGIDO
app.post('/instance/create', authenticateToken, async (req, res) => {
  try {
    const { instanceId, sessionName, webhookUrl, companyId } = req.body;
    
    if (!instanceId || !sessionName) {
      return res.status(400).json({
        success: false,
        error: 'instanceId e sessionName são obrigatórios',
        timestamp: new Date().toISOString()
      });
    }
    
    if (instances.has(instanceId)) {
      return res.status(409).json({
        success: false,
        error: 'Instância já existe',
        instanceId,
        timestamp: new Date().toISOString()
      });
    }
    
    const finalWebhookUrl = webhookUrl || 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web';
    
    console.log(`📝 Criando instância: ${instanceId}`);
    
    // Inicializar cliente com delay
    setTimeout(() => {
      initializeWhatsAppClient(instanceId, sessionName, finalWebhookUrl)
        .catch(error => {
          console.error(`❌ Erro ao inicializar ${instanceId}:`, error);
          const instance = instances.get(instanceId);
          if (instance) {
            instance.status = 'error';
            instance.error = error.message;
          }
        });
    }, 1000);
    
    res.json({
      success: true,
      instanceId,
      sessionName,
      webhookUrl: finalWebhookUrl,
      status: 'creating',
      message: 'Instância criada - inicializando cliente',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar instância:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Obter QR Code APRIMORADO
app.get('/instance/:instanceId/qr', authenticateToken, (req, res) => {
  try {
    const instanceId = req.params.instanceId;
    const instance = instances.get(instanceId);
    
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instância não encontrada',
        instanceId,
        timestamp: new Date().toISOString()
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
        error: 'QR Code não disponível',
        status: instance.status,
        instanceId,
        message: instance.status === 'ready' ? 'Instância já conectada' : 
                 instance.status === 'initializing' ? 'Aguarde - gerando QR Code' :
                 instance.status === 'error' ? 'Erro na inicialização' :
                 'QR Code sendo gerado',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ Erro ao obter QR Code:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Enviar mensagem CORRIGIDO
app.post('/send', authenticateToken, async (req, res) => {
  try {
    const { instanceId, phone, message } = req.body;
    
    if (!instanceId || !phone || !message) {
      return res.status(400).json({
        success: false,
        error: 'instanceId, phone e message são obrigatórios',
        timestamp: new Date().toISOString()
      });
    }
    
    const instance = instances.get(instanceId);
    if (!instance || !instance.client) {
      return res.status(404).json({
        success: false,
        error: 'Instância não encontrada ou não conectada',
        instanceId,
        timestamp: new Date().toISOString()
      });
    }
    
    if (instance.status !== 'ready') {
      return res.status(400).json({
        success: false,
        error: `Instância não está pronta. Status: ${instance.status}`,
        instanceId,
        status: instance.status,
        timestamp: new Date().toISOString()
      });
    }
    
    const formattedPhone = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
    const sentMessage = await instance.client.sendMessage(formattedPhone, message);
    
    console.log(`📤 Mensagem enviada de ${instanceId} para ${phone}: ${message.substring(0, 50)}...`);
    
    res.json({
      success: true,
      messageId: sentMessage.id._serialized || sentMessage.id,
      phone: formattedPhone,
      instanceId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Status da instância DETALHADO
app.get('/instance/:instanceId/status', authenticateToken, (req, res) => {
  try {
    const instanceId = req.params.instanceId;
    const instance = instances.get(instanceId);
    
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instância não encontrada',
        instanceId,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      instanceId,
      status: instance.status,
      phone: instance.phone,
      profileName: instance.profileName,
      hasQR: !!instance.qrCode,
      error: instance.error || null,
      createdAt: instance.createdAt,
      lastSeen: instance.lastSeen,
      messageCount: instance.messages?.length || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao obter status da instância:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Deletar instância APRIMORADO
app.post('/instance/delete', authenticateToken, async (req, res) => {
  try {
    const { instanceId } = req.body;
    
    if (!instanceId) {
      return res.status(400).json({
        success: false,
        error: 'instanceId é obrigatório',
        timestamp: new Date().toISOString()
      });
    }
    
    const instance = instances.get(instanceId);
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instância não encontrada',
        instanceId,
        timestamp: new Date().toISOString()
      });
    }
    
    if (instance.client) {
      try {
        await instance.client.destroy();
        console.log(`🗑️ Cliente destruído: ${instanceId}`);
      } catch (error) {
        console.error('❌ Erro ao destruir cliente:', error);
      }
    }
    
    instances.delete(instanceId);
    
    res.json({
      success: true,
      message: 'Instância deletada com sucesso',
      instanceId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao deletar instância:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handler GLOBAL
app.use((error, req, res, next) => {
  console.error('❌ Erro no servidor:', error);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint não encontrado',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// INICIALIZAÇÃO DO SERVIDOR CORRIGIDA
(async () => {
  try {
    console.log('🔧 Iniciando configuração do servidor...');
    
    // Verificar dependências críticas
    console.log('📦 Verificando dependências...');
    
    // Garantir diretório de sessões
    await ensureSessionDirectory();
    
    // Testar Puppeteer
    console.log('🔍 Testando Puppeteer...');
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch(PUPPETEER_CONFIG);
    await browser.close();
    console.log('✅ Puppeteer funcionando corretamente');
    
    // Iniciar servidor
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ CORREÇÃO COMPLETA APLICADA!`);
      console.log(`🚀 Servidor WhatsApp CORRIGIDO rodando na porta ${PORT}`);
      console.log(`🔐 Token: ${API_TOKEN.substring(0, 9)}...`);
      console.log(`🌐 Acesso: http://31.97.24.222:${PORT}`);
      console.log(`📡 Webhook: https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web`);
      console.log(`🎯 Puppeteer: headless=true, VPS_OPTIMIZED_CORRECTED`);
      console.log(`📂 Sessões: ${SESSIONS_DIR}`);
      console.log(`🔧 Versão: ${SERVER_VERSION}`);
      console.log(`⚡ Servidor PRONTO para receber requisições!`);
    });

    // Tratamento de eventos do processo
    process.on('SIGINT', () => {
      console.log('🛑 Encerrando servidor...');
      
      // Destruir todas as instâncias
      for (const [instanceId, instance] of instances.entries()) {
        try {
          if (instance.client) {
            instance.client.destroy();
          }
        } catch (error) {
          console.error(`❌ Erro ao destruir ${instanceId}:`, error.message);
        }
      }
      
      server.close(() => {
        console.log('✅ Servidor encerrado com sucesso');
        process.exit(0);
      });
    });

    // Tratamento de exceções não capturadas
    process.on('uncaughtException', (error) => {
      console.error('❌ Exceção não capturada:', error);
      // Não encerrar o processo para manter estabilidade
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Promise rejeitada não tratada:', reason);
      // Log mas não encerrar
    });

  } catch (error) {
    console.error('❌ Erro fatal na inicialização:', error);
    process.exit(1);
  }
})();

module.exports = { app };
