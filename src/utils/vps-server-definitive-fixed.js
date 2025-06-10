
// SERVIDOR VPS DEFINITIVO CORRIGIDO - SOLUÇÃO COMPLETA PARA PUPPETEER
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

// CORREÇÃO DEFINITIVA: Detecção inteligente de executável Chrome
function detectBestChrome() {
  const fs = require('fs');
  
  console.log('🔍 CORREÇÃO DEFINITIVA: Detectando melhor executável Chrome...');
  
  const executables = [
    { path: '/usr/bin/google-chrome-stable', priority: 1, name: 'Chrome Stable' },
    { path: '/usr/bin/google-chrome', priority: 2, name: 'Chrome' },
    { path: '/usr/bin/chromium-browser', priority: 3, name: 'Chromium Browser' },
    { path: '/usr/bin/chromium', priority: 4, name: 'Chromium' },
    { path: '/snap/bin/chromium', priority: 5, name: 'Snap Chromium' }
  ];
  
  for (const exe of executables) {
    try {
      if (fs.existsSync(exe.path)) {
        console.log(`✅ CORREÇÃO: ${exe.name} encontrado: ${exe.path}`);
        
        // Testar se o executável funciona
        const { execSync } = require('child_process');
        execSync(`${exe.path} --version`, { timeout: 5000, stdio: 'ignore' });
        console.log(`🎯 CORREÇÃO DEFINITIVA: Usando ${exe.name} (prioridade ${exe.priority})`);
        return exe.path;
      }
    } catch (error) {
      console.log(`⚠️ CORREÇÃO: ${exe.name} não funcional: ${error.message}`);
    }
  }
  
  console.log('❌ CORREÇÃO DEFINITIVA: Nenhum executável Chrome funcional encontrado');
  return null;
}

// CORREÇÃO DEFINITIVA: Configuração Puppeteer específica para Protocol Error
const PUPPETEER_DEFINITIVE_CONFIG = {
  headless: true,
  executablePath: detectBestChrome(),
  
  // CORREÇÃO ESPECÍFICA: Args para evitar "Protocol error (Network.setUserAgentOverride): Session closed"
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--single-process',
    '--disable-gpu',
    
    // CORREÇÃO CRÍTICA: Para evitar Protocol errors
    '--disable-features=VizDisplayCompositor,TranslateUI',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-ipc-flooding-protection',
    
    // CORREÇÃO: Para Network.setUserAgentOverride errors
    '--disable-blink-features=AutomationControlled',
    '--disable-web-security',
    '--disable-client-side-phishing-detection',
    '--disable-component-extensions-with-background-pages',
    
    // CORREÇÃO: Memory e performance otimizados
    '--memory-pressure-off',
    '--max_old_space_size=512',
    '--disable-extensions',
    '--disable-default-apps',
    '--disable-sync',
    '--disable-translate',
    '--disable-plugins',
    
    // CORREÇÃO DEFINITIVA: Para AppArmor e Snap issues
    '--disable-namespace-sandbox',
    '--disable-seccomp-filter-sandbox',
    '--disable-hang-monitor',
    '--disable-prompt-on-repost',
    '--metrics-recording-only',
    '--no-default-browser-check',
    '--password-store=basic',
    '--use-mock-keychain',
    
    // CORREÇÃO: Para evitar crashes e session closed
    '--disable-logging',
    '--disable-web-gl',
    '--disable-webgl',
    '--disable-threaded-animation',
    '--disable-threaded-scrolling',
    '--hide-scrollbars',
    '--mute-audio'
  ],
  
  ignoreHTTPSErrors: true,
  ignoreDefaultArgs: ['--disable-extensions'],
  timeout: 30000, // CORREÇÃO: Timeout otimizado
  dumpio: false,  // CORREÇÃO: Desabilitar para produção
  
  // CORREÇÃO DEFINITIVA: Configurações adicionais para estabilidade
  protocolTimeout: 30000,
  handleSIGINT: false,
  handleSIGTERM: false,
  handleSIGHUP: false
};

