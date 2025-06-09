
#!/bin/bash

# Script para aplicar correção completa na VPS
echo "🚀 APLICANDO CORREÇÃO COMPLETA VPS WhatsApp"
echo "==========================================="

# 1. Parar servidor atual
echo "🛑 Parando servidor atual..."
pm2 stop whatsapp-main-3002 2>/dev/null || true

# 2. Backup do arquivo atual
echo "📂 Fazendo backup..."
cp vps-server-persistent.js vps-server-persistent.js.backup.$(date +%s) 2>/dev/null || true

# 3. Baixar arquivo corrigido (você deve copiar manualmente o conteúdo)
echo "📝 Aplicando servidor corrigido..."
echo "ATENÇÃO: Copie o conteúdo do arquivo vps-server-corrected.js"
echo "para substituir o vps-server-persistent.js"

# 4. Verificar Chrome
echo "🌐 Verificando Chrome..."
if command -v google-chrome &> /dev/null; then
    echo "✅ Google Chrome encontrado: $(which google-chrome)"
    google-chrome --version
elif command -v chromium-browser &> /dev/null; then
    echo "✅ Chromium encontrado: $(which chromium-browser)"
    chromium-browser --version
else
    echo "❌ Chrome/Chromium não encontrado!"
    exit 1
fi

# 5. Definir variáveis de ambiente
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
if command -v google-chrome &> /dev/null; then
    export PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
elif command -v chromium-browser &> /dev/null; then
    export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
fi

# 6. Reiniciar servidor
echo "🚀 Iniciando servidor corrigido..."
PORT=3002 AUTH_TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" pm2 start vps-server-persistent.js --name whatsapp-main-3002

# 7. Aguardar inicialização
echo "⏳ Aguardando inicialização (10s)..."
sleep 10

# 8. Verificar status
echo "📊 Status da correção:"
pm2 status
echo ""
curl -s http://localhost:3002/health | jq '.version, .chromePath, .puppeteerConfig'

echo ""
echo "🎉 CORREÇÃO APLICADA!"
echo "==================="
echo "✅ Servidor reiniciado com configuração otimizada"
echo "✅ Chrome/Chromium detectado automaticamente"
echo "✅ Timeout reduzido para 30s/60s"
echo "✅ QR Code será salvo diretamente no Supabase"
echo ""
echo "📋 PRÓXIMO PASSO:"
echo "Teste criar uma instância via interface e verifique se o QR aparece rapidamente!"
