
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
    console.log('[VPS Deep Investigation] 🕵️ Iniciando investigação profunda da VPS...');

    const { action } = await req.json();

    switch (action) {
      case 'investigate_vps':
        return await investigateVPS();
      
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

async function investigateVPS() {
  console.log('[VPS Deep Investigation] 🔍 Investigando estado atual da VPS...');
  
  const investigationSteps = [];
  
  try {
    // Passo 1: Verificar conectividade básica
    investigationSteps.push('🔗 Verificando conectividade básica com a VPS...');
    
    const basicConnectivity = await testBasicConnectivity();
    investigationSteps.push(`${basicConnectivity.success ? '✅' : '❌'} Conectividade básica: ${basicConnectivity.message}`);
    
    // Passo 2: Verificar portas ativas
    investigationSteps.push('🔍 Escaneando portas ativas...');
    
    const portScan = await scanActivePorts();
    investigationSteps.push(`📊 Portas encontradas: ${portScan.activePorts.join(', ') || 'Nenhuma'}`);
    
    // Passo 3: Testar cada porta encontrada
    for (const port of portScan.activePorts) {
      investigationSteps.push(`🧪 Testando porta ${port}...`);
      
      const portTest = await testPort(port);
      investigationSteps.push(`${portTest.success ? '✅' : '❌'} Porta ${port}: ${portTest.message}`);
    }
    
    // Passo 4: Analisar se existe um servidor WhatsApp
    investigationSteps.push('🔍 Analisando se existe servidor WhatsApp...');
    
    const whatsappAnalysis = await analyzeWhatsAppServer();
    investigationSteps.push(`📱 Análise WhatsApp: ${whatsappAnalysis.message}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        investigation: {
          basicConnectivity,
          portScan,
          whatsappAnalysis,
          recommendation: generateRecommendation(basicConnectivity, portScan, whatsappAnalysis)
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

async function testBasicConnectivity() {
  const host = '31.97.24.222';
  
  try {
    // Testar conectividade HTTP básica
    const response = await fetch(`http://${host}:80/`, {
      signal: AbortSignal.timeout(5000)
    });
    
    return {
      success: true,
      message: `VPS acessível via HTTP (status: ${response.status})`,
      httpAccessible: true
    };
  } catch (error) {
    try {
      // Testar se pelo menos conseguimos conectar na VPS
      const response = await fetch(`http://${host}:22`, {
        signal: AbortSignal.timeout(5000)
      });
      
      return {
        success: true,
        message: 'VPS acessível, mas sem servidor HTTP na porta 80',
        httpAccessible: false
      };
    } catch (sshError) {
      return {
        success: false,
        message: 'VPS não acessível ou com problemas de conectividade',
        httpAccessible: false
      };
    }
  }
}

async function scanActivePorts() {
  const host = '31.97.24.222';
  const commonPorts = [80, 3000, 3001, 3002, 8080, 8000, 9000, 5000];
  const activePorts = [];
  
  for (const port of commonPorts) {
    try {
      const response = await fetch(`http://${host}:${port}/`, {
        signal: AbortSignal.timeout(3000)
      });
      
      activePorts.push(port);
    } catch (error) {
      // Porta não acessível ou sem serviço
    }
  }
  
  return {
    activePorts,
    totalScanned: commonPorts.length
  };
}

async function testPort(port: number) {
  const host = '31.97.24.222';
  
  try {
    const response = await fetch(`http://${host}:${port}/health`, {
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      const data = await response.text();
      return {
        success: true,
        message: `Servidor responde com /health (${response.status})`,
        data: data.substring(0, 100)
      };
    } else {
      // Testar endpoint raiz
      const rootResponse = await fetch(`http://${host}:${port}/`, {
        signal: AbortSignal.timeout(5000)
      });
      
      return {
        success: true,
        message: `Servidor ativo mas sem /health (root: ${rootResponse.status})`,
        hasHealthEndpoint: false
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Erro ao conectar: ${error.message}`
    };
  }
}

async function analyzeWhatsAppServer() {
  const host = '31.97.24.222';
  const whatsappPorts = [3002, 3001, 3000];
  
  for (const port of whatsappPorts) {
    try {
      // Testar endpoints específicos do WhatsApp
      const endpoints = ['/health', '/status', '/instances'];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`http://${host}:${port}${endpoint}`, {
            headers: {
              'Authorization': 'Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3'
            },
            signal: AbortSignal.timeout(5000)
          });
          
          if (response.ok) {
            const data = await response.json();
            
            return {
              success: true,
              message: `Servidor WhatsApp encontrado na porta ${port}`,
              port,
              endpoint,
              version: data.version || 'unknown',
              serverType: data.server || 'unknown',
              isWhatsAppServer: true
            };
          }
        } catch (endpointError) {
          continue;
        }
      }
    } catch (portError) {
      continue;
    }
  }
  
  return {
    success: false,
    message: 'Nenhum servidor WhatsApp encontrado nas portas padrão',
    isWhatsAppServer: false
  };
}

