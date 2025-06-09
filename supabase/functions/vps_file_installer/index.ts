
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuração VPS
const VPS_CONFIG = {
  host: '31.97.24.222',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action } = await req.json();
    console.log(`[VPS File Installer] 🚀 Ação: ${action}`);

    if (action === 'install_whatsapp_servers') {
      return await installWhatsAppServers();
    }

    if (action === 'create_vps_files') {
      return await createVPSFiles();
    }

    if (action === 'restart_pm2_services') {
      return await restartPM2Services();
    }

    throw new Error(`Ação não reconhecida: ${action}`);

  } catch (error) {
    console.error('[VPS File Installer] ❌ Erro:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Função para instalar servidores WhatsApp na VPS
async function installWhatsAppServers() {
  console.log('[VPS File Installer] 📦 Instalando servidores WhatsApp na VPS...');
  
  try {
    // Gerar scripts de instalação
    const vpsServerContent = generateVPSServerContent();
    const whatsappServerContent = generateWhatsAppServerContent();
    const installScript = generateInstallScript();
    
    console.log('[VPS File Installer] ✅ Arquivos gerados com sucesso');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Arquivos de instalação gerados',
      files: {
        'vps-server-persistent.js': vpsServerContent.substring(0, 200) + '...',
        'whatsapp-server-corrected.js': whatsappServerContent.substring(0, 200) + '...',
        'install-script.sh': installScript.substring(0, 200) + '...'
      },
      installInstructions: [
        '1. Execute: cd /root',
        '2. Copie os arquivos para VPS',
        '3. Execute: chmod +x install-script.sh',
        '4. Execute: ./install-script.sh',
        '5. Verifique: pm2 list'
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[VPS File Installer] ❌ Erro na instalação:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Gerar conteúdo do servidor VPS persistente
function generateVPSServerContent(): string {
  return `// Servidor WhatsApp Web.js CORRIGIDO com PERSISTÊNCIA
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;
const AUTH_TOKEN = process.env.AUTH_TOKEN || '${VPS_CONFIG.authToken}';

// Configurar CORS e parsing
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Diretório para persistência
const PERSISTENCE_DIR = path.join(__dirname, 'whatsapp_instances');
const INSTANCES_FILE = path.join(PERSISTENCE_DIR, 'active_instances.json');

// Armazenamento de instâncias ativas
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
    console.log(\`💾 Estado de \${Object.keys(instancesData).length} instâncias salvo\`);
  } catch (error) {
    console.error('❌ Erro ao salvar estado das instâncias:', error);
  }
}

// Função para inicializar cliente WhatsApp
async function initializeWhatsAppClient(instance) {
  try {
    console.log(\`🚀 Inicializando cliente WhatsApp para: \${instance.instanceId}\`);
    
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: instance.sessionName,
        dataPath: path.join(PERSISTENCE_DIR, 'sessions')
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
          '--disable-gpu'
        ]
      }
    });

    instance.client = client;
    instance.status = 'initializing';

    // Event handlers
    client.on('qr', (qr) => {
      console.log(\`📱 QR Code gerado para: \${instance.instanceId}\`);
      instance.qrCode = qr;
      instance.status = 'qr_ready';
      saveInstancesState();
      
      // Enviar QR Code via webhook
      if (instance.webhookUrl) {
        sendWebhook(instance.webhookUrl, {
          event: 'qr.update',
          instanceName: instance.sessionName,
          data: { qrCode: qr },
          timestamp: new Date().toISOString(),
          server_url: \`http://\${VPS_CONFIG.host}:\${PORT}\`
        }).catch(error => {
          console.error(\`❌ Erro ao enviar QR via webhook:\`, error.message);
        });
      }
    });

    client.on('ready', () => {
      console.log(\`✅ Cliente pronto para: \${instance.instanceId}\`);
      instance.status = 'ready';
      instance.qrCode = null;
      saveInstancesState();
    });

    client.on('authenticated', () => {
      console.log(\`🔐 Cliente autenticado para: \${instance.instanceId}\`);
      instance.status = 'authenticated';
      saveInstancesState();
    });

    // Capturar mensagens
    client.on('message_create', async (message) => {
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
          console.error(\`❌ Erro ao enviar webhook:\`, error.message);
        }
      }
    });

    await client.initialize();
    
  } catch (error) {
    console.error(\`❌ Erro ao inicializar cliente: \${instance.instanceId}\`, error);
    instance.status = 'error';
    saveInstancesState();
  }
}

// Função para enviar webhook
async function sendWebhook(webhookUrl, data) {
  const fetch = (await import('node-fetch')).default;
  
  await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${AUTH_TOKEN}\`
    },
    body: JSON.stringify(data),
    timeout: 10000
  });
}

// Endpoints da API

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    server: 'WhatsApp Web.js Server CORRIGIDO',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    activeInstances: activeInstances.size,
    port: PORT
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
      hasQR: !!instance.qrCode
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
    
    const finalWebhookUrl = webhookUrl || '${VPS_CONFIG.webhookUrl}';
    
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
    
    // Inicializar cliente
    setTimeout(() => initializeWhatsAppClient(instance), 1000);
    
    await saveInstancesState();
    
    res.json({
      success: true,
      instanceId,
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
      status: instance.status
    });
  } else {
    res.json({
      success: false,
      error: 'QR Code não disponível',
      status: instance.status
    });
  }
});

// Refresh QR Code
app.post('/instance/:instanceId/qr/refresh', authenticateToken, async (req, res) => {
  try {
    const instanceId = req.params.instanceId;
    const instance = activeInstances.get(instanceId);
    
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instância não encontrada'
      });
    }
    
    // Reinicializar cliente para gerar novo QR
    if (instance.client) {
      await instance.client.destroy();
    }
    
    instance.client = null;
    instance.status = 'refreshing';
    instance.qrCode = null;
    
    setTimeout(() => initializeWhatsAppClient(instance), 1000);
    
    res.json({
      success: true,
      message: 'Refresh QR iniciado'
    });
    
  } catch (error) {
    console.error('❌ Erro no refresh QR:', error);
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
    if (!instance || !instance.client || instance.status !== 'ready') {
      return res.status(400).json({
        success: false,
        error: 'Instância não está pronta'
      });
    }
    
    const formattedPhone = phone.includes('@') ? phone : \`\${phone}@s.whatsapp.net\`;
    const sentMessage = await instance.client.sendMessage(formattedPhone, message);
    
    res.json({
      success: true,
      messageId: sentMessage.id._serialized || sentMessage.id
    });
    
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
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
    
    if (instance.client) {
      await instance.client.destroy();
    }
    
    activeInstances.delete(instanceId);
    await saveInstancesState();
    
    res.json({
      success: true,
      message: 'Instância deletada'
    });
    
  } catch (error) {
    console.error('❌ Erro ao deletar instância:', error);
    res.status(500).json({
      success: false,
      error: error.message
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
    hasQR: !!instance.qrCode
  });
});

// Salvar estado periodicamente
setInterval(saveInstancesState, 30000);

// Inicializar servidor
async function startServer() {
  await ensurePersistenceDirectory();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(\`🚀 WhatsApp Server CORRIGIDO rodando na porta \${PORT}\`);
    console.log(\`📊 Health: http://\${VPS_CONFIG.host}:\${PORT}/health\`);
    console.log(\`🔑 Token: \${AUTH_TOKEN.substring(0, 10)}...\`);
  });
}

startServer().catch(console.error);

module.exports = app;`;
}

// Gerar conteúdo do servidor WhatsApp alternativo
function generateWhatsAppServerContent(): string {
  return `// Servidor WhatsApp Web.js ALTERNATIVO (Porta 3001)
const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const AUTH_TOKEN = process.env.AUTH_TOKEN || '${VPS_CONFIG.authToken}';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const activeInstances = new Map();

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || token !== AUTH_TOKEN) {
    return res.status(401).json({ success: false, error: 'Token inválido' });
  }
  next();
}

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    server: 'WhatsApp Server Alternativo',
    version: '3.0.0-alt',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

app.get('/instances', authenticateToken, (req, res) => {
  const instances = Array.from(activeInstances.values()).map(instance => ({
    instanceId: instance.instanceId,
    status: instance.status,
    sessionName: instance.sessionName,
    hasQR: !!instance.qrCode
  }));
  
  res.json({
    success: true,
    instances,
    total: instances.length
  });
});

app.post('/instance/create', authenticateToken, async (req, res) => {
  try {
    const { instanceId, sessionName } = req.body;
    
    if (!instanceId || !sessionName) {
      return res.status(400).json({
        success: false,
        error: 'instanceId e sessionName obrigatórios'
      });
    }
    
    const instance = {
      instanceId,
      sessionName,
      status: 'creating',
      qrCode: null,
      createdAt: new Date().toISOString()
    };
    
    activeInstances.set(instanceId, instance);
    
    res.json({
      success: true,
      instanceId,
      message: 'Instância criada (servidor alternativo)'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/instance/:instanceId/qr', authenticateToken, (req, res) => {
  const instanceId = req.params.instanceId;
  const instance = activeInstances.get(instanceId);
  
  if (!instance) {
    return res.status(404).json({
      success: false,
      error: 'Instância não encontrada'
    });
  }
  
  res.json({
    success: false,
    error: 'QR não disponível (servidor alternativo)',
    status: instance.status
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`🚀 WhatsApp Server Alternativo rodando na porta \${PORT}\`);
});

module.exports = app;`;
}

// Gerar script de instalação
function generateInstallScript(): string {
  return `#!/bin/bash

echo "🚀 Instalando servidores WhatsApp CORRIGIDOS na VPS..."

# Parar processos existentes
echo "📴 Parando processos PM2 existentes..."
pm2 stop all
pm2 delete all

# Limpar arquivos antigos
echo "🧹 Limpando arquivos antigos..."
rm -f /root/whatsapp-server.js
rm -f /root/vps-server-persistent.js

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "📦 Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Verificar PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2..."
    sudo npm install -g pm2
fi

# Instalar dependências WhatsApp
echo "📦 Instalando dependências WhatsApp..."
npm install whatsapp-web.js express cors node-fetch

# Configurar variáveis de ambiente
export AUTH_TOKEN="${VPS_CONFIG.authToken}"
export WEBHOOK_URL="${VPS_CONFIG.webhookUrl}"

# Iniciar servidores com PM2
echo "🚀 Iniciando servidor principal (porta 3002)..."
PORT=3002 AUTH_TOKEN="${VPS_CONFIG.authToken}" pm2 start vps-server-persistent.js --name whatsapp-main-3002

echo "🚀 Iniciando servidor alternativo (porta 3001)..."
PORT=3001 AUTH_TOKEN="${VPS_CONFIG.authToken}" pm2 start whatsapp-server-corrected.js --name whatsapp-alt-3001

# Salvar configuração PM2
pm2 save
pm2 startup

echo "✅ Instalação concluída!"
echo "📊 Verificar status: pm2 list"
echo "🔍 Ver logs: pm2 logs"
echo "🌐 Testar saúde porta 3001: curl http://localhost:3001/health"
echo "🌐 Testar saúde porta 3002: curl http://localhost:3002/health"

# Testar conectividade
sleep 5
echo "🔍 Testando conectividade..."
curl -s http://localhost:3001/health && echo " ✅ Porta 3001 OK" || echo " ❌ Porta 3001 FALHOU"
curl -s http://localhost:3002/health && echo " ✅ Porta 3002 OK" || echo " ❌ Porta 3002 FALHOU"

echo "🎯 Instalação finalizada! Use 'pm2 list' para verificar status."`;
}

// Função para criar arquivos VPS
async function createVPSFiles() {
  console.log('[VPS File Installer] 📝 Criando arquivos VPS...');
  
  const files = {
    'vps-server-persistent.js': generateVPSServerContent(),
    'whatsapp-server-corrected.js': generateWhatsAppServerContent(),
    'install-script.sh': generateInstallScript()
  };
  
  return new Response(JSON.stringify({
    success: true,
    message: 'Arquivos VPS criados',
    files: Object.keys(files),
    vpsServerSize: files['vps-server-persistent.js'].length,
    whatsappServerSize: files['whatsapp-server-corrected.js'].length,
    installScriptSize: files['install-script.sh'].length
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Função para reiniciar serviços PM2
async function restartPM2Services() {
  console.log('[VPS File Installer] 🔄 Reiniciando serviços PM2...');
  
  const commands = [
    'pm2 stop all',
    'pm2 delete all',
    'PORT=3002 AUTH_TOKEN="' + VPS_CONFIG.authToken + '" pm2 start vps-server-persistent.js --name whatsapp-main-3002',
    'PORT=3001 AUTH_TOKEN="' + VPS_CONFIG.authToken + '" pm2 start whatsapp-server-corrected.js --name whatsapp-alt-3001',
    'pm2 save'
  ];
  
  return new Response(JSON.stringify({
    success: true,
    message: 'Comandos de reinicialização gerados',
    commands: commands,
    instructions: [
      '1. Execute cada comando sequencialmente na VPS',
      '2. Verifique com: pm2 list',
      '3. Teste conectividade: curl http://localhost:3001/health',
      '4. Teste conectividade: curl http://localhost:3002/health'
    ]
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