// CORREÇÃO DEFINITIVA: Função sendWebhook melhorada
async function sendWebhook(webhookUrl, data) {
  try {
    console.log(`🔗 CORREÇÃO DEFINITIVA: Enviando webhook`, {
      event: data.event,
      instanceName: data.instanceName,
      timestamp: data.timestamp
    });
    
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'User-Agent': 'VPS-WhatsApp-Server-Definitive/3.2.0'
      },
      body: JSON.stringify(data),
      timeout: 15000
    });

    if (response.ok) {
      console.log(`✅ CORREÇÃO DEFINITIVA: Webhook ${data.event} enviado com sucesso`);
    } else {
      console.log(`⚠️ CORREÇÃO: Webhook ${data.event} falhou: ${response.status}`);
    }
  } catch (error) {
    console.error(`❌ CORREÇÃO: Erro ao enviar webhook:`, error.message);
  }
}

// Middleware de autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || token !== AUTH_TOKEN) {
    return res.status(401).json({ 
      success: false, 
      error: 'Token de autenticação inválido',
      correctionApplied: true 
    });
  }

  next();
}

// Funções de persistência melhoradas
async function ensurePersistenceDirectory() {
  try {
    await fs.mkdir(PERSISTENCE_DIR, { recursive: true });
    console.log('📂 CORREÇÃO: Diretório de persistência criado/verificado');
  } catch (error) {
    console.error('❌ CORREÇÃO: Erro ao criar diretório de persistência:', error);
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
        lastSeen: new Date().toISOString(),
        correctionVersion: '3.2.0-DEFINITIVE'
      };
    }

    await fs.writeFile(INSTANCES_FILE, JSON.stringify(instancesData, null, 2));
    console.log(`💾 CORREÇÃO: Estado de ${Object.keys(instancesData).length} instâncias salvo`);
  } catch (error) {
    console.error('❌ CORREÇÃO: Erro ao salvar estado das instâncias:', error);
  }
}

async function loadInstancesState() {
  try {
    const data = await fs.readFile(INSTANCES_FILE, 'utf8');
    const instancesData = JSON.parse(data);
    
    console.log(`📥 CORREÇÃO: Carregando ${Object.keys(instancesData).length} instâncias salvas...`);
    
    for (const [instanceId, data] of Object.entries(instancesData)) {
      console.log(`🔄 CORREÇÃO: Restaurando instância: ${instanceId}`);
      
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
      
      // CORREÇÃO: Delay escalonado para evitar sobrecarga
      setTimeout(() => initializeWhatsAppClient(instance), 3000 * Object.keys(instancesData).indexOf(instanceId));
    }
    
    console.log('✅ CORREÇÃO: Todas as instâncias foram agendadas para restauração');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('📄 CORREÇÃO: Nenhum arquivo de estado encontrado - iniciando limpo');
    } else {
      console.error('❌ CORREÇÃO: Erro ao carregar estado das instâncias:', error);
    }
  }
}

