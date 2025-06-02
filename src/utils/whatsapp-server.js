// Servidor WhatsApp Web.js v4.0 - MODO PERMANENTE com Auto-Reconexão
// Execute este script na VPS na porta 3001

const express = require('express');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { exec } = require('child_process');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.WHATSAPP_PORT || 3001;

// VERSION CONTROL
const SERVER_VERSION = '4.0.0';
const SERVER_HASH = 'sha256-' + Date.now();

// Configurar CORS e parsing
app.use(cors());
app.use(express.json());

// Token para autenticação
const API_TOKEN = process.env.VPS_API_TOKEN || 'default-token';

// URL do webhook Supabase
const SUPABASE_WEBHOOK_URL = process.env.SUPABASE_WEBHOOK_URL || 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web';

// Armazenar instâncias ativas com estado de reconexão
const activeInstances = new Map();

// Configurações de reconexão
const RECONNECT_CONFIG = {
  maxRetries: 10,
  retryDelay: 5000,
  healthCheckInterval: 30000,
  sessionBackupInterval: 60000
};

// Função para enviar webhook ao Supabase
async function sendWebhookToSupabase(event, instanceId, data = {}) {
  try {
    console.log(`📡 [v${SERVER_VERSION}] Enviando webhook: ${event} para instância ${instanceId}`);
    
    const response = await fetch(SUPABASE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify({
        event,
        instanceId,
        data,
        timestamp: new Date().toISOString()
      })
    });

    if (response.ok) {
      console.log(`✅ [v${SERVER_VERSION}] Webhook ${event} enviado com sucesso para ${instanceId}`);
    } else {
      console.error(`❌ [v${SERVER_VERSION}] Falha no webhook ${event} para ${instanceId}: ${response.status}`);
    }
  } catch (error) {
    console.error(`💥 [v${SERVER_VERSION}] Erro ao enviar webhook ${event} para ${instanceId}:`, error.message);
  }
}

// Middleware de autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log(`🔐 [v${SERVER_VERSION}] Auth check - Received token: ${token}`);

  if (!token || token !== API_TOKEN) {
    console.error(`❌ [v${SERVER_VERSION}] Token de autenticação inválido`);
    return res.status(401).json({ 
      success: false, 
      error: 'Token de autenticação inválido',
      version: SERVER_VERSION
    });
  }

  console.log(`✅ [v${SERVER_VERSION}] Autenticação bem-sucedida`);
  next();
}

// Sistema de Health Check e Auto-Reconexão
function startHealthCheck() {
  setInterval(async () => {
    console.log(`🔍 [v${SERVER_VERSION}] Health check iniciado - ${activeInstances.size} instâncias`);
    
    for (const [instanceId, instance] of activeInstances) {
      try {
        if (instance.client && instance.status !== 'reconnecting') {
          // Verificar se o cliente está realmente conectado
          const isConnected = instance.client.info ? true : false;
          
          if (!isConnected && instance.status === 'ready') {
            console.warn(`⚠️ [v${SERVER_VERSION}] Instância ${instanceId} perdeu conexão - iniciando reconexão`);
            await attemptReconnection(instanceId, instance);
          }
        }
      } catch (error) {
        console.error(`❌ [v${SERVER_VERSION}] Erro no health check para ${instanceId}:`, error.message);
        if (instance.reconnectAttempts < RECONNECT_CONFIG.maxRetries) {
          await attemptReconnection(instanceId, instance);
        }
      }
    }
  }, RECONNECT_CONFIG.healthCheckInterval);
}

