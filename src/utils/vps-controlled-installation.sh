
#!/bin/bash

# INSTALAÇÃO CONTROLADA VPS - AMBIENTE OTIMIZADO
echo "🚀 INSTALAÇÃO CONTROLADA VPS - AMBIENTE OTIMIZADO"
echo "================================================"
echo "📅 Data: $(date)"
echo "🎯 Objetivo: Instalar ambiente limpo e funcional"
echo ""

# Função de log
log_install() {
    echo "[$(date '+%H:%M:%S')] 🚀 $1"
}

log_test() {
    echo "[$(date '+%H:%M:%S')] 🧪 $1"
}

log_success() {
    echo "[$(date '+%H:%M:%S')] ✅ $1"
}

log_error() {
    echo "[$(date '+%H:%M:%S')] ❌ $1"
}

# FASE 1: ATUALIZAÇÃO DO SISTEMA
echo ""
echo "🔄 FASE 1: ATUALIZAÇÃO DO SISTEMA"
echo "==============================="

log_install "Atualizando repositórios do sistema..."
apt-get update -y

log_install "Instalando dependências básicas..."
apt-get install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates

# FASE 2: INSTALAÇÃO CONTROLADA DO CHROME
echo ""
echo "🌐 FASE 2: INSTALAÇÃO CONTROLADA DO CHROME"
echo "========================================"

log_install "Instalando Google Chrome Stable (versão específica)..."

# Adicionar repositório oficial do Google
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list

# Atualizar e instalar
apt-get update -y
apt-get install -y google-chrome-stable

# Verificar instalação
if command -v google-chrome-stable &> /dev/null; then
    chrome_version=$(google-chrome-stable --version)
    log_success "Chrome instalado: $chrome_version"
    CHROME_PATH="/usr/bin/google-chrome-stable"
else
    log_error "Falha na instalação do Chrome"
    exit 1
fi

# Instalar dependências adicionais do Chrome
log_install "Instalando dependências do Chrome..."
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
    libasound2

# FASE 3: TESTE BÁSICO DO CHROME
echo ""
echo "🧪 FASE 3: TESTE BÁSICO DO CHROME"
echo "==============================="

log_test "Testando Chrome headless..."

# Teste 1: Versão
if $CHROME_PATH --version >/dev/null 2>&1; then
    log_success "Chrome responde ao comando --version"
else
    log_error "Chrome não responde ao comando --version"
    exit 1
fi

# Teste 2: Headless básico
log_test "Testando Chrome headless com flags básicas..."
if timeout 15s $CHROME_PATH --headless --no-sandbox --disable-gpu --dump-dom "data:text/html,<h1>Test</h1>" >/dev/null 2>&1; then
    log_success "Chrome headless funciona corretamente"
else
    log_error "Chrome headless falhou no teste básico"
    
    # Diagnóstico adicional
    echo "📋 Diagnóstico Chrome:"
    ldd $CHROME_PATH | grep "not found" || echo "   ✅ Todas dependências encontradas"
    
    # Tentar com mais flags
    log_test "Tentando com flags adicionais..."
    if timeout 15s $CHROME_PATH --headless --no-sandbox --disable-gpu --disable-dev-shm-usage --single-process --dump-dom "data:text/html,<h1>Test</h1>" >/dev/null 2>&1; then
        log_success "Chrome funciona com flags adicionais"
    else
        log_error "Chrome falhou mesmo com flags adicionais"
        exit 1
    fi
fi

# FASE 4: INSTALAÇÃO CONTROLADA DO NODE.JS
echo ""
echo "🟢 FASE 4: INSTALAÇÃO CONTROLADA DO NODE.JS"
echo "=========================================="

log_install "Instalando Node.js LTS (versão específica)..."

# Instalar NodeSource repository (versão LTS estável)
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -

# Instalar Node.js
apt-get install -y nodejs

# Verificar instalação
if command -v node &> /dev/null; then
    node_version=$(node --version)
    npm_version=$(npm --version)
    log_success "Node.js instalado: $node_version"
    log_success "NPM instalado: $npm_version"
else
    log_error "Falha na instalação do Node.js"
    exit 1
fi

# Configurar npm para root
npm config set unsafe-perm true

# FASE 5: INSTALAÇÃO CONTROLADA PM2
echo ""
echo "⚙️ FASE 5: INSTALAÇÃO CONTROLADA PM2"
echo "=================================="

log_install "Instalando PM2 (Process Manager)..."

npm install -g pm2

if command -v pm2 &> /dev/null; then
    pm2_version=$(pm2 --version)
    log_success "PM2 instalado: v$pm2_version"
    
    # Configurar PM2
    pm2 startup
    pm2 save
else
    log_error "Falha na instalação do PM2"
    exit 1
fi

# FASE 6: INSTALAÇÃO CONTROLADA DAS DEPENDÊNCIAS WHATSAPP
echo ""
echo "📦 FASE 6: INSTALAÇÃO CONTROLADA DEPENDÊNCIAS WHATSAPP"
echo "===================================================="

