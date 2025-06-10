
#!/bin/bash

# CORREÇÃO RÁPIDA PUPPETEER - Script minimalista
# Para executar na VPS: bash vps-quick-fix.sh

echo "🔧 CORREÇÃO RÁPIDA PUPPETEER VPS"
echo "================================"

# Parar serviços
pm2 stop whatsapp-main-3002 2>/dev/null
pm2 delete whatsapp-main-3002 2>/dev/null

# Instalar Chrome se não existir
if ! command -v google-chrome-stable &> /dev/null; then
    echo "📦 Instalando Chrome..."
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
    apt-get update -y && apt-get install -y google-chrome-stable
fi

# Instalar dependências básicas
apt-get install -y libnss3 libatk-bridge2.0-0 libdrm2 libxkbcomposite1 libxdamage1 libxrandr2 libgbm1 libxss1 libasound2

# Criar servidor minimalista
cat > /root/whatsapp-quick.js << 'EOF'
const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const instances = new Map();

// Configuração Puppeteer otimizada
const puppeteerConfig = {
    headless: true,
    executablePath: '/usr/bin/google-chrome-stable',
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process',
        '--disable-gpu'
    ]
};

app.get('/health', (req, res) => {
    res.json({ success: true, status: 'online', port: 3002 });
});

app.post('/instance/create', async (req, res) => {
    try {
        const { instanceName } = req.body;
        const instanceId = `wa_${instanceName}_${Date.now()}`;
        
        const client = new Client({
            authStrategy: new LocalAuth({ clientId: instanceId }),
            puppeteer: puppeteerConfig
        });
        
        const instanceData = { id: instanceId, client, qrCode: null, status: 'initializing' };
        
        client.on('qr', (qr) => {
            instanceData.qrCode = qr;
            instanceData.status = 'waiting_qr';
        });
        
        client.on('ready', () => {
            instanceData.status = 'ready';
        });
        
        await client.initialize();
        instances.set(instanceId, instanceData);
        
        res.json({ success: true, instanceId, instanceName });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/instance/:instanceId/qr', (req, res) => {
    const instance = instances.get(req.params.instanceId);
    if (!instance) {
        return res.status(404).json({ success: false, error: 'Instância não encontrada' });
    }
    
    if (instance.qrCode) {
        res.json({ success: true, qrCode: instance.qrCode });
    } else {
        res.json({ success: false, waiting: true, message: 'QR Code sendo gerado' });
    }
});

app.listen(3002, '0.0.0.0', () => {
    console.log('🚀 WhatsApp Quick Server rodando na porta 3002');
});
EOF

# Instalar dependências se necessário
cd /root
npm install whatsapp-web.js express cors 2>/dev/null || echo "Dependências já instaladas"

# Iniciar servidor
pm2 start /root/whatsapp-quick.js --name whatsapp-main-3002
pm2 save

echo "✅ CORREÇÃO RÁPIDA CONCLUÍDA!"
echo "📋 Teste: curl http://localhost:3002/health"

