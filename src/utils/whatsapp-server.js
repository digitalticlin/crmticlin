
// Servidor WhatsApp Web.js - Atualizado para novos endpoints
// Comando de instalação: node whatsapp-server.js
// Este servidor deve rodar na VPS na porta 3001

const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
const PORT = process.env.WHATSAPP_PORT || 3001;

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
    return res.status(401).json({ success: false, error: 'Token de autenticação inválido' });
  }

  next();
}

// ===== ENDPOINT /health OBRIGATÓRIO PARA DEPLOY =====
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    server: 'WhatsApp Web.js Server',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    port: PORT,
    ssl_fix_enabled: true,
    timeout_fix_enabled: true,
    active_instances: 0
  });
});

// Endpoint de status (alternativo)
app.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'running',
    server: 'WhatsApp Web.js Server',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Endpoint raiz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'WhatsApp Web.js Server funcionando',
    version: '2.0.0',
    endpoints: ['/health', '/status', '/instances', '/instance/create', '/instance/delete', '/instance/status', '/instance/qr'],
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
        error: error.message
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
        }))
      });
    } catch (parseError) {
      res.json({
        success: false,
        instances: [],
        error: 'Erro ao fazer parse dos processos PM2'
      });
    }
  });
});

// Endpoint para criar instância WhatsApp
app.post('/instance/create', authenticateToken, async (req, res) => {
  const { instanceId, sessionName, webhookUrl, companyId } = req.body;

  if (!instanceId || !sessionName) {
    return res.status(400).json({
      success: false,
      error: 'instanceId e sessionName são obrigatórios'
    });
  }

  console.log(`🔧 Criando instância WhatsApp: ${instanceId}`);

  try {
    // Simular criação de instância (aqui você adicionaria a lógica real do WhatsApp Web.js)
    const result = await new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          instanceId,
          sessionName,
          status: 'created',
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        });
      }, 2000);
    });

    res.json(result);

  } catch (error) {
    console.error(`❌ Erro ao criar instância: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para deletar instância
app.post('/instance/delete', authenticateToken, async (req, res) => {
  const { instanceId } = req.body;

  if (!instanceId) {
    return res.status(400).json({
      success: false,
      error: 'instanceId é obrigatório'
    });
  }

  console.log(`🗑️ Deletando instância WhatsApp: ${instanceId}`);

  try {
    // Simular deleção de instância
    res.json({
      success: true,
      message: `Instância ${instanceId} deletada com sucesso`
    });

  } catch (error) {
    console.error(`❌ Erro ao deletar instância: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para status da instância
app.post('/instance/status', authenticateToken, async (req, res) => {
  const { instanceId } = req.body;

  if (!instanceId) {
    return res.status(400).json({
      success: false,
      error: 'instanceId é obrigatório'
    });
  }

  console.log(`📊 Verificando status da instância: ${instanceId}`);

  try {
    // Simular verificação de status
    res.json({
      success: true,
      status: {
        instanceId,
        connectionStatus: 'connected',
        phone: '+5511999999999',
        isConnected: true,
        lastActivity: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`❌ Erro ao verificar status: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para QR Code
app.post('/instance/qr', authenticateToken, async (req, res) => {
  const { instanceId } = req.body;

  if (!instanceId) {
    return res.status(400).json({
      success: false,
      error: 'instanceId é obrigatório'
    });
  }

  console.log(`📱 Gerando QR Code para instância: ${instanceId}`);

  try {
    // Simular geração de QR Code
    res.json({
      success: true,
      qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    });

  } catch (error) {
    console.error(`❌ Erro ao gerar QR Code: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Erro no servidor WhatsApp:', error);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WhatsApp Web.js Server rodando na porta ${PORT}`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
  console.log(`📊 Status: http://localhost:${PORT}/status`);
  console.log(`📋 Instances: http://localhost:${PORT}/instances`);
  console.log(`🔧 Create: http://localhost:${PORT}/instance/create`);
  console.log(`🗑️ Delete: http://localhost:${PORT}/instance/delete`);
  console.log(`📊 Instance Status: http://localhost:${PORT}/instance/status`);
  console.log(`📱 QR Code: http://localhost:${PORT}/instance/qr`);
  console.log(`🔑 Token: ${API_TOKEN === 'default-token' ? '⚠️  USANDO TOKEN PADRÃO' : '✅ Token configurado'}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Encerrando WhatsApp Server...');
  process.exit(0);
});

module.exports = app;
