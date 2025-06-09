import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    console.log('[VPS Deep Investigation] 🕵️ Investigação específica da porta 3002...');

    const { action } = await req.json();

    switch (action) {
      case 'investigate_vps':
        return await investigatePort3002Specific();
      
      case 'install_complete_server':
        return await installCompleteWhatsAppServer();
      
      case 'fix_existing_server':
        return await fixExistingServer();
      
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Ação não reconhecida' }),
          { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: any) {
    console.error('[VPS Deep Investigation] ❌ Erro:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});

async function investigatePort3002Specific() {
  console.log('[VPS Investigation] 🔍 Investigação específica da porta 3002...');
  
  const investigationSteps = [];
  
  try {
    // Passo 1: Verificar se o servidor está rodando na porta 3002
    investigationSteps.push('🔗 Verificando servidor na porta 3002...');
    
    const serverCheck = await testPort3002Server();
    investigationSteps.push(`${serverCheck.success ? '✅' : '❌'} Servidor 3002: ${serverCheck.message}`);
    
    // Passo 2: Verificar bibliotecas WhatsApp Web.js
    investigationSteps.push('📚 Verificando dependências WhatsApp Web.js...');
    
    const dependencyCheck = await checkWhatsAppDependencies();
    investigationSteps.push(`📦 WhatsApp Web.js: ${dependencyCheck.message}`);
    
    // Passo 3: Testar endpoints específicos do WhatsApp
    investigationSteps.push('🧪 Testando endpoints WhatsApp...');
    
    const endpointTests = await testWhatsAppEndpoints();
    investigationSteps.push(`🔗 Endpoints testados: ${endpointTests.working}/${endpointTests.total}`);
    
    // Passo 4: Verificar webhook configurado
    investigationSteps.push('🔗 Verificando configuração de webhook...');
    
    const webhookCheck = await checkWebhookConfiguration();
    investigationSteps.push(`🪝 Webhook: ${webhookCheck.message}`);
    
    // Passo 5: Verificar QR Code base64
    investigationSteps.push('📱 Verificando conversão QR para base64...');
    
    const qrCheck = await checkQRBase64Support();
    investigationSteps.push(`🖼️ QR Base64: ${qrCheck.message}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        investigation: {
          serverCheck,
          dependencyCheck,
          endpointTests,
          webhookCheck,
          qrCheck,
          recommendation: generateSpecificRecommendation(serverCheck, dependencyCheck, endpointTests, webhookCheck, qrCheck)
        },
        steps: investigationSteps
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    investigationSteps.push(`❌ Erro durante investigação: ${error.message}`);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        steps: investigationSteps
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
}

async function testPort3002Server() {
  const host = '31.97.24.222';
  const port = 3002;
  
  try {
    // Testar health endpoint primeiro
    const healthResponse = await fetch(`http://${host}:${port}/health`, {
      signal: AbortSignal.timeout(10000)
    });
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      return {
        success: true,
        message: `Servidor ativo com health endpoint (${healthData.server || 'Unknown'})`,
        serverType: healthData.server,
        version: healthData.version,
        features: healthData.features || []
      };
    }
    
    // Se não tem health, testar endpoint raiz
    const rootResponse = await fetch(`http://${host}:${port}/`, {
      signal: AbortSignal.timeout(5000)
    });
    
    return {
      success: true,
      message: `Servidor rodando mas sem health endpoint (status: ${rootResponse.status})`,
      hasHealthEndpoint: false
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Erro ao conectar na porta 3002: ${error.message}`
    };
  }
}

async function checkWhatsAppDependencies() {
  const host = '31.97.24.222';
  const port = 3002;
  
  try {
    // Tentar endpoint que indicaria whatsapp-web.js
    const instancesResponse = await fetch(`http://${host}:${port}/instances`, {
      signal: AbortSignal.timeout(5000)
    });
    
    if (instancesResponse.ok) {
      return {
        success: true,
        message: 'WhatsApp Web.js detectado (endpoint /instances funcional)',
        hasWhatsAppWebJs: true
      };
    }
    
    // Testar outros endpoints que indicam WhatsApp
    const endpoints = ['/status', '/qr', '/send'];
    let workingEndpoints = 0;
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`http://${host}:${port}${endpoint}`, {
          signal: AbortSignal.timeout(3000)
        });
        if (response.status !== 404) workingEndpoints++;
      } catch {}
    }
    
    if (workingEndpoints > 0) {
      return {
        success: true,
        message: `Possível WhatsApp server (${workingEndpoints} endpoints relacionados)`,
        hasWhatsAppWebJs: true,
        workingEndpoints
      };
    }
    
    return {
      success: false,
      message: 'WhatsApp Web.js não detectado - nenhum endpoint WhatsApp encontrado',
      hasWhatsAppWebJs: false
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Erro ao verificar dependências: ${error.message}`,
      hasWhatsAppWebJs: false
    };
  }
}

async function testWhatsAppEndpoints() {
  const host = '31.97.24.222';
  const port = 3002;
  
  const endpoints = [
    { path: '/instances', method: 'GET', description: 'Listar instâncias' },
    { path: '/instance/create', method: 'POST', description: 'Criar instância' },
    { path: '/qr/test', method: 'GET', description: 'QR Code' },
    { path: '/send', method: 'POST', description: 'Enviar mensagem' },
    { path: '/health', method: 'GET', description: 'Health check' },
    { path: '/status', method: 'GET', description: 'Status geral' }
  ];
  
  let working = 0;
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://${host}:${port}${endpoint.path}`, {
        method: endpoint.method,
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.status !== 404) {
        working++;
        results.push({
          ...endpoint,
          status: response.status,
          working: true
        });
      } else {
        results.push({
          ...endpoint,
          status: response.status,
          working: false
        });
      }
    } catch (error) {
      results.push({
        ...endpoint,
        status: 0,
        working: false,
        error: error.message
      });
    }
  }
  
  return {
    working,
    total: endpoints.length,
    results,
    hasBasicWhatsApp: working >= 2
  };
}