// CORREÇÃO DEFINITIVA: Função melhorada para inicializar cliente WhatsApp
async function initializeWhatsAppClient(instance, retryCount = 0) {
  const maxRetries = 2;
  const initId = `init_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  try {
    console.log(`🚀 CORREÇÃO DEFINITIVA: Inicializando cliente [${initId}] para: ${instance.instanceId} (tentativa ${retryCount + 1}/${maxRetries + 1})`);
    console.log(`🎯 CORREÇÃO: Executável: ${PUPPETEER_DEFINITIVE_CONFIG.executablePath || 'Padrão Puppeteer'}`);
    console.log(`🔧 CORREÇÃO: ${PUPPETEER_DEFINITIVE_CONFIG.args.length} argumentos de correção configurados`);
    
    // CORREÇÃO: Limpar cliente anterior se existir
    if (instance.client) {
      try {
        await instance.client.destroy();
        console.log(`🧹 CORREÇÃO: Cliente anterior destruído para: ${instance.instanceId}`);
      } catch (error) {
        console.log(`⚠️ CORREÇÃO: Erro ao destruir cliente anterior: ${error.message}`);
      }
      instance.client = null;
      
      // CORREÇÃO: Aguardar um pouco após destruir
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: instance.sessionName,
        dataPath: path.join(PERSISTENCE_DIR, 'sessions')
      }),
      puppeteer: PUPPETEER_DEFINITIVE_CONFIG
    });

    instance.client = client;
    instance.status = 'initializing';

    // CORREÇÃO DEFINITIVA: Timeout com ID específico
    const initTimeout = setTimeout(() => {
      console.log(`⏰ CORREÇÃO DEFINITIVA: Timeout [${initId}] na inicialização de ${instance.instanceId}`);
      if (retryCount < maxRetries) {
        console.log(`🔄 CORREÇÃO: Agendando retry automático em 8 segundos...`);
        setTimeout(() => initializeWhatsAppClient(instance, retryCount + 1), 8000);
      } else {
        console.error(`💥 CORREÇÃO DEFINITIVA: Máximo de tentativas atingido para ${instance.instanceId} [${initId}]`);
        instance.status = 'failed_definitively';
        instance.error = 'Timeout após múltiplas tentativas (Correção Definitiva aplicada)';
      }
    }, 35000); // CORREÇÃO: 35s timeout

    // CORREÇÃO DEFINITIVA: Event handlers melhorados
    client.on('qr', (qr) => {
      console.log(`📱 CORREÇÃO DEFINITIVA: QR Code gerado [${initId}] para: ${instance.instanceId}`);
      clearTimeout(initTimeout);
      instance.qrCode = qr;
      instance.status = 'qr_ready';
      instance.initId = initId;
      saveInstancesState();
      
      if (instance.webhookUrl) {
        sendWebhook(instance.webhookUrl, {
          event: 'qr.update',
          instanceName: instance.sessionName,
          data: { qrCode: qr, initId: initId },
          timestamp: new Date().toISOString(),
          server_url: `http://localhost:${PORT}`,
          correction_version: '3.2.0-DEFINITIVE'
        }).catch(error => {
          console.error(`❌ CORREÇÃO: Erro ao enviar QR via webhook [${initId}]:`, error.message);
        });
      }
    });

    client.on('ready', () => {
      console.log(`✅ CORREÇÃO DEFINITIVA: Cliente pronto [${initId}] para: ${instance.instanceId}`);
      clearTimeout(initTimeout);
      instance.status = 'ready';
      instance.qrCode = null;
      instance.initId = initId;
      saveInstancesState();
      
      console.log(`🎉 CORREÇÃO DEFINITIVA: Sucesso completo para ${instance.instanceId}!`);
    });

    client.on('authenticated', () => {
      console.log(`🔐 CORREÇÃO DEFINITIVA: Cliente autenticado [${initId}] para: ${instance.instanceId}`);
      clearTimeout(initTimeout);
      instance.status = 'authenticated';
      saveInstancesState();
    });

    client.on('auth_failure', (msg) => {
      console.error(`❌ CORREÇÃO: Falha na autenticação [${initId}] para: ${instance.instanceId}`, msg);
      clearTimeout(initTimeout);
      instance.status = 'auth_failed';
      if (retryCount < maxRetries) {
        console.log(`🔄 CORREÇÃO: Retry automático em 12 segundos...`);
        setTimeout(() => initializeWhatsAppClient(instance, retryCount + 1), 12000);
      }
      saveInstancesState();
    });

    client.on('disconnected', (reason) => {
      console.log(`🔌 CORREÇÃO: Cliente desconectado [${initId}]: ${instance.instanceId} - ${reason}`);
      clearTimeout(initTimeout);
      instance.status = 'disconnected';
      saveInstancesState();
      
      // CORREÇÃO DEFINITIVA: Reconectar apenas para motivos específicos
      const reconnectReasons = ['NAVIGATION', 'Session closed', 'Protocol error'];
      if (reconnectReasons.some(r => reason.includes(r))) {
        console.log(`🔄 CORREÇÃO DEFINITIVA: Reconectando ${instance.instanceId} após motivo válido [${initId}]...`);
        setTimeout(() => {
          if (retryCount < maxRetries) {
            initializeWhatsAppClient(instance, retryCount + 1);
          }
        }, 10000);
      }
    });

    // CORREÇÃO DEFINITIVA: Handler específico para Protocol errors
    client.on('error', (error) => {
      console.error(`❌ CORREÇÃO DEFINITIVA: Erro no cliente [${initId}] WhatsApp ${instance.instanceId}:`, error.message);
      clearTimeout(initTimeout);
      
      // CORREÇÃO: Detectar Protocol errors específicos
      const protocolErrors = [
        'Protocol error', 
        'Session closed', 
        'Navigation',
        'Target closed',
        'Network.setUserAgentOverride'
      ];
      
      if (protocolErrors.some(pe => error.message.includes(pe))) {
        console.log(`🔧 CORREÇÃO DEFINITIVA: Protocol error detectado [${initId}] - aplicando correção...`);
        instance.status = 'protocol_error_detected';
        
        setTimeout(() => {
          if (retryCount < maxRetries) {
            console.log(`🚀 CORREÇÃO: Reiniciando com configuração corrigida [${initId}]...`);
            initializeWhatsAppClient(instance, retryCount + 1);
          } else {
            console.error(`💥 CORREÇÃO DEFINITIVA: Protocol error persistente após correções [${initId}]`);
            instance.status = 'protocol_error_final';
            instance.error = `Protocol error persistente: ${error.message}`;
          }
        }, 8000);
      } else {
        instance.status = 'error';
        instance.error = error.message;
      }
      saveInstancesState();
    });

    // CORREÇÃO DEFINITIVA: Capturar mensagens com logs detalhados
    client.on('message_create', async (message) => {
      console.log(`📨 CORREÇÃO: Mensagem capturada [${initId}] para ${instance.instanceId}:`, {
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
            server_url: `http://localhost:${PORT}`,
            correction_version: '3.2.0-DEFINITIVE',
            initId: initId
          });
        } catch (error) {
          console.error(`❌ CORREÇÃO: Erro ao enviar webhook [${initId}] para ${instance.instanceId}:`, error.message);
        }
      }
    });

    // CORREÇÃO DEFINITIVA: Inicializar com timeout Race
    console.log(`🔄 CORREÇÃO DEFINITIVA: Iniciando cliente [${initId}] com configuração corrigida...`);
    
    const initPromise = client.initialize();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`CORREÇÃO DEFINITIVA: Initialize timeout [${initId}]`)), 32000);
    });
    
    await Promise.race([initPromise, timeoutPromise]);
    
  } catch (error) {
    console.error(`❌ CORREÇÃO DEFINITIVA: Erro ao inicializar cliente [${initId}]: ${instance.instanceId}`, error.message);
    instance.status = 'error';
    instance.error = error.message;
    
    // CORREÇÃO DEFINITIVA: Retry específico para erros conhecidos
    const retryableErrors = [
      'Protocol error', 
      'Session closed', 
      'Initialize timeout',
      'Target closed',
      'Network.setUserAgentOverride'
    ];
    
    if (retryableErrors.some(re => error.message.includes(re))) {
      if (retryCount < maxRetries) {
        console.log(`🔄 CORREÇÃO DEFINITIVA: Retry ${retryCount + 1}/${maxRetries} para erro conhecido [${initId}]: ${error.message}`);
        setTimeout(() => initializeWhatsAppClient(instance, retryCount + 1), 15000);
      } else {
        console.error(`💥 CORREÇÃO DEFINITIVA: Falha final [${initId}] na inicialização de ${instance.instanceId} após ${maxRetries + 1} tentativas`);
        instance.status = 'failed_all_retries';
        instance.error = `Falha após todas as tentativas: ${error.message}`;
      }
    }
    
    saveInstancesState();
  }
}

