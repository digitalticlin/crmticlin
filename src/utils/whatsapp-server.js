// Servidor WhatsApp Web.js v3.3 - Versão com QR Code real obrigatório
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
const SERVER_VERSION = '3.3.0';
const SERVER_HASH = 'sha256-' + Date.now();

// Configurar CORS e parsing
app.use(cors());
app.use(express.json());

// Token simples para autenticação
const API_TOKEN = process.env.VPS_API_TOKEN || 'default-token';

// Armazenar instâncias ativas
const activeInstances = new Map();

// Middleware de autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || token !== API_TOKEN) {
    return res.status(401).json({ 
      success: false, 
      error: 'Token de autenticação inválido',
      version: SERVER_VERSION
    });
  }

  next();
}

// ===== ENDPOINT /health OBRIGATÓRIO PARA DEPLOY =====
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    server: 'WhatsApp Web.js Server',
    version: SERVER_VERSION,
    hash: SERVER_HASH,
    timestamp: new Date().toISOString(),
    port: PORT,
    ssl_fix_enabled: true,
    timeout_fix_enabled: true,
    active_instances: activeInstances.size,
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
    port: PORT
  });
});

// Endpoint raiz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'WhatsApp Web.js Server v3.3 funcionando',
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
    timestamp: new Date().toISOString()
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