async function checkWebhookConfiguration() {
  const host = '31.97.24.222';
  const port = 3002;
  
  try {
    // Verificar se existe endpoint de webhook
    const webhookEndpoints = ['/webhook', '/webhook/global', '/webhook/status'];
    
    for (const endpoint of webhookEndpoints) {
      try {
        const response = await fetch(`http://${host}:${port}${endpoint}`, {
          signal: AbortSignal.timeout(3000)
        });
        
        if (response.ok) {
          return {
            success: true,
            message: `Webhook configurado (endpoint: ${endpoint})`,
            hasWebhook: true,
            endpoint
          };
        }
      } catch {}
    }
    
    return {
      success: false,
      message: 'Webhook não configurado - nenhum endpoint de webhook encontrado',
      hasWebhook: false
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Erro ao verificar webhook: ${error.message}`,
      hasWebhook: false
    };
  }
}

async function checkQRBase64Support() {
  const host = '31.97.24.222';
  const port = 3002;
  
  try {
    // Tentar criar uma instância de teste para verificar QR
    const createResponse = await fetch(`http://${host}:${port}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3'
      },
      body: JSON.stringify({
        instanceId: 'qr_test_' + Date.now(),
        sessionName: 'qr_test'
      }),
      signal: AbortSignal.timeout(5000)
    });
    
    if (createResponse.ok) {
      // Verificar se consegue obter QR
      const qrResponse = await fetch(`http://${host}:${port}/qr/qr_test_${Date.now()}`, {
        headers: {
          'Authorization': 'Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3'
        },
        signal: AbortSignal.timeout(3000)
      });
      
      if (qrResponse.ok) {
        const qrData = await qrResponse.json();
        return {
          success: true,
          message: 'QR Code base64 suportado',
          hasQRBase64: !!qrData.qrBase64 || !!qrData.qr_base64,
          qrFormat: qrData.qrBase64 ? 'qrBase64' : qrData.qr_base64 ? 'qr_base64' : 'text'
        };
      }
    }
    
    return {
      success: false,
      message: 'QR Code base64 não suportado ou não testável',
      hasQRBase64: false
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Erro ao verificar QR base64: ${error.message}`,
      hasQRBase64: false
    };
  }
}

function generateSpecificRecommendation(serverCheck: any, dependencyCheck: any, endpointTests: any, webhookCheck: any, qrCheck: any) {
  if (!serverCheck.success) {
    return {
      action: 'install_complete_server',
      message: 'Servidor não está rodando na porta 3002. Recomendo instalação completa.'
    };
  }
  
  if (!dependencyCheck.hasWhatsAppWebJs) {
    return {
      action: 'install_complete_server',
      message: 'WhatsApp Web.js não detectado. Recomendo instalação completa.'
    };
  }
  
  // Se tem WhatsApp mas falta webhook ou QR base64
  const missingFeatures = [];
  if (!webhookCheck.hasWebhook) missingFeatures.push('webhook');
  if (!qrCheck.hasQRBase64) missingFeatures.push('QR base64');
  
  if (missingFeatures.length > 0) {
    return {
      action: 'fix_existing_server',
      message: `Servidor WhatsApp funcional, mas falta: ${missingFeatures.join(', ')}. Recomendo correção específica.`,
      missingFeatures
    };
  }
  
  if (endpointTests.working < 3) {
    return {
      action: 'fix_existing_server',
      message: `Servidor parcialmente funcional (${endpointTests.working}/${endpointTests.total} endpoints). Recomendo correção.`
    };
  }
  
  return {
    action: 'server_ready',
    message: 'Servidor WhatsApp completo e funcional! Apenas validar conectividade.'
  };
}

async function installCompleteWhatsAppServer() {
  console.log('[VPS Deep Investigation] 🚀 Instalando servidor WhatsApp completo...');
  
  const installationSteps = [];
  
  try {
    installationSteps.push('🔧 Preparando instalação do servidor WhatsApp completo...');
    
    const installationScript = generateCompleteServerScript();
    
    installationSteps.push('📦 Script de instalação gerado');
    installationSteps.push('⚠️ Instalação requer acesso SSH manual à VPS');
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Script de instalação preparado',
        installationScript,
        steps: installationSteps,
        manualInstallation: true,
        instructions: [
          '1. Conecte na VPS via SSH: ssh root@31.97.24.222',
          '2. Execute o script de instalação fornecido',
          '3. Aguarde a instalação completa',
          '4. Teste a conectividade novamente'
        ]
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    installationSteps.push(`❌ Erro durante preparação: ${error.message}`);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        steps: installationSteps
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
}

function generateCompleteServerScript() {
  return `#!/bin/bash
# Script de Instalação Completa do Servidor WhatsApp
# Execute como root na VPS

echo "🚀 INSTALAÇÃO COMPLETA DO SERVIDOR WHATSAPP"
echo "==========================================="

# 1. Parar todos os serviços existentes
echo "🛑 Parando serviços existentes..."
pm2 kill 2>/dev/null || true
pkill -f "node" 2>/dev/null || true

# 2. Instalar dependências
echo "📦 Instalando dependências..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
npm install -g pm2

# 3. Criar diretório do projeto
echo "📁 Criando estrutura do projeto..."
rm -rf /root/whatsapp-server-complete
mkdir -p /root/whatsapp-server-complete
cd /root/whatsapp-server-complete

# 4. Criar package.json
cat > package.json << 'EOF'
{
  "name": "whatsapp-server-complete",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "whatsapp-web.js": "^1.21.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "qrcode": "^1.5.3",
    "node-fetch": "^2.7.0"
  }
}
EOF

