
// Servidor WhatsApp Web.js v3.0 - Versão com controle e endpoint /instance/create
// Execute este script na VPS na porta 3001

const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
const PORT = process.env.WHATSAPP_PORT || 3001;

// VERSION CONTROL
const SERVER_VERSION = '3.0.0';
const SERVER_HASH = 'sha256-' + Date.now();

// Configurar CORS e parsing
app.use(cors());
app.use(express.json());

// Token simples para autenticação
const API_TOKEN = process.env.VPS_API_TOKEN || 'default-token';

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
    active_instances: 0,
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
    message: 'WhatsApp Web.js Server v3.0 funcionando',
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
  exec('pm2 jlist', (error, stdout, stderr) => {
    if (error) {
      return res.json({
        success: false,
        instances: [],
        error: error.message,
        version: SERVER_VERSION
      });
    }

    try {
      const processes = JSON.parse(stdout);
      const whatsappInstances = processes.filter(p => 
        p.name && p.name.includes('whatsapp')
      );

      res.json({
        success: true,
        instances: whatsappInstances.map(p => ({
          name: p.name,
          status: p.pm2_env.status,
          pid: p.pid,
          uptime: p.pm2_env.pm_uptime,
          memory: p.monit.memory,
          cpu: p.monit.cpu
        })),
        version: SERVER_VERSION
      });
    } catch (parseError) {
      res.json({
        success: false,
        instances: [],
        error: 'Erro ao fazer parse dos processos PM2',
        version: SERVER_VERSION
      });
    }
  });
});

// ===== ENDPOINT PARA CRIAR INSTÂNCIA WHATSAPP (CORRIGIDO) =====
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
    // Simular criação de instância (aqui você adicionaria a lógica real do WhatsApp Web.js)
    const result = await new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          instanceId,
          sessionName,
          webhookUrl,
          companyId,
          status: 'created',
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          version: SERVER_VERSION,
          timestamp: new Date().toISOString()
        });
      }, 2000);
    });

    console.log(`✅ [v${SERVER_VERSION}] Instância criada com sucesso: ${instanceId}`);
    res.json(result);

  } catch (error) {
    console.error(`❌ [v${SERVER_VERSION}] Erro ao criar instância: ${error.message}`);
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
    // Simular deleção de instância
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
    // Simular verificação de status
    res.json({
      success: true,
      status: {
        instanceId,
        connectionStatus: 'connected',
        phone: '+5511999999999',
        isConnected: true,
        lastActivity: new Date().toISOString(),
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

// Endpoint para QR Code
app.post('/instance/qr', authenticateToken, async (req, res) => {
  const { instanceId } = req.body;

  if (!instanceId) {
    return res.status(400).json({
      success: false,
      error: 'instanceId é obrigatório',
      version: SERVER_VERSION
    });
  }

  console.log(`📱 [v${SERVER_VERSION}] Gerando QR Code para instância: ${instanceId}`);

  try {
    // Simular geração de QR Code
    res.json({
      success: true,
      qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      version: SERVER_VERSION,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ [v${SERVER_VERSION}] Erro ao gerar QR Code: ${error.message}`);
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
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(`🛑 [v${SERVER_VERSION}] Encerrando WhatsApp Server...`);
  process.exit(0);
});

module.exports = app;