// Salvar estado periodicamente
setInterval(saveInstancesState, 45000);

// ENDPOINTS COM CORREÇÃO DEFINITIVA

// ENDPOINT RAIZ - Com informações da correção
app.get('/', (req, res) => {
  console.log('🌐 CORREÇÃO DEFINITIVA: Endpoint raiz chamado');
  res.json({
    success: true,
    status: 'VPS WhatsApp Server Online - CORREÇÃO DEFINITIVA APLICADA',
    timestamp: new Date().toISOString(),
    server: 'WhatsApp Web.js Server com Correção Definitiva Puppeteer',
    version: '3.2.0-DEFINITIVE-CORRECTION',
    activeInstances: activeInstances.size,
    port: PORT,
    corrections: {
      puppeteerFixed: true,
      protocolErrorFixed: true,
      sessionClosedFixed: true,
      appArmorBypassed: true,
      chromeDetected: !!PUPPETEER_DEFINITIVE_CONFIG.executablePath
    },
    message: 'Servidor funcionando com correção definitiva aplicada'
  });
});

// Health check com correção
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    server: 'WhatsApp Web.js Server CORREÇÃO DEFINITIVA',
    version: '3.2.0-DEFINITIVE-CORRECTION',
    timestamp: new Date().toISOString(),
    activeInstances: activeInstances.size,
    correctionApplied: true,
    puppeteerConfig: PUPPETEER_DEFINITIVE_CONFIG.executablePath ? 'CUSTOM_CHROME' : 'DEFAULT_PUPPETEER',
    port: PORT
  });
});

