
#!/bin/bash

# Script para instalar Chrome/Chromium na VPS para WhatsApp Web.js
# Execute como root: bash install-chrome-vps.sh

echo "🚀 INSTALAÇÃO CHROME/CHROMIUM PARA VPS WhatsApp Web.js"
echo "====================================================="

# 1. Atualizar sistema
echo "📦 Atualizando sistema..."
apt-get update -y

# 2. Instalar dependências básicas
echo "🔧 Instalando dependências básicas..."
apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    apt-transport-https \
    software-properties-common \
    curl

# 3. Instalar Google Chrome
echo "🌐 Instalando Google Chrome..."
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
apt-get update -y
apt-get install -y google-chrome-stable

# 4. Verificar instalação do Chrome
if command -v google-chrome &> /dev/null; then
    echo "✅ Google Chrome instalado com sucesso!"
    google-chrome --version
else
    echo "❌ Falha na instalação do Chrome, tentando Chromium..."
    
    # Fallback: Instalar Chromium
    echo "🔄 Instalando Chromium como alternativa..."
    apt-get install -y chromium-browser
    
    if command -v chromium-browser &> /dev/null; then
        echo "✅ Chromium instalado com sucesso!"
        chromium-browser --version
    else
        echo "❌ Falha na instalação do Chromium também!"
        exit 1
    fi
fi

# 5. Instalar dependências específicas para ambiente headless
echo "🔧 Instalando dependências para ambiente headless..."
apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0

# 6. Criar usuário para WhatsApp (se não existir)
if ! id "whatsapp-user" &>/dev/null; then
    echo "👤 Criando usuário whatsapp-user..."
    useradd -r -s /bin/false whatsapp-user
fi

# 7. Configurar permissões para diretórios
echo "🔑 Configurando permissões..."
mkdir -p /root/whatsapp_instances
chmod 755 /root/whatsapp_instances

# 8. Instalar dependências Node.js específicas (se necessário)
echo "📦 Verificando dependências Node.js..."
cd /root
npm install puppeteer --save 2>/dev/null || echo "⚠️ Puppeteer já instalado ou erro na instalação"

# 9. Teste básico do Chrome/Chromium
echo "🧪 Testando Chrome/Chromium..."
if command -v google-chrome &> /dev/null; then
    google-chrome --headless --disable-gpu --no-sandbox --dump-dom https://www.google.com > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Chrome funciona corretamente no modo headless!"
    else
        echo "⚠️ Chrome instalado mas pode ter problemas no modo headless"
    fi
elif command -v chromium-browser &> /dev/null; then
    chromium-browser --headless --disable-gpu --no-sandbox --dump-dom https://www.google.com > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Chromium funciona corretamente no modo headless!"
    else
        echo "⚠️ Chromium instalado mas pode ter problemas no modo headless"
    fi
fi

# 10. Configurar variáveis de ambiente
echo "🌍 Configurando variáveis de ambiente..."
echo "export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true" >> /root/.bashrc
if command -v google-chrome &> /dev/null; then
    echo "export PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome" >> /root/.bashrc
elif command -v chromium-browser &> /dev/null; then
    echo "export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser" >> /root/.bashrc
fi

# 11. Recarregar variáveis
source /root/.bashrc

echo ""
echo "🎉 INSTALAÇÃO CONCLUÍDA!"
echo "======================"
echo "✅ Chrome/Chromium instalado e configurado"
echo "✅ Dependências headless instaladas"
echo "✅ Permissões configuradas"
echo "✅ Variáveis de ambiente definidas"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Reinicie o servidor WhatsApp: pm2 restart whatsapp-main-3002"
echo "2. Monitore os logs: pm2 logs whatsapp-main-3002"
echo "3. Teste a criação de instância via interface"
echo ""
echo "🔧 Se ainda houver problemas, execute:"
echo "   pm2 logs whatsapp-main-3002 --lines 50"
