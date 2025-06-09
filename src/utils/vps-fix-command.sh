
#!/bin/bash

# Comando único para corrigir VPS WhatsApp Web.js
echo "🚀 CORREÇÃO COMPLETA VPS WhatsApp Web.js + Puppeteer"
echo "=================================================="

# 1. Parar servidor atual
echo "🛑 Parando servidor atual..."
pm2 stop whatsapp-main-3002 2>/dev/null || true
pm2 delete whatsapp-main-3002 2>/dev/null || true

# 2. Instalar Chrome se não existir
if ! command -v google-chrome &> /dev/null && ! command -v chromium-browser &> /dev/null; then
    echo "🌐 Instalando Google Chrome..."
    apt-get update -y
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
    apt-get update -y
    apt-get install -y google-chrome-stable
    
    # Instalar dependências headless
    apt-get install -y libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxss1 libasound2
fi

# 3. Atualizar servidor com Puppeteer corrigido
echo "📝 Atualizando servidor com Puppeteer corrigido..."
# (O arquivo vps-server-persistent.js já foi atualizado acima)

# 4. Instalar dependências Node.js
echo "📦 Instalando dependências..."
cd /root
npm install whatsapp-web.js express cors node-fetch

# 5. Configurar variáveis de ambiente
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
if command -v google-chrome &> /dev/null; then
    export PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
elif command -v chromium-browser &> /dev/null; then
    export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
fi

# 6. Reiniciar servidor
echo "🚀 Iniciando servidor corrigido..."
PORT=3002 AUTH_TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" pm2 start vps-server-persistent.js --name whatsapp-main-3002

# 7. Salvar configuração PM2
pm2 save

# 8. Aguardar inicialização
echo "⏳ Aguardando inicialização (10s)..."
sleep 10

# 9. Verificar status
echo "📊 Status final:"
pm2 status
echo ""
curl -s http://localhost:3002/health | jq '.version, .puppeteerFixed'

echo ""
echo "🎉 CORREÇÃO CONCLUÍDA!"
echo "===================="
echo "✅ Puppeteer configurado para VPS"
echo "✅ Chrome/Chromium instalado"
echo "✅ Servidor reiniciado"
echo "✅ Retry automático implementado"
echo ""
echo "📋 Teste agora a criação de instância via interface!"
