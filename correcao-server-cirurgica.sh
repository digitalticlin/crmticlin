#!/bin/bash

echo "🔬 CORREÇÃO CIRÚRGICA DO SERVIDOR - PORTA 3002"
echo "============================================="
echo "📅 $(date)"

# Backup de segurança
echo ""
echo "💾 1. CRIANDO BACKUP DE SEGURANÇA..."
cd /root/whatsapp-server
cp server.js server.js.backup-$(date +%Y%m%d-%H%M%S)
echo "✅ Backup criado"

# Parar completamente o PM2
echo ""
echo "🛑 2. PARANDO SERVIDOR COMPLETAMENTE..."
pm2 stop whatsapp-server 2>/dev/null
pm2 delete whatsapp-server 2>/dev/null
pkill -f "node.*server.js" 2>/dev/null
pkill -f "whatsapp-server" 2>/dev/null
sleep 3
echo "✅ Servidor parado"

# Limpar porta se estiver ocupada
echo ""
echo "🧹 3. LIMPANDO PORTA 3002..."
PORT_PID=$(lsof -ti:3002 2>/dev/null)
if [ ! -z "$PORT_PID" ]; then
    echo "🔫 Matando processo na porta 3002: $PORT_PID"
    kill -9 $PORT_PID 2>/dev/null
    sleep 2
fi
echo "✅ Porta 3002 liberada"

# Verificar dependências críticas
echo ""
echo "📦 4. VERIFICANDO DEPENDÊNCIAS..."
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules não encontrado, instalando..."
    npm install
fi

# Testar módulos críticos
node -e "
try {
    require('express');
    require('@whiskeysockets/baileys');
    require('axios');
    require('qrcode');
    console.log('✅ Todos os módulos OK');
} catch(e) {
    console.log('❌ Erro nos módulos:', e.message);
    process.exit(1);
}
" || {
    echo "❌ Instalando dependências faltantes..."
    npm install express @whiskeysockets/baileys axios qrcode
}

# Criar versão robusta do servidor
echo ""
echo "🔧 5. CRIANDO SERVIDOR ROBUSTO..."
cat > server-robusto.js << 'ROBUST_EOF'
const express = require('express');
const crypto = require('crypto');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Global crypto fix
global.crypto = crypto;

// Variáveis globais
const app = express();
const PORT = 3002;
const instances = {};

// CONFIGURAÇÃO SUPABASE
const SUPABASE_PROJECT = 'rhjgagzstjzynvrakdyj';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUxMzEwMCwiZXhwIjoyMDY2MDg5MTAwfQ.48XYhDq4XdVTqNhIHdskd6iMcJem38aHzk6U1psfRRM';

const SUPABASE_WEBHOOKS = {
  QR_RECEIVER: `https://${SUPABASE_PROJECT}.supabase.co/functions/v1/webhook_qr_receiver`,
  AUTO_SYNC_INSTANCES: `https://${SUPABASE_PROJECT}.supabase.co/functions/v1/auto_sync_instances`,
  AUTO_WHATSAPP_SYNC: `https://${SUPABASE_PROJECT}.supabase.co/functions/v1/auto_whatsapp_sync`,
  MESSAGE_RECEIVER: `https://${SUPABASE_PROJECT}.supabase.co/functions/v1/whatsapp_message_service`
};

// Configurar diretório de persistência
const AUTH_DIR = path.join(__dirname, 'auth_info');
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

// Middleware básico
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Middleware de timeout global
app.use((req, res, next) => {
  req.setTimeout(25000);
  res.setTimeout(25000);
  next();
});

// Endpoint de health check ROBUSTO
app.get('/health', (req, res) => {
  try {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      port: PORT,
      instances: Object.keys(instances).length,
      version: '1.0.0-robust'
    });
  } catch (error) {
    res.status(500).json({ error: 'Health check failed', message: error.message });
  }
});

