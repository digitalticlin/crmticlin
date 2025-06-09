
// Servidor WhatsApp Web.js otimizado para porta 3002
// Corrigido por: Sistema de correção VPS
// Autor: Lovable AI

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configurações
const PORT = process.env.PORT || 3002;
const AUTH_TOKEN = process.env.AUTH_TOKEN || '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web';
const SUPABASE_QR_WEBHOOK = 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/whatsapp_qr_service';
const SESSION_DIR = './sessions';

// Configurações do Chrome/Puppeteer otimizadas
const HEADLESS = 'new'; // 'new' é mais estável que true/false
const BROWSER_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--disable-gpu',
  '--window-size=1280,720',
  '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
];

// Criar diretório de sessões se não existir
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}

// Inicializar Express
const app = express();
app.use(express.json());
app.use(cors());

// Armazenamento de instâncias ativas
const instances = {};
const qrCodes = {};
const initializationPromises = {};

// Middleware de autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['x-api-token'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token || token !== AUTH_TOKEN) {
    return res.status(401).json({ success: false, error: 'Token de autenticação inválido' });
  }
  
  next();
}

// Criar/inicializar cliente WhatsApp
async function createWhatsAppClient(instanceId, webhookUrl = WEBHOOK_URL) {
  console.log(`🚀 Criando instância: ${instanceId}`);
  
  // Evitar inicializações duplicadas
  if (initializationPromises[instanceId]) {
    console.log(`⚠️ Inicialização para ${instanceId} já em andamento, aguardando...`);
    return initializationPromises[instanceId];
  }
  
  // Criar diretório específico para esta instância
  const sessionDir = path.join(SESSION_DIR, instanceId);
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  // Identificar Chrome executável
  const chromePath = getChromePath();
  console.log(`🌐 Chrome: ${chromePath}`);
  
  // Configuração do cliente
  const clientConfig = {
    authStrategy: new LocalAuth({
      clientId: instanceId,
      dataPath: SESSION_DIR
    }),
    puppeteer: {
      headless: HEADLESS,
      args: BROWSER_ARGS,
      executablePath: chromePath,
      // CORREÇÃO: Remover defaultViewport para evitar erros
    }
  };

  // CORREÇÃO: Promises de inicialização com retry
  initializationPromises[instanceId] = (async () => {
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      attempts++;
      try {
        // Criar cliente
        const client = new Client(clientConfig);
        
        // Configurar eventos
        setupClientEvents(client, instanceId, webhookUrl);
        
        // Inicializar cliente
        await client.initialize();
        
        // Armazenar cliente
        instances[instanceId] = client;
        
        console.log(`✅ Instância ${instanceId} inicializada (tentativa ${attempts})`);
        return { success: true, client, instanceId };
      } catch (error) {
        console.error(`❌ Erro ao criar instância ${instanceId} (tentativa ${attempts}):`, error);
        
        // Se for a última tentativa, relançar erro
        if (attempts >= maxAttempts) {
          throw error;
        }
        
        // Aguardar antes de tentar novamente
        console.log(`⏱️ Aguardando 5s antes de tentar novamente...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  })();
  
  return initializationPromises[instanceId];
}

// Configurar eventos do cliente
function setupClientEvents(client, instanceId, webhookUrl) {
  // QR Code
  client.on('qr', async (qr) => {
    console.log(`📱 QR Code gerado para ${instanceId}`);
    
    try {
      // Converter QR para image base64
      const qrImage = await qrcode.toDataURL(qr, { scale: 8 });
      qrCodes[instanceId] = qrImage;
      
      // Salvar QR no banco via Supabase function
      const qrSavePayload = {
        action: 'save_qr_code',
        vps_instance_id: instanceId,
        qr_code: qrImage
      };
      
      axios.post(SUPABASE_QR_WEBHOOK, qrSavePayload, {
        headers: { 'Content-Type': 'application/json' }
      }).then(() => {
        console.log(`✅ QR Code salvo no banco para: ${instanceId}`);
      }).catch(error => {
        console.error(`❌ Erro ao salvar QR no banco:`, error.message);
      });
      
      // Enviar evento para webhook
      sendWebhookEvent(webhookUrl, 'qr.update', { instanceId, qr, qrImage });
    } catch (error) {
      console.error(`❌ Erro ao processar QR Code:`, error);
    }
  });
  
  // Autenticado
  client.on('authenticated', () => {
    console.log(`🔐 Autenticado: ${instanceId}`);
    sendWebhookEvent(webhookUrl, 'connection.update', { 
      instanceId, 
      status: 'authenticated' 
    });
  });
  
  // Pronto
  client.on('ready', () => {
    console.log(`✅ Pronto: ${instanceId}`);
    delete qrCodes[instanceId]; // QR não é mais necessário
    sendWebhookEvent(webhookUrl, 'connection.update', { 
      instanceId, 
      status: 'ready' 
    });
  });
  
  // Mudança de estado de conexão
  client.on('change_state', (state) => {
    console.log(`🔄 Mudança de estado: ${instanceId} -> ${state}`);
    sendWebhookEvent(webhookUrl, 'connection.update', {
      instanceId,
      status: state
    });
  });

  // Mensagens
  client.on('message', (message) => {
    console.log(`📨 Mensagem recebida em ${instanceId} de ${message.from}`);
    sendWebhookEvent(webhookUrl, 'messages.upsert', {
      instance: instanceId,
      ...message
    });
  });
  
  // Desconexão
  client.on('disconnected', (reason) => {
    console.log(`❌ Desconectado: ${instanceId} - ${reason}`);
    sendWebhookEvent(webhookUrl, 'connection.update', {
      instanceId,
      status: 'disconnected',
      reason
    });
  });
}

// Enviar evento para webhook
function sendWebhookEvent(webhookUrl, event, data) {
  if (!webhookUrl) return;
  
  axios.post(webhookUrl, {
    event,
    data,
    timestamp: Date.now()
  }, {
    headers: { 'Content-Type': 'application/json' }
  }).catch(error => {
    console.error(`❌ Erro ao enviar webhook:`, error.message);
  });
}

// Obter caminho do Chrome/Chromium
function getChromePath() {
  // Lista de possíveis localizações
  const chromePaths = [
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ];
  
  // Verificar cada caminho
  for (const path of chromePaths) {
    if (fs.existsSync(path)) {
      return path;
    }
  }
  
  // Retornar undefined para usar o padrão do puppeteer
  return undefined;
}

// Endpoint de health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    server: 'WhatsApp Web.js Server',
    version: '3.0-CORRECTED',
    port: PORT.toString(),
    timestamp: new Date().toISOString(),
    activeInstances: Object.keys(instances).length,
    chromePath: getChromePath(),
    puppeteerConfig: ['headless', 'args', 'executablePath']
  });
});

// CORREÇÃO: Novo endpoint de status
app.get('/status', authenticateToken, (req, res) => {
  const activeInstances = Object.keys(instances).map(id => ({
    id,
    status: instances[id].info?.wid ? 'connected' : 'initializing',
    name: id,
    lastSeen: new Date().toISOString()
  }));
  
  res.json({
    success: true,
    instances: activeInstances,
    total: activeInstances.length,
    server: {
      uptime: process.uptime(),
      version: '3.0-CORRECTED',
      port: PORT
    }
  });
});

// Listar instâncias
app.get('/instances', authenticateToken, (req, res) => {
  const activeInstances = Object.keys(instances).map(id => ({
    id,
    status: instances[id].info?.wid ? 'connected' : 'initializing',
    name: id
  }));
  
  res.json({
    success: true,
    instances: activeInstances,
    total: activeInstances.length
  });
});

// Criar instância
app.post('/instance/create', authenticateToken, async (req, res) => {
  const { instanceId, sessionName, webhookUrl } = req.body;
  const id = instanceId || `instance_${Date.now()}`;
  
  // Verificar se instância já existe
  if (instances[id]) {
    return res.json({
      success: true,
      message: 'Instância já existe',
      instanceId: id,
      status: 'exists'
    });
  }
  
  try {
    // Iniciar instância assincronamente
    res.json({
      success: true,
      message: 'Instância em criação',
      instanceId: id,
      status: 'initializing'
    });
    
    // Criar instância de forma assíncrona
    createWhatsAppClient(id, webhookUrl).catch(error => {
      console.error(`❌ Erro ao criar instância ${id}:`, error);
    });
    
  } catch (error) {
    console.error(`❌ Erro ao criar instância ${id}:`, error);
    return res.status(500).json({
      success: false,
      error: `Erro ao criar instância: ${error.message}`
    });
  }
});

// Deletar instância
app.delete('/instance/:instanceId', authenticateToken, async (req, res) => {
  const { instanceId } = req.params;
  
  try {
    // Verificar se instância existe
    if (!instances[instanceId]) {
      return res.json({
        success: true,
        message: 'Instância não encontrada ou já foi deletada',
        instanceId
      });
    }
    
    // Tentar destruir cliente
    try {
      await instances[instanceId].destroy();
    } catch (destroyError) {
      console.error(`❌ Erro ao destruir cliente ${instanceId}:`, destroyError);
    }
    
    // Remover referências
    delete instances[instanceId];
    delete qrCodes[instanceId];
    delete initializationPromises[instanceId];
    
    // Tentar remover diretório de sessão
    try {
      const sessionDir = path.join(SESSION_DIR, instanceId);
      if (fs.existsSync(sessionDir)) {
        fs.rmdirSync(sessionDir, { recursive: true });
      }
    } catch (fsError) {
      console.error(`⚠️ Erro ao remover diretório de sessão:`, fsError);
    }
    
    return res.json({
      success: true,
      message: 'Instância deletada',
      instanceId
    });
    
  } catch (error) {
    console.error(`❌ Erro ao deletar instância ${instanceId}:`, error);
    return res.status(500).json({
      success: false,
      error: `Erro ao deletar instância: ${error.message}`
    });
  }
});

// Obter QR Code
app.get('/instance/:instanceId/qr', authenticateToken, (req, res) => {
  const { instanceId } = req.params;
  
  // Verificar se instância existe
  if (!instances[instanceId]) {
    return res.status(404).json({
      success: false,
      error: 'Instância não encontrada'
    });
  }
  
  // Verificar se QR code está disponível
  if (!qrCodes[instanceId]) {
    return res.status(404).json({
      success: false,
      error: 'QR Code não disponível para esta instância'
    });
  }
  
  return res.json({
    success: true,
    qrCode: qrCodes[instanceId],
    instanceId
  });
});

// CORREÇÃO: Novo endpoint de status da instância
app.get('/instance/:instanceId/status', authenticateToken, (req, res) => {
  const { instanceId } = req.params;
  
  // Verificar se instância existe
  if (!instances[instanceId]) {
    return res.status(404).json({
      success: false,
      error: 'Instância não encontrada'
    });
  }
  
  const client = instances[instanceId];
  const state = client.info ? 'ready' : (qrCodes[instanceId] ? 'qr_ready' : 'initializing');
  
  return res.json({
    success: true,
    state,
    info: {
      id: instanceId,
      pushname: client.info?.pushname,
      connected: !!client.info,
      phone: client.info?.wid?.user || null,
      hasQR: !!qrCodes[instanceId]
    }
  });
});

// CORREÇÃO: Implementar endpoint de envio de mensagem
app.post('/send', authenticateToken, async (req, res) => {
  const { instanceId, phone, message } = req.body;
  
  if (!instanceId || !phone || !message) {
    return res.status(400).json({
      success: false,
      error: 'Parâmetros inválidos. Necessário: instanceId, phone, message'
    });
  }
  
  try {
    // Verificar se instância existe
    if (!instances[instanceId]) {
      return res.status(404).json({
        success: false,
        error: 'Instância não encontrada'
      });
    }
    
    const client = instances[instanceId];
    
    // Verificar se cliente está pronto
    if (!client.info) {
      return res.status(400).json({
        success: false,
        error: 'Cliente não está pronto para enviar mensagens'
      });
    }
    
    // Formatar número de telefone
    let formattedPhone = phone.toString().replace(/[^\d]/g, '');
    
    // Adicionar @c.us se não tiver
    if (!formattedPhone.includes('@')) {
      formattedPhone = `${formattedPhone}@c.us`;
    }
    
    // Enviar mensagem
    const sentMessage = await client.sendMessage(formattedPhone, message);
    
    return res.json({
      success: true,
      messageId: sentMessage.id._serialized,
      timestamp: sentMessage.timestamp || new Date().toISOString(),
      to: formattedPhone
    });
    
  } catch (error) {
    console.error(`❌ Erro ao enviar mensagem:`, error);
    return res.status(500).json({
      success: false,
      error: `Erro ao enviar mensagem: ${error.message}`
    });
  }
});

// CORREÇÃO: Endpoint para forçar refresh do QR Code
app.post('/instance/:instanceId/refresh', authenticateToken, (req, res) => {
  const { instanceId } = req.params;
  
  // Verificar se instância existe
  if (!instances[instanceId]) {
    return res.status(404).json({
      success: false,
      error: 'Instância não encontrada'
    });
  }
  
  try {
    // Remover QR Code atual para forçar geração de um novo
    delete qrCodes[instanceId];
    
    // Tentar desconectar e reconectar o cliente
    const client = instances[instanceId];
    if (client) {
      // Logout forçado para gerar novo QR
      client.logout()
        .then(() => console.log(`✅ Logout realizado para ${instanceId}`))
        .catch(() => console.log(`⚠️ Erro no logout para ${instanceId}, ignorando`));
    }
    
    return res.json({
      success: true,
      message: 'QR Code refresh iniciado',
      instanceId
    });
    
  } catch (error) {
    console.error(`❌ Erro ao fazer refresh do QR:`, error);
    return res.status(500).json({
      success: false,
      error: `Erro ao fazer refresh do QR: ${error.message}`
    });
  }
});

// Configurar webhook global
app.get('/webhook/global', authenticateToken, (req, res) => {
  res.json({
    success: true,
    webhook: WEBHOOK_URL,
    active: !!WEBHOOK_URL
  });
});

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Chrome detectado: ${getChromePath()}`);
  console.log(`🚀 Servidor WhatsApp rodando na porta ${PORT}`);
  console.log(`🔐 Token: ${AUTH_TOKEN.substring(0, 9)}...`);
  console.log(`🌐 Chrome: ${getChromePath()}`);
  console.log(`📡 Webhook: ${WEBHOOK_URL}`);
});

// Tratamento de eventos do processo
process.on('SIGINT', () => {
  console.log('🛑 Encerrando servidor...');
  
  // Tentar destruir todas as instâncias
  Object.keys(instances).forEach(id => {
    try {
      instances[id].destroy();
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

module.exports = { app, server };
