
export const FIXED_SERVER_CODE = `const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const instances = new Map();
const sessionDir = './sessions';

// Criar diretório de sessões se não existir
if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
}

// Health endpoint com informações das correções
app.get('/health', (req, res) => {
    const totalInstances = instances.size;
    const onlineInstances = Array.from(instances.values()).filter(inst => inst.status === 'ready').length;
    
    res.json({
        status: 'online',
        version: '2.0.0-ssl-fix',
        instances: totalInstances,
        online_instances: onlineInstances,
        uptime: process.uptime(),
        ssl_fix_enabled: true,
        timeout_fix_enabled: true,
        timestamp: new Date().toISOString()
    });
});

// Info endpoint
app.get('/info', (req, res) => {
    res.json({
        server: 'WhatsApp Web.js Server',
        version: '2.0.0-ssl-fix',
        ssl_fix: 'enabled',
        timeout_fix: 'enabled',
        webhook_url: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web',
        total_instances: instances.size,
        active_instances: Array.from(instances.values()).filter(inst => inst.status === 'ready').length
    });
});

// Webhook de teste
app.post('/test-webhook', (req, res) => {
    console.log('Webhook teste recebido:', req.body);
    res.json({
        success: true,
        message: 'Webhook teste recebido com sucesso',
        data: req.body,
        timestamp: new Date().toISOString()
    });
});

// Listar instâncias
app.get('/instances', (req, res) => {
    const instanceList = Array.from(instances.entries()).map(([name, instance]) => ({
        name,
        status: instance.status || 'unknown',
        qr: instance.qr || null,
        phone: instance.phone || null,
        created_at: instance.created_at || null
    }));
    
    res.json({
        success: true,
        instances: instanceList,
        total: instanceList.length
    });
});

// Criar instância
app.post('/create', async (req, res) => {
    try {
        const { instanceName } = req.body;
        
        if (!instanceName) {
            return res.status(400).json({ success: false, error: 'instanceName é obrigatório' });
        }
        
        if (instances.has(instanceName)) {
            return res.status(400).json({ success: false, error: 'Instância já existe' });
        }
        
        console.log(\`Criando instância: \${instanceName}\`);
        
        // Configuração com correções SSL e timeout
        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: instanceName,
                dataPath: path.join(sessionDir, instanceName)
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
                    '--disable-gpu',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding',
                    '--disable-features=TranslateUI',
                    '--disable-ipc-flooding-protection',
                    // CORREÇÕES SSL
                    '--ignore-certificate-errors',
                    '--ignore-ssl-errors',
                    '--ignore-certificate-errors-spki-list',
                    '--allow-running-insecure-content',
                    '--disable-web-security'
                ],
                // CORREÇÕES DE TIMEOUT
                timeout: 120000,
                protocolTimeout: 120000
            },
            // Configurações adicionais de timeout
            qrMaxRetries: 5,
            restartOnAuthFail: true,
            takeoverOnConflict: true,
            takeoverTimeoutMs: 60000
        });
        
        const instanceData = {
            client,
            status: 'initializing',
            qr: null,
            phone: null,
            created_at: new Date().toISOString()
        };
        
        instances.set(instanceName, instanceData);
        
        // Event handlers com melhor tratamento de erros
        client.on('qr', (qr) => {
            console.log(\`QR Code gerado para \${instanceName}\`);
            instanceData.qr = qr;
            instanceData.status = 'qr_generated';
        });
        
        client.on('ready', () => {
            console.log(\`Cliente \${instanceName} está pronto!\`);
            instanceData.status = 'ready';
            instanceData.phone = client.info?.wid?.user || null;
            instanceData.qr = null;
        });
        
        client.on('authenticated', () => {
            console.log(\`Cliente \${instanceName} autenticado\`);
            instanceData.status = 'authenticated';
        });
        
        client.on('auth_failure', (msg) => {
            console.error(\`Falha na autenticação para \${instanceName}:\`, msg);
            instanceData.status = 'auth_failure';
        });
        
        client.on('disconnected', (reason) => {
            console.log(\`Cliente \${instanceName} desconectado:\`, reason);
            instanceData.status = 'disconnected';
            
            // Auto-reconectar após desconexão (com limite)
            if (!instanceData.reconnectAttempts) instanceData.reconnectAttempts = 0;
            if (instanceData.reconnectAttempts < 3) {
                instanceData.reconnectAttempts++;
                setTimeout(() => {
                    console.log(\`Tentando reconectar \${instanceName} (tentativa \${instanceData.reconnectAttempts})\`);
                    client.initialize();
                }, 5000);
            }
        });
        
        // Inicializar cliente com timeout de segurança
        const initPromise = client.initialize();
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout na inicialização')), 60000);
        });
        
        try {
            await Promise.race([initPromise, timeoutPromise]);
        } catch (error) {
            console.error(\`Erro na inicialização de \${instanceName}:\`, error);
            instances.delete(instanceName);
            throw error;
        }
        
        res.json({
            success: true,
            instanceName,
            message: 'Instância criada com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao criar instância:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obter QR Code
app.get('/qr/:instanceName', async (req, res) => {
    const { instanceName } = req.params;
    const instance = instances.get(instanceName);
    
    if (!instance) {
        return res.status(404).json({ success: false, error: 'Instância não encontrada' });
    }
    
    if (instance.qr) {
        const qrDataURL = await QRCode.toDataURL(instance.qr);
        res.json({
            success: true,
            qr: instance.qr,
            qrImage: qrDataURL,
            status: instance.status
        });
    } else {
        res.json({
            success: false,
            message: 'QR Code não disponível',
            status: instance.status
        });
    }
});

// Status da instância
app.get('/status/:instanceName', (req, res) => {
    const { instanceName } = req.params;
    const instance = instances.get(instanceName);
    
    if (!instance) {
        return res.status(404).json({ success: false, error: 'Instância não encontrada' });
    }
    
    res.json({
        success: true,
        instanceName,
        status: instance.status,
        phone: instance.phone,
        created_at: instance.created_at,
        hasQR: !!instance.qr
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(\`🚀 Servidor WhatsApp Web.js rodando na porta \${PORT}\`);
    console.log(\`📡 Health check: http://localhost:\${PORT}/health\`);
    console.log(\`🔧 Versão: 2.0.0-ssl-fix (SSL + Timeout fixes enabled)\`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Encerrando servidor...');
    instances.forEach((instance, name) => {
        if (instance.client) {
            console.log(\`Desconectando \${name}\`);
            instance.client.destroy();
        }
    });
    process.exit(0);
});

module.exports = app;`;

