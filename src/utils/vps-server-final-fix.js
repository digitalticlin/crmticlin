// Servidor WhatsApp Web.js DEFINITIVO - Configuração Puppeteer Corrigida para VPS
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;
const AUTH_TOKEN = process.env.AUTH_TOKEN || '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';

// Configurar CORS e parsing
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Diretório para persistência
const PERSISTENCE_DIR = path.join(__dirname, 'whatsapp_instances');
const INSTANCES_FILE = path.join(PERSISTENCE_DIR, 'active_instances.json');

// Armazenamento de instâncias ativas
const activeInstances = new Map();

// CORREÇÃO DEFINITIVA: Configuração Puppeteer OTIMIZADA para VPS
const PUPPETEER_CONFIG = {
  headless: true, // CORREÇÃO: true ao invés de 'new'
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--no-first-run',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-extensions',
    '--disable-default-apps',
    '--no-zygote',
    '--single-process',
    '--disable-features=VizDisplayCompositor',
    '--disable-ipc-flooding-protection',
    '--memory-pressure-off',
    '--max_old_space_size=4096'
  ],
  ignoreHTTPSErrors: true,
  timeout: 30000
};

// Função para detectar Chrome automaticamente
function getChromePath() {
  const chromePaths = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable', 
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium'
  ];
  
  for (const chromePath of chromePaths) {
    try {
      require('fs').accessSync(chromePath);
      console.log(`🌐 Chrome encontrado: ${chromePath}`);
      return chromePath;
    } catch (error) {
      // Chrome não encontrado neste caminho
    }
  }
  
  console.log('⚠️ Chrome não encontrado nos caminhos padrão, usando padrão do sistema');
  return null;
}

// Configurar caminho do executável Chrome
const chromePath = getChromePath();
if (chromePath) {
  PUPPETEER_CONFIG.executablePath = chromePath;
}

// Middleware de autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || token !== AUTH_TOKEN) {
    return res.status(401).json({ success: false, error: 'Token de autenticação inválido' });
  }

  next();
}

// Funções de persistência
async function ensurePersistenceDirectory() {
  try {
    await fs.mkdir(PERSISTENCE_DIR, { recursive: true });
    console.log('📂 Diretório de persistência criado/verificado');
  } catch (error) {
    console.error('❌ Erro ao criar diretório de persistência:', error);
  }
}

async function saveInstancesState() {
  try {
    const instancesData = {};
    
    for (const [instanceId, instance] of activeInstances.entries()) {
      instancesData[instanceId] = {
        instanceId: instance.instanceId,
        sessionName: instance.sessionName,
        companyId: instance.companyId,
        webhookUrl: instance.webhookUrl,
        status: instance.client ? (instance.client.info ? 'ready' : 'initializing') : 'stopped',
        phone: instance.client?.info?.wid?.user || null,
        profileName: instance.client?.info?.pushname || null,
        createdAt: instance.createdAt,
        lastSeen: new Date().toISOString()
      };
    }

    await fs.writeFile(INSTANCES_FILE, JSON.stringify(instancesData, null, 2));
    console.log(`💾 Estado de ${Object.keys(instancesData).length} instâncias salvo`);
  } catch (error) {
    console.error('❌ Erro ao salvar estado das instâncias:', error);
  }
}

// CORREÇÃO: Função para enviar QR Code diretamente para Supabase
async function saveQRCodeToSupabase(instanceId, qrCode) {
  try {
    console.log(`💾 Salvando QR Code no Supabase para: ${instanceId}`);
    
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch('https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/whatsapp_qr_service', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZ3llYnJoZm9sam55ZGZpcGNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzEwNTQ5NSwiZXhwIjoyMDYyNjgxNDk1fQ.sEJzqhPrF4hOB-Uw8Y0_-8o8k9BVTsVtJ8xjI5OcR9s'
      },
      body: JSON.stringify({
        action: 'save_qr_code',
        vps_instance_id: instanceId,
        qr_code: qrCode
      }),
      timeout: 10000
    });

    if (response.ok) {
      console.log(`✅ QR Code salvo no Supabase para: ${instanceId}`);
    } else {
      console.error(`❌ Erro ao salvar QR Code no Supabase: ${response.status}`);
    }
  } catch (error) {
    console.error(`❌ Erro ao salvar QR Code no Supabase:`, error.message);
  }
}

