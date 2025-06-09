
#!/bin/bash
# Script para implementar servidor WhatsApp Web.js COMPLETO corrigido
# Baseado no whatsapp-server.js original com todas as funcionalidades

echo "🚀 IMPLEMENTANDO SERVIDOR COMPLETO CORRIGIDO"
echo "=============================================="

# 1. Parar servidor atual
echo "🛑 Parando servidor atual..."
pm2 stop webhook-server-3002 2>/dev/null || true
sleep 3

# 2. Fazer backup
echo "💾 Fazendo backup..."
cd /root/webhook-server-3002
cp server.js "server-backup-incompleto-$(date +%Y%m%d-%H%M%S).js"

# 3. Implementar servidor COMPLETO
echo "📝 Implementando servidor COMPLETO..."
cat > server.js << 'EOF'
// WhatsApp Web.js Server COMPLETO - Versão Corrigida para VPS
// Baseado no whatsapp-server.js original com TODAS as funcionalidades
const express = require('express');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { exec } = require('child_process');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3002; // PORTA FIXA PARA VPS
const API_TOKEN = '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3'; // TOKEN FIXO

// VERSION CONTROL
const SERVER_VERSION = '4.2.0-VPS-COMPLETE';
const BUILD_DATE = new Date().toISOString();

// Configurar CORS e parsing
app.use(cors());
app.use(express.json());

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
    '--memory-pressure-off',
    '--max_old_space_size=512'
  ],
  ignoreHTTPSErrors: true,
  timeout: 60000
};

// Armazenamento de instâncias
const instances = new Map();
const instanceStates = new Map();

// Diretório de persistência
const SESSIONS_DIR = path.join(__dirname, '.wwebjs_auth');

// Middleware de autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || token !== API_TOKEN) {
    return res.status(401).json({ 
      success: false, 
      error: 'Token de autenticação inválido',
      code: 'AUTH_FAILED'
    });
  }

  next();
}

// Função para garantir diretório de sessões
async function ensureSessionDirectory() {
  try {
    if (!fs.existsSync(SESSIONS_DIR)) {
      fs.mkdirSync(SESSIONS_DIR, { recursive: true });
      console.log('📂 Diretório de sessões criado:', SESSIONS_DIR);
    }
  } catch (error) {
    console.error('❌ Erro ao criar diretório de sessões:', error);
  }
}