export const API_SERVER_CODE = `const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
const PORT = process.env.API_PORT || 3002;

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

  console.log(\`🔧 Executando: \${description || 'Comando personalizado'}\`);
  console.log(\`Command: \${command}\`);

  try {
    const startTime = Date.now();

    exec(command, { timeout }, (error, stdout, stderr) => {
      const duration = Date.now() - startTime;

      if (error) {
        console.error(\`❌ Erro: \${error.message}\`);
        return res.status(500).json({
          success: false,
          error: error.message,
          output: stderr || stdout,
          duration
        });
      }

      const output = stdout.trim() || stderr.trim() || 'Comando executado com sucesso';
      
      console.log(\`✅ Sucesso (\${duration}ms): \${output.substring(0, 200)}\`);
      
      res.json({
        success: true,
        output,
        duration,
        timestamp: new Date().toISOString()
      });
    });

  } catch (error) {
    console.error(\`❌ Erro na execução: \${error.message}\`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`🚀 VPS API Server rodando na porta \${PORT}\`);
  console.log(\`📡 Status: http://localhost:\${PORT}/status\`);
  console.log(\`🔧 Execute: POST http://localhost:\${PORT}/execute\`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Encerrando VPS API Server...');
  process.exit(0);
});

module.exports = app;`;
