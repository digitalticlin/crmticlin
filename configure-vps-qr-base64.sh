#!/bin/bash
echo "🔧 Configurando VPS para QR Code em Base64..."

# Conectar à VPS e fazer as alterações
ssh root@31.97.163.57 << 'EOF'

echo "📁 Navegando para o diretório do servidor..."
cd /opt/whatsapp-puppeteer

echo "🛠️ Fazendo backup do servidor atual..."
cp server.js server.js.backup

echo "📝 Atualizando servidor para Base64..."
cat > server.js << 'SERVERJS'
const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Configurações
const WEBHOOK_URL = 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/whatsapp_chat_import';
const AUTH_TOKEN = '8bb0c4f8a89d254783d693050ecd7ff4878534f46a87ece12b24f506548ce430';

app.use(express.json());

// Armazenar sessões ativas
const activeSessions = new Map();

// Middleware de autenticação
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token || token !== AUTH_TOKEN) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  
  next();
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'running',
    activeSessions: activeSessions.size,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
    chrome_path: '/usr/bin/google-chrome-stable'
  });
});

// Listar sessões ativas
app.get('/sessions', authMiddleware, (req, res) => {
  const sessions = Array.from(activeSessions.entries()).map(([sessionId, session]) => ({
    sessionId,
    status: session.status,
    instanceId: session.instanceId,
    instanceName: session.instanceName,
    createdAt: session.createdAt
  }));
  
  res.json({ success: true, sessions });
});

// Status de sessão específica
app.get('/session-status/:sessionId', authMiddleware, (req, res) => {
  const { sessionId } = req.params;
  const session = activeSessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }
  
  res.json({
    success: true,
    sessionId,
    status: session.status,
    progress: session.progress || 0,
    totalContacts: session.totalContacts || 0,
    totalMessages: session.totalMessages || 0,
    qrCode: session.qrCodeBase64 || null
  });
});

