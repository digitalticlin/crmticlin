#!/bin/bash

echo "🚀 CONFIGURAÇÃO COMPLETA DA VPS PARA PUPPETEER + QR CODE"
echo "=========================================================="

# Verificar se é root
if [[ $EUID -ne 0 ]]; then
   echo "❌ Este script deve ser executado como root (sudo)"
   exit 1
fi

echo "📦 1. Atualizando sistema..."
apt-get update && apt-get upgrade -y

echo "📦 2. Instalando Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

echo "🎭 3. Instalando dependências essenciais do Puppeteer..."
apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    gconf-service \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils

echo "🌐 4. Instalando Google Chrome..."
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list
apt-get update
apt-get install -y google-chrome-stable

echo "🎨 5. Instalando dependências para Canvas e imagens..."
apt-get install -y \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    build-essential \
    g++ \
    libpng-dev

echo "🖥️ 6. Instalando X11 para modo headless..."
apt-get install -y \
    xvfb \
    x11vnc \
    fluxbox \
    wmctrl

echo "📁 7. Configurando diretório de trabalho..."
mkdir -p /opt/whatsapp-puppeteer
cd /opt/whatsapp-puppeteer

echo "📦 8. Inicializando projeto Node.js..."
cat > package.json << 'EOF'
{
  "name": "whatsapp-puppeteer-import",
  "version": "1.0.0",
  "description": "WhatsApp Import via Puppeteer",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "test": "node test-qr.js"
  },
  "dependencies": {
    "puppeteer": "^21.5.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "axios": "^1.6.0"
  }
}
EOF

echo "🔧 9. Instalando dependências Node.js..."
npm install

echo "🔍 10. Verificando instalações..."
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "Chrome: $(google-chrome --version)"

echo "🎭 11. Criando script de teste básico..."
cat > test-basic.js << 'EOF'
const puppeteer = require('puppeteer');

async function testBasic() {
    console.log('🎭 Testando Puppeteer básico...');
    
    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.goto('https://example.com');
        
        const title = await page.title();
        console.log('✅ Título da página:', title);
        
        await browser.close();
        console.log('✅ Teste básico PASSOU!');
        return true;
        
    } catch (error) {
        console.error('❌ Teste básico FALHOU:', error);
        return false;
    }
}

testBasic();
EOF

echo "📱 12. Criando script de teste do WhatsApp QR..."
cat > test-qr.js << 'EOF'
const puppeteer = require('puppeteer');

async function testWhatsAppQR() {
    console.log('📱 Testando captura de QR Code...');
    
    const browser = await puppeteer.launch({
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
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--window-size=1280,720'
        ]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        console.log('🌐 Carregando WhatsApp Web...');
        await page.goto('https://web.whatsapp.com', { 
            waitUntil: 'domcontentloaded',
            timeout: 60000 
        });

        console.log('⏳ Aguardando 10 segundos...');
        await page.waitForTimeout(10000);

        const pageInfo = await page.evaluate(() => {
            return {
                title: document.title,
                canvasCount: document.querySelectorAll('canvas').length,
                bodyText: document.body.innerText.substring(0, 200)
            };
        });

        console.log('📊 Informações da página:', pageInfo);

        if (pageInfo.canvasCount > 0) {
            console.log('✅ Canvas encontrado! Tentando capturar...');
            
            const canvas = await page.$('canvas');
            const boundingBox = await canvas.boundingBox();
            
            if (boundingBox && boundingBox.width > 100 && boundingBox.height > 100) {
                const screenshot = await canvas.screenshot({ 
                    encoding: 'base64',
                    type: 'png'
                });
                
                console.log(`✅ QR Code capturado! Tamanho: ${screenshot.length} chars`);
                console.log(`📋 Amostra: ${screenshot.substring(0, 50)}...`);
                return true;
            } else {
                console.log('⚠️ Canvas muito pequeno');
            }
        } else {
            console.log('❌ Nenhum canvas encontrado');
        }

        return false;

    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
        return false;
    } finally {
        await browser.close();
    }
}

testWhatsAppQR().then(success => {
    console.log(success ? '🎉 TESTE QR PASSOU!' : '❌ TESTE QR FALHOU!');
    process.exit(success ? 0 : 1);
});
EOF

echo "🚀 13. Executando testes..."
echo "Teste básico:"
node test-basic.js

echo -e "\nTeste QR Code:"
node test-qr.js

echo "📝 14. Criando arquivo de configuração de serviço..."
cat > /etc/systemd/system/whatsapp-puppeteer.service << 'EOF'
[Unit]
Description=WhatsApp Puppeteer Import Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/whatsapp-puppeteer
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

echo "🔧 15. Configurando permissões..."
chmod +x /opt/whatsapp-puppeteer/*.js
chmod 644 /etc/systemd/system/whatsapp-puppeteer.service

echo "🧹 16. Limpeza final..."
apt-get autoremove -y
apt-get autoclean
npm cache clean --force

echo "✅ CONFIGURAÇÃO COMPLETA FINALIZADA!"
echo ""
echo "📋 RESUMO:"
echo "========="
echo "✅ Node.js $(node --version) instalado"
echo "✅ Chrome $(google-chrome --version | cut -d' ' -f3) instalado"
echo "✅ Puppeteer e dependências instaladas"
echo "✅ Scripts de teste criados"
echo "✅ Serviço systemd configurado"
echo ""
echo "🧪 PRÓXIMOS PASSOS:"
echo "=================="
echo "1. Copie o arquivo 'puppeteer-server-complete.js' para '/opt/whatsapp-puppeteer/server.js'"
echo "2. Execute: systemctl daemon-reload"
echo "3. Execute: systemctl enable whatsapp-puppeteer"
echo "4. Execute: systemctl start whatsapp-puppeteer"
echo "5. Verifique: systemctl status whatsapp-puppeteer"
echo ""
echo "🔗 ENDPOINTS DISPONÍVEIS:"
echo "========================"
echo "POST http://31.97.163.57:3001/start-import"
echo "GET  http://31.97.163.57:3001/session-status/:sessionId"
echo "DEL  http://31.97.163.57:3001/delete-session/:sessionId"
echo ""
echo "🎯 Para testar novamente:"
echo "cd /opt/whatsapp-puppeteer && node test-qr.js" 