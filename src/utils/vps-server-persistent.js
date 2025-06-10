
// Servidor WhatsApp Web.js com PERSISTÊNCIA e ENDPOINTS CORRETOS para Edge Function
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

// CORREÇÃO PUPPETEER: Configuração robusta para VPS
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
    '--max_old_space_size=512',
    '--disable-web-gl',
    '--disable-webgl',
    '--disable-threaded-animation',
    '--disable-threaded-scrolling',
    '--disable-in-process-stack-traces',
    '--disable-histogram-customizer',
    '--disable-gl-extensions',
    '--disable-composited-antialiasing',
    '--disable-canvas-aa',
    '--disable-3d-apis',
    '--disable-accelerated-mjpeg-decode',
    '--disable-accelerated-video-decode',
    '--disable-animatable-transform-fullscreen',
    '--disable-background-networking',
    '--disable-sync-preferences',
    '--hide-scrollbars',
    '--mute-audio',
    '--disable-logging',
    '--disable-gl-drawing-for-tests'
  ],
  ignoreHTTPSErrors: true,
  ignoreDefaultArgs: ['--disable-extensions'],
  timeout: 60000
};

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

async function loadInstancesState() {
  try {
    const data = await fs.readFile(INSTANCES_FILE, 'utf8');
    const instancesData = JSON.parse(data);
    
    console.log(`📥 Carregando ${Object.keys(instancesData).length} instâncias salvas...`);
    
    for (const [instanceId, data] of Object.entries(instancesData)) {
      console.log(`🔄 Restaurando instância: ${instanceId}`);
      
      const instance = {
        instanceId: data.instanceId,
        sessionName: data.sessionName,
        companyId: data.companyId,
        webhookUrl: data.webhookUrl,
        client: null,
        createdAt: data.createdAt,
        status: 'restoring'
      };
      
      activeInstances.set(instanceId, instance);
      
      setTimeout(() => initializeWhatsAppClient(instance), 2000 * Object.keys(instancesData).indexOf(instanceId));
    }
    
    console.log('✅ Todas as instâncias foram agendadas para restauração');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('📄 Nenhum arquivo de estado encontrado - iniciando limpo');
    } else {
      console.error('❌ Erro ao carregar estado das instâncias:', error);
    }
  }
}

// CORREÇÃO: Função melhorada para inicializar cliente WhatsApp
async function initializeWhatsAppClient(instance, retryCount = 0) {
  const maxRetries = 3;
  
  try {
    console.log(`🚀 Inicializando cliente WhatsApp para: ${instance.instanceId} (tentativa ${retryCount + 1}/${maxRetries + 1})`);
    
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

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: instance.sessionName,
        dataPath: path.join(PERSISTENCE_DIR, 'sessions')
      }),
      puppeteer: PUPPETEER_CONFIG
    });

    instance.client = client;
    instance.status = 'initializing';

    // Timeout para inicialização
    const initTimeout = setTimeout(() => {
      console.log(`⏰ Timeout na inicialização de ${instance.instanceId} - tentando novamente...`);
      if (retryCount < maxRetries) {
        setTimeout(() => initializeWhatsAppClient(instance, retryCount + 1), 5000);
      } else {
        console.error(`❌ Máximo de tentativas atingido para ${instance.instanceId}`);
        instance.status = 'failed';
        instance.error = 'Timeout na inicialização após múltiplas tentativas';
      }
    }, 90000); // 90 segundos

    // Event handlers
    client.on('qr', (qr) => {
      console.log(`📱 QR Code gerado para: ${instance.instanceId}`);
      clearTimeout(initTimeout);
      instance.qrCode = qr;
      instance.status = 'qr_ready';
      saveInstancesState();
      
      if (instance.webhookUrl) {
        sendWebhook(instance.webhookUrl, {
          event: 'qr.update',
          instanceName: instance.sessionName,
          data: { qrCode: qr },
          timestamp: new Date().toISOString(),
          server_url: `http://localhost:${PORT}`
        }).catch(error => {
          console.error(`❌ Erro ao enviar QR via webhook:`, error.message);
        });
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
        console.log(`🔄 Tentando novamente em 10 segundos...`);
        setTimeout(() => initializeWhatsAppClient(instance, retryCount + 1), 10000);
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
      console.log(`📨 Mensagem capturada para ${instance.instanceId}:`, {
        from: message.from,
        to: message.to,
        fromMe: message.fromMe,
        body: message.body?.substring(0, 50) + '...',
        timestamp: new Date().toISOString()
      });
      
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
          console.error(`❌ Erro ao enviar webhook para ${instance.instanceId}:`, error.message);
        }
      }
    });

    // CORREÇÃO: Inicializar com retry automático
    console.log(`🔄 Iniciando cliente WhatsApp para ${instance.instanceId}...`);
    await client.initialize();
    
  } catch (error) {
    console.error(`❌ Erro ao inicializar cliente: ${instance.instanceId}`, error.message);
    instance.status = 'error';
    instance.error = error.message;
    
    if (retryCount < maxRetries) {
      console.log(`🔄 Retry ${retryCount + 1}/${maxRetries} em 15 segundos para ${instance.instanceId}...`);
      setTimeout(() => initializeWhatsAppClient(instance, retryCount + 1), 15000);
    } else {
      console.error(`💥 Falha final na inicialização de ${instance.instanceId} após ${maxRetries + 1} tentativas`);
    }
    
    saveInstancesState();
  }
}

