
#!/bin/bash

# INSTALAÇÃO LIMPA VPS - AMBIENTE OTIMIZADO
echo "🚀 INSTALAÇÃO LIMPA VPS - AMBIENTE OTIMIZADO"
echo "==========================================="
echo "📅 Data: $(date)"
echo "🎯 Objetivo: Instalar ambiente limpo e funcional"
echo ""

# Função de log
log_install() {
    echo "[$(date '+%H:%M:%S')] 🚀 $1"
}

log_success() {
    echo "[$(date '+%H:%M:%S')] ✅ $1"
}

log_error() {
    echo "[$(date '+%H:%M:%S')] ❌ $1"
}

log_test() {
    echo "[$(date '+%H:%M:%S')] 🧪 $1"
}

# FASE 1: ATUALIZAÇÃO DO SISTEMA
echo ""
echo "🔄 FASE 1: ATUALIZAÇÃO DO SISTEMA"
echo "==============================="

log_install "Atualizando sistema operacional..."
apt-get update -y
apt-get upgrade -y

log_install "Instalando dependências básicas..."
apt-get install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates build-essential

log_success "Sistema atualizado"

# FASE 2: INSTALAÇÃO NODE.JS LTS
echo ""
echo "🟢 FASE 2: INSTALAÇÃO NODE.JS LTS"
echo "==============================="

log_install "Instalando Node.js LTS (versão 18)..."

# Instalar NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -

# Instalar Node.js
apt-get install -y nodejs

# Verificar instalação
if command -v node &> /dev/null; then
    node_version=$(node --version)
    npm_version=$(npm --version)
    log_success "Node.js instalado: $node_version"
    log_success "NPM instalado: v$npm_version"
else
    log_error "Falha na instalação do Node.js"
    exit 1
fi

# Configurar npm para root
npm config set unsafe-perm true

log_success "Node.js configurado"

# FASE 3: INSTALAÇÃO GOOGLE CHROME
echo ""
echo "🌐 FASE 3: INSTALAÇÃO GOOGLE CHROME"
echo "=================================="

log_install "Instalando Google Chrome Stable..."

# Adicionar chave e repositório
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list

# Atualizar e instalar
apt-get update -y
apt-get install -y google-chrome-stable

# Instalar dependências adicionais
apt-get install -y libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxss1 libasound2

# Verificar instalação
if command -v google-chrome-stable &> /dev/null; then
    chrome_version=$(google-chrome-stable --version)
    log_success "Chrome instalado: $chrome_version"
    CHROME_PATH="/usr/bin/google-chrome-stable"
else
    log_error "Falha na instalação do Chrome"
    exit 1
fi

log_success "Chrome configurado"

# FASE 4: TESTE CHROME HEADLESS
echo ""
echo "🧪 FASE 4: TESTE CHROME HEADLESS"
echo "==============================="

log_test "Testando Chrome headless..."

# Teste básico
if timeout 10s $CHROME_PATH --headless --no-sandbox --disable-gpu --dump-dom "data:text/html,<h1>Test</h1>" >/dev/null 2>&1; then
    log_success "Chrome headless funciona corretamente"
else
    log_error "Chrome headless falhou"
    exit 1
fi

log_success "Chrome validado"

# FASE 5: INSTALAÇÃO PM2
echo ""
echo "⚙️ FASE 5: INSTALAÇÃO PM2"
echo "======================="

log_install "Instalando PM2 globalmente..."

npm install -g pm2

# Verificar instalação
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

log_success "PM2 configurado"

# FASE 6: CRIAÇÃO DO AMBIENTE WHATSAPP
echo ""
echo "📦 FASE 6: CRIAÇÃO DO AMBIENTE WHATSAPP"
echo "======================================"

log_install "Criando ambiente WhatsApp original..."

# Criar diretório principal
mkdir -p /root/whatsapp-original
cd /root/whatsapp-original

# Inicializar projeto
npm init -y

# Instalar dependências específicas
log_install "Instalando dependências WhatsApp..."
npm install whatsapp-web.js@1.30.0
npm install express@4.19.2 cors@2.8.5 qrcode@1.5.4

# Verificar instalações
if [ -d "node_modules/whatsapp-web.js" ]; then
    log_success "whatsapp-web.js instalado"
else
    log_error "whatsapp-web.js não foi instalado"
    exit 1
fi

# Criar diretórios necessários
mkdir -p sessions
mkdir -p backups
mkdir -p logs

log_success "Ambiente WhatsApp criado"

# FASE 7: CONFIGURAÇÃO DE VARIÁVEIS
echo ""
echo "🌍 FASE 7: CONFIGURAÇÃO DE VARIÁVEIS"
echo "=================================="

log_install "Configurando variáveis de ambiente..."

# Configurar variáveis
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH="$CHROME_PATH"
export NODE_ENV=production

# Adicionar ao bashrc
echo "" >> ~/.bashrc
echo "# WhatsApp Original Environment" >> ~/.bashrc
echo "export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true" >> ~/.bashrc
echo "export PUPPETEER_EXECUTABLE_PATH=\"$CHROME_PATH\"" >> ~/.bashrc
echo "export NODE_ENV=production" >> ~/.bashrc

log_success "Variáveis configuradas"

# FASE 8: TESTE DE INTEGRAÇÃO
echo ""
echo "🧪 FASE 8: TESTE DE INTEGRAÇÃO"
echo "============================"

log_test "Testando integração Puppeteer + Chrome..."

# Criar teste de integração
cat > test-integration.js << 'EOF'
const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log('🧪 Testando Puppeteer com Chrome...');
    
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      timeout: 10000
    });
    
    const page = await browser.newPage();
    await page.goto('data:text/html,<h1>Teste OK</h1>');
    const title = await page.title();
    
    await browser.close();
    console.log('✅ INTEGRAÇÃO FUNCIONANDO!');
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    process.exit(1);
  }
})();
EOF

# Executar teste
if node test-integration.js; then
    log_success "INTEGRAÇÃO FUNCIONANDO!"
else
    log_error "Falha na integração"
    exit 1
fi

# Limpeza
rm test-integration.js

log_success "Integração validada"

# RESUMO DA INSTALAÇÃO
echo ""
echo "🎉 INSTALAÇÃO LIMPA CONCLUÍDA!"
echo "============================="

echo "✅ AMBIENTE LIMPO INSTALADO:"
echo "   ✅ Sistema: Atualizado"
echo "   ✅ Node.js: $node_version"
echo "   ✅ NPM: v$npm_version"
echo "   ✅ Chrome: $chrome_version"
echo "   ✅ PM2: v$pm2_version"
echo "   ✅ WhatsApp-web.js: v1.30.0"
echo "   ✅ Integração: TESTADA E FUNCIONANDO"

echo ""
echo "🔧 CONFIGURAÇÃO:"
echo "   📁 Diretório: /root/whatsapp-original"
echo "   🌐 Chrome: $CHROME_PATH"
echo "   📦 Dependências: Instaladas e testadas"

echo ""
echo "🚀 PRÓXIMO PASSO:"
echo "   Execute: bash vps-original-server.sh"
echo "   (Implementar servidor WhatsApp original)"

log_success "INSTALAÇÃO LIMPA FINALIZADA COM SUCESSO!"