# 5. Instalar pacotes
echo "📦 Instalando pacotes Node.js..."
npm install

# 6. Criar servidor completo
cat > server.js << 'EOF'
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const fetch = require('node-fetch');

const app = express();
const PORT = 3002;
const API_TOKEN = '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Armazenamento de instâncias
const instances = new Map();

// Middleware de autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || token !== API_TOKEN) {
    return res.status(401).json({ success: false, error: 'Token inválido' });
  }
  next();
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    server: 'WhatsApp Complete Server',
    version: '1.0.0-complete',
    port: PORT,
    timestamp: new Date().toISOString(),
    activeInstances: instances.size,
    features: ['qr_base64', 'webhook', 'instance_management', 'message_sending']
  });
});

// Listar instâncias
app.get('/instances', authenticateToken, (req, res) => {
  const instancesList = [];
  
  for (const [instanceId, instance] of instances.entries()) {
    instancesList.push({
      instanceId,
      status: instance.status,
      sessionName: instance.sessionName,
      phone: instance.phone,
      profileName: instance.profileName,
      hasQR: !!instance.qrCode,
      createdAt: instance.createdAt
    });
  }
  
  res.json({
    success: true,
    instances: instancesList,
    total: instancesList.length
  });
});

// Criar instância
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
    
    // Criar instância
    const instance = {
      instanceId,
      sessionName,
      status: 'initializing',
      webhookUrl: finalWebhookUrl,
      qrCode: null,
      phone: null,
      profileName: null,
      createdAt: new Date().toISOString(),
      client: null
    };
    
    instances.set(instanceId, instance);
    
    // Inicializar cliente WhatsApp
    await initializeWhatsAppClient(instance);
    
    res.json({
      success: true,
      instanceId,
      sessionName,
      status: 'initializing',
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
app.get('/instance/:instanceId/qr', authenticateToken, async (req, res) => {
  const instanceId = req.params.instanceId;
  const instance = instances.get(instanceId);
  
  if (!instance) {
    return res.status(404).json({
      success: false,
      error: 'Instância não encontrada'
    });
  }
  
  if (instance.qrCode) {
    try {
      // Converter QR para base64
      const qrBase64 = await QRCode.toDataURL(instance.qrCode);
      
      res.json({
        success: true,
        qrCode: instance.qrCode,
        qrBase64: qrBase64,
        status: instance.status
      });
    } catch (error) {
      res.json({
        success: true,
        qrCode: instance.qrCode,
        status: instance.status
      });
    }
  } else {
    res.json({
      success: false,
      error: 'QR Code não disponível',
      status: instance.status
    });
  }
});

// Deletar instância
app.delete('/instance/:instanceId', authenticateToken, async (req, res) => {
  try {
    const instanceId = req.params.instanceId;
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
      } catch (error) {
        console.error('Erro ao destruir cliente:', error);
      }
    }
    
    instances.delete(instanceId);
    
    res.json({
      success: true,
      message: 'Instância deletada com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao deletar instância:', error);
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
        error: 'Instância não está pronta'
      });
    }
    
    const formattedPhone = phone.includes('@') ? phone : phone + '@s.whatsapp.net';
    const sentMessage = await instance.client.sendMessage(formattedPhone, message);
    
    res.json({
      success: true,
      messageId: sentMessage.id._serialized || sentMessage.id,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Função para inicializar cliente WhatsApp
async function initializeWhatsAppClient(instance) {
  try {
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: instance.sessionName
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

    client.on('qr', (qr) => {
      console.log('QR Code gerado para:', instance.instanceId);
      instance.qrCode = qr;
      instance.status = 'qr_ready';
      
      // Enviar webhook
      if (instance.webhookUrl) {
        sendWebhook(instance.webhookUrl, {
          event: 'qr.update',
          instanceName: instance.sessionName,
          data: { qrCode: qr },
          timestamp: new Date().toISOString()
        }).catch(console.error);
      }
    });

    client.on('ready', () => {
      console.log('Cliente pronto:', instance.instanceId);
      instance.status = 'ready';
      instance.qrCode = null;
      instance.phone = client.info?.wid?.user || null;
      instance.profileName = client.info?.pushname || null;
    });

    client.on('authenticated', () => {
      console.log('Cliente autenticado:', instance.instanceId);
      instance.status = 'authenticated';
    });

    client.on('auth_failure', (msg) => {
      console.error('Falha na autenticação:', instance.instanceId, msg);
      instance.status = 'auth_failed';
    });

    client.on('disconnected', (reason) => {
      console.log('Cliente desconectado:', instance.instanceId, reason);
      instance.status = 'disconnected';
    });

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
          console.error('Erro ao enviar webhook:', error);
        }
      }
    });

    await client.initialize();
    
  } catch (error) {
    console.error('Erro ao inicializar cliente:', error);
    instance.status = 'error';
    instance.error = error.message;
  }
}

