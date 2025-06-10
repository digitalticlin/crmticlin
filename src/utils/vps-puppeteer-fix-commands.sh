
#!/bin/bash

# CORREÇÃO PUPPETEER VPS - Comandos para executar na VPS
echo "🔧 APLICANDO CORREÇÃO PUPPETEER VPS"
echo "================================="

echo "📍 VPS: 31.97.24.222:3002"
echo "📅 Data: $(date)"

echo ""
echo "🚀 FASE 1: PREPARAÇÃO DO AMBIENTE"
echo "================================"

echo "📂 Navegando para diretório do projeto..."
cd /root

echo "📦 Verificando se node_modules existe..."
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules não encontrado - instalando dependências..."
    npm init -y 2>/dev/null || echo "package.json já existe"
    npm install whatsapp-web.js puppeteer express cors node-fetch
else
    echo "✅ node_modules encontrado"
fi

echo "📋 Verificando versões instaladas..."
echo "Node.js: $(node --version)"
echo "NPM: $(npm --version)"

echo ""
echo "🚀 FASE 2: APLICAÇÃO DO ARQUIVO CORRIGIDO"
echo "======================================="

echo "💾 Fazendo backup do arquivo atual (se existir)..."
if [ -f "vps-server-persistent.js" ]; then
    cp vps-server-persistent.js vps-server-persistent.js.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup criado"
else
    echo "⚠️ Arquivo não encontrado - será criado novo"
fi

echo "📝 Aplicando arquivo corrigido..."
echo "⚠️ ATENÇÃO: Copie o conteúdo do arquivo src/utils/vps-server-persistent.js"
echo "   e salve como /root/vps-server-persistent.js na VPS"

echo ""
echo "🚀 FASE 3: TESTE DA CONFIGURAÇÃO PUPPETEER"
echo "========================================"

echo "🧪 Criando teste específico para a correção..."
cat > /tmp/test-puppeteer-corrected.js << 'EOF'
const puppeteer = require('puppeteer');

// Configuração corrigida idêntica ao servidor
const PUPPETEER_CONFIG_CORRECTED = {
  headless: true,
  executablePath: '/usr/bin/google-chrome-stable',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--single-process',
    '--disable-gpu',
    '--disable-features=VizDisplayCompositor',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-ipc-flooding-protection',
    '--disable-extensions',
    '--disable-default-apps',
    '--disable-sync',
    '--disable-translate',
    '--disable-plugins',
    '--disable-web-security',
    '--memory-pressure-off',
    '--max_old_space_size=512',
    '--disable-web-gl',
    '--disable-webgl',
    '--disable-threaded-animation',
    '--disable-threaded-scrolling',
    '--hide-scrollbars',
    '--mute-audio',
    '--disable-logging',
    '--disable-blink-features=AutomationControlled',
    '--disable-client-side-phishing-detection',
    '--disable-component-extensions-with-background-pages',
    '--disable-hang-monitor',
    '--disable-prompt-on-repost',
    '--metrics-recording-only',
    '--no-default-browser-check',
    '--password-store=basic',
    '--use-mock-keychain',
    '--disable-namespace-sandbox',
    '--disable-seccomp-filter-sandbox'
  ],
  ignoreHTTPSErrors: true,
  ignoreDefaultArgs: ['--disable-extensions'],
  timeout: 25000,
  dumpio: false
};

(async () => {
  try {
    console.log("🔧 TESTE CORREÇÃO PUPPETEER:");
    console.log("   Executável:", PUPPETEER_CONFIG_CORRECTED.executablePath);
    console.log("   Args:", PUPPETEER_CONFIG_CORRECTED.args.length, "argumentos");
    
    console.log("\n🧪 Testando inicialização com configuração corrigida...");
    const browser = await puppeteer.launch(PUPPETEER_CONFIG_CORRECTED);
    
    console.log("✅ SUCESSO: Puppeteer iniciou com configuração corrigida!");
    
    const page = await browser.newPage();
    await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded', timeout: 10000 });
    console.log("✅ SUCESSO: Página carregada com sucesso!");
    
    await browser.close();
    console.log("✅ SUCESSO: Browser fechado com sucesso!");
    
    console.log("\n🎉 CORREÇÃO PUPPETEER APLICADA COM SUCESSO!");
    console.log("   ✅ Chrome Stable funcional");
    console.log("   ✅ AppArmor bypass configurado");
    console.log("   ✅ Argumentos otimizados aplicados");
    
  } catch (error) {
    console.error("❌ ERRO NA CORREÇÃO:", error.message);
    console.error("Stack:", error.stack);
  }
})();
EOF

echo "🔬 Executando teste da correção..."
node /tmp/test-puppeteer-corrected.js

echo ""
echo "🚀 FASE 4: COMANDOS FINAIS"
echo "========================"

echo "📋 COMANDOS PARA EXECUTAR APÓS APLICAR O ARQUIVO:"
echo "   1. pm2 stop whatsapp-main-3002"
echo "   2. pm2 delete whatsapp-main-3002"
echo "   3. pm2 start vps-server-persistent.js --name whatsapp-main-3002"
echo "   4. pm2 logs whatsapp-main-3002 --lines 20"
echo "   5. pm2 save"

echo ""
echo "✅ CORREÇÃO PUPPETEER PREPARADA!"
echo "==============================="
EOF