// Sistema de Reconexão Automática
async function attemptReconnection(instanceId, instance) {
  if (instance.reconnecting) {
    console.log(`🔄 [v${SERVER_VERSION}] Reconexão já em andamento para ${instanceId}`);
    return;
  }

  instance.reconnecting = true;
  instance.reconnectAttempts = (instance.reconnectAttempts || 0) + 1;
  instance.status = 'reconnecting';
  
  console.log(`🔄 [v${SERVER_VERSION}] Tentativa de reconexão ${instance.reconnectAttempts}/${RECONNECT_CONFIG.maxRetries} para ${instanceId}`);

  try {
    // Destruir cliente atual se existir
    if (instance.client) {
      try {
        await instance.client.destroy();
      } catch (destroyError) {
        console.warn(`⚠️ [v${SERVER_VERSION}] Erro ao destruir cliente: ${destroyError.message}`);
      }
    }

    // Aguardar antes de tentar reconectar
    await new Promise(resolve => setTimeout(resolve, RECONNECT_CONFIG.retryDelay * instance.reconnectAttempts));

    // Criar novo cliente
    const sessionPath = path.join(__dirname, 'sessions', instanceId);
    
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: instanceId,
        dataPath: sessionPath
      }),
      puppeteer: {
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
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      },
      webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
      }
    });

    // Configurar eventos do cliente
    setupClientEvents(instanceId, client, instance);
    
    // Atualizar instância
    instance.client = client;
    instance.lastActivity = new Date().toISOString();

    // Inicializar cliente
    await client.initialize();
    
    console.log(`✅ [v${SERVER_VERSION}] Reconexão bem-sucedida para ${instanceId}`);
    instance.reconnecting = false;
    instance.reconnectAttempts = 0;

  } catch (error) {
    console.error(`❌ [v${SERVER_VERSION}] Falha na reconexão para ${instanceId}:`, error.message);
    instance.reconnecting = false;
    
    if (instance.reconnectAttempts >= RECONNECT_CONFIG.maxRetries) {
      console.error(`💀 [v${SERVER_VERSION}] Máximo de tentativas atingido para ${instanceId} - marcando como falha`);
      instance.status = 'connection_failed';
    } else {
      // Tentar novamente após delay
      setTimeout(() => attemptReconnection(instanceId, instance), RECONNECT_CONFIG.retryDelay * 2);
    }
  }
}

