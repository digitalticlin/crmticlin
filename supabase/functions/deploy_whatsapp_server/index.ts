
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './config.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Deploying WhatsApp server via API...');

    const VPS_HOST = '31.97.24.222';
    const VPS_PORT = '3002';
    const API_TOKEN = 'vps-api-token-2024';

    // First, try to check if server is already running
    try {
      const healthResponse = await fetch(`http://${VPS_HOST}:3001/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('✅ WhatsApp server already running:', healthData);
        
        return new Response(
          JSON.stringify({
            success: true,
            message: 'WhatsApp server is already running!',
            server_url: `http://${VPS_HOST}:3001`,
            health: healthData,
            status: 'already_running'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (healthError) {
      console.log('⚠️ Health check failed, proceeding with deployment...');
    }

    // Deploy command to run on VPS
    const deployCommand = `
      #!/bin/bash
      set -e
      
      echo "🔧 Starting WhatsApp server deployment..."
      
      # Install Node.js if not present
      if ! command -v node &> /dev/null; then
          echo "📦 Installing Node.js..."
          curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
          apt-get install -y nodejs
      fi
      
      # Install PM2 if not present
      if ! command -v pm2 &> /dev/null; then
          echo "📦 Installing PM2..."
          npm install -g pm2
      fi
      
      # Create server directory
      echo "📁 Creating server directory..."
      mkdir -p /root/whatsapp-permanent-server
      cd /root/whatsapp-permanent-server
      
      # Create package.json
      echo "📝 Creating package.json..."
      cat > package.json << 'EOF'
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
EOF
      
      # Install dependencies if needed
      if [ ! -d "node_modules" ]; then
          echo "⬇️ Installing dependencies..."
          npm install
      fi
      
      # Create server code
      echo "🤖 Creating WhatsApp server..."
      cat > server.js << 'SERVEREOF'
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const axios = require('axios');

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

// Create WhatsApp instance
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

// Send message
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
      
      # Create PM2 ecosystem
      echo "⚙️ Creating PM2 ecosystem..."
      cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'whatsapp-permanent-server',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
EOF
      
      # Create directories
      mkdir -p /root/whatsapp-sessions
      
      # Start server with PM2
      echo "🚀 Starting server with PM2..."
      pm2 stop whatsapp-permanent-server 2>/dev/null || true
      pm2 delete whatsapp-permanent-server 2>/dev/null || true
      pm2 start ecosystem.config.js
      pm2 save
      pm2 startup
      
      # Test server
      echo "✅ Testing server..."
      sleep 3
      curl -s http://localhost:3001/health || echo "❌ Server not responding"
      
      echo "🎉 WhatsApp Permanent Server deployed successfully!"
    `;

    console.log('📡 Executing deployment via VPS API...');
    
    // Try to use VPS API to execute the deployment
    try {
      const vpsApiResponse = await fetch(`http://${VPS_HOST}:${VPS_PORT}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_TOKEN}`
        },
        body: JSON.stringify({
          command: deployCommand,
          description: 'Deploy WhatsApp Permanent Server'
        }),
        signal: AbortSignal.timeout(120000) // 2 minutes timeout
      });

      if (!vpsApiResponse.ok) {
        throw new Error(`VPS API responded with status ${vpsApiResponse.status}`);
      }

      const vpsResult = await vpsApiResponse.json();
      
      if (!vpsResult.success) {
        throw new Error(`VPS API error: ${vpsResult.error || 'Unknown error'}`);
      }

      console.log('✅ Deployment executed successfully via VPS API');
      console.log('Output:', vpsResult.output);

      // Test server health after deployment
      console.log('🏥 Testing server health...');
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

      try {
        const healthResponse = await fetch(`http://${VPS_HOST}:3001/health`);
        const healthData = await healthResponse.json();
        
        console.log('✅ Server health check passed:', healthData);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'WhatsApp Permanent Server deployed successfully!',
            server_url: `http://${VPS_HOST}:3001`,
            health: healthData,
            deployment_output: vpsResult.output
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (healthError) {
        console.log('⚠️ Health check failed, but deployment completed:', healthError.message);
        
        return new Response(
          JSON.stringify({
            success: true,
            message: 'WhatsApp server deployed, but health check failed',
            server_url: `http://${VPS_HOST}:3001`,
            deployment_output: vpsResult.output,
            health_error: healthError.message
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

    } catch (vpsApiError) {
      console.error('VPS API deployment failed:', vpsApiError.message);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: `VPS API deployment failed: ${vpsApiError.message}`,
          message: 'Failed to deploy via VPS API - server may be offline'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('Deployment error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Failed to deploy WhatsApp server'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
