#!/bin/bash

echo "🚀 Instalando dependências completas para Puppeteer + QR Code na VPS..."

# Atualizar sistema
echo "📦 Atualizando sistema..."
apt-get update && apt-get upgrade -y

# Instalar Node.js se não existir
if ! command -v node &> /dev/null; then
    echo "📦 Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt-get install -y nodejs
fi

# Dependências essenciais para Puppeteer
echo "🎭 Instalando dependências do Puppeteer..."
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
    wget \
    xdg-utils

# Instalar Google Chrome (necessário para Puppeteer)
echo "🌐 Instalando Google Chrome..."
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list
apt-get update
apt-get install -y google-chrome-stable

# Dependências adicionais para Canvas e imagens
echo "🎨 Instalando dependências para Canvas e processamento de imagens..."
apt-get install -y \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    build-essential \
    g++ \
    libpng-dev

# Instalar bibliotecas X11 para modo headless
echo "🖥️ Instalando bibliotecas X11..."
apt-get install -y \
    xvfb \
    x11vnc \
    fluxbox \
    wmctrl

# Criar diretório para Puppeteer se não existir
mkdir -p /opt/whatsapp-puppeteer
cd /opt/whatsapp-puppeteer

# Instalar dependências Node.js específicas
echo "📦 Instalando pacotes Node.js..."
if [ ! -f "package.json" ]; then
    npm init -y
fi

# Instalar Puppeteer e dependências
npm install --save \
    puppeteer \
    express \
    cors \
    dotenv \
    axios \
    canvas \
    sharp \
    jimp \
    qrcode \
    qrcode-reader \
    jsqr

# Verificar se Chrome está funcionando
echo "🔍 Verificando instalação do Chrome..."
google-chrome --version

# Verificar Node.js e npm
echo "🔍 Verificando Node.js..."
node --version
npm --version

# Testar Puppeteer básico
echo "🎭 Testando Puppeteer..."
cat > test-puppeteer.js << 'EOF'
const puppeteer = require('puppeteer');

(async () => {
  console.log('🎭 Testando Puppeteer...');
  
  try {
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
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.goto('https://example.com');
    
    const title = await page.title();
    console.log('✅ Puppeteer funcionando! Título:', title);
    
    await browser.close();
    console.log('✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
})();
EOF

node test-puppeteer.js

# Criar script para WhatsApp QR Code
echo "📱 Criando script específico para WhatsApp QR Code..."
cat > whatsapp-qr-test.js << 'EOF'
const puppeteer = require('puppeteer');

async function testWhatsAppQR() {
    console.log('📱 Testando captura de QR Code do WhatsApp...');
    
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

        // Verificar canvas
        const canvasCount = await page.evaluate(() => {
            return document.querySelectorAll('canvas').length;
        });

        console.log(`📊 Canvas encontrados: ${canvasCount}`);

        if (canvasCount > 0) {
            const canvas = await page.$('canvas');
            const boundingBox = await canvas.boundingBox();
            
            if (boundingBox) {
                console.log(`📐 Canvas size: ${boundingBox.width}x${boundingBox.height}`);
                
                const screenshot = await canvas.screenshot({ 
                    encoding: 'base64',
                    type: 'png'
                });
                
                console.log(`✅ QR Code capturado! Base64 length: ${screenshot.length}`);
                console.log(`📋 Primeiros 50 chars: ${screenshot.substring(0, 50)}...`);
                
                return true;
            }
        }

        console.log('❌ QR Code não encontrado');
        return false;

    } catch (error) {
        console.error('❌ Erro:', error);
        return false;
    } finally {
        await browser.close();
    }
}

testWhatsAppQR().then(success => {
    console.log(success ? '🎉 SUCESSO!' : '❌ FALHOU!');
});
EOF

echo "🎯 Testando captura de QR Code..."
node whatsapp-qr-test.js

# Verificar permissões
echo "🔒 Verificando permissões..."
chmod +x /opt/whatsapp-puppeteer/*.js

# Limpar cache
echo "🧹 Limpando cache..."
npm cache clean --force

echo "✅ Instalação completa finalizada!"
echo ""
echo "📋 Resumo da instalação:"
echo "- ✅ Google Chrome instalado"
echo "- ✅ Dependências X11 instaladas"
echo "- ✅ Bibliotecas Canvas instaladas" 
echo "- ✅ Puppeteer e dependências Node.js instaladas"
echo "- ✅ Scripts de teste criados"
echo ""
echo "🚀 Para testar novamente:"
echo "cd /opt/whatsapp-puppeteer && node whatsapp-qr-test.js" 