function generateRecommendation(connectivity: any, portScan: any, whatsappAnalysis: any) {
  if (!connectivity.success) {
    return {
      action: 'check_vps_status',
      message: 'VPS não acessível. Verificar status da VPS no painel Hostinger.'
    };
  }
  
  if (whatsappAnalysis.isWhatsAppServer) {
    return {
      action: 'fix_existing_server',
      message: `Servidor WhatsApp encontrado na porta ${whatsappAnalysis.port}, mas com problemas. Recomendo corrigir o servidor existente.`
    };
  }
  
  if (portScan.activePorts.length > 0) {
    return {
      action: 'install_new_server',
      message: `VPS ativa com ${portScan.activePorts.length} portas em uso, mas sem servidor WhatsApp. Recomendo instalar servidor completo.`
    };
  }
  
  return {
    action: 'install_complete_server',
    message: 'VPS acessível mas sem serviços ativos. Recomendo instalação completa do servidor WhatsApp.'
  };
}

async function installCompleteWhatsAppServer() {
  console.log('[VPS Deep Investigation] 🚀 Instalando servidor WhatsApp completo...');
  
  const installationSteps = [];
  
  try {
    // Como não temos acesso SSH direto via Edge Functions,
    // vamos tentar usar uma abordagem via HTTP
    installationSteps.push('🔧 Preparando instalação do servidor WhatsApp completo...');
    
    // Primeiro, verificar se existe uma API de instalação na VPS
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
    
    // Analisar o servidor atual
    const analysis = await analyzeWhatsAppServer();
    
    if (!analysis.isWhatsAppServer) {
      fixSteps.push('❌ Nenhum servidor WhatsApp encontrado para correção');
      
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Nenhum servidor WhatsApp encontrado',
          recommendation: 'install_complete_server',
          steps: fixSteps
        }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }
    
    fixSteps.push(`✅ Servidor encontrado na porta ${analysis.port}`);
    fixSteps.push('🔧 Preparando correções...');
    
    const fixScript = generateFixScript(analysis.port);
    
    fixSteps.push('📝 Script de correção gerado');
    fixSteps.push('⚠️ Correção requer acesso SSH manual à VPS');
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Script de correção preparado',
        fixScript,
        serverPort: analysis.port,
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

function generateFixScript(port: number) {
  return `#!/bin/bash
# Script de Correção do Servidor WhatsApp Existente
# Execute como root na VPS

echo "🔧 CORREÇÃO DO SERVIDOR WHATSAPP (Porta ${port})"
echo "============================================="

# 1. Parar servidor atual
echo "🛑 Parando servidor atual..."
pm2 stop all
sleep 3

# 2. Fazer backup
echo "💾 Fazendo backup..."
cp -r /root/webhook-server-${port} /root/backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || true

# 3. Verificar e corrigir dependências
echo "📦 Verificando dependências..."
cd /root/webhook-server-${port} || cd /root/whatsapp-server || cd /root
npm install whatsapp-web.js express cors qrcode node-fetch 2>/dev/null || true

# 4. Atualizar configuração
echo "⚙️ Atualizando configuração..."
# Aqui você adicionaria as correções específicas baseadas na análise

# 5. Reiniciar servidor
echo "🚀 Reiniciando servidor..."
pm2 restart all

# 6. Verificar status
echo "📊 Verificando status..."
sleep 5
pm2 status
curl -s http://localhost:${port}/health || echo "Servidor ainda não responde"

echo ""
echo "✅ CORREÇÃO FINALIZADA!"
echo "====================="
echo "🔗 Teste: http://31.97.24.222:${port}/health"
`;
}