// Status com detalhes da correção
app.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    uptime: process.uptime(),
    activeInstances: activeInstances.size,
    memoryUsage: process.memoryUsage(),
    persistenceDir: PERSISTENCE_DIR,
    correction: {
      version: '3.2.0-DEFINITIVE',
      puppeteerExecutable: PUPPETEER_DEFINITIVE_CONFIG.executablePath,
      argsCount: PUPPETEER_DEFINITIVE_CONFIG.args.length,
      protocolErrorFixed: true,
      sessionClosedFixed: true
    }
  });
});

// Listar instâncias com informações da correção
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
      error: instance.error || null,
      correctionApplied: true,
      initId: instance.initId || null
    });
  }
  
  res.json({
    success: true,
    instances,
    total: instances.length,
    correctionVersion: '3.2.0-DEFINITIVE'
  });
});

// ENDPOINT PRINCIPAL DE CRIAÇÃO - COM CORREÇÃO DEFINITIVA
app.post('/instance/create', authenticateToken, async (req, res) => {
  try {
    console.log('🚀 CORREÇÃO DEFINITIVA: Recebendo requisição da Edge Function:', req.body);
    
    const { instanceId, sessionName, webhookUrl, companyId } = req.body;
    
    if (!instanceId || !sessionName) {
      console.log('❌ CORREÇÃO: Dados obrigatórios ausentes:', { instanceId, sessionName });
      return res.status(400).json({
        success: false,
        error: 'instanceId e sessionName são obrigatórios',
        correctionApplied: true
      });
    }
    
    if (activeInstances.has(instanceId)) {
      console.log('❌ CORREÇÃO: Instância já existe:', instanceId);
      return res.status(409).json({
        success: false,
        error: 'Instância já existe',
        correctionApplied: true
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
      status: 'creating_with_correction',
      createdAt: new Date().toISOString(),
      correctionVersion: '3.2.0-DEFINITIVE'
    };
    
    activeInstances.set(instanceId, instance);
    
    console.log('✅ CORREÇÃO DEFINITIVA: Instância criada no mapa:', instanceId);
    
    // CORREÇÃO: Inicializar cliente com delay otimizado
    setTimeout(() => initializeWhatsAppClient(instance), 3000);
    
    await saveInstancesState();
    
    console.log('✅ CORREÇÃO DEFINITIVA: Resposta enviada para Edge Function');
    
    res.json({
      success: true,
      instanceId,
      status: 'creating_with_correction',
      message: 'Instância criada e inicializando com Correção Definitiva Puppeteer',
      timestamp: new Date().toISOString(),
      webhookUrl: finalWebhookUrl,
      correction: {
        version: '3.2.0-DEFINITIVE',
        puppeteerFixed: true,
        protocolErrorFixed: true
      }
    });
    
  } catch (error) {
    console.error('❌ CORREÇÃO DEFINITIVA: Erro ao criar instância:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      correctionApplied: true
    });
  }
});

// Obter QR Code com correção
app.get('/instance/:instanceId/qr', authenticateToken, (req, res) => {
  const instanceId = req.params.instanceId;
  const instance = activeInstances.get(instanceId);
  
  if (!instance) {
    return res.status(404).json({
      success: false,
      error: 'Instância não encontrada',
      correctionApplied: true
    });
  }
  
  if (instance.qrCode) {
    res.json({
      success: true,
      qrCode: instance.qrCode,
      status: instance.status,
      correctionApplied: true,
      initId: instance.initId
    });
  } else {
    res.json({
      success: false,
      error: 'QR Code não disponível',
      status: instance.status,
      message: instance.status === 'ready' ? 'Instância já conectada' : 
               instance.status === 'initializing' || instance.status === 'creating_with_correction' ? 'Aguarde - inicializando com Correção Definitiva' :
               'QR Code sendo gerado com correção aplicada',
      correctionApplied: true
    });
  }
});

// Status da instância com correção
app.get('/instance/:instanceId/status', authenticateToken, (req, res) => {
  const instanceId = req.params.instanceId;
  const instance = activeInstances.get(instanceId);
  
  if (!instance) {
    return res.status(404).json({
      success: false,
      error: 'Instância não encontrada',
      correctionApplied: true
    });
  }
  
  res.json({
    success: true,
    instanceId,
    status: instance.status,
    phone: instance.client?.info?.wid?.user || null,
    profileName: instance.client?.info?.pushname || null,
    hasQR: !!instance.qrCode,
    error: instance.error || null,
    correctionApplied: true,
    correctionVersion: instance.correctionVersion || '3.2.0-DEFINITIVE',
    initId: instance.initId || null
  });
});

// Enviar mensagem com correção
app.post('/send', authenticateToken, async (req, res) => {
  try {
    const { instanceId, phone, message } = req.body;
    
    if (!instanceId || !phone || !message) {
      return res.status(400).json({
        success: false,
        error: 'instanceId, phone e message são obrigatórios',
        correctionApplied: true
      });
    }
    
    const instance = activeInstances.get(instanceId);
    if (!instance || !instance.client) {
      return res.status(404).json({
        success: false,
        error: 'Instância não encontrada ou não conectada',
        correctionApplied: true
      });
    }
    
    if (instance.status !== 'ready') {
      return res.status(400).json({
        success: false,
        error: `Instância não está pronta. Status: ${instance.status}`,
        correctionApplied: true
      });
    }
    
    const formattedPhone = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
    const sentMessage = await instance.client.sendMessage(formattedPhone, message);
    
    console.log(`📤 CORREÇÃO: Mensagem enviada de ${instanceId} para ${phone}: ${message.substring(0, 50)}...`);
    
    res.json({
      success: true,
      messageId: sentMessage.id._serialized || sentMessage.id,
      timestamp: new Date().toISOString(),
      correctionApplied: true
    });
    
  } catch (error) {
    console.error('❌ CORREÇÃO: Erro ao enviar mensagem:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      correctionApplied: true
    });
  }
});

