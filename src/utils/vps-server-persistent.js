
// Servidor WhatsApp Web.js com PERSISTÊNCIA implementada
// Este arquivo deve substituir o whatsapp-server.js na VPS
// Comando de instalação: node vps-server-persistent.js

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'default-token';

// Configurar CORS e parsing
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Diretório para persistência
const PERSISTENCE_DIR = path.join(__dirname, 'whatsapp_instances');
const INSTANCES_FILE = path.join(PERSISTENCE_DIR, 'active_instances.json');

// Armazenamento de instâncias ativas
const activeInstances = new Map();

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
      
      // Recriar instância
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
      
      // Tentar reconectar (assíncrono)
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

// Função para inicializar cliente WhatsApp
async function initializeWhatsAppClient(instance) {
  try {
    console.log(`🚀 Inicializando cliente WhatsApp para: ${instance.instanceId}`);
    
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: instance.sessionName,
        dataPath: path.join(PERSISTENCE_DIR, 'sessions')
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

    instance.client = client;
    instance.status = 'initializing';

    // Event handlers
    client.on('qr', (qr) => {
      console.log(`📱 QR Code gerado para: ${instance.instanceId}`);
      instance.qrCode = qr;
      instance.status = 'qr_ready';
      saveInstancesState(); // Salvar estado atualizado
    });

    client.on('ready', () => {
      console.log(`✅ Cliente pronto para: ${instance.instanceId}`);
      instance.status = 'ready';
      instance.qrCode = null;
      saveInstancesState(); // Salvar estado atualizado
    });

    client.on('authenticated', () => {
      console.log(`🔐 Cliente autenticado para: ${instance.instanceId}`);
      instance.status = 'authenticated';
      saveInstancesState(); // Salvar estado atualizado
    });

    client.on('auth_failure', (msg) => {
      console.error(`❌ Falha na autenticação para: ${instance.instanceId}`, msg);
      instance.status = 'auth_failed';
      saveInstancesState(); // Salvar estado atualizado
    });

    client.on('disconnected', (reason) => {
      console.log(`🔌 Cliente desconectado: ${instance.instanceId} - ${reason}`);
      instance.status = 'disconnected';
      saveInstancesState(); // Salvar estado atualizado
    });

    client.on('message_create', async (message) => {
      if (instance.webhookUrl) {
        try {
          await sendWebhook(instance.webhookUrl, {
            event: 'messages.upsert',
            instanceName: instance.sessionName,
            data: { messages: [message] },
            timestamp: new Date().toISOString(),
            server_url: `http://localhost:${PORT}`
          });
        } catch (error) {
          console.error(`❌ Erro ao enviar webhook: ${error.message}`);
        }
      }
    });

    await client.initialize();
    
  } catch (error) {
    console.error(`❌ Erro ao inicializar cliente: ${instance.instanceId}`, error);
    instance.status = 'error';
    instance.error = error.message;
    saveInstancesState(); // Salvar estado atualizado
  }
}

// Função para enviar webhook
async function sendWebhook(webhookUrl, data) {
  const fetch = (await import('node-fetch')).default;
  
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
setInterval(saveInstancesState, 30000); // A cada 30 segundos

// Endpoints da API

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    server: 'WhatsApp Web.js Server with Persistence',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    activeInstances: activeInstances.size,
    persistenceEnabled: true
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
    persistenceDir: PERSISTENCE_DIR
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
      hasQR: !!instance.qrCode
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
    
    const instance = {
      instanceId,
      sessionName,
      companyId,
      webhookUrl,
      client: null,
      qrCode: null,
      status: 'creating',
      createdAt: new Date().toISOString()
    };
    
    activeInstances.set(instanceId, instance);
    
    // Inicializar cliente assincronamente
    setTimeout(() => initializeWhatsAppClient(instance), 1000);
    
    await saveInstancesState();
    
    res.json({
      success: true,
      instanceId,
      status: 'creating',
      message: 'Instância criada e inicializando'
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar instância:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
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
    
    // Destruir cliente se existir
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
      status: instance.status
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
    hasQR: !!instance.qrCode
  });
});

// Reiniciar instância
app.post('/instance/restart', authenticateToken, async (req, res) => {
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
    
    // Destruir cliente atual se existir
    if (instance.client) {
      try {
        await instance.client.destroy();
      } catch (error) {
        console.error('❌ Erro ao destruir cliente durante restart:', error);
      }
    }
    
    instance.client = null;
    instance.status = 'restarting';
    
    // Reinicializar após delay
    setTimeout(() => initializeWhatsAppClient(instance), 2000);
    
    await saveInstancesState();
    
    res.json({
      success: true,
      message: 'Restart da instância iniciado'
    });
    
  } catch (error) {
    console.error('❌ Erro ao reiniciar instância:', error);
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
    console.log(`🚀 WhatsApp Web.js Server com Persistência rodando na porta ${PORT}`);
    console.log(`📊 Status: http://localhost:${PORT}/health`);
    console.log(`📂 Persistência: ${PERSISTENCE_DIR}`);
    console.log(`🔑 Token: ${AUTH_TOKEN === 'default-token' ? '⚠️  USANDO TOKEN PADRÃO' : '✅ Token configurado'}`);
    console.log(`💾 Instâncias carregadas: ${activeInstances.size}`);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Encerrando servidor...');
  
  // Salvar estado final
  await saveInstancesState();
  
  // Destruir todas as instâncias
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

// Iniciar servidor
startServer().catch(console.error);

module.exports = app;
