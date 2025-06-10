
#!/bin/bash

# DIAGNÓSTICO COMPLETO PUPPETEER VPS - Correção "Protocol error Session closed"
echo "🔍 DIAGNÓSTICO PUPPETEER VPS - Análise Profunda"
echo "=============================================="

VPS_IP="31.97.24.222"
PORTA="3002"

echo "📋 Configuração da VPS:"
echo "   IP: $VPS_IP"
echo "   Porta: $PORTA"
echo "   Data: $(date)"

# 1. IDENTIFICAR QUAL CHROMIUM/CHROME ESTÁ DISPONÍVEL
echo ""
echo "🔍 FASE 1: IDENTIFICANDO BINÁRIOS CHROME/CHROMIUM"
echo "================================================"

echo "📍 Verificando executáveis disponíveis:"

# Verificar Google Chrome
if command -v google-chrome &> /dev/null; then
    echo "   ✅ Google Chrome encontrado:"
    echo "      Caminho: $(which google-chrome)"
    echo "      Versão: $(google-chrome --version 2>/dev/null || echo 'Erro ao executar')"
    CHROME_PATH=$(which google-chrome)
    CHROME_AVAILABLE=true
else
    echo "   ❌ Google Chrome não encontrado"
    CHROME_AVAILABLE=false
fi

if command -v google-chrome-stable &> /dev/null; then
    echo "   ✅ Google Chrome Stable encontrado:"
    echo "      Caminho: $(which google-chrome-stable)"
    echo "      Versão: $(google-chrome-stable --version 2>/dev/null || echo 'Erro ao executar')"
    CHROME_STABLE_PATH=$(which google-chrome-stable)
    CHROME_STABLE_AVAILABLE=true
else
    echo "   ❌ Google Chrome Stable não encontrado"
    CHROME_STABLE_AVAILABLE=false
fi

# Verificar Chromium
if command -v chromium-browser &> /dev/null; then
    echo "   ✅ Chromium encontrado:"
    echo "      Caminho: $(which chromium-browser)"
    echo "      Versão: $(chromium-browser --version 2>/dev/null || echo 'Erro ao executar')"
    CHROMIUM_PATH=$(which chromium-browser)
    CHROMIUM_AVAILABLE=true
else
    echo "   ❌ Chromium não encontrado"
    CHROMIUM_AVAILABLE=false
fi

# 2. TESTAR PUPPETEER ATUAL
echo ""
echo "🧪 FASE 2: TESTANDO CONFIGURAÇÃO ATUAL DO PUPPETEER"
echo "=================================================="

# Criar arquivo de teste temporário
cat > /tmp/test-puppeteer-path.js << 'EOF'
const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log("📍 Caminho do Chromium que Puppeteer tentará usar:");
    console.log("   ", puppeteer.executablePath());
    
    console.log("\n🧪 Testando inicialização do Puppeteer...");
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      timeout: 10000
    });
    
    console.log("✅ Puppeteer iniciou com sucesso!");
    await browser.close();
    console.log("✅ Browser fechado com sucesso!");
    
  } catch (error) {
    console.error("❌ Erro no Puppeteer:", error.message);
    console.error("Stack trace:", error.stack);
  }
})();
EOF

echo "🔬 Executando teste do Puppeteer atual:"
cd /root
node /tmp/test-puppeteer-path.js

# 3. VERIFICAR LOGS DO SISTEMA
echo ""
echo "📜 FASE 3: VERIFICANDO LOGS DO SISTEMA"
echo "======================================"

echo "🔍 Verificando logs recentes do kernel (dmesg):"
dmesg | tail -10 | grep -i -E "(chrome|chromium|puppeteer|segfault|killed)" || echo "   ✅ Nenhum erro relacionado encontrado no dmesg"

echo ""
echo "🔍 Verificando logs do systemd (journalctl):"
journalctl -xe --no-pager | tail -20 | grep -i -E "(chrome|chromium|puppeteer|error|failed)" || echo "   ✅ Nenhum erro relacionado encontrado no journalctl"

# 4. TESTE COM DUMPIO
echo ""
echo "🔬 FASE 4: TESTE DETALHADO COM DUMPIO"
echo "===================================="

cat > /tmp/test-puppeteer-dumpio.js << 'EOF'
const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log("🧪 Testando Puppeteer com dumpio: true para logs detalhados...");
    
    const browser = await puppeteer.launch({
      headless: true,
      dumpio: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ],
      timeout: 15000
    });
    
    console.log("✅ Browser iniciado - testando página...");
    const page = await browser.newPage();
    await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded', timeout: 10000 });
    console.log("✅ Página carregada com sucesso!");
    
    await browser.close();
    console.log("✅ Teste completo bem-sucedido!");
    
  } catch (error) {
    console.error("❌ Erro detalhado:", error.message);
    console.error("❌ Stack completo:", error.stack);
  }
})();
EOF

echo "🔬 Executando teste com dumpio:"
cd /root
timeout 30s node /tmp/test-puppeteer-dumpio.js

# 5. GERAR RECOMENDAÇÕES
echo ""
echo "📊 FASE 5: RECOMENDAÇÕES BASEADAS NO DIAGNÓSTICO"
echo "==============================================="

echo "🎯 Executáveis encontrados:"
if [ "$CHROME_AVAILABLE" = true ]; then
    echo "   ✅ Google Chrome: $CHROME_PATH"
fi
if [ "$CHROME_STABLE_AVAILABLE" = true ]; then
    echo "   ✅ Google Chrome Stable: $CHROME_STABLE_PATH"
fi
if [ "$CHROMIUM_AVAILABLE" = true ]; then
    echo "   ✅ Chromium: $CHROMIUM_PATH"
fi

echo ""
echo "💡 Próximos passos recomendados:"
echo "   1. Analisar os logs de teste acima"
echo "   2. Se houver erro, aplicar a correção específica"
echo "   3. Atualizar configuração do servidor WhatsApp"
echo "   4. Testar criação de instância"

# Cleanup
rm -f /tmp/test-puppeteer-path.js /tmp/test-puppeteer-dumpio.js

echo ""
echo "✅ DIAGNÓSTICO CONCLUÍDO!"
echo "========================"
echo "Execute este script na VPS com: bash vps-puppeteer-diagnosis.sh"
