#!/bin/bash

# DIAGNÓSTICO ULTRA PROFUNDO PUPPETEER V4.0
echo "🔬 DIAGNÓSTICO ULTRA PROFUNDO PUPPETEER V4.0"
echo "============================================="

echo "📅 Data: $(date)"
echo "🎯 Objetivo: Encontrar a CAUSA EXATA do Protocol error"
echo ""

echo "🔍 FASE 1: DIAGNÓSTICO SISTEMA BASE"
echo "=================================="

echo "📋 Versões instaladas:"
echo "Node.js: $(node --version)"
echo "NPM: $(npm --version)"

echo ""
echo "📦 Verificando dependências críticas:"
cd /root
npm list whatsapp-web.js puppeteer express cors node-fetch 2>/dev/null || echo "❌ Algumas dependências ausentes"

echo ""
echo "🌐 FASE 2: DIAGNÓSTICO CHROME DETALHADO"
echo "======================================"

echo "📋 Procurando executáveis Chrome disponíveis:"
CHROME_PATHS=(
    "/usr/bin/google-chrome-stable"
    "/usr/bin/google-chrome"
    "/usr/bin/chromium-browser"
    "/usr/bin/chromium"
    "/snap/bin/chromium"
)

WORKING_CHROME=""
for chrome_path in "${CHROME_PATHS[@]}"; do
    echo "🔍 Testando: $chrome_path"
    if [ -f "$chrome_path" ]; then
        echo "   ✅ Arquivo existe"
        
        # Testar se executa
        if timeout 5s "$chrome_path" --version >/dev/null 2>&1; then
            version=$("$chrome_path" --version 2>/dev/null)
            echo "   ✅ Funcional: $version"
            
            # Testar se aceita args básicos
            if timeout 5s "$chrome_path" --no-sandbox --headless --disable-gpu --version >/dev/null 2>&1; then
                echo "   ✅ Aceita argumentos básicos"
                WORKING_CHROME="$chrome_path"
                break
            else
                echo "   ❌ Não aceita argumentos básicos"
            fi
        else
            echo "   ❌ Não executa"
        fi
    else
        echo "   ❌ Não existe"
    fi
done

if [ -n "$WORKING_CHROME" ]; then
    echo "🎯 CHROME FUNCIONANDO ENCONTRADO: $WORKING_CHROME"
else
    echo "❌ NENHUM CHROME FUNCIONANDO ENCONTRADO!"
fi

echo ""
echo "🧪 FASE 3: TESTE PUPPETEER ISOLADO"
echo "================================="

echo "📝 Criando teste isolado do Puppeteer..."
cat > /tmp/test-puppeteer-ultra-basic.js << 'EOF'
const puppeteer = require('puppeteer');

// CONFIGURAÇÃO ULTRA BÁSICA - SEM CONFLITOS
const ULTRA_BASIC_CONFIG = {
  headless: true,
  executablePath: process.env.CHROME_PATH || undefined,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox'
  ],
  timeout: 10000
};

(async () => {
  console.log('🧪 TESTE PUPPETEER ULTRA BÁSICO');
  console.log('Chrome path:', ULTRA_BASIC_CONFIG.executablePath || 'default');
  
  try {
    console.log('⚡ Iniciando browser...');
    const browser = await puppeteer.launch(ULTRA_BASIC_CONFIG);
    
    console.log('✅ Browser iniciado com sucesso!');
    
    console.log('📄 Criando página...');
    const page = await browser.newPage();
    
    console.log('✅ Página criada!');
    
    console.log('🌐 Navegando para página simples...');
    await page.goto('data:text/html,<h1>Test</h1>', { waitUntil: 'domcontentloaded' });
    
    console.log('✅ Navegação bem-sucedida!');
    
    await browser.close();
    console.log('✅ TESTE PUPPETEER ULTRA BÁSICO: SUCESSO TOTAL!');
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE BÁSICO:', error.message);
    console.error('Stack:', error.stack);
  }
})();
EOF

echo "🚀 Executando teste Puppeteer ultra básico..."
if [ -n "$WORKING_CHROME" ]; then
    CHROME_PATH="$WORKING_CHROME" node /tmp/test-puppeteer-ultra-basic.js
else
    node /tmp/test-puppeteer-ultra-basic.js