log_install "Criando projeto WhatsApp com dependências específicas..."

# Criar diretório de trabalho limpo
mkdir -p /root/whatsapp-optimized
cd /root/whatsapp-optimized

# Inicializar projeto
npm init -y

# Instalar dependências específicas com versões testadas
log_install "Instalando whatsapp-web.js (versão específica)..."
npm install whatsapp-web.js@1.30.0

log_install "Instalando puppeteer (versão específica compatível)..."
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm install puppeteer@21.11.0

log_install "Instalando dependências do servidor..."
npm install express@4.19.2 cors@2.8.5 qrcode@1.5.4

# Verificar instalações
if [ -d "node_modules/whatsapp-web.js" ]; then
    log_success "whatsapp-web.js instalado"
else
    log_error "whatsapp-web.js não foi instalado"
    exit 1
fi

if [ -d "node_modules/puppeteer" ]; then
    log_success "puppeteer instalado"
else
    log_error "puppeteer não foi instalado"
    exit 1
fi

# FASE 7: CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE
echo ""
echo "🌍 FASE 7: CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE"
echo "=============================================="

log_install "Configurando variáveis de ambiente otimizadas..."

# Configurar variáveis para Puppeteer
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH="$CHROME_PATH"
export NODE_ENV=production

# Adicionar ao bashrc para persistência
echo "# WhatsApp Optimized Environment" >> ~/.bashrc
echo "export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true" >> ~/.bashrc
echo "export PUPPETEER_EXECUTABLE_PATH=\"$CHROME_PATH\"" >> ~/.bashrc
echo "export NODE_ENV=production" >> ~/.bashrc

log_success "Variáveis de ambiente configuradas"

# FASE 8: TESTE DE INTEGRAÇÃO
echo ""
echo "🧪 FASE 8: TESTE DE INTEGRAÇÃO"
echo "============================"

log_test "Testando integração Puppeteer + Chrome..."

# Criar teste básico de Puppeteer
cat > test-integration.js << 'EOF'
const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log('🧪 Testando Puppeteer com Chrome instalado...');
    
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ],
      timeout: 15000
    });
    
    console.log('✅ Browser lançado com sucesso!');
    
    const page = await browser.newPage();
    console.log('✅ Página criada!');
    
    await page.goto('data:text/html,<h1>Teste Integração</h1>');
    console.log('✅ Navegação funcionou!');
    
    const title = await page.title();
    console.log('✅ Título obtido:', title);
    
    await browser.close();
    console.log('✅ TESTE DE INTEGRAÇÃO: SUCESSO TOTAL!');
    
  } catch (error) {
    console.error('❌ ERRO na integração:', error.message);
    process.exit(1);
  }
})();
EOF

# Executar teste
log_test "Executando teste de integração..."
if node test-integration.js; then
    log_success "INTEGRAÇÃO PUPPETEER + CHROME: FUNCIONANDO!"
else
    log_error "FALHA na integração Puppeteer + Chrome"
    exit 1
fi

# Limpeza
rm test-integration.js

# FASE 9: CRIAÇÃO DE DIRETÓRIOS OTIMIZADOS
echo ""
echo "📁 FASE 9: CRIAÇÃO DE DIRETÓRIOS OTIMIZADOS"
echo "========================================"

log_install "Criando estrutura de diretórios..."

# Criar diretórios necessários
mkdir -p /root/whatsapp-optimized/sessions
mkdir -p /root/whatsapp-optimized/logs
chmod 755 /root/whatsapp-optimized/sessions
chmod 755 /root/whatsapp-optimized/logs

log_success "Estrutura de diretórios criada"

# RESUMO DA INSTALAÇÃO
echo ""
echo "🎉 INSTALAÇÃO CONTROLADA CONCLUÍDA!"
echo "=================================="

echo "✅ AMBIENTE OTIMIZADO INSTALADO:"
echo "   ✅ Sistema: Atualizado"
echo "   ✅ Chrome: $chrome_version"
echo "   ✅ Node.js: $node_version"
echo "   ✅ NPM: $npm_version"
echo "   ✅ PM2: v$pm2_version"
echo "   ✅ WhatsApp-web.js: v1.30.0"
echo "   ✅ Puppeteer: v21.11.0 (sem Chromium próprio)"
echo "   ✅ Integração: TESTADA E FUNCIONANDO"

echo ""
echo "🔧 CONFIGURAÇÃO:"
echo "   📁 Diretório: /root/whatsapp-optimized"
echo "   🌐 Chrome: $CHROME_PATH"
echo "   📦 Dependências: Instaladas e testadas"
echo "   🧪 Integração: Validada"

echo ""
echo "🚀 PRÓXIMO PASSO:"
echo "   Execute: bash vps-optimized-server.sh"
echo "   (Implementar servidor otimizado)"

log_success "INSTALAÇÃO CONTROLADA FINALIZADA COM SUCESSO!"