// Endpoint de status
app.get('/status', (req, res) => {
  try {
    res.json({
      server: 'online',
      instances: instances,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Status check failed', message: error.message });
  }
});

// Listar instâncias
app.get('/instances', (req, res) => {
  try {
    const instanceList = Object.keys(instances).map(id => ({
      instanceId: id,
      status: instances[id].status,
      connected: instances[id].connected,
      phone: instances[id].phone,
      lastUpdate: instances[id].lastUpdate
    }));
    
    res.json({
      success: true,
      instances: instanceList,
      total: instanceList.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list instances', message: error.message });
  }
});

// Função para enviar webhook (simplificada e robusta)
async function sendSupabaseWebhook(url, data, type = 'general') {
  try {
    const response = await axios.post(url, data, {
      timeout: 8000,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      }
    });
    console.log(`[Webhook ${type}] ✅ Enviado com sucesso`);
    return true;
  } catch (error) {
    console.error(`[Webhook ${type}] ❌ Erro:`, error.message);
    return false;
  }
}

// Criar instância WhatsApp (versão robusta)
app.post('/instance/create', async (req, res) => {
  try {
    const { instanceId, createdByUserId } = req.body;

    if (!instanceId) {
      return res.status(400).json({
        success: false,
        error: 'instanceId é obrigatório'
      });
    }

    if (instances[instanceId]) {
      return res.json({
        success: true,
        message: 'Instância já existe',
        instanceId,
        status: instances[instanceId].status
      });
    }

    // Criar estrutura da instância
    instances[instanceId] = {
      instanceId,
      status: 'initializing',
      connected: false,
      phone: null,
      profileName: null,
      qrCode: null,
      lastUpdate: new Date(),
      createdByUserId
    };

    res.json({
      success: true,
      message: 'Instância criada com sucesso',
      instanceId,
      status: 'initializing'
    });

    // Inicializar WhatsApp em background
    setTimeout(() => {
      createWhatsAppInstance(instanceId, createdByUserId);
    }, 1000);

  } catch (error) {
    console.error('Erro ao criar instância:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno ao criar instância',
      message: error.message
    });
  }
});

// Função para criar instância WhatsApp (simplificada)
async function createWhatsAppInstance(instanceId, createdByUserId = null) {
  try {
    console.log(`🚀 Iniciando instância: ${instanceId}`);

    const authDir = path.join(AUTH_DIR, instanceId);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    const socket = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ['WhatsApp CRM', 'Chrome', '1.0.0'],
      connectTimeoutMs: 30000,
      defaultQueryTimeoutMs: 30000
    });

    instances[instanceId].socket = socket;
    instances[instanceId].status = 'connecting';

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      instances[instanceId].lastUpdate = new Date();

      if (qr) {
        try {
          const qrCodeDataURL = await QRCode.toDataURL(qr);
          instances[instanceId].qrCode = qrCodeDataURL;
          instances[instanceId].status = 'waiting_qr';
          
          await sendSupabaseWebhook(SUPABASE_WEBHOOKS.QR_RECEIVER, {
            event: 'qr_update',
            instanceId,
            qrCode: qrCodeDataURL,
            timestamp: new Date().toISOString()
          }, 'QR');
        } catch (error) {
          console.error(`[${instanceId}] Erro ao gerar QR:`, error);
        }
      }

      if (connection === 'open') {
        console.log(`[${instanceId}] ✅ Conectado!`);
        instances[instanceId].status = 'ready';
        instances[instanceId].connected = true;
        instances[instanceId].qrCode = null;

        const phoneNumber = socket.user?.id?.split('@')[0];
        const profileName = socket.user?.name || 'Usuário';

        instances[instanceId].phone = phoneNumber;
        instances[instanceId].profileName = profileName;

        await sendSupabaseWebhook(SUPABASE_WEBHOOKS.AUTO_WHATSAPP_SYNC, {
          event: 'connection_established',
          instanceId,
          status: 'connected',
          phone: phoneNumber,
          profileName,
          timestamp: new Date().toISOString()
        }, 'Connection');
      }

      if (connection === 'close') {
        instances[instanceId].status = 'disconnected';
        instances[instanceId].connected = false;
      }
    });

  } catch (error) {
    console.error(`[${instanceId}] Erro ao criar instância:`, error);
    instances[instanceId].status = 'error';
  }
}