// ===== ENDPOINT PARA CRIAR INSTÂNCIA WHATSAPP COM QR CODE REAL =====
app.post('/instance/create', authenticateToken, async (req, res) => {
  const { instanceId, sessionName, webhookUrl, companyId } = req.body;

  if (!instanceId || !sessionName) {
    return res.status(400).json({
      success: false,
      error: 'instanceId e sessionName são obrigatórios',
      version: SERVER_VERSION
    });
  }

  console.log(`🔧 [v${SERVER_VERSION}] Criando instância WhatsApp: ${instanceId}`);
  console.log('Payload recebido:', { instanceId, sessionName, webhookUrl, companyId });

  try {
    // Verificar se a instância já existe
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
        version: SERVER_VERSION,
        timestamp: new Date().toISOString()
      });
    }

    // Criar nova instância do WhatsApp Web.js
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
          '--disable-gpu'
        ]
      }
    });

    // Criar objeto da instância
    const instanceData = {
      client,
      sessionName,
      webhookUrl,
      companyId,
      status: 'initializing',
      qrCode: null,
      lastActivity: new Date().toISOString(),
      qrPromise: null
    };

    // Armazenar a instância
    activeInstances.set(instanceId, instanceData);

    // Promise para aguardar QR code real
    instanceData.qrPromise = new Promise((resolve) => {
      instanceData.qrResolve = resolve;
    });

    // Event listener para QR Code - GERAR QR REAL
    client.on('qr', async (qr) => {
      try {
        console.log(`📱 [v${SERVER_VERSION}] QR Code REAL gerado para ${instanceId}`);
        console.log(`QR String recebida: ${qr.substring(0, 50)}...`);
        
        // Gerar QR code como base64 REAL
        const qrCodeDataUrl = await qrcode.toDataURL(qr, {
          width: 512,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        instanceData.qrCode = qrCodeDataUrl;
        instanceData.status = 'waiting_scan';
        instanceData.lastActivity = new Date().toISOString();
        
        console.log(`✅ [v${SERVER_VERSION}] QR Code real gerado para ${instanceId} - Tamanho: ${qrCodeDataUrl.length} chars`);
        
        // Resolver a promise do QR code
        if (instanceData.qrResolve) {
          instanceData.qrResolve(qrCodeDataUrl);
        }
        
      } catch (error) {
        console.error(`❌ [v${SERVER_VERSION}] Erro ao gerar QR Code para ${instanceId}:`, error);
        instanceData.qrCode = null;
        instanceData.status = 'qr_error';
        if (instanceData.qrResolve) {
          instanceData.qrResolve(null);
        }
      }
    });

    // Event listener para autenticação
    client.on('authenticated', () => {
      console.log(`🔐 [v${SERVER_VERSION}] Cliente autenticado: ${instanceId}`);
      instanceData.status = 'authenticated';
      instanceData.qrCode = null; // Limpar QR code após autenticação
      instanceData.lastActivity = new Date().toISOString();
    });

    // Event listener para quando estiver pronto
    client.on('ready', () => {
      console.log(`✅ [v${SERVER_VERSION}] Cliente pronto: ${instanceId}`);
      instanceData.status = 'ready';
      instanceData.lastActivity = new Date().toISOString();
      
      // Obter informações do usuário
      if (client.info) {
        instanceData.phone = client.info.wid?.user;
        instanceData.profileName = client.info.pushname;
      }
    });

    // Event listener para desconexão
    client.on('disconnected', (reason) => {
      console.log(`🔌 [v${SERVER_VERSION}] Cliente desconectado ${instanceId}:`, reason);
      instanceData.status = 'disconnected';
      instanceData.lastActivity = new Date().toISOString();
    });

    // Inicializar o cliente
    console.log(`🚀 [v${SERVER_VERSION}] Inicializando cliente WhatsApp para ${instanceId}...`);
    await client.initialize();

    console.log(`✅ [v${SERVER_VERSION}] Instância ${instanceId} inicializada com sucesso`);

    // Retornar resposta inicial
    res.json({
      success: true,
      instanceId,
      sessionName,
      webhookUrl,
      companyId,
      status: 'created',
      qrCode: null,
      message: 'Instância criada. QR Code será gerado em breve.',
      version: SERVER_VERSION,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ [v${SERVER_VERSION}] Erro ao criar instância: ${error.message}`);
    
    // Remover instância em caso de erro
    if (activeInstances.has(instanceId)) {
      const instance = activeInstances.get(instanceId);
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
      error: error.message,
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

  console.log(`🗑️ [v${SERVER_VERSION}] Deletando instância WhatsApp: ${instanceId}`);

  try {
    if (activeInstances.has(instanceId)) {
      const instance = activeInstances.get(instanceId);
      
      // Destruir o cliente
      if (instance.client) {
        await instance.client.destroy();
      }
      
      // Remover da lista de instâncias ativas
      activeInstances.delete(instanceId);
      
      // Limpar pasta de sessão
      const sessionPath = path.join(__dirname, 'sessions', instanceId);
      if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
      }
      
      console.log(`✅ [v${SERVER_VERSION}] Instância ${instanceId} deletada com sucesso`);
    }

    res.json({
      success: true,
      message: `Instância ${instanceId} deletada com sucesso`,
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

// Endpoint para QR Code - RETORNAR APENAS QR REAL
app.post('/instance/qr', authenticateToken, async (req, res) => {
  const { instanceId } = req.body;

  if (!instanceId) {
    return res.status(400).json({
      success: false,
      error: 'instanceId é obrigatório',
      version: SERVER_VERSION
    });
  }

  console.log(`📱 [v${SERVER_VERSION}] Solicitando QR Code para instância: ${instanceId}`);

  try {
    if (!activeInstances.has(instanceId)) {
      return res.status(404).json({
        success: false,
        error: 'Instância não encontrada',
        version: SERVER_VERSION
      });
    }

    const instance = activeInstances.get(instanceId);
    
    // Se já tem QR code real, retornar imediatamente
    if (instance.qrCode && instance.qrCode.startsWith('data:image/') && instance.qrCode.length > 500) {
      console.log(`✅ [v${SERVER_VERSION}] QR Code real já disponível para ${instanceId}`);
      return res.json({
        success: true,
        qrCode: instance.qrCode,
        status: instance.status,
        version: SERVER_VERSION,
        timestamp: new Date().toISOString()
      });
    }

    // Se tem promise do QR code, aguardar até 10 segundos
    if (instance.qrPromise) {
      console.log(`⏳ [v${SERVER_VERSION}] Aguardando QR Code real para ${instanceId}...`);
      
      const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 10000));
      const qrCode = await Promise.race([instance.qrPromise, timeout]);
      
      if (qrCode) {
        console.log(`✅ [v${SERVER_VERSION}] QR Code real obtido para ${instanceId}`);
        return res.json({
          success: true,
          qrCode: qrCode,
          status: instance.status,
          version: SERVER_VERSION,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Se chegou até aqui, QR code não foi gerado
    console.log(`❌ [v${SERVER_VERSION}] QR Code não disponível para ${instanceId}`);
    res.status(404).json({
      success: false,
      error: 'QR Code ainda não foi gerado. Tente novamente em alguns segundos.',
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
  console.log(`🚀 WhatsApp Web.js Server v${SERVER_VERSION} rodando na porta ${PORT}`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
  console.log(`📊 Status: http://localhost:${PORT}/status`);
  console.log(`📋 Instances: http://localhost:${PORT}/instances`);
  console.log(`🔧 Create: http://localhost:${PORT}/instance/create`);
  console.log(`🗑️ Delete: http://localhost:${PORT}/instance/delete`);
  console.log(`📊 Instance Status: http://localhost:${PORT}/instance/status`);
  console.log(`📱 QR Code: http://localhost:${PORT}/instance/qr`);
  console.log(`🔑 Token: ${API_TOKEN === 'default-token' ? '⚠️  USANDO TOKEN PADRÃO' : '✅ Token configurado'}`);
  console.log(`📝 Hash: ${SERVER_HASH}`);
  
  // Criar diretório de sessões se não existir
  const sessionsDir = path.join(__dirname, 'sessions');
  if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
    console.log(`📁 Diretório de sessões criado: ${sessionsDir}`);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log(`🛑 [v${SERVER_VERSION}] Encerrando WhatsApp Server...`);
  
  // Destruir todas as instâncias ativas
  for (const [instanceId, instance] of activeInstances) {
    try {
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