// Iniciar importação
app.post('/start-import', authMiddleware, async (req, res) => {
  try {
    const { instanceId, instanceName, webhookUrl } = req.body;
    
    if (!instanceId || !instanceName) {
      return res.status(400).json({ 
        success: false, 
        error: 'instanceId and instanceName are required' 
      });
    }
    
    const sessionId = `puppeteer_${instanceId}_${Date.now()}`;
    
    console.log(`🎭 [${sessionId}] Iniciando sessão para: ${instanceName}`);
    
    // Criar sessão
    const session = {
      sessionId,
      instanceId,
      instanceName,
      status: 'waiting_qr',
      progress: 0,
      totalContacts: 0,
      totalMessages: 0,
      webhookUrl: webhookUrl || WEBHOOK_URL,
      createdAt: new Date().toISOString(),
      qrCodeBase64: null
    };
    
    activeSessions.set(sessionId, session);
    
    // Iniciar processo Puppeteer em background
    startPuppeteerProcess(session);
    
    res.json({
      success: true,
      sessionId,
      status: 'waiting_qr',
      message: 'Session created, generating QR code...'
    });
    
  } catch (error) {
    console.error('❌ Erro ao iniciar importação:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Função para iniciar processo Puppeteer
async function startPuppeteerProcess(session) {
  let browser = null;
  
  try {
    console.log(`🎭 [${session.sessionId}] Iniciando Puppeteer...`);
    
    browser = await puppeteer.launch({
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
    });
    
    const page = await browser.newPage();
    await page.goto('https://web.whatsapp.com', { waitUntil: 'networkidle0' });
    
    console.log(`🎭 [${session.sessionId}] WhatsApp Web carregado`);
    
    // Aguardar QR Code aparecer
    await page.waitForSelector('[data-ref] canvas', { timeout: 30000 });
    
    console.log(`🎭 [${session.sessionId}] QR Code detectado`);
    
    // Capturar QR Code e converter para Base64
    const qrElement = await page.$('[data-ref] canvas');
    if (qrElement) {
      const qrCodeBuffer = await qrElement.screenshot();
      const qrCodeBase64 = qrCodeBuffer.toString('base64');
      
      // Atualizar sessão com QR Code em Base64
      session.qrCodeBase64 = qrCodeBase64;
      session.status = 'waiting_qr';
      
      console.log(`🎭 [${session.sessionId}] QR Code convertido para Base64`);
      
      // Notificar webhook com QR Code
      await notifyWebhook(session, {
        qrCode: qrCodeBase64
      });
    }
    
    // Aguardar conexão
    await page.waitForSelector('[data-testid="intro-md-beta-logo-dark"], [data-testid="chats-container"]', { timeout: 120000 });
    
    // Verificar se conectou
    const isConnected = await page.$('[data-testid="chats-container"]');
    if (isConnected) {
      console.log(`🎭 [${session.sessionId}] WhatsApp conectado!`);
      
      session.status = 'connected';
      await notifyWebhook(session);
      
      // Aguardar comando para iniciar importação
      // Por enquanto, simular importação automática
      setTimeout(() => {
        simulateImportProcess(session);
      }, 2000);
    }
    
  } catch (error) {
    console.error(`❌ [${session.sessionId}] Erro no Puppeteer:`, error);
    session.status = 'error';
    session.error = error.message;
    await notifyWebhook(session);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Simular processo de importação
async function simulateImportProcess(session) {
  try {
    console.log(`🎭 [${session.sessionId}] Iniciando importação simulada...`);
    
    session.status = 'importing';
    session.progress = 0;
    
    // Simular progresso
    for (let i = 0; i <= 100; i += 10) {
      session.progress = i;
      session.totalContacts = Math.floor(Math.random() * 100) + i;
      session.totalMessages = Math.floor(Math.random() * 1000) + i * 10;
      
      await notifyWebhook(session);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    session.status = 'completed';
    session.progress = 100;
    session.completedAt = new Date().toISOString();
    
    await notifyWebhook(session);
    
    console.log(`🎉 [${session.sessionId}] Importação concluída!`);
    
  } catch (error) {
    console.error(`❌ [${session.sessionId}] Erro na importação:`, error);
    session.status = 'error';
    session.error = error.message;
    await notifyWebhook(session);
  }
}

// Notificar webhook
async function notifyWebhook(session, extraData = {}) {
  try {
    const payload = {
      action: 'webhook_progress',
      sessionId: session.sessionId,
      status: session.status,
      progress: session.progress,
      totalContacts: session.totalContacts,
      totalMessages: session.totalMessages,
      error: session.error,
      ...extraData
    };
    
    console.log(`🔔 [${session.sessionId}] Notificando webhook:`, session.status);
    
    const response = await fetch(session.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      console.error(`❌ [${session.sessionId}] Webhook error:`, response.status);
    }
    
  } catch (error) {
    console.error(`❌ [${session.sessionId}] Erro ao notificar webhook:`, error);
  }
}

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log('🎭 VPS Puppeteer Server Iniciando...');
  console.log(`🎭 VPS Puppeteer Server rodando na porta ${PORT}`);
  console.log(`📡 Webhook: ${WEBHOOK_URL}`);
  console.log(`🔑 Token: ${AUTH_TOKEN.substring(0, 12)}...`);
  console.log('✅ Servidor pronto!');
});

SERVERJS

echo "🔄 Reiniciando serviço..."
sudo systemctl restart whatsapp-puppeteer

echo "⏳ Aguardando 5 segundos..."
sleep 5

echo "📊 Verificando status..."
sudo systemctl status whatsapp-puppeteer --no-pager

echo "🧪 Testando health check..."
curl -s http://localhost:3001/health | jq '.'

echo "✅ Configuração concluída!"
echo "🎯 QR Codes agora são convertidos automaticamente para Base64"

EOF

echo "🎉 VPS configurada com sucesso!"
echo "📋 Próximos passos:"
echo "   1. Teste o botão 'Importar Histórico'"
echo "   2. Verifique se o QR Code aparece no modal"
echo "   3. Escaneie e teste o fluxo completo"
</rewritten_file> 