// CORREÇÃO: Função melhorada para inicializar cliente WhatsApp
async function initializeWhatsAppClient(instance, retryCount = 0) {
  const maxRetries = 2;
  
  try {
    console.log(`🚀 CORREÇÃO FINAL: Inicializando cliente para: ${instance.instanceId} (tentativa ${retryCount + 1}/${maxRetries + 1})`);
    
    // Limpar cliente anterior se existir
    if (instance.client) {
      try {
        await instance.client.destroy();
        console.log(`🧹 Cliente anterior destruído para: ${instance.instanceId}`);
      } catch (error) {
        console.log(`⚠️ Erro ao destruir cliente anterior: ${error.message}`);
      }
      instance.client = null;
    }

    // CORREÇÃO DEFINITIVA: Usar configuração corrigida
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: instance.sessionName,
        dataPath: path.join(PERSISTENCE_DIR, 'sessions')
      }),
      puppeteer: PUPPETEER_CONFIG
    });

    instance.client = client;
    instance.status = 'initializing';

    // Timeout para 60s
    const initTimeout = setTimeout(() => {
      console.log(`⏰ Timeout na inicialização de ${instance.instanceId}`);
      if (retryCount < maxRetries) {
        setTimeout(() => initializeWhatsAppClient(instance, retryCount + 1), 5000);
      } else {
        console.error(`❌ Máximo de tentativas atingido para ${instance.instanceId}`);
        instance.status = 'failed';
        instance.error = 'Timeout na inicialização após múltiplas tentativas';
      }
    }, 60000);

    // Event handlers
    client.on('qr', async (qr) => {
      console.log(`📱 QR Code gerado para: ${instance.instanceId}`);
      clearTimeout(initTimeout);
      
      // CORREÇÃO: Converter QR string para base64 image
      const qrcode = require('qrcode');
      const qrBase64 = await qrcode.toDataURL(qr, { scale: 8 });
      
      instance.qrCode = qrBase64;
      instance.status = 'qr_ready';
      
      // Salvar no Supabase imediatamente
      await saveQRCodeToSupabase(instance.instanceId, qrBase64);
      
      saveInstancesState();
      
      // Enviar webhook se configurado
      if (instance.webhookUrl) {
        try {
          await sendWebhook(instance.webhookUrl, {
            event: 'qr.update',
            instanceName: instance.sessionName,
            data: { qrCode: qrBase64 },
            timestamp: new Date().toISOString(),
            server_url: `http://localhost:${PORT}`
          });
        } catch (error) {
          console.error(`❌ Erro ao enviar QR via webhook:`, error.message);
        }
      }
    });

    client.on('ready', () => {
      console.log(`✅ Cliente pronto para: ${instance.instanceId}`);
      clearTimeout(initTimeout);
      instance.status = 'ready';
      instance.qrCode = null;
      saveInstancesState();
    });

    client.on('authenticated', () => {
      console.log(`🔐 Cliente autenticado para: ${instance.instanceId}`);
      clearTimeout(initTimeout);
      instance.status = 'authenticated';
      saveInstancesState();
    });

    client.on('auth_failure', (msg) => {
      console.error(`❌ Falha na autenticação para: ${instance.instanceId}`, msg);
      clearTimeout(initTimeout);
      instance.status = 'auth_failed';
      if (retryCount < maxRetries) {
        console.log(`🔄 Tentando novamente em 5 segundos...`);
        setTimeout(() => initializeWhatsAppClient(instance, retryCount + 1), 5000);
      }
      saveInstancesState();
    });

    client.on('disconnected', (reason) => {
      console.log(`🔌 Cliente desconectado: ${instance.instanceId} - ${reason}`);
      clearTimeout(initTimeout);
      instance.status = 'disconnected';
      saveInstancesState();
    });

    // Capturar mensagens
    client.on('message_create', async (message) => {
      console.log(`📨 Mensagem capturada para ${instance.instanceId}`);
      
      if (instance.webhookUrl) {
        try {
          await sendWebhook(instance.webhookUrl, {
            event: 'messages.upsert',
            instanceName: instance.sessionName,
            data: { 
              messages: [{
                key: {
                  id: message.id._serialized || message.id,
                  remoteJid: message.fromMe ? message.to : message.from,
                  fromMe: message.fromMe
                },
                message: {
                  conversation: message.body,
                  extendedTextMessage: {
                    text: message.body
                  }
                }
              }] 
            },
            timestamp: new Date().toISOString(),
            server_url: `http://localhost:${PORT}`
          });
        } catch (error) {
          console.error(`❌ Erro ao enviar webhook:`, error.message);
        }
      }
    });

    // CORREÇÃO: Inicializar com timeout específico
    console.log(`🔄 Iniciando cliente WhatsApp para ${instance.instanceId} com configuração corrigida...`);
    await client.initialize();
    
  } catch (error) {
    console.error(`❌ Erro ao inicializar cliente: ${instance.instanceId}`, error.message);
    instance.status = 'error';
    instance.error = error.message;
    
    if (retryCount < maxRetries) {
      console.log(`🔄 Retry ${retryCount + 1}/${maxRetries} em 10 segundos para ${instance.instanceId}...`);
      setTimeout(() => initializeWhatsAppClient(instance, retryCount + 1), 10000);
    } else {
      console.error(`💥 Falha final na inicialização de ${instance.instanceId} após ${maxRetries + 1} tentativas`);
    }
    
    saveInstancesState();
  }
}

