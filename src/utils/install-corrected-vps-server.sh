
#!/bin/bash
# Script para instalar servidor VPS corrigido e otimizado
# Baseado no vps-server-persistent.js com melhorias específicas para VPS

echo "🚀 INSTALANDO SERVIDOR VPS CORRIGIDO E OTIMIZADO"
echo "=================================================="

# 1. Parar servidor atual
echo "🛑 Parando servidor atual..."
pm2 stop webhook-server-3002 2>/dev/null || true
sleep 3

# 2. Fazer backup do servidor atual
echo "💾 Fazendo backup do servidor atual..."
cd /root/webhook-server-3002
cp server.js "server-backup-$(date +%Y%m%d-%H%M%S).js"

# 3. Criar novo servidor otimizado
echo "📝 Criando servidor corrigido..."
cat > server.js << 'EOF'
// Servidor WhatsApp Web.js CORRIGIDO para VPS
// Versão otimizada com configuração Puppeteer específica para VPS
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3002; // PORTA FIXA PARA VPS
const AUTH_TOKEN = '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3'; // TOKEN FIXO

// Configurar CORS e parsing
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Diretório para persistência
const PERSISTENCE_DIR = path.join(__dirname, 'whatsapp_instances');
const INSTANCES_FILE = path.join(PERSISTENCE_DIR, 'active_instances.json');
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

// CONFIGURAÇÃO PUPPETEER OTIMIZADA PARA VPS
const VPS_PUPPETEER_CONFIG = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox', 
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--single-process', // CRÍTICO: Um único processo para VPS limitada
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
    '--memory-pressure-off',
    '--max_old_space_size=512' // LIMITE MEMÓRIA
  ],
  ignoreHTTPSErrors: true,
  timeout: 45000 // 45 segundos para VPS
};

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

// Função para inicializar cliente WhatsApp COM CONFIGURAÇÃO VPS
async function initializeWhatsAppClient(instance) {
  try {
    console.log(`🚀 [${instance.instanceId}] Inicializando com configuração VPS otimizada...`);
    
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: instance.sessionName,
        dataPath: path.join(PERSISTENCE_DIR, 'sessions')
      }),
      puppeteer: VPS_PUPPETEER_CONFIG // CONFIGURAÇÃO ESPECÍFICA VPS
    });

    instance.client = client;
    instance.status = 'initializing';

    // TIMEOUT PERSONALIZADO PARA VPS
    const initTimeout = setTimeout(() => {
      console.log(`⏰ [${instance.instanceId}] TIMEOUT na inicialização VPS (45s)`);
      instance.status = 'timeout';
      if (client) {
        try {
          client.destroy();
        } catch (e) {
          console.log(`🧹 [${instance.instanceId}] Cleanup timeout OK`);
        }
      }
      saveInstancesState();
    }, 45000);

    // Event handlers otimizados
    client.on('qr', (qr) => {
      console.log(`📱 [${instance.instanceId}] QR Code gerado para VPS!`);
      instance.qrCode = qr;
      instance.status = 'qr_ready';
      saveInstancesState();
      
      // Enviar QR Code via webhook se configurado
      if (instance.webhookUrl) {
        sendWebhook(instance.webhookUrl, {
          event: 'qr.update',
          instanceName: instance.sessionName,
          data: { qrCode: qr },
          timestamp: new Date().toISOString(),
          server_url: `http://31.97.24.222:${PORT}` // IP FIXO VPS
        }).catch(error => {
          console.error(`❌ Erro webhook QR:`, error.message);
        });
      }
    });

    client.on('ready', () => {
      console.log(`✅ [${instance.instanceId}] Cliente VPS pronto!`);
      clearTimeout(initTimeout);
      instance.status = 'ready';
      instance.qrCode = null;
      saveInstancesState();
    });

    client.on('authenticated', () => {
      console.log(`🔐 [${instance.instanceId}] Cliente VPS autenticado`);
      clearTimeout(initTimeout);
      instance.status = 'authenticated';
      saveInstancesState();
    });

    client.on('auth_failure', (msg) => {
      console.error(`❌ [${instance.instanceId}] Falha auth VPS:`, msg);
      clearTimeout(initTimeout);
      instance.status = 'auth_failed';
      saveInstancesState();
    });

    client.on('disconnected', (reason) => {
      console.log(`🔌 [${instance.instanceId}] VPS desconectado:`, reason);
      clearTimeout(initTimeout);
      instance.status = 'disconnected';
      saveInstancesState();
    });

    // CAPTURAR MENSAGENS
    client.on('message_create', async (message) => {
      console.log(`📨 [${instance.instanceId}] Mensagem capturada:`, {
        from: message.from,
        fromMe: message.fromMe,
        body: message.body?.substring(0, 30) + '...'
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
                  conversation: message.body
                }
              }] 
            },
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error(`❌ Erro webhook mensagem:`, error.message);
        }
      }
    });

    console.log(`🔄 [${instance.instanceId}] Chamando client.initialize() com config VPS...`);
    await client.initialize();
    
  } catch (error) {
    console.error(`❌ [${instance.instanceId}] Erro inicialização VPS:`, error.message);
    instance.status = 'error';
    instance.error = error.message;
    saveInstancesState();
  }
}