// Configurar eventos do cliente com reconexão automática E WEBHOOK AUTOMÁTICO
function setupClientEvents(instanceId, client, instance) {
  // QR Code
  client.on('qr', async (qr) => {
    try {
      console.log(`📱 [v${SERVER_VERSION}] QR Code gerado para ${instanceId}`);
      
      const qrCodeDataUrl = await qrcode.toDataURL(qr, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      
      instance.qrCode = qrCodeDataUrl;
      instance.status = 'waiting_scan';
      instance.lastActivity = new Date().toISOString();
      
      // Enviar webhook de QR Code
      await sendWebhookToSupabase('qr', instanceId, {
        qr: qrCodeDataUrl
      });
      
    } catch (error) {
      console.error(`❌ [v${SERVER_VERSION}] Erro ao gerar QR Code para ${instanceId}:`, error);
    }
  });

  // Autenticação
  client.on('authenticated', async () => {
    console.log(`🔐 [v${SERVER_VERSION}] Cliente autenticado: ${instanceId}`);
    instance.status = 'authenticated';
    instance.qrCode = null;
    instance.lastActivity = new Date().toISOString();
    instance.reconnectAttempts = 0; // Reset contador
    
    // Enviar webhook de autenticação
    await sendWebhookToSupabase('authenticated', instanceId);
  });

  // Pronto - WEBHOOK AUTOMÁTICO PARA CADASTRAR NÚMERO
  client.on('ready', async () => {
    console.log(`✅ [v${SERVER_VERSION}] Cliente pronto: ${instanceId}`);
    instance.status = 'ready';
    instance.lastActivity = new Date().toISOString();
    instance.reconnectAttempts = 0; // Reset contador
    
    if (client.info) {
      instance.phone = client.info.wid?.user;
      instance.profileName = client.info.pushname;
      console.log(`📱 [v${SERVER_VERSION}] Conectado como: ${instance.phone} (${instance.profileName})`);
      
      // WEBHOOK AUTOMÁTICO PARA ATUALIZAR SUPABASE COM NÚMERO DO TELEFONE
      await sendWebhookToSupabase('ready', instanceId, {
        phone: instance.phone,
        name: instance.profileName,
        profilePic: client.info.profilePicUrl || null
      });
    }
  });

  // Desconexão - Tentar reconectar automaticamente
  client.on('disconnected', async (reason) => {
    console.log(`🔌 [v${SERVER_VERSION}] Cliente desconectado ${instanceId}:`, reason);
    instance.status = 'disconnected';
    instance.lastActivity = new Date().toISOString();
    
    // Enviar webhook de desconexão
    await sendWebhookToSupabase('disconnected', instanceId, { reason });
    
    // Iniciar reconexão automática se não foi desconexão manual
    if (reason !== 'LOGOUT' && !instance.manualDisconnect) {
      console.log(`🔄 [v${SERVER_VERSION}] Iniciando reconexão automática para ${instanceId}`);
      setTimeout(() => attemptReconnection(instanceId, instance), 2000);
    }
  });

  // Falha na autenticação
  client.on('auth_failure', async (msg) => {
    console.error(`🚫 [v${SERVER_VERSION}] Falha na autenticação ${instanceId}:`, msg);
    instance.status = 'auth_failure';
    instance.qrCode = null;
    instance.lastActivity = new Date().toISOString();
    
    // Enviar webhook de falha na autenticação
    await sendWebhookToSupabase('auth_failure', instanceId, { message: msg });
  });

  // Escutar mensagens recebidas
  client.on('message', async (message) => {
    try {
      console.log(`💬 [v${SERVER_VERSION}] Mensagem recebida em ${instanceId}:`, message.from);
      
      // Enviar webhook de mensagem
      await sendWebhookToSupabase('message', instanceId, {
        id: message.id._serialized,
        from: message.from,
        to: message.to,
        body: message.body,
        type: message.type,
        timestamp: message.timestamp,
        notifyName: message._data.notifyName || null,
        mediaUrl: message.hasMedia ? 'pending' : null
      });
      
    } catch (error) {
      console.error(`❌ [v${SERVER_VERSION}] Erro ao processar mensagem para ${instanceId}:`, error);
    }
  });
}

// Sistema de Backup de Sessões
function startSessionBackup() {
  setInterval(() => {
    console.log(`💾 [v${SERVER_VERSION}] Iniciando backup de sessões`);
    
    for (const [instanceId, instance] of activeInstances) {
      if (instance.status === 'ready') {
        try {
          const sessionPath = path.join(__dirname, 'sessions', instanceId);
          const backupPath = path.join(__dirname, 'backups', instanceId);
          
          if (fs.existsSync(sessionPath)) {
            if (!fs.existsSync(path.join(__dirname, 'backups'))) {
              fs.mkdirSync(path.join(__dirname, 'backups'), { recursive: true });
            }
            
            // Copiar arquivos de sessão
            exec(`cp -r "${sessionPath}" "${backupPath}"`, (error) => {
              if (error) {
                console.error(`❌ [v${SERVER_VERSION}] Erro no backup para ${instanceId}:`, error.message);
              } else {
                console.log(`✅ [v${SERVER_VERSION}] Backup realizado para ${instanceId}`);
              }
            });
          }
        } catch (error) {
          console.error(`❌ [v${SERVER_VERSION}] Erro no backup para ${instanceId}:`, error.message);
        }
      }
    }
  }, RECONNECT_CONFIG.sessionBackupInterval);
}

// ===== ENDPOINTS =====

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    server: 'WhatsApp Web.js Server - Modo Permanente',
    version: SERVER_VERSION,
    hash: SERVER_HASH,
    timestamp: new Date().toISOString(),
    port: PORT,
    active_instances: activeInstances.size,
    auth_token_configured: API_TOKEN !== 'default-token',
    permanent_mode: true,
    health_check_enabled: true,
    auto_reconnect_enabled: true,
    webhook_url: SUPABASE_WEBHOOK_URL,
    endpoints_available: [
      '/health',
      '/status',
      '/instances',
      '/instance/create',
      '/instance/delete',
      '/instance/status',
      '/instance/qr'
    ]
  });
});