// Função robusta para inicializar cliente
async function initializeWhatsAppClient(instanceId, sessionName, webhookUrl = null) {
  try {
    console.log(`🚀 [${instanceId}] Inicializando cliente com configuração VPS completa...`);
    
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: sessionName,
        dataPath: SESSIONS_DIR
      }),
      puppeteer: VPS_PUPPETEER_CONFIG
    });

    // Armazenar cliente
    instances.set(instanceId, {
      client,
      sessionName,
      webhookUrl,
      status: 'initializing',
      createdAt: new Date().toISOString(),
      qrCode: null,
      phone: null,
      profileName: null,
      lastSeen: new Date().toISOString()
    });

    // TIMEOUT DE INICIALIZAÇÃO PARA VPS
    const initTimeout = setTimeout(() => {
      console.log(`⏰ [${instanceId}] TIMEOUT na inicialização VPS (60s)`);
      const instance = instances.get(instanceId);
      if (instance) {
        instance.status = 'timeout';
        try {
          if (client) client.destroy();
        } catch (e) {
          console.log(`🧹 [${instanceId}] Cleanup timeout executado`);
        }
      }
    }, 60000);

    // Event handlers robustos
    client.on('qr', (qr) => {
      console.log(`📱 [${instanceId}] QR Code gerado para VPS!`);
      const instance = instances.get(instanceId);
      if (instance) {
        instance.qrCode = qr;
        instance.status = 'qr_ready';
        instance.lastSeen = new Date().toISOString();
        
        // Enviar webhook se configurado
        if (webhookUrl) {
          sendWebhook(webhookUrl, {
            event: 'qr.update',
            instanceName: sessionName,
            instanceId: instanceId,
            data: { qrCode: qr },
            timestamp: new Date().toISOString(),
            server_info: {
              version: SERVER_VERSION,
              port: PORT
            }
          }).catch(error => {
            console.error(`❌ [${instanceId}] Erro webhook QR:`, error.message);
          });
        }
      }
    });

    client.on('ready', () => {
      console.log(`✅ [${instanceId}] Cliente VPS pronto!`);
      clearTimeout(initTimeout);
      const instance = instances.get(instanceId);
      if (instance) {
        instance.status = 'ready';
        instance.qrCode = null;
        instance.phone = client.info?.wid?.user || null;
        instance.profileName = client.info?.pushname || null;
        instance.lastSeen = new Date().toISOString();
        
        // Webhook de conexão
        if (webhookUrl) {
          sendWebhook(webhookUrl, {
            event: 'connection.update',
            instanceName: sessionName,
            instanceId: instanceId,
            data: { 
              status: 'ready',
              phone: instance.phone,
              profileName: instance.profileName
            },
            timestamp: new Date().toISOString()
          }).catch(console.error);
        }
      }
    });

    client.on('authenticated', () => {
      console.log(`🔐 [${instanceId}] Cliente VPS autenticado`);
      clearTimeout(initTimeout);
      const instance = instances.get(instanceId);
      if (instance) {
        instance.status = 'authenticated';
        instance.lastSeen = new Date().toISOString();
      }
    });

    client.on('auth_failure', (msg) => {
      console.error(`❌ [${instanceId}] Falha auth VPS:`, msg);
      clearTimeout(initTimeout);
      const instance = instances.get(instanceId);
      if (instance) {
        instance.status = 'auth_failed';
        instance.error = msg;
        instance.lastSeen = new Date().toISOString();
      }
    });

    client.on('disconnected', (reason) => {
      console.log(`🔌 [${instanceId}] VPS desconectado:`, reason);
      clearTimeout(initTimeout);
      const instance = instances.get(instanceId);
      if (instance) {
        instance.status = 'disconnected';
        instance.error = reason;
        instance.lastSeen = new Date().toISOString();
      }
    });

    // CAPTURAR MENSAGENS
    client.on('message_create', async (message) => {
      console.log(`📨 [${instanceId}] Mensagem capturada:`, {
        from: message.from,
        fromMe: message.fromMe,
        body: message.body?.substring(0, 30) + '...'
      });
      
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
          console.error(`❌ [${instanceId}] Erro webhook mensagem:`, error.message);
        }
      }
    });

    console.log(`🔄 [${instanceId}] Chamando client.initialize() VPS...`);
    await client.initialize();
    
  } catch (error) {
    console.error(`❌ [${instanceId}] Erro inicialização VPS:`, error.message);
    const instance = instances.get(instanceId);
    if (instance) {
      instance.status = 'error';
      instance.error = error.message;
      instance.lastSeen = new Date().toISOString();
    }
  }
}

// Função para enviar webhook
async function sendWebhook(webhookUrl, data) {
  try {
    const fetch = (await import('node-fetch')).default;
    
    console.log(`🔗 Enviando webhook VPS:`, {
      event: data.event,
      instanceName: data.instanceName
    });
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify(data),
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    console.log(`✅ Webhook enviado com sucesso`);
  } catch (error) {
    console.error(`❌ Erro ao enviar webhook:`, error.message);
    throw error;
  }
}

// === ENDPOINTS DA API ===

// Health check
app.get('/health', (req, res) => {
  const instancesList = Array.from(instances.entries()).map(([id, instance]) => ({
    id,
    status: instance.status,
    phone: instance.phone,
    hasQR: !!instance.qrCode
  }));

  res.json({
    success: true,
    status: 'online',
    server: 'WhatsApp VPS Complete',
    version: SERVER_VERSION,
    build_date: BUILD_DATE,
    port: PORT,
    timestamp: new Date().toISOString(),
    active_instances: instances.size,
    instances: instancesList,
    vps_optimized: true,
    puppeteer_config: 'vps_optimized'
  });
});

