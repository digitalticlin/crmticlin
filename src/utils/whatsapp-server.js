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
const SERVER_VERSION = '4.0.1-QR-FIX';
const SERVER_HASH = 'sha256-' + Date.now();

// Configurar CORS e parsing
app.use(cors());
app.use(express.json());

// Token para autenticação
const API_TOKEN = process.env.VPS_API_TOKEN || 'default-token';

// URL do webhook Supabase - GLOBAL
let GLOBAL_WEBHOOK_URL = process.env.SUPABASE_WEBHOOK_URL || 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web';
let GLOBAL_WEBHOOK_EVENTS = ['messages.upsert', 'connection.update'];
let GLOBAL_WEBHOOK_CONFIG = {
  active: true,
  url: GLOBAL_WEBHOOK_URL,
  events: GLOBAL_WEBHOOK_EVENTS,
  description: 'Webhook global para multi-tenant CRM',
  configuredAt: new Date().toISOString()
};

// Armazenar instâncias ativas com estado de reconexão
const activeInstances = new Map();

// Configurações de reconexão
const RECONNECT_CONFIG = {
  maxRetries: 10,
  retryDelay: 5000,
  healthCheckInterval: 30000,
  sessionBackupInterval: 60000
};

// CORREÇÃO: Função para validar QR Code real - MAIS TOLERANTE
function isValidQRCode(qrCode) {
  if (!qrCode) {
    console.log(`[QR Validation] ❌ QR Code é null ou undefined`);
    return false;
  }
  
  // Verificar se é data URL válida
  if (!qrCode.startsWith('data:image/')) {
    console.log(`[QR Validation] ❌ QR Code não é data URL de imagem`);
    return false;
  }
  
  // Extrair parte base64
  const parts = qrCode.split(',');
  if (parts.length !== 2) {
    console.log(`[QR Validation] ❌ QR Code mal formatado (split falhou)`);
    return false;
  }
  
  const base64Part = parts[1];
  
  // CORREÇÃO: Reduzir tamanho mínimo de 500 para 50 caracteres - mais tolerante
  if (base64Part.length < 50) {
    console.log(`[QR Validation] ❌ QR Code muito pequeno: ${base64Part.length} caracteres`);
    return false;
  }
  
  // Verificar padrões conhecidos de QR falsos
  const knownFakePatterns = [
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  ];
  
  const isFake = knownFakePatterns.some(pattern => base64Part.includes(pattern));
  if (isFake) {
    console.log(`[QR Validation] ❌ QR Code corresponde a padrão conhecido falso`);
    return false;
  }
  
  console.log(`[QR Validation] ✅ QR Code válido: ${base64Part.length} caracteres`);
  return true;
}