// Endpoint de status (alternativo)
app.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'running',
    server: 'WhatsApp Web.js Server',
    version: SERVER_VERSION,
    hash: SERVER_HASH,
    timestamp: new Date().toISOString(),
    port: PORT,
    auth_token_configured: API_TOKEN !== 'default-token'
  });
});

// Endpoint raiz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'WhatsApp Web.js Server v3.5 funcionando - QR Real OBRIGATÓRIO',
    version: SERVER_VERSION,
    hash: SERVER_HASH,
    endpoints: [
      'GET /health',
      'GET /status', 
      'GET /instances',
      'POST /instance/create',
      'POST /instance/delete',
      'POST /instance/status',
      'POST /instance/qr'
    ],
    timestamp: new Date().toISOString(),
    auth_configured: API_TOKEN !== 'default-token'
  });
});

// Endpoint para listar instâncias ativas
app.get('/instances', (req, res) => {
  const instances = Array.from(activeInstances.entries()).map(([id, instance]) => ({
    instanceId: id,
    sessionName: instance.sessionName,
    isReady: instance.client?.info?.wid ? true : false,
    phone: instance.client?.info?.wid?.user,
    status: instance.status || 'unknown',
    qrCode: instance.qrCode || null,
    lastActivity: instance.lastActivity || new Date().toISOString()
  }));

  res.json({
    success: true,
    instances,
    total: instances.length,
    version: SERVER_VERSION
  });
});

// ===== ENDPOINT PARA CRIAR INSTÂNCIA WHATSAPP COM QR CODE REAL OBRIGATÓRIO =====
app.post('/instance/create', authenticateToken, async (req, res) => {
  const { instanceId, sessionName, webhookUrl, companyId } = req.body;

  if (!instanceId || !sessionName) {
    return res.status(400).json({
      success: false,
      error: 'instanceId e sessionName são obrigatórios',
      version: SERVER_VERSION
    });
  }

  console.log(`🔧 [v${SERVER_VERSION}] Criando instância PERMANENTE: ${instanceId}`);

  try {
    if (activeInstances.has(instanceId)) {
      console.log(`⚠️ [v${SERVER_VERSION}] Instância ${instanceId} já existe`);
      const existingInstance = activeInstances.get(instanceId);
      
      return res.json({
        success: true,
        instanceId,
        sessionName,
        webhookUrl,
        companyId,
        status: 'exists',
        qrCode: existingInstance.qrCode,
        permanent_mode: true,
        version: SERVER_VERSION
      });
    }

    // Tentar restaurar de backup se existir
    const backupPath = path.join(__dirname, 'backups', instanceId);
    const sessionPath = path.join(__dirname, 'sessions', instanceId);
    
    if (fs.existsSync(backupPath) && !fs.existsSync(sessionPath)) {
      console.log(`📥 [v${SERVER_VERSION}] Restaurando backup para ${instanceId}`);
      exec(`cp -r "${backupPath}" "${sessionPath}"`, (error) => {
        if (error) {
          console.warn(`⚠️ [v${SERVER_VERSION}] Erro ao restaurar backup: ${error.message}`);
        } else {
          console.log(`✅ [v${SERVER_VERSION}] Backup restaurado para ${instanceId}`);
        }
      });
    }

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: instanceId,
        dataPath: sessionPath
      }),
      puppeteer: {
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
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      },
      webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
      }
    });

    const instanceData = {
      client,
      sessionName,
      webhookUrl,
      companyId,
      status: 'initializing',
      qrCode: null,
      lastActivity: new Date().toISOString(),
      reconnectAttempts: 0,
      reconnecting: false,
      manualDisconnect: false,
      permanentMode: true,
      startTime: Date.now()
    };

    activeInstances.set(instanceId, instanceData);

    // Configurar eventos
    setupClientEvents(instanceId, client, instanceData);

    // Aguardar QR code real
    const waitForRealQR = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout aguardando QR code real'));
      }, 30000);

      instanceData.qrResolve = (qrCode) => {
        clearTimeout(timeout);
        resolve(qrCode);
      };
      instanceData.qrReject = (error) => {
        clearTimeout(timeout);
        reject(error);
      };
    });

    // Resolver QR code quando gerado
    client.on('qr', (qr) => {
      if (instanceData.qrResolve) {
        instanceData.qrResolve(instanceData.qrCode);
      }
    });

    console.log(`🚀 [v${SERVER_VERSION}] Inicializando cliente PERMANENTE para ${instanceId}...`);
    await client.initialize();

    try {
      const realQRCode = await waitForRealQR;
      
      res.json({
        success: true,
        instanceId,
        sessionName,
        webhookUrl,
        companyId,
        status: 'waiting_scan',
        qrCode: realQRCode,
        permanent_mode: true,
        auto_reconnect: true,
        webhook_enabled: true,
        message: 'Instância criada em MODO PERMANENTE com auto-reconexão e webhook automático',
        version: SERVER_VERSION,
        timestamp: new Date().toISOString()
      });

    } catch (qrError) {
      console.error(`❌ [v${SERVER_VERSION}] Erro ao aguardar QR real para ${instanceId}:`, qrError);
      throw qrError;
    }

  } catch (error) {
    console.error(`❌ [v${SERVER_VERSION}] Erro ao criar instância: ${error.message}`);
    
    if (activeInstances.has(instanceId)) {
      const instance = activeInstances.get(instanceId);
      instance.manualDisconnect = true;
      if (instance.client) {
        try {
          await instance.client.destroy();
        } catch (destroyError) {
          console.error(`❌ [v${SERVER_VERSION}] Erro ao destruir cliente: ${destroyError.message}`);
        }
      }
      activeInstances.delete(instanceId);
    }

    res.status(500).json({
      success: false,
      error: `Falha ao criar instância: ${error.message}`,
      version: SERVER_VERSION
    });
  }
});