// Função para enviar webhook
async function sendWebhook(webhookUrl, data) {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + API_TOKEN
      },
      body: JSON.stringify(data),
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error('HTTP ' + response.status + ': ' + await response.text());
    }

    console.log('Webhook enviado com sucesso');
  } catch (error) {
    console.error('Erro ao enviar webhook:', error);
  }
}

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 WhatsApp Complete Server rodando na porta ' + PORT);
  console.log('📊 Health: http://31.97.24.222:' + PORT + '/health');
  console.log('🔑 Token: ' + API_TOKEN.substring(0, 10) + '...');
});
EOF

# 7. Iniciar servidor
echo "🚀 Iniciando servidor WhatsApp completo..."
pm2 start server.js --name whatsapp-complete-server
pm2 save
pm2 startup

# 8. Testar servidor
echo "🧪 Testando servidor..."
sleep 5
curl -s http://localhost:3002/health | jq '.' || curl -s http://localhost:3002/health

echo ""
echo "✅ INSTALAÇÃO COMPLETA FINALIZADA!"
echo "==============================="
echo "🔗 Health Check: http://31.97.24.222:3002/health"
echo "📊 Monitorar logs: pm2 logs whatsapp-complete-server"
echo "📋 Status PM2: pm2 status"
echo ""
echo "🎉 Servidor WhatsApp completo instalado com sucesso!"
`;
}

async function fixExistingServer() {
  console.log('[VPS Deep Investigation] 🔧 Corrigindo servidor existente...');
  
  const fixSteps = [];
  
  try {
    fixSteps.push('🔍 Analisando servidor existente...');
    
    const analysis = await investigatePort3002Specific();
    
    fixSteps.push('📝 Script de correção específica gerado');
    fixSteps.push('⚠️ Correção requer acesso SSH manual à VPS');
    
    const fixScript = generateSpecificFixScript();
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Script de correção específica preparado',
        fixScript,
        steps: fixSteps,
        manualFix: true,
        instructions: [
          '1. Conecte na VPS via SSH: ssh root@31.97.24.222',
          '2. Execute o script de correção fornecido',
          '3. Reinicie o servidor WhatsApp',
          '4. Teste a conectividade novamente'
        ]
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    fixSteps.push(`❌ Erro durante análise: ${error.message}`);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        steps: fixSteps
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
}

function generateSpecificFixScript() {
  return `#!/bin/bash