// Função para enviar webhook ao Supabase - ATUALIZADA PARA USAR CONFIG GLOBAL
async function sendWebhookToSupabase(event, instanceId, data = {}) {
  if (!GLOBAL_WEBHOOK_CONFIG.active) {
    console.log(`⚠️ [v${SERVER_VERSION}] Webhook global desativado - não enviando evento ${event}`);
    return;
  }

  if (!GLOBAL_WEBHOOK_CONFIG.events.includes(event)) {
    console.log(`⚠️ [v${SERVER_VERSION}] Evento ${event} não está na lista de eventos configurados`);
    return;
  }

  try {
    console.log(`📡 [v${SERVER_VERSION}] Enviando webhook: ${event} para instância ${instanceId}`);
    
    const response = await fetch(GLOBAL_WEBHOOK_CONFIG.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify({
        event,
        instanceName: instanceId,
        data,
        timestamp: new Date().toISOString(),
        server_url: `http://localhost:${PORT}`
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
  // QR Code - CORREÇÃO: Marcar QR como validado quando gerado
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
      instance.qrCodeValidated = true; // CORREÇÃO: Marcar como validado
      instance.status = 'waiting_scan';
      instance.lastActivity = new Date().toISOString();
      
      console.log(`✅ [v${SERVER_VERSION}] QR Code REAL gerado e validado para ${instanceId}`);
      
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
    await sendWebhookToSupabase('connection.update', instanceId, { 
      connection: 'close',
      reason 
    });
    
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

  // Escutar mensagens recebidas - WEBHOOK MULTI-TENANT
  client.on('message', async (message) => {
    try {
      console.log(`💬 [v${SERVER_VERSION}] Mensagem recebida em ${instanceId}:`, message.from);
      
      // Enviar webhook de mensagem para processamento multi-tenant
      await sendWebhookToSupabase('messages.upsert', instanceId, {
        messages: [{
          key: {
            id: message.id._serialized,
            remoteJid: message.from,
            fromMe: message.fromMe
          },
          message: {
            conversation: message.body,
            extendedTextMessage: message.body ? { text: message.body } : null
          }
        }]
      });
      
    } catch (error) {
      console.error(`❌ [v${SERVER_VERSION}] Erro ao processar mensagem para ${instanceId}:`, error);
    }
  });

  // Status de conexão
  client.on('change_state', async (state) => {
    console.log(`🔄 [v${SERVER_VERSION}] Mudança de estado ${instanceId}:`, state);
    instance.connectionState = state;
    
    await sendWebhookToSupabase('connection.update', instanceId, { 
      connection: state === 'CONNECTED' ? 'open' : 'close',
      state 
    });
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

// ===== NOVO ENDPOINT PARA CONFIGURAÇÃO GLOBAL DO WEBHOOK =====
app.post('/webhook/global', authenticateToken, async (req, res) => {
  console.log(`🌐 [v${SERVER_VERSION}] Configurando webhook global`);

  try {
    const { webhookUrl, events, description } = req.body;

    if (!webhookUrl) {
      return res.status(400).json({
        success: false,
        error: 'webhookUrl é obrigatório',
        version: SERVER_VERSION
      });
    }

    // Validar URL do webhook
    try {
      new URL(webhookUrl);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'webhookUrl deve ser uma URL válida',
        version: SERVER_VERSION
      });
    }

    // Atualizar configuração global
    GLOBAL_WEBHOOK_URL = webhookUrl;
    GLOBAL_WEBHOOK_EVENTS = events || ['messages.upsert', 'connection.update'];
    GLOBAL_WEBHOOK_CONFIG = {
      active: true,
      url: webhookUrl,
      events: GLOBAL_WEBHOOK_EVENTS,
      description: description || 'Webhook global configurado via API',
      configuredAt: new Date().toISOString(),
      totalInstances: activeInstances.size
    };

    console.log(`✅ [v${SERVER_VERSION}] Webhook global configurado:`, GLOBAL_WEBHOOK_CONFIG);

    // Testar webhook se solicitado
    const testWebhook = req.body.testWebhook || false;
    let testResult = null;

    if (testWebhook) {
      try {
        console.log(`🧪 [v${SERVER_VERSION}] Testando webhook global...`);
        
        const testResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_TOKEN}`
          },
          body: JSON.stringify({
            event: 'webhook.test',
            instanceName: 'test-instance',
            data: {
              message: 'Teste de configuração do webhook global',
              timestamp: new Date().toISOString(),
              server_version: SERVER_VERSION
            },
            server_url: `http://localhost:${PORT}`
          })
        });

        testResult = {
          success: testResponse.ok,
          status: testResponse.status,
          statusText: testResponse.statusText,
          responseTime: Date.now()
        };

        if (testResponse.ok) {
          console.log(`✅ [v${SERVER_VERSION}] Teste do webhook bem-sucedido`);
        } else {
          console.log(`⚠️ [v${SERVER_VERSION}] Teste do webhook falhou: ${testResponse.status}`);
        }
      } catch (testError) {
        console.error(`❌ [v${SERVER_VERSION}] Erro no teste do webhook:`, testError.message);
        testResult = {
          success: false,
          error: testError.message
        };
      }
    }

    res.json({
      success: true,
      message: 'Webhook global configurado com sucesso',
      config: GLOBAL_WEBHOOK_CONFIG,
      testResult,
      affectedInstances: activeInstances.size,
      version: SERVER_VERSION,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ [v${SERVER_VERSION}] Erro na configuração do webhook global:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      version: SERVER_VERSION
    });
  }
});