// Endpoint para deletar instância
app.post('/instance/delete', authenticateToken, async (req, res) => {
  const { instanceId } = req.body;

  if (!instanceId) {
    return res.status(400).json({
      success: false,
      error: 'instanceId é obrigatório',
      version: SERVER_VERSION
    });
  }

  console.log(`🗑️ [v${SERVER_VERSION}] Deletando instância: ${instanceId}`);

  try {
    if (activeInstances.has(instanceId)) {
      const instance = activeInstances.get(instanceId);
      instance.manualDisconnect = true; // Marcar como desconexão manual
      
      if (instance.client) {
        await instance.client.destroy();
      }
      
      activeInstances.delete(instanceId);
      
      // Limpar sessão e backup
      const sessionPath = path.join(__dirname, 'sessions', instanceId);
      const backupPath = path.join(__dirname, 'backups', instanceId);
      
      if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
      }
      
      if (fs.existsSync(backupPath)) {
        fs.rmSync(backupPath, { recursive: true, force: true });
      }
      
      console.log(`✅ [v${SERVER_VERSION}] Instância ${instanceId} deletada completamente`);
    }

    res.json({
      success: true,
      message: `Instância ${instanceId} deletada do modo permanente`,
      version: SERVER_VERSION,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ [v${SERVER_VERSION}] Erro ao deletar instância: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
      version: SERVER_VERSION
    });
  }
});