fi

echo ""
echo "🧪 FASE 4: TESTE PUPPETEER COM ARGS WHATSAPP"
echo "==========================================="

echo "📝 Criando teste com argumentos similares ao WhatsApp..."
cat > /tmp/test-puppeteer-whatsapp-args.js << 'EOF'
const puppeteer = require('puppeteer');

// CONFIGURAÇÃO SIMILAR AO WHATSAPP - PARA IDENTIFICAR CONFLITO
const WHATSAPP_LIKE_CONFIG = {
  headless: true,
  executablePath: process.env.CHROME_PATH || undefined,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--no-first-run',
    '--disable-extensions'
  ],
  timeout: 15000
};

(async () => {
  console.log('🧪 TESTE PUPPETEER ARGS WHATSAPP');
  console.log('Chrome path:', WHATSAPP_LIKE_CONFIG.executablePath || 'default');
  
  try {
    console.log('⚡ Iniciando browser com args WhatsApp...');
    const browser = await puppeteer.launch(WHATSAPP_LIKE_CONFIG);
    
    console.log('✅ Browser iniciado!');
    
    console.log('📄 Criando página...');
    const page = await browser.newPage();
    
    console.log('✅ Página criada!');
    
    // TESTE ESPECÍFICO: setUserAgent (causa do Protocol error)
    console.log('🔧 Testando setUserAgent...');
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36');
    
    console.log('✅ setUserAgent funcionou!');
    
    console.log('🌐 Navegando...');
    await page.goto('https://web.whatsapp.com', { 
      waitUntil: 'domcontentloaded',
      timeout: 20000 
    });
    
    console.log('✅ WhatsApp Web carregou!');
    
    await browser.close();
    console.log('✅ TESTE ARGS WHATSAPP: SUCESSO!');
    
  } catch (error) {
    console.error('❌ ERRO COM ARGS WHATSAPP:', error.message);
    if (error.message.includes('Protocol error')) {
      console.error('🎯 PROTOCOL ERROR DETECTADO - ESTE É O PROBLEMA!');
    }
    if (error.message.includes('Session closed')) {
      console.error('🎯 SESSION CLOSED DETECTADO - PROBLEMA CRÍTICO!');
    }
  }
})();
EOF

echo "🚀 Executando teste com args WhatsApp..."
if [ -n "$WORKING_CHROME" ]; then
    CHROME_PATH="$WORKING_CHROME" node /tmp/test-puppeteer-whatsapp-args.js
else
    node /tmp/test-puppeteer-whatsapp-args.js
fi

echo ""
echo "📊 FASE 5: ANÁLISE DE RECURSOS"
echo "============================"

echo "💾 Memória disponível:"
free -h

echo ""
echo "💽 Espaço em disco:"
df -h /

echo ""
echo "⚙️ Processos Chrome existentes:"
ps aux | grep -i chrome | grep -v grep || echo "✅ Nenhum processo Chrome ativo"

echo ""
echo "📋 FASE 6: VERIFICAÇÃO APPARMOR/SNAP"
echo "==================================="

echo "🛡️ Status AppArmor:"
if command -v aa-status &> /dev/null; then
    aa-status | head -5
else
    echo "✅ AppArmor não instalado"
fi

echo ""
echo "📦 Verificação Snap:"
if command -v snap &> /dev/null; then
    snap list | grep -i chrom || echo "✅ Nenhum Chrome via Snap"
else
    echo "✅ Snap não instalado"
fi

echo ""
echo "🏆 DIAGNÓSTICO ULTRA PROFUNDO V4.0 CONCLUÍDO!"
echo "============================================="

echo ""
echo "📋 ANÁLISE DOS RESULTADOS:"
echo "   1. Se teste básico funcionou + teste WhatsApp falhou = ARGS CONFLITANTES"
echo "   2. Se ambos falharam = PROBLEMA CHROME/SISTEMA"
echo "   3. Se Protocol error apareceu = INCOMPATIBILIDADE COM WHATSAPP-WEB.JS"
echo "   4. Se Session closed apareceu = PROBLEMA APPARMOR/SNAP"

echo ""
echo "📋 PRÓXIMO PASSO: Aplicar servidor v4.0 com configuração baseada nos resultados"
