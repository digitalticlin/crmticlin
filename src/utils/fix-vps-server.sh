
#!/bin/bash
# Script para corrigir servidor WhatsApp VPS - Tornar mais permissivo
# Execute: chmod +x src/utils/fix-vps-server.sh && src/utils/fix-vps-server.sh

echo "🔧 CORREÇÃO DO SERVIDOR VPS - TORNAR MAIS PERMISSIVO"
echo "==================================================="

# 1. Parar servidor atual
echo "🛑 Parando servidor atual..."
pm2 stop webhook-server-3002 2>/dev/null || true
sleep 3

# 2. Fazer backup
echo "💾 Fazendo backup do servidor atual..."
cd /root/webhook-server-3002
cp server.js "server-backup-$(date +%Y%m%d-%H%M%S).js"

# 3. Implementar servidor CORRIGIDO - Mais permissivo
echo "📝 Implementando servidor CORRIGIDO (mais permissivo)..."
cat > server.js << 'EOF'
// WhatsApp Web.js Server CORRIGIDO - Versão Permissiva para VPS
const express = require('express');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { exec } = require('child_process');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3002;
const API_TOKEN = '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';

// VERSION CONTROL - CORRIGIDA
const SERVER_VERSION = '4.1.0-PERMISSIVE';
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