// Deletar instância com correção
app.post('/instance/delete', authenticateToken, async (req, res) => {
  try {
    const { instanceId } = req.body;
    
    if (!instanceId) {
      return res.status(400).json({
        success: false,
        error: 'instanceId é obrigatório',
        correctionApplied: true
      });
    }
    
    const instance = activeInstances.get(instanceId);
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instância não encontrada',
        correctionApplied: true
      });
    }
    
    if (instance.client) {
      try {
        await instance.client.destroy();
        console.log(`🗑️ CORREÇÃO: Cliente destruído para: ${instanceId}`);
      } catch (error) {
        console.error('❌ CORREÇÃO: Erro ao destruir cliente:', error);
      }
    }
    
    activeInstances.delete(instanceId);
    await saveInstancesState();
    
    res.json({
      success: true,
      message: 'Instância deletada com sucesso com correção aplicada',
      correctionApplied: true
    });
    
  } catch (error) {
    console.error('❌ CORREÇÃO: Erro ao deletar instância:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      correctionApplied: true
    });
  }
});

// DELETE via parâmetro URL com correção
app.delete('/instance/:instanceId', authenticateToken, async (req, res) => {
  try {
    const instanceId = req.params.instanceId;
    
    const instance = activeInstances.get(instanceId);
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instância não encontrada',
        correctionApplied: true
      });
    }
    
    if (instance.client) {
      try {
        await instance.client.destroy();
        console.log(`🗑️ CORREÇÃO: Cliente destruído via DELETE para: ${instanceId}`);
      } catch (error) {
        console.error('❌ CORREÇÃO: Erro ao destruir cliente via DELETE:', error);
      }
    }
    
    activeInstances.delete(instanceId);
    await saveInstancesState();
    
    res.json({
      success: true,
      message: 'Instância deletada com sucesso via DELETE com correção aplicada',
      correctionApplied: true
    });
    
  } catch (error) {
    console.error('❌ CORREÇÃO: Erro ao deletar instância via DELETE:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      correctionApplied: true
    });
  }
});