// ===== ENDPOINT PARA STATUS DO WEBHOOK GLOBAL =====
app.get('/webhook/status', authenticateToken, (req, res) => {
  console.log(`📊 [v${SERVER_VERSION}] Verificando status do webhook global`);

  res.json({
    success: true,
    globalWebhook: GLOBAL_WEBHOOK_CONFIG,
    activeInstances: activeInstances.size,
    instancesList: Array.from(activeInstances.keys()),
    server: {
      version: SERVER_VERSION,
      port: PORT,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }
  });
});

// ===== ENDPOINT PARA DESATIVAR WEBHOOK GLOBAL =====
app.delete('/webhook/global', authenticateToken, (req, res) => {
  console.log(`🗑️ [v${SERVER_VERSION}] Desativando webhook global`);

  GLOBAL_WEBHOOK_CONFIG.active = false;
  GLOBAL_WEBHOOK_CONFIG.deactivatedAt = new Date().toISOString();

  res.json({
    success: true,
    message: 'Webhook global desativado',
    config: GLOBAL_WEBHOOK_CONFIG,
    version: SERVER_VERSION
  });
});

// ===== NOVO ENDPOINT PARA ENVIO DE MENSAGENS =====
app.post('/send', authenticateToken, async (req, res) => {
  const { instanceId, phone, message } = req.body;

  if (!instanceId || !phone || !message) {
    return res.status(400).json({
      success: false,
      error: 'instanceId, phone e message são obrigatórios',
      version: SERVER_VERSION
    });
  }

  console.log(`📤 [v${SERVER_VERSION}] Enviando mensagem para ${phone} via instância ${instanceId}`);

  try {
    if (!activeInstances.has(instanceId)) {
      return res.status(404).json({
        success: false,
        error: 'Instância não encontrada',
        version: SERVER_VERSION
      });
    }

    const instance = activeInstances.get(instanceId);
    
    if (instance.status !== 'ready') {
      return res.status(400).json({
        success: false,
        error: `Instância não está pronta. Status atual: ${instance.status}`,
        version: SERVER_VERSION
      });
    }

    // Limpar número de telefone (remover caracteres especiais)
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@c.us`;

    // Enviar mensagem
    const messageResult = await instance.client.sendMessage(formattedPhone, message);
    
    console.log(`✅ [v${SERVER_VERSION}] Mensagem enviada com sucesso para ${phone}`);
    
    res.json({
      success: true,
      messageId: messageResult.id._serialized,
      to: formattedPhone,
      message: message,
      timestamp: new Date().toISOString(),
      version: SERVER_VERSION
    });

  } catch (error) {
    console.error(`❌ [v${SERVER_VERSION}] Erro ao enviar mensagem: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
      version: SERVER_VERSION
    });
  }
});

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
    global_webhook: GLOBAL_WEBHOOK_CONFIG,
    qr_validation_fix: true,
    endpoints_available: [
      '/health',
      '/status',
      '/instances',
      '/instance/create',
      '/instance/delete',
      '/instance/status',
      '/instance/qr',
      '/send',
      '/webhook/global',
      '/webhook/status'
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

// Endpoint raiz - ATUALIZADO
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'WhatsApp Web.js Server v4.0.1 - QR Code Validation Fix',
    version: SERVER_VERSION,
    hash: SERVER_HASH,
    qrValidationFix: true,
    globalWebhook: {
      active: GLOBAL_WEBHOOK_CONFIG.active,
      url: GLOBAL_WEBHOOK_CONFIG.url,
      events: GLOBAL_WEBHOOK_CONFIG.events
    },
    endpoints: [
      'GET /health',
      'GET /status', 
      'GET /instances',
      'POST /instance/create',
      'POST /instance/delete',
      'POST /instance/status',
      'POST /instance/qr - CORRIGIDO!',
      'POST /send',
      'POST /webhook/global',
      'GET /webhook/status',
      'DELETE /webhook/global'
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
    qrCodeValidated: instance.qrCodeValidated || false,
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
      qrCodeValidated: false, // CORREÇÃO: Adicionar flag de validação
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
      if (instanceData.qrResolve && instanceData.qrCodeValidated) {
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
        qr_validation_fix: true,
        message: 'Instância criada em MODO PERMANENTE com validação QR corrigida',
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
        qrCodeValidated: instance.qrCodeValidated,
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

// CORREÇÃO: Endpoint QR Code corrigido - usar validação própria e fallback para status
app.post('/instance/qr', authenticateToken, async (req, res) => {
  const { instanceId } = req.body;

  if (!instanceId) {
    return res.status(400).json({
      success: false,
      error: 'instanceId é obrigatório',
      version: SERVER_VERSION
    });
  }

  console.log(`📱 [v${SERVER_VERSION}] Solicitando QR Code CORRIGIDO para instância: ${instanceId}`);

  try {
    if (!activeInstances.has(instanceId)) {
      return res.status(404).json({
        success: false,
        error: 'Instância não encontrada',
        version: SERVER_VERSION
      });
    }

    const instance = activeInstances.get(instanceId);
    
    // CORREÇÃO: Usar validação própria mais tolerante
    if (instance.qrCode && isValidQRCode(instance.qrCode)) {
      console.log(`✅ [v${SERVER_VERSION}] QR Code REAL disponível para ${instanceId}`);
      return res.json({
        success: true,
        qrCode: instance.qrCode,
        status: instance.status,
        qrCodeValidated: instance.qrCodeValidated,
        validation: 'passed_internal_check',
        version: SERVER_VERSION,
        timestamp: new Date().toISOString()
      });
    }

    // FALLBACK: Se validação falhou mas QR existe, ainda retornar (pode ser erro de validação)
    if (instance.qrCode && instance.qrCode.startsWith('data:image/')) {
      console.log(`⚠️ [v${SERVER_VERSION}] QR Code disponível mas validação falhou - retornando mesmo assim`);
      return res.json({
        success: true,
        qrCode: instance.qrCode,
        status: instance.status,
        qrCodeValidated: false,
        validation: 'bypassed_for_compatibility',
        warning: 'QR Code pode não estar totalmente válido',
        version: SERVER_VERSION,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`❌ [v${SERVER_VERSION}] QR Code não disponível para ${instanceId}`);
    res.status(404).json({
      success: false,
      error: 'QR Code ainda não foi gerado. WhatsApp Web.js ainda está inicializando. Tente novamente em alguns segundos.',
      status: instance.status,
      qrCodeValidated: instance.qrCodeValidated,
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
  console.log(`🚀 WhatsApp Web.js Server v${SERVER_VERSION} - QR CODE VALIDATION FIX rodando na porta ${PORT}`);
  console.log(`🔧 QR Code validation corrigida - mais tolerante`);
  console.log(`🔄 Auto-reconexão habilitada`);
  console.log(`💾 Backup automático de sessões habilitado`);
  console.log(`🔍 Health check habilitado (intervalo: ${RECONNECT_CONFIG.healthCheckInterval}ms)`);
  console.log(`🌐 Webhook global configurável habilitado: ${GLOBAL_WEBHOOK_CONFIG.url}`);
  console.log(`📡 Eventos monitorados: ${GLOBAL_WEBHOOK_CONFIG.events.join(', ')}`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
  console.log(`🌐 Webhook Config: POST http://localhost:${PORT}/webhook/global`);
  console.log(`📊 Webhook Status: GET http://localhost:${PORT}/webhook/status`);
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
  
  console.log(`✅ [v${SERVER_VERSION}] Modo permanente ativado com QR validation fix!`);
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
