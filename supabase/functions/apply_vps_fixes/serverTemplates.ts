
export const FIXED_SERVER_CODE = `const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const instances = new Map();
const sessionDir = './sessions';

// CORREÇÃO CRÍTICA: URL correta do webhook para QR Code
const GLOBAL_WEBHOOK_URL = 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/whatsapp_qr_service';

// Criar diretório de sessões se não existir
if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
}

// Função para enviar webhook
async function sendWebhook(instanceId, event, data) {
    try {
        console.log(\`📡 Enviando webhook: \${event} para \${instanceId}\`);
        
        const response = await fetch(GLOBAL_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                instanceId: instanceId,
                event: event,
                data: data,
                timestamp: new Date().toISOString()
            })
        });

        if (response.ok) {
            console.log(\`✅ Webhook enviado com sucesso: \${event}\`);
        } else {
            console.error(\`❌ Erro no webhook: \${response.status} - \${response.statusText}\`);
        }
    } catch (error) {
        console.error(\`❌ Erro ao enviar webhook \${event}:\`, error.message);
    }
}

// Health endpoint com informações das correções
app.get('/health', (req, res) => {
    const totalInstances = instances.size;
    const onlineInstances = Array.from(instances.values()).filter(inst => inst.status === 'ready').length;
    
    res.json({
        status: 'online',
        version: '2.1.0-webhook-fix',
        instances: totalInstances,
        online_instances: onlineInstances,
        uptime: process.uptime(),
        webhook_url: GLOBAL_WEBHOOK_URL,
        ssl_fix_enabled: true,
        timeout_fix_enabled: true,
        timestamp: new Date().toISOString()
    });
});

// Info endpoint
app.get('/info', (req, res) => {
    res.json({
        server: 'WhatsApp Web.js Server',
        version: '2.1.0-webhook-fix',
        ssl_fix: 'enabled',
        timeout_fix: 'enabled',
        webhook_url: GLOBAL_WEBHOOK_URL,
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
app.post('/instance/create', async (req, res) => {
    try {
        const { instanceId, sessionName, webhookUrl } = req.body;
        
        if (!instanceId) {
            return res.status(400).json({ success: false, error: 'instanceId é obrigatório' });
        }
        
        if (instances.has(instanceId)) {
            return res.status(400).json({ success: false, error: 'Instância já existe' });
        }
        
        console.log(\`Criando instância: \${instanceId}\`);
        
        // Configuração com correções SSL e timeout
        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: instanceId,
                dataPath: path.join(sessionDir, instanceId)
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
                    '--ignore-certificate-errors',
                    '--ignore-ssl-errors',
                    '--ignore-certificate-errors-spki-list',
                    '--allow-running-insecure-content',
                    '--disable-web-security'
                ],
                timeout: 120000,
                protocolTimeout: 120000
            },
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
            created_at: new Date().toISOString(),
            instanceId: instanceId
        };
        
        instances.set(instanceId, instanceData);
        
        // Event handlers com webhook CORRIGIDO
        client.on('qr', async (qr) => {
            console.log(\`📱 QR Code gerado para \${instanceId}\`);
            instanceData.qr = qr;
            instanceData.status = 'qr_generated';
            
            // CORREÇÃO CRÍTICA: Enviar webhook com QR Code
            await sendWebhook(instanceId, 'qr_code_generated', {
                qrCode: qr,
                status: 'qr_generated'
            });
        });
        
        client.on('ready', async () => {
            console.log(\`✅ Cliente \${instanceId} está pronto!\`);
            instanceData.status = 'ready';
            instanceData.phone = client.info?.wid?.user || null;
            instanceData.qr = null;
            
            // Enviar webhook de conexão
            await sendWebhook(instanceId, 'connection_status_changed', {
                status: 'ready',
                phone: instanceData.phone
            });
        });
        
        client.on('authenticated', async () => {
            console.log(\`🔐 Cliente \${instanceId} autenticado\`);
            instanceData.status = 'authenticated';
            
            await sendWebhook(instanceId, 'connection_status_changed', {
                status: 'authenticated'
            });
        });
        
        client.on('auth_failure', async (msg) => {
            console.error(\`❌ Falha na autenticação para \${instanceId}:\`, msg);
            instanceData.status = 'auth_failure';
            
            await sendWebhook(instanceId, 'connection_status_changed', {
                status: 'auth_failure',
                error: msg
            });
        });
        
        client.on('disconnected', async (reason) => {
            console.log(\`📴 Cliente \${instanceId} desconectado:\`, reason);
            instanceData.status = 'disconnected';
            
            await sendWebhook(instanceId, 'connection_status_changed', {
                status: 'disconnected',
                reason: reason
            });
            
            // Auto-reconectar após desconexão (com limite)
            if (!instanceData.reconnectAttempts) instanceData.reconnectAttempts = 0;
            if (instanceData.reconnectAttempts < 3) {
                instanceData.reconnectAttempts++;
                setTimeout(() => {
                    console.log(\`🔄 Tentando reconectar \${instanceId} (tentativa \${instanceData.reconnectAttempts})\`);
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
            console.error(\`❌ Erro na inicialização de \${instanceId}:\`, error);
            instances.delete(instanceId);
            throw error;
        }
        
        res.json({
            success: true,
            instanceId: instanceId,
            status: 'creating',
            message: 'Instância criada e inicializando'
        });
        
    } catch (error) {
        console.error('❌ Erro ao criar instância:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obter QR Code
app.get('/instance/:instanceId/qr', async (req, res) => {
    const { instanceId } = req.params;
    const instance = instances.get(instanceId);
    
    if (!instance) {
        return res.status(404).json({ success: false, error: 'Instância não encontrada' });
    }
    
    if (instance.qr) {
        const qrDataURL = await QRCode.toDataURL(instance.qr);
        res.json({
            success: true,
            qrCode: qrDataURL,
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
app.get('/instance/:instanceId/status', (req, res) => {
    const { instanceId } = req.params;
    const instance = instances.get(instanceId);
    
    if (!instance) {
        return res.status(404).json({ success: false, error: 'Instância não encontrada' });
    }
    
    res.json({
        success: true,
        instanceId,
        status: instance.status,
        phone: instance.phone,
        created_at: instance.created_at,
        hasQR: !!instance.qr
    });
});

// Deletar instância
app.delete('/instance/:instanceId', (req, res) => {
    const { instanceId } = req.params;
    const instance = instances.get(instanceId);
    
    if (!instance) {
        return res.status(404).json({ success: false, error: 'Instância não encontrada' });
    }
    
    try {
        if (instance.client) {
            instance.client.destroy();
        }
        instances.delete(instanceId);
        
        console.log(\`🗑️ Instância \${instanceId} deletada com sucesso\`);
        
        res.json({
            success: true,
            message: 'Instância deletada com sucesso'
        });
    } catch (error) {
        console.error(\`❌ Erro ao deletar instância \${instanceId}:\`, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(\`🚀 Servidor WhatsApp Web.js rodando na porta \${PORT}\`);
    console.log(\`📡 Health check: http://localhost:\${PORT}/health\`);
    console.log(\`🔧 Versão: 2.1.0-webhook-fix\`);
    console.log(\`📡 Webhook URL: \${GLOBAL_WEBHOOK_URL}\`);
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