// Função para enviar webhook
async function sendWebhook(webhookUrl, data) {
  const fetch = (await import('node-fetch')).default;
  
  console.log(`🔗 Enviando webhook VPS:`, {
    event: data.event,
    instanceName: data.instanceName
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

// === ENDPOINTS DA API ===

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    server: 'WhatsApp VPS Corrigido',
    version: '3.0.0-vps',
    port: PORT,
    timestamp: new Date().toISOString(),
    activeInstances: activeInstances.size,
    persistenceEnabled: true,
    vpsOptimized: true
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
    vpsConfig: 'optimized'
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
      vpsOptimized: true
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
    
    // Webhook URL padrão
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
    
    // Inicializar cliente em 2 segundos
    setTimeout(() => initializeWhatsAppClient(instance), 2000);
    
    await saveInstancesState();
    
    res.json({
      success: true,
      instanceId,
      status: 'creating',
      message: 'Instância VPS criada - aguarde inicialização',
      vpsOptimized: true
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar instância VPS:', error);
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
      status: instance.status,
      vpsOptimized: true
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
    hasQR: !!instance.qrCode,
    vpsOptimized: true
  });
});

// Deletar instância
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
      message: 'Instância VPS deletada com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao deletar instância VPS:', error);
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
    
    console.log(`📤 [${instanceId}] Mensagem VPS enviada para ${phone}`);
    
    res.json({
      success: true,
      messageId: sentMessage.id._serialized || sentMessage.id,
      timestamp: new Date().toISOString(),
      vpsOptimized: true
    });
    
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem VPS:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handler
app.use((error, req, res, next) => {
  console.error('❌ Erro no servidor VPS:', error);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor VPS',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Encerrando servidor VPS...');
  
  await saveInstancesState();
  
  for (const [instanceId, instance] of activeInstances.entries()) {
    if (instance.client) {
      try {
        await instance.client.destroy();
        console.log(`🔌 Cliente VPS ${instanceId} desconectado`);
      } catch (error) {
        console.error(`❌ Erro ao desconectar ${instanceId}:`, error);
      }
    }
  }
  
  console.log('✅ Shutdown VPS concluído');
  process.exit(0);
});

// Inicializar servidor
async function startServer() {
  await ensurePersistenceDirectory();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 WhatsApp VPS Corrigido rodando na porta ${PORT}`);
    console.log(`📊 Health: http://31.97.24.222:${PORT}/health`);
    console.log(`🔑 Token: ${AUTH_TOKEN.substring(0, 10)}...`);
    console.log(`⚡ VPS OPTIMIZADO: Configuração específica aplicada`);
  });
}

startServer().catch(console.error);
EOF

# 4. Instalar node-fetch se necessário
echo "📦 Verificando dependências..."
npm list node-fetch 2>/dev/null || npm install node-fetch@2.7.0

# 5. Reiniciar servidor
echo "🔄 Reiniciando servidor com configuração VPS..."
pm2 restart webhook-server-3002

# 6. Aguardar inicialização
echo "⏳ Aguardando inicialização (10s)..."
sleep 10

# 7. Testar servidor
echo "🧪 Testando servidor VPS corrigido..."
echo ""
echo "=== HEALTH CHECK VPS ==="
curl -s "http://31.97.24.222:3002/health" | jq '.'

echo ""
echo "=== TESTE CRIAÇÃO INSTÂNCIA VPS ==="
curl -s -X POST "http://31.97.24.222:3002/instance/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" \
  --data '{"instanceId": "vps_corrigido_definitivo", "sessionName": "vps_corrigido"}' | jq '.'

echo ""
echo "⏳ Aguardando QR Code (30s)..."
sleep 30

echo ""
echo "=== STATUS INSTÂNCIA VPS ==="
curl -s "http://31.97.24.222:3002/instance/vps_corrigido_definitivo/status" \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" | jq '.'

echo ""
echo "=== QR CODE VPS ==="
curl -s "http://31.97.24.222:3002/instance/vps_corrigido_definitivo/qr" \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" | jq '.'

echo ""
echo "🎉 INSTALAÇÃO VPS CORRIGIDA CONCLUÍDA!"
echo "=================================================="
echo "✅ Servidor otimizado para VPS implementado"
echo "✅ Configuração Puppeteer específica para VPS"
echo "✅ Timeouts ajustados para recursos VPS"
echo "✅ Sistema de persistência implementado"
echo "✅ Webhook automático configurado"
echo ""
echo "📋 Para monitorar logs: pm2 logs webhook-server-3002"
echo "📊 Para status PM2: pm2 status"
echo "🔍 Para health check: curl http://31.97.24.222:3002/health"
echo "=================================================="
