
#!/bin/bash

# PLANO DE CORREÇÃO DEFINITIVA VPS - EXECUÇÃO COMPLETA
echo "🚀 PLANO DE CORREÇÃO DEFINITIVA VPS"
echo "=================================="

VPS_IP="31.97.24.222"
PORTA="3002"

echo "📋 VPS: $VPS_IP:$PORTA"
echo "📅 Data: $(date)"
echo ""

echo "🧹 FASE 1: LIMPEZA TOTAL DA VPS"
echo "==============================="

echo "1.1 Parando todos os processos PM2..."
pm2 stop all
pm2 delete all
pm2 save

echo "1.2 Verificando processos na porta 3002..."
lsof -i :3002 | grep LISTEN && echo "⚠️ Processo ainda rodando na porta 3002" || echo "✅ Porta 3002 livre"

echo "1.3 Removendo arquivo corrompido..."
if [ -f "vps-server-persistent.js" ]; then
    mv vps-server-persistent.js vps-server-persistent.js.corrupted.$(date +%Y%m%d_%H%M%S)
    echo "✅ Arquivo corrompido movido para backup"
else
    echo "✅ Arquivo não encontrado"
fi

echo "1.4 Limpando sessões Puppeteer corrompidas..."
rm -rf ./.wwebjs_auth 2>/dev/null || echo "✅ Sem sessões antigas"
rm -rf ./whatsapp_instances 2>/dev/null || echo "✅ Sem instâncias antigas"

echo "1.5 Limpando cache Chrome/Chromium..."
rm -rf ~/.cache/google-chrome/* 2>/dev/null || echo "✅ Cache Chrome limpo"
rm -rf ~/.cache/chromium/* 2>/dev/null || echo "✅ Cache Chromium limpo"

echo ""
echo "🔧 FASE 2: INSTALAÇÃO DE DEPENDÊNCIAS"
echo "====================================="

echo "2.1 Verificando Node.js..."
node --version

echo "2.2 Reinstalando dependências..."
npm init -y 2>/dev/null || echo "✅ package.json já existe"
npm install --force whatsapp-web.js puppeteer express cors node-fetch

echo "2.3 Verificando Chrome/Chromium..."
if command -v google-chrome-stable &> /dev/null; then
    echo "✅ Google Chrome Stable encontrado: $(which google-chrome-stable)"
    CHROME_PATH=$(which google-chrome-stable)
elif command -v google-chrome &> /dev/null; then
    echo "✅ Google Chrome encontrado: $(which google-chrome)"
    CHROME_PATH=$(which google-chrome)
elif command -v chromium-browser &> /dev/null; then
    echo "✅ Chromium encontrado: $(which chromium-browser)"
    CHROME_PATH=$(which chromium-browser)
else
    echo "❌ Nenhum Chrome/Chromium encontrado!"
    CHROME_PATH=""
fi

echo ""
echo "📝 FASE 3: APLICANDO SERVIDOR CORRIGIDO"
echo "======================================"

echo "⚠️ IMPORTANTE: Agora você deve copiar o conteúdo do arquivo:"
echo "   src/utils/vps-server-definitive-fixed.js"
echo "   e salvar como /root/vps-server-persistent.js"
echo ""

echo "📋 COMANDOS FINAIS APÓS APLICAR O ARQUIVO:"
echo "   1. pm2 start vps-server-persistent.js --name whatsapp-main-3002"
echo "   2. pm2 logs whatsapp-main-3002 --lines 20"
echo "   3. pm2 save"
echo ""

echo "✅ FASE 1 e 2 DA CORREÇÃO DEFINITIVA CONCLUÍDAS!"
echo "==============================================="
echo "🎯 Próximo passo: Aplicar o arquivo servidor corrigido"
