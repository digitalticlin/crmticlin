
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './config.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Deploying permanent WhatsApp server to VPS...');

    const VPS_HOST = '31.97.24.222';
    const deployScript = `
#!/bin/bash
set -e

echo "🔧 Installing Node.js and dependencies..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

echo "📦 Installing PM2 globally..."
npm install -g pm2

echo "📁 Creating WhatsApp server directory..."
mkdir -p /root/whatsapp-permanent-server
cd /root/whatsapp-permanent-server

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

echo "⬇️ Installing dependencies..."
npm install

echo "🤖 Creating WhatsApp server..."
cat > server.js << 'EOF'
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'true';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Store for active WhatsApp instances
const clients = new Map();
const webhookUrl = 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web';

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    server: 'WhatsApp Permanent Server v2.0',
    timestamp: new Date().toISOString(),
    active_instances: clients.size,
    uptime: process.uptime(),
    ssl_fix_enabled: true,
    timeout_fix_enabled: true
  });
});

// Create new WhatsApp instance
app.post('/create', async (req, res) => {
  const { instanceId, sessionName, webhookUrl: customWebhook } = req.body;
  
  try {
    console.log(\`🆕 Creating WhatsApp instance: \${instanceId}\`);
    
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
          '--disable-gpu',
          '--ignore-ssl-errors=yes',
          '--ignore-certificate-errors',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--timeout=60000'
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
    
    // QR Code handler
    client.on('qr', async (qr) => {
      try {
        console.log(\`📱 QR Code generated for \${instanceId}\`);
        const qrCodeData = await QRCode.toDataURL(qr);
        instanceData.qrCode = qrCodeData;
        instanceData.status = 'waiting_scan';
        
        // Notify webhook about QR code
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
    
    // Ready handler
    client.on('ready', async () => {
      try {
        console.log(\`✅ WhatsApp ready for \${instanceId}\`);
        instanceData.status = 'ready';
        instanceData.qrCode = null;
        
        const info = client.info;
        instanceData.phone = info.wid.user;
        instanceData.name = info.pushname;
        
        // Notify webhook about ready state
        if (instanceData.webhook) {
          await axios.post(instanceData.webhook, {
            event: 'ready',
            instanceId,
            data: {
              phone: instanceData.phone,
              name: instanceData.name,
              profilePic: info.profilePicUrl
            }
          }).catch(err => console.log('Webhook ready error:', err.message));
        }
      } catch (error) {
        console.error('Ready Error:', error);
      }
    });
    
    // Message handler
    client.on('message', async (message) => {
      try {
        if (message.from.includes('@g.us')) return; // Skip groups
        
        console.log(\`📨 New message for \${instanceId}: \${message.from}\`);
        
        // Notify webhook about new message
        if (instanceData.webhook) {
          await axios.post(instanceData.webhook, {
            event: 'message',
            instanceId,
            data: {
              id: message.id._serialized,
              from: message.from,
              body: message.body,
              type: message.type,
              timestamp: message.timestamp,
              notifyName: message.notifyName,
              mediaUrl: message.hasMedia ? \`/media/\${message.id._serialized}\` : null
            }
          }).catch(err => console.log('Webhook message error:', err.message));
        }
      } catch (error) {
        console.error('Message Error:', error);
      }
    });
    
    // Disconnected handler
    client.on('disconnected', async (reason) => {
      console.log(\`❌ WhatsApp disconnected for \${instanceId}: \${reason}\`);
      instanceData.status = 'disconnected';
      
      // Notify webhook about disconnection
      if (instanceData.webhook) {
        await axios.post(instanceData.webhook, {
          event: 'disconnected',
          instanceId,
          data: { reason }
        }).catch(err => console.log('Webhook disconnect error:', err.message));
      }
      
      // Auto-reconnect after 30 seconds
      setTimeout(() => {
        console.log(\`🔄 Auto-reconnecting \${instanceId}...\`);
        client.initialize().catch(err => console.error('Reconnect error:', err));
      }, 30000);
    });
    
    // Initialize client
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
    
    console.log(\`📤 Message sent from \${instanceId} to \${phone}\`);
    
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
      console.log(\`🗑️ Instance deleted: \${instanceId}\`);
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
  console.log(\`📊 Health check: http://localhost:\${PORT}/health\`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down gracefully...');
  for (const [instanceId, data] of clients) {
    try {
      await data.client.destroy();
      console.log(\`✅ Instance \${instanceId} closed\`);
    } catch (error) {
      console.error(\`❌ Error closing \${instanceId}:\`, error);
    }
  }
  process.exit(0);
});
EOF

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
    },
    error_file: '/root/logs/whatsapp-error.log',
    out_file: '/root/logs/whatsapp-out.log',
    log_file: '/root/logs/whatsapp-combined.log',
    time: true
  }]
};
EOF

echo "📁 Creating directories..."
mkdir -p /root/whatsapp-sessions
mkdir -p /root/logs

echo "🚀 Starting server with PM2..."
pm2 stop whatsapp-permanent-server 2>/dev/null || true
pm2 delete whatsapp-permanent-server 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "✅ Testing server..."
sleep 5
curl -s http://localhost:3001/health || echo "❌ Server not responding"

echo "🎉 WhatsApp Permanent Server deployed successfully!"
echo "🔗 Health check: http://31.97.24.222:3001/health"
echo "📊 PM2 status: pm2 status"
echo "📋 PM2 logs: pm2 logs whatsapp-permanent-server"
    `;

    // Send deployment script to VPS
    const deployResponse = await fetch(`http://${VPS_HOST}:3002/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        command: deployScript,
        description: 'Deploy WhatsApp Permanent Server'
      })
    });

    if (!deployResponse.ok) {
      throw new Error(`VPS deployment failed: ${deployResponse.status}`);
    }

    const deployResult = await deployResponse.json();
    
    // Test server health
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10s
    
    const healthResponse = await fetch(`http://${VPS_HOST}:3001/health`);
    const healthData = await healthResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'WhatsApp Permanent Server deployed successfully!',
        deployment: deployResult,
        health: healthData,
        server_url: `http://${VPS_HOST}:3001`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

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