// FUNÇÃO CORRIGIDA - Inicialização PERMISSIVA
async function initializeWhatsAppClient(instanceId, sessionName, webhookUrl = null) {
  try {
    console.log(`🚀 [${instanceId}] Inicializando cliente PERMISSIVO...`);
    
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: sessionName,
        dataPath: SESSIONS_DIR
      }),
      puppeteer: VPS_PUPPETEER_CONFIG
    });

    // Armazenar cliente IMEDIATAMENTE - SEM AGUARDAR QR
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

    // TIMEOUT MAIS GENEROSO - 120 segundos
    const initTimeout = setTimeout(() => {
      console.log(`⏰ [${instanceId}] TIMEOUT na inicialização (120s) - MANTENDO INSTÂNCIA`);
      const instance = instances.get(instanceId);
      if (instance && instance.status === 'initializing') {
        instance.status = 'timeout_but_available';
        instance.lastSeen = new Date().toISOString();
      }
    }, 120000);

    // Event handlers PERMISSIVOS
    client.on('qr', (qr) => {
      console.log(`📱 [${instanceId}] QR Code GERADO com sucesso!`);
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
          }).catch(console.error);
        }
      }
    });

    client.on('ready', () => {
      console.log(`✅ [${instanceId}] Cliente CONECTADO!`);
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
      console.log(`🔐 [${instanceId}] Cliente autenticado`);
      clearTimeout(initTimeout);
      const instance = instances.get(instanceId);
      if (instance) {
        instance.status = 'authenticated';
        instance.lastSeen = new Date().toISOString();
      }
    });

    client.on('auth_failure', (msg) => {
      console.error(`❌ [${instanceId}] Falha auth:`, msg);
      const instance = instances.get(instanceId);
      if (instance) {
        instance.status = 'auth_failed';
        instance.error = msg;
        instance.lastSeen = new Date().toISOString();
        // NÃO REMOVER A INSTÂNCIA - MANTER PARA RETRY
      }
    });

    client.on('disconnected', (reason) => {
      console.log(`🔌 [${instanceId}] Desconectado:`, reason);
      const instance = instances.get(instanceId);
      if (instance) {
        instance.status = 'disconnected';
        instance.error = reason;
        instance.lastSeen = new Date().toISOString();
        // NÃO REMOVER A INSTÂNCIA - MANTER PARA RECONEXÃO
      }
    });

    // CAPTURAR MENSAGENS
    client.on('message_create', async (message) => {
      console.log(`📨 [${instanceId}] Mensagem:`, {
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
          console.error(`❌ [${instanceId}] Erro webhook:`, error.message);
        }
      }
    });

    // INICIALIZAR EM BACKGROUND - NÃO AGUARDAR
    console.log(`🔄 [${instanceId}] Inicializando em background...`);
    client.initialize().catch(error => {
      console.error(`❌ [${instanceId}] Erro na inicialização:`, error.message);
      const instance = instances.get(instanceId);
      if (instance) {
        instance.status = 'init_error';
        instance.error = error.message;
        instance.lastSeen = new Date().toISOString();
        // MANTER A INSTÂNCIA MESMO COM ERRO
      }
    });
    
  } catch (error) {
    console.error(`❌ [${instanceId}] Erro geral:`, error.message);
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

    console.log(`✅ Webhook enviado`);
  } catch (error) {
    console.error(`❌ Erro webhook:`, error.message);
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
    server: 'WhatsApp VPS PERMISSIVE',
    version: SERVER_VERSION,
    build_date: BUILD_DATE,
    port: PORT,
    timestamp: new Date().toISOString(),
    active_instances: instances.size,
    instances: instancesList,
    vps_optimized: true,
    permissive_mode: true
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

// ENDPOINT CORRIGIDO - Criar instância PERMISSIVA
app.post('/instance/create', authenticateToken, async (req, res) => {
  try {
    const { instanceId, sessionName, webhookUrl } = req.body;
    
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
    
    const finalWebhookUrl = webhookUrl || 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web';
    
    console.log(`✅ [${instanceId}] CRIAÇÃO PERMISSIVA iniciada...`);
    
    // INICIALIZAR IMEDIATAMENTE EM BACKGROUND
    initializeWhatsAppClient(instanceId, sessionName, finalWebhookUrl);
    
    // RETORNAR SUCESSO IMEDIATAMENTE - NÃO AGUARDAR QR
    res.json({
      success: true,
      instanceId,
      sessionName,
      status: 'creating',
      message: 'Instância criada - aguarde QR code',
      webhookUrl: finalWebhookUrl,
      server_version: SERVER_VERSION,
      permissive_mode: true
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar instância:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ENDPOINT CORRIGIDO - QR Code PERMISSIVO
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
      // RETORNO PERMISSIVO - SEMPRE DAR INFO ÚTIL
      res.json({
        success: false,
        error: 'QR Code ainda não disponível',
        status: instance.status,
        message: instance.status === 'ready' ? 'Instância já conectada' : 
                instance.status === 'initializing' ? 'Aguarde - inicializando cliente' :
                instance.status === 'timeout_but_available' ? 'Timeout mas instância ativa - tente novamente' :
                'QR Code sendo gerado',
        instanceId: instanceId,
        permissive_info: {
          created_at: instance.createdAt,
          last_seen: instance.lastSeen,
          current_status: instance.status
        }
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
app.get('/instance/:instanceId/status', authenticateToken, (req, res) => {
  try {
    const { instanceId } = req.params;
    
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
      createdAt: instance.createdAt,
      permissive_mode: true
    });
  } catch (error) {
    console.error('❌ Erro ao obter status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Status da instância (POST também para compatibilidade)
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
        console.error(`❌ [${instanceId}] Erro ao destruir:`, error);
      }
    }
    
    instances.delete(instanceId);
    
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
    
    console.log(`📤 [${instanceId}] Mensagem enviada para ${phone}`);
    
    res.json({
      success: true,
      messageId: sentMessage.id._serialized || sentMessage.id,
      timestamp: new Date().toISOString(),
      phone: formattedPhone
    });
    
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
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
    timestamp: new Date().toISOString(),
    version: SERVER_VERSION
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Encerrando servidor permissivo...');
  
  for (const [instanceId, instance] of instances.entries()) {
    if (instance.client) {
      try {
        await instance.client.destroy();
        console.log(`🔌 [${instanceId}] Cliente desconectado`);
      } catch (error) {
        console.error(`❌ [${instanceId}] Erro ao desconectar:`, error);
      }
    }
  }
  
  console.log('✅ Shutdown permissivo concluído');
  process.exit(0);
});

// Inicializar servidor
async function startServer() {
  await ensureSessionDirectory();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 WhatsApp VPS PERMISSIVE Server na porta ${PORT}`);
    console.log(`📊 Health: http://31.97.24.222:${PORT}/health`);
    console.log(`🔑 Token: ${API_TOKEN.substring(0, 10)}...`);
    console.log(`📱 Versão: ${SERVER_VERSION}`);
    console.log(`✅ MODO PERMISSIVO: Criação assíncrona ativada`);
    console.log(`🔧 CORREÇÃO: Timeouts ajustados, validações relaxadas`);
  });
}

startServer().catch(console.error);

module.exports = app;
EOF

# 4. Reiniciar servidor com configuração corrigida
echo "🔄 Reiniciando servidor com configuração PERMISSIVA..."
pm2 restart webhook-server-3002

# 5. Aguardar inicialização
echo "⏳ Aguardando inicialização (10s)..."
sleep 10

# 6. Testar servidor corrigido
echo ""
echo "🧪 TESTE DO SERVIDOR CORRIGIDO"
echo "=============================="

echo "1. Health Check Corrigido:"
curl -s "http://31.97.24.222:3002/health" | jq '.'

echo ""
echo "2. Criar Instância com Servidor Permissivo:"
INSTANCE_NAME="teste_permissivo_$(date +%s)"

CREATE_RESULT=$(curl -s -X POST "http://31.97.24.222:3002/instance/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" \
  --data "{\"instanceId\": \"$INSTANCE_NAME\", \"sessionName\": \"$INSTANCE_NAME\"}")

echo "$CREATE_RESULT" | jq '.'

echo ""
echo "3. Aguardar 15s e verificar QR Code:"
sleep 15

QR_RESULT=$(curl -s -X POST "http://31.97.24.222:3002/instance/qr" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" \
  --data "{\"instanceId\": \"$INSTANCE_NAME\"}")

echo "$QR_RESULT" | jq '.'

echo ""
echo "4. Status da Instância:"
curl -s "http://31.97.24.222:3002/instance/$INSTANCE_NAME/status" \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" | jq '.'

echo ""
echo "🎉 SERVIDOR CORRIGIDO IMPLEMENTADO!"
echo "=================================="
echo "✅ Criação de instância PERMISSIVA (não aguarda QR)"
echo "✅ Timeouts ajustados (120s ao invés de 30s)"
echo "✅ Validações relaxadas (mantém instância mesmo com erro)"
echo "✅ Retornos informativos (sempre explica o status)"
echo "✅ Inicialização assíncrona (não bloqueia criação)"
echo ""
echo "📋 Próximos passos:"
echo "1. Teste via SSH: src/utils/final-whatsapp-test.sh"
echo "2. Teste via frontend: /settings → Teste Final"
echo "3. Crie instância normalmente - agora deve funcionar!"
echo "=================================="