// Função para enviar webhook
async function sendWebhook(webhookUrl, data) {
  const fetch = (await import('node-fetch')).default;
  
  console.log(`🔗 Enviando webhook para: ${webhookUrl}`);
  
  await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`
    },
    body: JSON.stringify(data),
    timeout: 10000
  });
}

// Salvar estado periodicamente
setInterval(saveInstancesState, 30000);

// Endpoints da API

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    server: 'WhatsApp Web.js Server DEFINITIVO',
    version: '3.2.0-PUPPETEER-FIXED',
    timestamp: new Date().toISOString(),
    activeInstances: activeInstances.size,
    puppeteerConfig: 'VPS_OPTIMIZED_FINAL',
    chromePath: chromePath || 'system-default',
    port: PORT,
    puppeteerFixed: true
  });
});

// Status do servidor
app.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    uptime: process.uptime(),
    activeInstances: activeInstances.size,
    memoryUsage: process.memoryUsage(),
    persistenceDir: PERSISTENCE_DIR,
    puppeteerConfig: 'VPS_OPTIMIZED_FINAL'
  });
});

// Listar instâncias
app.get('/instances', authenticateToken, (req, res) => {
  const instances = [];
  
  for (const [instanceId, instance] of activeInstances.entries()) {
    instances.push({
      instanceId: instance.instanceId,
      status: instance.status,
      sessionName: instance.sessionName,
      phone: instance.client?.info?.wid?.user || null,
      profileName: instance.client?.info?.pushname || null,
      companyId: instance.companyId,
      lastSeen: new Date().toISOString(),
      hasQR: !!instance.qrCode,
      error: instance.error || null
    });
  }
  
  res.json({
    success: true,
    instances,
    total: instances.length
  });
});

// Criar instância
app.post('/instance/create', authenticateToken, async (req, res) => {
  try {
    const { instanceId, sessionName, webhookUrl, companyId } = req.body;
    
    if (!instanceId || !sessionName) {
      return res.status(400).json({
        success: false,
        error: 'instanceId e sessionName são obrigatórios'
      });
    }
    
    if (activeInstances.has(instanceId)) {
      return res.status(409).json({
        success: false,
        error: 'Instância já existe'
      });
    }
    
    const finalWebhookUrl = webhookUrl || 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web';
    
    const instance = {
      instanceId,
      sessionName,
      companyId,
      webhookUrl: finalWebhookUrl,
      client: null,
      qrCode: null,
      status: 'creating',
      createdAt: new Date().toISOString()
    };
    
    activeInstances.set(instanceId, instance);
    
    // Inicializar cliente com delay menor
    setTimeout(() => initializeWhatsAppClient(instance), 1000);
    
    await saveInstancesState();
    
    res.json({
      success: true,
      instanceId,
      status: 'creating',
      message: 'Instância criada - Chrome corrigido'
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar instância:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Obter QR Code
app.get('/instance/:instanceId/qr', authenticateToken, (req, res) => {
  const instanceId = req.params.instanceId;
  const instance = activeInstances.get(instanceId);
  
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
      status: instance.status
    });
  } else {
    res.json({
      success: false,
      error: 'QR Code não disponível',
      status: instance.status,
      message: instance.status === 'ready' ? 'Instância já conectada' : 
               instance.status === 'initializing' ? 'Aguarde - gerando QR Code' :
               instance.status === 'error' ? 'Erro na inicialização' :
               'QR Code sendo gerado'
    });
  }
});

// Endpoint para configurar webhook
app.post('/instance/:instanceId/webhook', authenticateToken, async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { webhookUrl, events } = req.body;
    
    const instance = activeInstances.get(instanceId);
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instância não encontrada'
      });
    }
    
    instance.webhookUrl = webhookUrl;
    await saveInstancesState();
    
    console.log(`🔗 Webhook configurado para ${instanceId}: ${webhookUrl}`);
    
    res.json({
      success: true,
      message: 'Webhook configurado com sucesso',
      webhookUrl: webhookUrl,
      events: events || ['messages.upsert', 'qr.update', 'connection.update']
    });
    
  } catch (error) {
    console.error('❌ Erro ao configurar webhook:', error);
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
    
    const instance = activeInstances.get(instanceId);
    if (!instance || !instance.client) {
      return res.status(404).json({
        success: false,
        error: 'Instância não encontrada ou não conectada'
      });
    }
    
    if (instance.status !== 'ready') {
      return res.status(400).json({
        success: false,
        error: `Instância não está pronta. Status: ${instance.status}`
      });
    }
    
    const formattedPhone = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
    const sentMessage = await instance.client.sendMessage(formattedPhone, message);
    
    console.log(`📤 Mensagem enviada de ${instanceId} para ${phone}: ${message.substring(0, 50)}...`);
    
    res.json({
      success: true,
      messageId: sentMessage.id._serialized || sentMessage.id,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Status da instância
app.get('/instance/:instanceId/status', authenticateToken, (req, res) => {
  const instanceId = req.params.instanceId;
  const instance = activeInstances.get(instanceId);
  
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
    phone: instance.client?.info?.wid?.user || null,
    profileName: instance.client?.info?.pushname || null,
    hasQR: !!instance.qrCode,
    error: instance.error || null
  });
});

// Deletar instância
app.post('/instance/delete', authenticateToken, async (req, res) => {
  try {
    const { instanceId } = req.body;
    
    if (!instanceId) {
      return res.status(400).json({
        success: false,
        error: 'instanceId é obrigatório'
      });
    }
    
    const instance = activeInstances.get(instanceId);
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instância não encontrada'
      });
    }
    
    if (instance.client) {
      try {
        await instance.client.destroy();
      } catch (error) {
        console.error('❌ Erro ao destruir cliente:', error);
      }
    }
    
    activeInstances.delete(instanceId);
    await saveInstancesState();
    
    res.json({
      success: true,
      message: 'Instância deletada com sucesso'
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
    timestamp: new Date().toISOString()
  });
});

// Inicialização do servidor
(async () => {
  try {
    await ensurePersistenceDirectory();
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ CORREÇÃO APLICADA: Puppeteer configurado para VPS`);
      console.log(`🚀 Servidor WhatsApp DEFINITIVO rodando na porta ${PORT}`);
      console.log(`🔐 Token: ${AUTH_TOKEN.substring(0, 9)}...`);
      console.log(`🌐 Chrome: ${chromePath || 'system-default'}`);
      console.log(`📡 Webhook: https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web`);
      console.log(`🎯 Puppeteer: headless=true, VPS_OPTIMIZED_FINAL`);
    });

    // Tratamento de eventos do processo
    process.on('SIGINT', () => {
      console.log('🛑 Encerrando servidor...');
      
      // Tentar destruir todas as instâncias
      Object.keys(activeInstances).forEach(id => {
        try {
          activeInstances[id].destroy();
        } catch (error) {
          // Ignorar erros de destruição
        }
      });
      
      server.close();
      process.exit(0);
    });

    // Tratamento de exceções não capturadas
    process.on('uncaughtException', (error) => {
      console.error('❌ Exceção não capturada:', error);
    });

  } catch (error) {
    console.error('❌ Erro fatal na inicialização:', error);
    process.exit(1);
  }
})();

module.exports = { app, server };