// Função para enviar webhook
async function sendWebhook(webhookUrl, data) {
  const fetch = (await import('node-fetch')).default;
  
  console.log(`🔗 Enviando webhook para: ${webhookUrl}`, {
    event: data.event,
    instanceName: data.instanceName,
    timestamp: data.timestamp
  });
  
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

// ENDPOINTS CORRETOS PARA EDGE FUNCTION

// ENDPOINT RAIZ - Para teste de conectividade
app.get('/', (req, res) => {
  res.json({
    success: true,
    status: 'VPS WhatsApp Server Online - CORRETO',
    timestamp: new Date().toISOString(),
    server: 'WhatsApp Web.js Server com Puppeteer VPS',
    version: '3.1.0-ENDPOINTS-CORRETOS',
    activeInstances: activeInstances.size,
    port: PORT,
    message: 'Servidor funcionando corretamente com endpoints para Edge Function'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    server: 'WhatsApp Web.js Server CORRIGIDO com Puppeteer VPS',
    version: '3.1.0-PUPPETEER-FIXED',
    timestamp: new Date().toISOString(),
    activeInstances: activeInstances.size,
    puppeteerFixed: true,
    port: PORT
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
    puppeteerConfig: 'VPS_OPTIMIZED'
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

// ENDPOINT CORRETO QUE A EDGE FUNCTION CHAMA
app.post('/instance/create', authenticateToken, async (req, res) => {
  try {
    console.log('🚀 [ENDPOINT CORRETO] Recebendo requisição da Edge Function:', req.body);
    
    const { instanceId, sessionName, webhookUrl, companyId } = req.body;
    
    if (!instanceId || !sessionName) {
      console.log('❌ Dados obrigatórios ausentes:', { instanceId, sessionName });
      return res.status(400).json({
        success: false,
        error: 'instanceId e sessionName são obrigatórios'
      });
    }
    
    if (activeInstances.has(instanceId)) {
      console.log('❌ Instância já existe:', instanceId);
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
    
    console.log('✅ Instância criada no mapa:', instanceId);
    
    // Inicializar cliente com delay
    setTimeout(() => initializeWhatsAppClient(instance), 2000);
    
    await saveInstancesState();
    
    console.log('✅ [SUCESSO] Resposta enviada para Edge Function');
    
    res.json({
      success: true,
      instanceId,
      status: 'creating',
      message: 'Instância criada e inicializando com Puppeteer corrigido',
      timestamp: new Date().toISOString(),
      webhookUrl: finalWebhookUrl
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
               instance.status === 'initializing' ? 'Aguarde - inicializando com Puppeteer corrigido' :
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

// ENDPOINT DELETE VIA GET (para compatibilidade)
app.delete('/instance/:instanceId', authenticateToken, async (req, res) => {
  try {
    const instanceId = req.params.instanceId;
    
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

// Inicializar servidor
async function startServer() {
  await ensurePersistenceDirectory();
  await loadInstancesState();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 WhatsApp Web.js Server com Puppeteer CORRIGIDO rodando na porta ${PORT}`);
    console.log(`📊 Status: http://localhost:${PORT}/health`);
    console.log(`📂 Persistência: ${PERSISTENCE_DIR}`);
    console.log(`🔑 Token: ${AUTH_TOKEN === '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3' ? '✅ Token configurado' : '⚠️  USANDO TOKEN PADRÃO'}`);
    console.log(`💾 Instâncias carregadas: ${activeInstances.size}`);
    console.log(`🔧 Puppeteer: VPS-OPTIMIZED com retry automático`);
    console.log(`✅ ENDPOINTS CORRETOS PARA EDGE FUNCTION IMPLEMENTADOS`);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Encerrando servidor...');
  
  await saveInstancesState();
  
  for (const [instanceId, instance] of activeInstances.entries()) {
    if (instance.client) {
      try {
        await instance.client.destroy();
        console.log(`🔌 Cliente ${instanceId} desconectado`);
      } catch (error) {
        console.error(`❌ Erro ao desconectar ${instanceId}:`, error);
      }
    }
  }
  
  console.log('✅ Shutdown concluído');
  process.exit(0);
});

startServer().catch(console.error);

module.exports = app;