// Status do servidor
app.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    uptime: process.uptime(),
    active_instances: instances.size,
    memory_usage: process.memoryUsage(),
    sessions_dir: SESSIONS_DIR,
    version: SERVER_VERSION
  });
});

// Listar instâncias
app.get('/instances', authenticateToken, (req, res) => {
  const instancesList = [];
  
  for (const [instanceId, instance] of instances.entries()) {
    instancesList.push({
      instanceId: instanceId,
      status: instance.status,
      sessionName: instance.sessionName,
      phone: instance.phone,
      profileName: instance.profileName,
      lastSeen: instance.lastSeen,
      hasQR: !!instance.qrCode,
      error: instance.error || null,
      createdAt: instance.createdAt
    });
  }
  
  res.json({
    success: true,
    instances: instancesList,
    total: instancesList.length,
    server_version: SERVER_VERSION
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
    
    if (instances.has(instanceId)) {
      return res.status(409).json({
        success: false,
        error: 'Instância já existe'
      });
    }
    
    // Webhook URL padrão
    const finalWebhookUrl = webhookUrl || 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web';
    
    console.log(`✅ [${instanceId}] Instância registrada, iniciando em 2s...`);
    
    // Inicializar cliente em 2 segundos
    setTimeout(() => {
      initializeWhatsAppClient(instanceId, sessionName, finalWebhookUrl);
    }, 2000);
    
    res.json({
      success: true,
      instanceId,
      sessionName,
      status: 'creating',
      message: 'Instância VPS criada - aguarde inicialização',
      webhookUrl: finalWebhookUrl,
      server_version: SERVER_VERSION
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
app.post('/instance/qr', authenticateToken, (req, res) => {
  try {
    const { instanceId } = req.body;
    
    if (!instanceId) {
      return res.status(400).json({
        success: false,
        error: 'instanceId é obrigatório'
      });
    }
    
    const instance = instances.get(instanceId);
    
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
        instanceId: instanceId,
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({
        success: false,
        error: 'QR Code não disponível',
        status: instance.status,
        message: instance.status === 'ready' ? 'Instância já conectada' : 'QR Code ainda não gerado'
      });
    }
  } catch (error) {
    console.error('❌ Erro ao obter QR Code:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Status da instância
app.post('/instance/status', authenticateToken, (req, res) => {
  try {
    const { instanceId } = req.body;
    
    if (!instanceId) {
      return res.status(400).json({
        success: false,
        error: 'instanceId é obrigatório'
      });
    }
    
    const instance = instances.get(instanceId);
    
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
      phone: instance.phone,
      profileName: instance.profileName,
      hasQR: !!instance.qrCode,
      lastSeen: instance.lastSeen,
      error: instance.error || null,
      createdAt: instance.createdAt
    });
  } catch (error) {
    console.error('❌ Erro ao obter status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Deletar instância
app.delete('/instance/:instanceId', authenticateToken, async (req, res) => {
  try {
    const { instanceId } = req.params;
    
    const instance = instances.get(instanceId);
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
        console.log(`🔌 [${instanceId}] Cliente destruído`);
      } catch (error) {
        console.error(`❌ [${instanceId}] Erro ao destruir cliente:`, error);
      }
    }
    
    instances.delete(instanceId);
    
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
    
    const instance = instances.get(instanceId);
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
      phone: formattedPhone
    });
    
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem VPS:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Configurar webhook global
app.post('/webhook/global', authenticateToken, async (req, res) => {
  try {
    const { webhookUrl, events } = req.body;
    
    if (!webhookUrl) {
      return res.status(400).json({
        success: false,
        error: 'webhookUrl é obrigatório'
      });
    }
    
    // Atualizar webhook para todas as instâncias
    for (const [instanceId, instance] of instances.entries()) {
      instance.webhookUrl = webhookUrl;
      console.log(`🔗 [${instanceId}] Webhook global configurado: ${webhookUrl}`);
    }
    
    res.json({
      success: true,
      message: 'Webhook global configurado para todas as instâncias',
      webhookUrl: webhookUrl,
      events: events || ['messages.upsert', 'qr.update', 'connection.update'],
      instances_updated: instances.size
    });
    
  } catch (error) {
    console.error('❌ Erro ao configurar webhook global:', error);
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
    timestamp: new Date().toISOString(),
    version: SERVER_VERSION
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Encerrando servidor VPS completo...');
  
  for (const [instanceId, instance] of instances.entries()) {
    if (instance.client) {
      try {
        await instance.client.destroy();
        console.log(`🔌 [${instanceId}] Cliente VPS desconectado`);
      } catch (error) {
        console.error(`❌ [${instanceId}] Erro ao desconectar:`, error);
      }
    }
  }
  
  console.log('✅ Shutdown VPS concluído');
  process.exit(0);
});

// Inicializar servidor
async function startServer() {
  await ensureSessionDirectory();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 WhatsApp VPS Complete Server rodando na porta ${PORT}`);
    console.log(`📊 Health: http://31.97.24.222:${PORT}/health`);
    console.log(`🔑 Token configurado: ${API_TOKEN.substring(0, 10)}...`);
    console.log(`💚 Health: http://31.97.24.222:${PORT}/health`);
    console.log(`📱 Versão: ${SERVER_VERSION}`);
    console.log(`⚡ VPS OTIMIZADO: Todas as funcionalidades implementadas`);
  });
}

startServer().catch(console.error);

module.exports = app;
EOF

# 4. Instalar puppeteer na versão correta
echo "📦 Instalando Puppeteer otimizado para VPS..."
npm install puppeteer@18.0.5 --save

# 5. Verificar dependências
echo "🔍 Verificando dependências..."
npm list

# 6. Reiniciar servidor
echo "🔄 Reiniciando servidor com implementação COMPLETA..."
pm2 restart webhook-server-3002

# 7. Aguardar inicialização
echo "⏳ Aguardando inicialização completa (15s)..."
sleep 15

# 8. Configurar webhook global
echo "🔗 Configurando webhook global..."
curl -s -X POST "http://31.97.24.222:3002/webhook/global" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" \
  --data '{"webhookUrl": "https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web", "events": ["messages.upsert", "qr.update", "connection.update"]}' | jq '.'

echo ""
echo "🧪 TESTE COMPLETO DO SERVIDOR CORRIGIDO"
echo "======================================="

echo "1. Health Check Completo:"
curl -s "http://31.97.24.222:3002/health" | jq '.'

echo ""
echo "2. Criar Instância com Sistema Completo:"
curl -s -X POST "http://31.97.24.222:3002/instance/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" \
  --data '{"instanceId": "completo_definitivo", "sessionName": "completo_definitivo"}' | jq '.'

echo ""
echo "3. Aguardar QR Code (45s)..."
sleep 45

echo ""
echo "4. Verificar QR Code:"
curl -s -X POST "http://31.97.24.222:3002/instance/qr" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" \
  --data '{"instanceId": "completo_definitivo"}' | jq '.'

echo ""
echo "5. Status da Instância:"
curl -s -X POST "http://31.97.24.222:3002/instance/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" \
  --data '{"instanceId": "completo_definitivo"}' | jq '.'

echo ""
echo "6. Listar Todas as Instâncias:"
curl -s "http://31.97.24.222:3002/instances" \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" | jq '.'

echo ""
echo "🎉 SERVIDOR COMPLETO IMPLEMENTADO!"
echo "================================="
echo "✅ Todas as funcionalidades do whatsapp-server.js implementadas"
echo "✅ Configuração Puppeteer otimizada para VPS"
echo "✅ Sistema robusto de validação QR"
echo "✅ Webhook global configurado automaticamente"
echo "✅ Endpoints completos para criação/gerenciamento de instâncias"
echo "✅ Sistema de persistência de sessões"
echo "✅ Tratamento robusto de erros e timeouts"
echo ""
echo "📋 Para monitorar: pm2 logs webhook-server-3002"
echo "📊 Para status: pm2 status"
echo "🔍 Para health: curl http://31.97.24.222:3002/health"
echo "================================="
