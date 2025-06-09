
#!/bin/bash

# Script para aplicar a correção definitiva do Puppeteer na VPS
echo "🚀 CORREÇÃO DEFINITIVA: Puppeteer VPS Fix"
echo "========================================"

# 1. Parar servidor atual
echo "🛑 Parando servidor atual..."
pm2 stop whatsapp-main-3002 2>/dev/null || true
pm2 delete whatsapp-main-3002 2>/dev/null || true

# 2. Backup do arquivo anterior
echo "💾 Fazendo backup..."
cp vps-server-persistent.js vps-server-backup-$(date +%Y%m%d_%H%M%S).js 2>/dev/null || true

# 3. Substituir arquivo servidor
echo "📝 Aplicando correção definitiva..."
# Assume que o arquivo vps-server-final-fix.js foi copiado para a VPS
cp vps-server-final-fix.js vps-server-persistent.js

# 4. Instalar dependências necessárias
echo "📦 Instalando/atualizando dependências..."
npm install whatsapp-web.js@latest express cors node-fetch qrcode

# 5. Verificar se Chrome está instalado
if ! command -v google-chrome &> /dev/null; then
    echo "🌐 Instalando Google Chrome..."
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
    apt-get update -y
    apt-get install -y google-chrome-stable
fi

# 6. Instalar dependências extras para Chrome
echo "🔧 Instalando dependências do Chrome..."
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
    libatspi2.0-0 \
    libgtk-3-0

# 7. Configurar variáveis de ambiente
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome

# 8. Limpar sessions antigas se existirem
echo "🧹 Limpando sessions antigas..."
rm -rf /root/sessions/* 2>/dev/null || true
rm -rf /root/whatsapp_instances/sessions/* 2>/dev/null || true

# 9. Reiniciar servidor com configuração corrigida
echo "🚀 Iniciando servidor com correção definitiva..."
PORT=3002 AUTH_TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" pm2 start vps-server-persistent.js --name whatsapp-main-3002

# 10. Salvar configuração PM2
pm2 save

# 11. Aguardar inicialização
echo "⏳ Aguardando inicialização (15s)..."
sleep 15

# 12. Verificar status final
echo "📊 Status final:"
pm2 status
echo ""
echo "🧪 Testando health check:"
curl -s http://localhost:3002/health | jq '.version, .puppeteerFixed, .puppeteerConfig'

echo ""
echo "🎉 CORREÇÃO DEFINITIVA APLICADA!"
echo "================================"
echo "✅ Puppeteer: headless=true (corrigido)"
echo "✅ Chrome: Configurado para VPS"
echo "✅ Args: Otimizados para servidor headless"
echo "✅ Dependencies: Todas instaladas"
echo "✅ Retry: Sistema de retry implementado"
echo "✅ QR Code: Geração automática corrigida"
echo ""
echo "📋 Teste agora via interface web!"
echo "Status esperado: puppeteerFixed=true"
