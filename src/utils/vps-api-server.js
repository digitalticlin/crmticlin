
// Servidor API HTTP para VPS - Instalar na VPS
// Comando de instalação: node vps-api-server.js
// Este servidor deve rodar na VPS na porta 3002

const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
const PORT = process.env.API_PORT || 3002;

// Configurar CORS e parsing
app.use(cors());
app.use(express.json());

// Token simples para autenticação (pode ser melhorado)
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

// Endpoint de status
app.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    server: 'VPS API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Endpoint principal para execução de comandos
app.post('/execute', authenticateToken, async (req, res) => {
  const { command, description, timeout = 60000 } = req.body;

  if (!command) {
    return res.status(400).json({
      success: false,
      error: 'Comando é obrigatório'
    });
  }

  console.log(`🔧 Executando: ${description || 'Comando personalizado'}`);
  console.log(`Command: ${command}`);

  try {
    const startTime = Date.now();

    // Executar comando com timeout
    exec(command, { timeout }, (error, stdout, stderr) => {
      const duration = Date.now() - startTime;

      if (error) {
        console.error(`❌ Erro: ${error.message}`);
        return res.status(500).json({
          success: false,
          error: error.message,
          output: stderr || stdout,
          duration
        });
      }

      const output = stdout.trim() || stderr.trim() || 'Comando executado com sucesso';
      
      console.log(`✅ Sucesso (${duration}ms): ${output.substring(0, 200)}`);
      
      res.json({
        success: true,
        output,
        duration,
        timestamp: new Date().toISOString()
      });
    });

  } catch (error) {
    console.error(`❌ Erro na execução: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para múltiplos comandos sequenciais
app.post('/execute-batch', authenticateToken, async (req, res) => {
  const { commands } = req.body;

  if (!Array.isArray(commands) || commands.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Lista de comandos é obrigatória'
    });
  }

  console.log(`🔧 Executando batch de ${commands.length} comandos`);

  const results = [];
  let allSuccess = true;

  for (let i = 0; i < commands.length; i++) {
    const { command, description } = commands[i];
    
    try {
      const result = await new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
          const duration = Date.now() - startTime;
          
          if (error) {
            resolve({
              success: false,
              command,
              description,
              error: error.message,
              output: stderr || stdout,
              duration
            });
          } else {
            resolve({
              success: true,
              command,
              description,
              output: stdout.trim() || stderr.trim() || 'Sucesso',
              duration
            });
          }
        });
      });

      results.push(result);
      
      if (!result.success) {
        allSuccess = false;
        console.log(`❌ Comando ${i + 1} falhou: ${result.error}`);
      } else {
        console.log(`✅ Comando ${i + 1} sucesso: ${result.output.substring(0, 100)}`);
      }
      
    } catch (error) {
      results.push({
        success: false,
        command,
        description,
        error: error.message
      });
      allSuccess = false;
    }
  }

  res.json({
    success: allSuccess,
    message: `Batch executado: ${results.filter(r => r.success).length}/${results.length} comandos bem-sucedidos`,
    results,
    timestamp: new Date().toISOString()
  });
});

// Health check específico para WhatsApp server
app.get('/whatsapp-health', (req, res) => {
  exec('curl -s http://localhost:3001/health', (error, stdout, stderr) => {
    if (error) {
      return res.json({
        success: false,
        whatsapp_status: 'offline',
        error: error.message
      });
    }

    try {
      const healthData = JSON.parse(stdout);
      res.json({
        success: true,
        whatsapp_status: 'online',
        health_data: healthData
      });
    } catch (parseError) {
      res.json({
        success: false,
        whatsapp_status: 'unknown',
        raw_output: stdout,
        error: 'Não foi possível fazer parse da resposta'
      });
    }
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Erro no servidor API:', error);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 VPS API Server rodando na porta ${PORT}`);
  console.log(`📡 Status: http://localhost:${PORT}/status`);
  console.log(`🔧 Execute: POST http://localhost:${PORT}/execute`);
  console.log(`📊 WhatsApp Health: http://localhost:${PORT}/whatsapp-health`);
  console.log(`🔑 Token: ${API_TOKEN === 'default-token' ? '⚠️  USANDO TOKEN PADRÃO' : '✅ Token configurado'}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Encerrando VPS API Server...');
  process.exit(0);
});

module.exports = app;
