
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './config.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Iniciando diagnóstico profissional da VPS...');

    const VPS_HOST = '31.97.24.222';
    const VPS_API_PORT = '3002';
    const WHATSAPP_PORT = '3001';
    const API_TOKEN = 'vps-api-token-2024';

    // === FASE 1: DIAGNÓSTICO COMPLETO ===
    console.log('📊 FASE 1: Diagnóstico de conectividade VPS');
    
    const diagnosticResults = {
      vps_ping: false,
      api_server_running: false,
      whatsapp_server_running: false,
      api_authentication: false,
      system_resources: null,
      error_details: []
    };

    // 1.1 Teste de conectividade básica VPS
    try {
      console.log(`🔌 Testando conectividade básica com ${VPS_HOST}...`);
      const pingResponse = await fetch(`http://${VPS_HOST}:80`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      diagnosticResults.vps_ping = true;
      console.log('✅ VPS responde na porta 80');
    } catch (error) {
      console.log('⚠️ VPS não responde na porta 80:', error.message);
      diagnosticResults.error_details.push(`Ping VPS: ${error.message}`);
    }

    // 1.2 Teste da API Server (porta 3002)
    try {
      console.log(`🔧 Testando API Server na porta ${VPS_API_PORT}...`);
      const apiStatusResponse = await fetch(`http://${VPS_HOST}:${VPS_API_PORT}/status`, {
        method: 'GET',
        signal: AbortSignal.timeout(8000)
      });
      
      if (apiStatusResponse.ok) {
        const apiStatus = await apiStatusResponse.json();
        diagnosticResults.api_server_running = true;
        diagnosticResults.system_resources = apiStatus;
        console.log('✅ API Server está online:', apiStatus);
      } else {
        throw new Error(`API Server retornou status ${apiStatusResponse.status}`);
      }
    } catch (error) {
      console.log('❌ API Server não está rodando:', error.message);
      diagnosticResults.error_details.push(`API Server: ${error.message}`);
    }

    // 1.3 Teste de autenticação da API
    if (diagnosticResults.api_server_running) {
      try {
        console.log('🔐 Testando autenticação da API...');
        const authTestResponse = await fetch(`http://${VPS_HOST}:${VPS_API_PORT}/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_TOKEN}`
          },
          body: JSON.stringify({
            command: 'echo "Test auth"',
            description: 'Teste de autenticação'
          }),
          signal: AbortSignal.timeout(10000)
        });

        if (authTestResponse.ok) {
          diagnosticResults.api_authentication = true;
          console.log('✅ Autenticação da API funcionando');
        } else {
          throw new Error(`Auth falhou: HTTP ${authTestResponse.status}`);
        }
      } catch (error) {
        console.log('❌ Falha na autenticação da API:', error.message);
        diagnosticResults.error_details.push(`Auth API: ${error.message}`);
      }
    }

    // 1.4 Verificar se WhatsApp server já está rodando
    try {
      console.log(`📱 Verificando WhatsApp server na porta ${WHATSAPP_PORT}...`);
      const whatsappResponse = await fetch(`http://${VPS_HOST}:${WHATSAPP_PORT}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (whatsappResponse.ok) {
        const whatsappHealth = await whatsappResponse.json();
        diagnosticResults.whatsapp_server_running = true;
        console.log('✅ WhatsApp server já está rodando:', whatsappHealth);
        
        return new Response(
          JSON.stringify({
            success: true,
            message: 'WhatsApp server já está online e funcionando!',
            server_url: `http://${VPS_HOST}:${WHATSAPP_PORT}`,
            health: whatsappHealth,
            status: 'already_running',
            diagnostics: diagnosticResults
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.log('ℹ️ WhatsApp server não está rodando, procederemos com deploy');
      diagnosticResults.error_details.push(`WhatsApp check: ${error.message}`);
    }

    // === FASE 2: ESTRATÉGIA DE DEPLOY ===
    console.log('🚀 FASE 2: Selecionando estratégia de deploy');

    if (!diagnosticResults.api_server_running) {
      console.log('⚠️ API Server não disponível - Deploy não é possível');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'API Server da VPS não está disponível',
          message: 'Não é possível fazer deploy sem a API da VPS rodando',
          diagnostics: diagnosticResults,
          next_steps: [
            'Verifique se a VPS está online',
            'Instale o API Server usando o script de instalação manual',
            'Verifique se a porta 3002 está liberada no firewall'
          ]
        }),
        { 
          status: 503, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!diagnosticResults.api_authentication) {
      console.log('⚠️ Falha na autenticação da API');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Falha na autenticação com API da VPS',
          message: 'Token de autenticação inválido ou API não configurada',
          diagnostics: diagnosticResults
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // === FASE 3: DEPLOY PROFISSIONAL ===
    console.log('🎯 FASE 3: Executando deploy via API autenticada');

    const deployScript = `
#!/bin/bash
set -e

echo "🚀 Deploy WhatsApp Server Profissional - $(date)"

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "📦 Instalando Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2..."
    npm install -g pm2
fi

# Criar diretório do servidor
mkdir -p /root/whatsapp-permanent-server
cd /root/whatsapp-permanent-server

# Verificar se já existe e está rodando
if pm2 list | grep -q "whatsapp-permanent-server.*online"; then
    echo "✅ Servidor já está rodando, reiniciando..."
    pm2 restart whatsapp-permanent-server
    exit 0
fi

# Criar package.json se não existir
if [ ! -f package.json ]; then
    echo "📝 Criando package.json..."
    cat > package.json << 'PKGEOF'
{
  "name": "whatsapp-permanent-server",
  "version": "2.0.0",
  "main": "server.js",
  "dependencies": {
    "whatsapp-web.js": "^1.23.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "qrcode": "^1.5.3",
    "axios": "^1.6.0",
    "puppeteer": "^21.5.0"
  }
}
PKGEOF
fi

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "⬇️ Instalando dependências..."
    npm install
fi

# Criar servidor principal
echo "🤖 Criando servidor WhatsApp..."
cat > server.js << 'SERVEREOF'
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const axios = require('axios');

// Configurações de ambiente
process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'true';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const clients = new Map();
const webhookUrl = 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web';

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    server: 'WhatsApp Permanent Server v2.0',
    timestamp: new Date().toISOString(),
    active_instances: clients.size,
    uptime: process.uptime()
  });
});

// Create instance endpoint
app.post('/create', async (req, res) => {
  const { instanceId, sessionName, webhookUrl: customWebhook } = req.body;
  
  try {
    if (clients.has(instanceId)) {
      return res.json({ success: false, error: 'Instance already exists' });
    }

    const client = new Client({
      authStrategy: new LocalAuth({ 
        clientId: instanceId,
        dataPath: \`/root/whatsapp-sessions/\${instanceId}\`
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
          '--disable-gpu'
        ],
        timeout: 60000
      }
    });
    
    const instanceData = {
      client,
      qrCode: null,
      status: 'initializing',
      sessionName: sessionName || instanceId,
      webhook: customWebhook || webhookUrl,
      phone: null,
      name: null,
      createdAt: new Date()
    };
    
    clients.set(instanceId, instanceData);
    
    // Event handlers
    client.on('qr', async (qr) => {
      try {
        const qrCodeData = await QRCode.toDataURL(qr);
        instanceData.qrCode = qrCodeData;
        instanceData.status = 'waiting_scan';
        
        if (instanceData.webhook) {
          await axios.post(instanceData.webhook, {
            event: 'qr',
            instanceId,
            data: { qr: qrCodeData }
          }).catch(err => console.log('Webhook QR error:', err.message));
        }
      } catch (error) {
        console.error('QR Error:', error);
      }
    });
    
    client.on('ready', async () => {
      try {
        instanceData.status = 'ready';
        instanceData.qrCode = null;
        
        const info = client.info;
        instanceData.phone = info.wid.user;
        instanceData.name = info.pushname;
        
        if (instanceData.webhook) {
          await axios.post(instanceData.webhook, {
            event: 'ready',
            instanceId,
            data: {
              phone: instanceData.phone,
              name: instanceData.name
            }
          }).catch(err => console.log('Webhook ready error:', err.message));
        }
      } catch (error) {
        console.error('Ready Error:', error);
      }
    });
    
    client.on('message', async (message) => {
      try {
        if (message.from.includes('@g.us')) return;
        
        if (instanceData.webhook) {
          await axios.post(instanceData.webhook, {
            event: 'message',
            instanceId,
            data: {
              id: message.id._serialized,
              from: message.from,
              body: message.body,
              type: message.type,
              timestamp: message.timestamp
            }
          }).catch(err => console.log('Webhook message error:', err.message));
        }
      } catch (error) {
        console.error('Message Error:', error);
      }
    });
    
    client.on('disconnected', async (reason) => {
      instanceData.status = 'disconnected';
      
      if (instanceData.webhook) {
        await axios.post(instanceData.webhook, {
          event: 'disconnected',
          instanceId,
          data: { reason }
        }).catch(err => console.log('Webhook disconnect error:', err.message));
      }
      
      setTimeout(() => {
        client.initialize().catch(err => console.error('Reconnect error:', err));
      }, 30000);
    });
    
    await client.initialize();
    
    res.json({ 
      success: true, 
      instanceId,
      status: 'created',
      qrCode: instanceData.qrCode
    });
    
  } catch (error) {
    console.error('Create instance error:', error);
    clients.delete(instanceId);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Send message endpoint
app.post('/send', async (req, res) => {
  const { instanceId, phone, message } = req.body;
  
  try {
    const instanceData = clients.get(instanceId);
    if (!instanceData || instanceData.status !== 'ready') {
      return res.status(400).json({ 
        success: false, 
        error: 'Instance not ready' 
      });
    }
    
    const chatId = phone.includes('@c.us') ? phone : \`\${phone}@c.us\`;
    await instanceData.client.sendMessage(chatId, message);
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get instance status
app.get('/status/:instanceId', (req, res) => {
  const { instanceId } = req.params;
  const instanceData = clients.get(instanceId);
  
  if (!instanceData) {
    return res.status(404).json({ 
      success: false, 
      error: 'Instance not found' 
    });
  }
  
  res.json({
    success: true,
    status: instanceData.status,
    qrCode: instanceData.qrCode,
    phone: instanceData.phone,
    name: instanceData.name,
    createdAt: instanceData.createdAt
  });
});

// Delete instance
app.post('/delete', async (req, res) => {
  const { instanceId } = req.body;
  
  try {
    const instanceData = clients.get(instanceId);
    if (instanceData) {
      await instanceData.client.destroy();
      clients.delete(instanceId);
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Delete instance error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// List instances
app.get('/instances', (req, res) => {
  const instances = Array.from(clients.entries()).map(([id, data]) => ({
    instanceId: id,
    status: data.status,
    phone: data.phone,
    name: data.name,
    createdAt: data.createdAt
  }));
  
  res.json({ success: true, instances });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`🚀 WhatsApp Permanent Server running on port \${PORT}\`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down gracefully...');
  for (const [instanceId, data] of clients) {
    try {
      await data.client.destroy();
    } catch (error) {
      console.error(\`❌ Error closing \${instanceId}:\`, error);
    }
  }
  process.exit(0);
});
SERVEREOF

# Criar diretório de sessões
mkdir -p /root/whatsapp-sessions

# Parar instância anterior se existir
pm2 stop whatsapp-permanent-server 2>/dev/null || true
pm2 delete whatsapp-permanent-server 2>/dev/null || true

# Iniciar com PM2
echo "🚀 Iniciando servidor com PM2..."
pm2 start server.js --name "whatsapp-permanent-server" --watch false --max-memory-restart 1G
pm2 save

# Configurar startup automático
pm2 startup ubuntu 2>/dev/null || pm2 startup 2>/dev/null || true

# Teste final
echo "✅ Testando servidor..."
sleep 5
curl -s http://localhost:3001/health && echo "✅ Deploy concluído com sucesso!" || echo "❌ Falha no teste final"
`;

    console.log('📤 Enviando script de deploy via API...');

    const deployResponse = await fetch(`http://${VPS_HOST}:${VPS_API_PORT}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify({
        command: deployScript,
        description: 'Deploy WhatsApp Permanent Server',
        timeout: 180000 // 3 minutos
      }),
      signal: AbortSignal.timeout(200000) // 3.3 minutos
    });

    if (!deployResponse.ok) {
      throw new Error(`Deploy API falhou: HTTP ${deployResponse.status}`);
    }

    const deployResult = await deployResponse.json();
    
    if (!deployResult.success) {
      throw new Error(`Deploy script falhou: ${deployResult.error || 'Erro desconhecido'}`);
    }

    console.log('✅ Deploy executado com sucesso');
    console.log('Output:', deployResult.output);

    // === FASE 4: VALIDAÇÃO FINAL ===
    console.log('🧪 FASE 4: Validação final do deploy');
    
    await new Promise(resolve => setTimeout(resolve, 8000)); // Aguardar 8 segundos

    try {
      const finalHealthResponse = await fetch(`http://${VPS_HOST}:${WHATSAPP_PORT}/health`);
      
      if (finalHealthResponse.ok) {
        const finalHealth = await finalHealthResponse.json();
        
        console.log('🎉 Validação final: Servidor online!');
        
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Deploy realizado com sucesso! Servidor WhatsApp online.',
            server_url: `http://${VPS_HOST}:${WHATSAPP_PORT}`,
            health: finalHealth,
            deployment_output: deployResult.output,
            diagnostics: diagnosticResults,
            deploy_method: 'API VPS Autenticada'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        throw new Error(`Health check final falhou: HTTP ${finalHealthResponse.status}`);
      }
      
    } catch (healthError) {
      console.log('⚠️ Deploy concluído mas validação final falhou:', healthError.message);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Deploy executado, mas validação final falhou',
          server_url: `http://${VPS_HOST}:${WHATSAPP_PORT}`,
          deployment_output: deployResult.output,
          validation_error: healthError.message,
          diagnostics: diagnosticResults,
          next_steps: [
            'Aguarde alguns segundos e teste manualmente',
            'Verifique se o PM2 está rodando o processo',
            'Confirme se as portas estão liberadas'
          ]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('❌ Erro crítico no deploy:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Falha crítica no processo de deploy',
        timestamp: new Date().toISOString(),
        error_type: error.constructor.name
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