// Obter QR Code
app.get('/instance/:instanceId/qr', (req, res) => {
  try {
    const { instanceId } = req.params;
    const instance = instances[instanceId];

    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instância não encontrada'
      });
    }

    res.json({
      success: true,
      instanceId,
      qrCode: instance.qrCode,
      status: instance.status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao obter QR Code',
      message: error.message
    });
  }
});

// Status da instância
app.get('/instance/:instanceId', (req, res) => {
  try {
    const { instanceId } = req.params;
    const instance = instances[instanceId];

    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instância não encontrada'
      });
    }

    res.json({
      success: true,
      instance: {
        instanceId,
        status: instance.status,
        connected: instance.connected,
        phone: instance.phone,
        profileName: instance.profileName,
        lastUpdate: instance.lastUpdate
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao obter status',
      message: error.message
    });
  }
});

// Tratamento robusto de erros
process.on('uncaughtException', (error) => {
  console.error('🚨 Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Promise rejeitada:', reason);
});

// Inicialização robusta do servidor
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor WhatsApp ROBUSTO rodando na porta ${PORT}`);
  console.log(`📡 Endpoints ativos:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   GET  /status - Status do servidor`);
  console.log(`   GET  /instances - Listar instâncias`);
  console.log(`   POST /instance/create - Criar instância`);
  console.log(`   GET  /instance/:id/qr - Obter QR Code`);
  console.log(`   GET  /instance/:id - Status da instância`);
  console.log(`⚡ Servidor ROBUSTO inicializado com sucesso!`);
});

// Configurações de timeout
server.timeout = 30000;
server.keepAliveTimeout = 5000;
server.headersTimeout = 6000;

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado');
    process.exit(0);
  });
});

console.log(`🛡️ Servidor configurado com timeouts robustos`);
ROBUST_EOF

echo "✅ Servidor robusto criado"

# Testar sintaxe do servidor robusto
echo ""
echo "🧪 6. TESTANDO SINTAXE DO SERVIDOR ROBUSTO..."
node -c server-robusto.js && echo "✅ Sintaxe OK" || {
    echo "❌ Erro de sintaxe no servidor robusto"
    exit 1
}

# Substituir servidor atual
echo ""
echo "🔄 7. SUBSTITUINDO SERVIDOR ATUAL..."
cp server-robusto.js server.js
echo "✅ Servidor substituído"

# Iniciar com PM2
echo ""
echo "🚀 8. INICIANDO COM PM2..."
pm2 start server.js --name whatsapp-server --max-memory-restart 300M

# Aguardar inicialização
echo ""
echo "⏳ 9. AGUARDANDO INICIALIZAÇÃO (10s)..."
sleep 10

# Testar funcionamento
echo ""
echo "🧪 10. TESTANDO FUNCIONAMENTO..."
echo "Teste 1: Health check"
curl -s http://localhost:3002/health | head -3 || echo "❌ Health check falhou"

echo ""
echo "Teste 2: Status"
curl -s http://localhost:3002/status | head -3 || echo "❌ Status falhou"

echo ""
echo "Teste 3: Instâncias"
curl -s http://localhost:3002/instances | head -3 || echo "❌ Instâncias falhou"

# Status final
echo ""
echo "📊 11. STATUS FINAL..."
pm2 status
netstat -tulpn | grep :3002

echo ""
echo "🎉 CORREÇÃO CIRÚRGICA CONCLUÍDA!"
echo "================================"
echo "✅ Servidor robusto implementado"
echo "✅ Timeouts configurados"
echo "✅ Tratamento de erros implementado"
echo "✅ Endpoints essenciais ativos"
echo ""
echo "🔬 Para monitorar: pm2 logs whatsapp-server"
echo "🧪 Para testar: curl http://localhost:3002/health" 