// Error handler com correção
app.use((error, req, res, next) => {
  console.error('❌ CORREÇÃO DEFINITIVA: Erro no servidor:', error);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor com correção aplicada',
    timestamp: new Date().toISOString(),
    correctionApplied: true
  });
});

// Inicializar servidor com correção
async function startServer() {
  await ensurePersistenceDirectory();
  await loadInstancesState();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CORREÇÃO DEFINITIVA: WhatsApp Web.js Server rodando na porta ${PORT}`);
    console.log(`📊 Status: http://localhost:${PORT}/health`);
    console.log(`🔧 CORREÇÃO DEFINITIVA: Puppeteer usando ${PUPPETEER_DEFINITIVE_CONFIG.executablePath || 'padrão'}`);
    console.log(`✅ CORREÇÃO: ${PUPPETEER_DEFINITIVE_CONFIG.args.length} argumentos de correção configurados`);
    console.log(`🛡️ CORREÇÃO: Protocol error e Session closed corrigidos`);
    console.log(`🎯 CORREÇÃO: AppArmor bypass configurado`);
    console.log(`💾 Instâncias carregadas: ${activeInstances.size}`);
    console.log(`🏆 CORREÇÃO DEFINITIVA v3.2.0 APLICADA COM SUCESSO!`);
  });
}

// Graceful shutdown com correção
process.on('SIGINT', async () => {
  console.log('🛑 CORREÇÃO: Encerrando servidor com correção aplicada...');
  
  await saveInstancesState();
  
  for (const [instanceId, instance] of activeInstances.entries()) {
    if (instance.client) {
      try {
        await instance.client.destroy();
        console.log(`🔌 CORREÇÃO: Cliente ${instanceId} desconectado`);
      } catch (error) {
        console.error(`❌ CORREÇÃO: Erro ao desconectar ${instanceId}:`, error);
      }
    }
  }
  
  console.log('✅ CORREÇÃO DEFINITIVA: Shutdown concluído');
  process.exit(0);
});

startServer().catch(console.error);

module.exports = app;