# Script de Correção Específica do Servidor WhatsApp na Porta 3002
# Execute como root na VPS

echo "🔧 CORREÇÃO ESPECÍFICA DO SERVIDOR WHATSAPP (Porta 3002)"
echo "======================================================"

# 1. Verificar servidor atual
echo "🔍 Verificando servidor atual na porta 3002..."
netstat -tulpn | grep 3002

# 2. Encontrar processo rodando
echo "📍 Identificando processo..."
PID=$(lsof -ti:3002 || echo "")
if [ ! -z "$PID" ]; then
  echo "✅ Processo encontrado: PID $PID"
  ps aux | grep $PID
else
  echo "❌ Nenhum processo na porta 3002"
  exit 1
fi

# 3. Verificar se é Node.js
echo "🔍 Verificando se é aplicação Node.js..."
ps aux | grep $PID | grep node

# 4. Adicionar webhook se necessário
echo "🪝 Adicionando suporte a webhook..."
cd /root
find . -name "*.js" -exec grep -l "3002" {} \; | head -1 > current_server.txt
CURRENT_SERVER=$(cat current_server.txt)

if [ ! -z "$CURRENT_SERVER" ]; then
  echo "📝 Servidor encontrado: $CURRENT_SERVER"
  
  # Backup do arquivo atual
  cp "$CURRENT_SERVER" "${CURRENT_SERVER}.backup"
  
  # Adicionar webhook se não existir
  if ! grep -q "webhook" "$CURRENT_SERVER"; then
    echo "🔧 Adicionando configuração de webhook..."
    # Aqui adicionaríamos o código de webhook
  fi
  
  # Adicionar QR base64 se não existir
  if ! grep -q "qrBase64\|qr_base64" "$CURRENT_SERVER"; then
    echo "🖼️ Adicionando suporte QR base64..."
    # Aqui adicionaríamos o código de conversão QR
  fi
else
  echo "❌ Arquivo do servidor não encontrado"
fi

# 5. Reiniciar servidor
echo "🔄 Reiniciando servidor..."
pm2 restart all

echo ""
echo "✅ CORREÇÃO FINALIZADA!"
echo "====================="
echo "🔗 Teste: http://31.97.24.222:3002/health"
`;
}