// Endpoint para status da instância
app.post('/instance/status', authenticateToken, async (req, res) => {
  const { instanceId } = req.body;

  if (!instanceId) {
    return res.status(400).json({
      success: false,
      error: 'instanceId é obrigatório',
      version: SERVER_VERSION
    });
  }

  console.log(`📊 [v${SERVER_VERSION}] Verificando status da instância: ${instanceId}`);

  try {
    if (!activeInstances.has(instanceId)) {
      return res.json({
        success: true,
        status: {
          instanceId,
          connectionStatus: 'not_found',
          isConnected: false,
          lastActivity: null,
          version: SERVER_VERSION
        }
      });
    }

    const instance = activeInstances.get(instanceId);
    
    res.json({
      success: true,
      status: {
        instanceId,
        connectionStatus: instance.status,
        phone: instance.phone,
        profileName: instance.profileName,
        isConnected: instance.status === 'ready',
        lastActivity: instance.lastActivity,
        qrCode: instance.qrCode,
        version: SERVER_VERSION
      }
    });

  } catch (error) {
    console.error(`❌ [v${SERVER_VERSION}] Erro ao verificar status: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
      version: SERVER_VERSION
    });
  }
});

// Endpoint para QR Code - RETORNAR APENAS QR REAL VALIDADO
app.post('/instance/qr', authenticateToken, async (req, res) => {
  const { instanceId } = req.body;

  if (!instanceId) {
    return res.status(400).json({
      success: false,
      error: 'instanceId é obrigatório',
      version: SERVER_VERSION
    });
  }

  console.log(`📱 [v${SERVER_VERSION}] Solicitando QR Code REAL para instância: ${instanceId}`);

  try {
    if (!activeInstances.has(instanceId)) {
      return res.status(404).json({
        success: false,
        error: 'Instância não encontrada',
        version: SERVER_VERSION
      });
    }

    const instance = activeInstances.get(instanceId);
    
    // Se já tem QR code real validado, retornar imediatamente
    if (instance.qrCode && instance.realQRReceived && instance.qrCode.startsWith('data:image/')) {
      const base64Part = instance.qrCode.split(',')[1];
      if (base64Part && base64Part.length > 500) {
        console.log(`✅ [v${SERVER_VERSION}] QR Code REAL já disponível para ${instanceId}`);
        return res.json({
          success: true,
          qrCode: instance.qrCode,
          status: instance.status,
          version: SERVER_VERSION,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Se chegou até aqui, QR code real não foi gerado
    console.log(`❌ [v${SERVER_VERSION}] QR Code REAL não disponível para ${instanceId}`);
    res.status(404).json({
      success: false,
      error: 'QR Code real ainda não foi gerado. WhatsApp Web.js ainda está inicializando. Tente novamente em alguns segundos.',
      status: instance.status,
      version: SERVER_VERSION,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ [v${SERVER_VERSION}] Erro ao obter QR Code: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
      version: SERVER_VERSION
    });
  }
});

// Error handler
app.use((error, req, res, next) => {
  console.error(`❌ [v${SERVER_VERSION}] Erro no servidor WhatsApp:`, error);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    version: SERVER_VERSION,
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WhatsApp Web.js Server v${SERVER_VERSION} - MODO PERMANENTE rodando na porta ${PORT}`);
  console.log(`🔄 Auto-reconexão habilitada`);
  console.log(`💾 Backup automático de sessões habilitado`);
  console.log(`🔍 Health check habilitado (intervalo: ${RECONNECT_CONFIG.healthCheckInterval}ms)`);
  console.log(`📡 Webhook automático habilitado: ${SUPABASE_WEBHOOK_URL}`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
  console.log(`🔑 Token: ${API_TOKEN === 'default-token' ? '⚠️  USANDO TOKEN PADRÃO' : '✅ Token configurado'}`);
  
  // Criar diretórios necessários
  const sessionsDir = path.join(__dirname, 'sessions');
  const backupsDir = path.join(__dirname, 'backups');
  
  if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
    console.log(`📁 Diretório de sessões criado: ${sessionsDir}`);
  }
  
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
    console.log(`📁 Diretório de backups criado: ${backupsDir}`);
  }
  
  // Iniciar sistemas de monitoramento
  startHealthCheck();
  startSessionBackup();
  
  console.log(`✅ [v${SERVER_VERSION}] Modo permanente ativado com webhooks automáticos!`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log(`🛑 [v${SERVER_VERSION}] Encerrando WhatsApp Server...`);
  
  for (const [instanceId, instance] of activeInstances) {
    try {
      instance.manualDisconnect = true;
      if (instance.client) {
        await instance.client.destroy();
      }
      console.log(`🔌 [v${SERVER_VERSION}] Instância ${instanceId} finalizada`);
    } catch (error) {
      console.error(`❌ [v${SERVER_VERSION}] Erro ao finalizar instância ${instanceId}:`, error);
    }
  }
  
  process.exit(0);
});

module.exports = app;
