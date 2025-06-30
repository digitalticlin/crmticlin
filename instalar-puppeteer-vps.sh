#!/bin/bash

echo "🎭 INSTALAÇÃO COMPLETA DO SISTEMA PUPPETEER VPS"
echo "=============================================="
echo ""

# Definir cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se é root
if [[ $EUID -eq 0 ]]; then
   log_error "Este script não deve ser executado como root. Use um usuário comum com sudo."
   exit 1
fi

log_info "Iniciando instalação do sistema Puppeteer..."

# 1. ATUALIZAR SISTEMA
log_info "1. Atualizando sistema..."
sudo apt update && sudo apt upgrade -y
if [ $? -eq 0 ]; then
    log_success "Sistema atualizado"
else
    log_error "Falha ao atualizar sistema"
    exit 1
fi

# 2. INSTALAR DEPENDÊNCIAS BÁSICAS
log_info "2. Instalando dependências básicas..."
sudo apt install -y curl wget gnupg lsb-release software-properties-common build-essential
if [ $? -eq 0 ]; then
    log_success "Dependências básicas instaladas"
else
    log_error "Falha ao instalar dependências básicas"
    exit 1
fi

# 3. INSTALAR NODE.JS 18
log_info "3. Instalando Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
if [ $? -eq 0 ]; then
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    log_success "Node.js instalado: $NODE_VERSION"
    log_success "NPM instalado: $NPM_VERSION"
else
    log_error "Falha ao instalar Node.js"
    exit 1
fi

# 4. INSTALAR GOOGLE CHROME
log_info "4. Instalando Google Chrome..."
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt update
sudo apt install -y google-chrome-stable
if [ $? -eq 0 ]; then
    CHROME_VERSION=$(google-chrome --version)
    log_success "Google Chrome instalado: $CHROME_VERSION"
else
    log_error "Falha ao instalar Google Chrome"
    exit 1
fi

# 5. INSTALAR DEPENDÊNCIAS DO PUPPETEER (CORRIGIDAS)
log_info "5. Instalando dependências do Puppeteer..."
sudo apt install -y \
    ca-certificates \
    fonts-liberation \
    libasound2t64 \
    libatk-bridge2.0-0t64 \
    libatk1.0-0t64 \
    libc6 \
    libcairo2 \
    libcups2t64 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc-s1 \
    libglib2.0-0t64 \
    libgtk-3-0t64 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils

if [ $? -eq 0 ]; then
    log_success "Dependências do Puppeteer instaladas"
else
    log_warning "Algumas dependências podem ter falhado, mas continuando..."
fi

# 6. INSTALAR XVFB PARA HEADLESS
log_info "6. Instalando Xvfb para modo headless..."
sudo apt install -y xvfb
if [ $? -eq 0 ]; then
    log_success "Xvfb instalado"
else
    log_error "Falha ao instalar Xvfb"
    exit 1
fi

# 7. CRIAR DIRETÓRIO DO PROJETO
log_info "7. Criando diretório do projeto..."
PROJECT_DIR="/opt/whatsapp-puppeteer"
sudo mkdir -p $PROJECT_DIR
sudo chown $USER:$USER $PROJECT_DIR
cd $PROJECT_DIR
log_success "Diretório criado: $PROJECT_DIR"

# 8. INSTALAR DEPENDÊNCIAS NPM
log_info "8. Instalando dependências NPM..."
npm init -y
npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth express cors fs-extra dotenv
if [ $? -eq 0 ]; then
    log_success "Dependências NPM instaladas"
else
    log_error "Falha ao instalar dependências NPM"
    exit 1
fi

# 9. CRIAR ARQUIVO DO SERVIDOR
log_info "9. Criando arquivo do servidor..."
cat > server.js << 'EOF'
const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Configurações
const SUPABASE_WEBHOOK_URL = process.env.SUPABASE_WEBHOOK_URL || 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/whatsapp_chat_import';
const VPS_AUTH_TOKEN = process.env.VPS_PUPPETEER_TOKEN || 'puppeteer-token-2024';

// Armazenamento de sessões ativas
const activeSessions = new Map();

console.log('🎭 VPS Puppeteer Server Iniciando...');
console.log(`📡 Webhook URL: ${SUPABASE_WEBHOOK_URL}`);
console.log(`🔑 Auth Token: ${VPS_AUTH_TOKEN.substring(0, 8)}...`);

// Middleware de autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || token !== VPS_AUTH_TOKEN) {
    return res.status(401).json({ success: false, error: 'Token inválido' });
  }

  next();
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'running',
    activeSessions: activeSessions.size,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🎭 VPS Puppeteer Server rodando na porta ${PORT}`);
  console.log(`📡 Webhook configurado para: ${SUPABASE_WEBHOOK_URL}`);
  console.log(`🔑 Autenticação: Bearer ${VPS_AUTH_TOKEN.substring(0, 8)}...`);
  console.log('✅ Servidor pronto para receber requisições!');
});

// Cleanup ao encerrar
process.on('SIGINT', async () => {
  console.log('🛑 Encerrando servidor...');
  process.exit(0);
});
EOF

log_success "Arquivo do servidor criado"

# 10. CRIAR ARQUIVO .ENV
log_info "10. Criando arquivo de configuração..."
cat > .env << 'EOF'
# Configurações do Puppeteer
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Configurações do servidor
PORT=3001
NODE_ENV=production

# Token de autenticação
VPS_PUPPETEER_TOKEN=puppeteer-token-2024

# URL do webhook Supabase
SUPABASE_WEBHOOK_URL=https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/whatsapp_chat_import
EOF

log_success "Arquivo .env criado"

# 11. TESTAR PUPPETEER
log_info "11. Testando instalação do Puppeteer..."
cat > test-puppeteer.js << 'EOF'
const puppeteer = require('puppeteer');

async function testPuppeteer() {
  console.log('🧪 Testando Puppeteer...');
  
  try {
    const browser = await puppeteer.launch({
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
        '--disable-gpu'
      ]
    });
    
    console.log('✅ Browser iniciado com sucesso!');
    
    const page = await browser.newPage();
    await page.goto('https://web.whatsapp.com');
    
    console.log('✅ WhatsApp Web carregado!');
    
    await browser.close();
    console.log('✅ Teste concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  }
}

testPuppeteer();
EOF

node test-puppeteer.js
if [ $? -eq 0 ]; then
    log_success "Teste do Puppeteer passou"
else
    log_error "Teste do Puppeteer falhou"
fi

# 12. CRIAR SCRIPT DE START
log_info "12. Criando script de inicialização..."
cat > start.sh << 'EOF'
#!/bin/bash
cd /opt/whatsapp-puppeteer
echo "🚀 Iniciando VPS Puppeteer Server..."
node server.js
EOF

chmod +x start.sh
log_success "Script de inicialização criado"

# 13. CRIAR SYSTEMD SERVICE
log_info "13. Criando serviço systemd..."
sudo tee /etc/systemd/system/whatsapp-puppeteer.service > /dev/null << EOF
[Unit]
Description=WhatsApp Puppeteer Import Service
After=network.target

[Service]
Type=simple
User=$USER
Group=$USER
WorkingDirectory=$PROJECT_DIR
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable whatsapp-puppeteer
log_success "Serviço systemd criado e habilitado"

# 14. DEFINIR PERMISSÕES
log_info "14. Configurando permissões..."
sudo chown -R $USER:$USER $PROJECT_DIR
chmod -R 755 $PROJECT_DIR
log_success "Permissões configuradas"

# 15. VERIFICAÇÕES FINAIS
log_info "15. Executando verificações finais..."

# Verificar Chrome
if google-chrome --headless --disable-gpu --dump-dom https://www.google.com > /dev/null 2>&1; then
    log_success "Chrome funcionando corretamente"
else
    log_warning "Chrome pode ter problemas"
fi

# Verificar Node.js
NODE_VERSION=$(node --version)
log_success "Node.js: $NODE_VERSION"

# Verificar dependências NPM
if npm list puppeteer > /dev/null 2>&1; then
    log_success "Puppeteer instalado corretamente"
else
    log_warning "Puppeteer pode ter problemas"
fi

# Verificar espaço em disco
DISK_USAGE=$(df -h / | awk 'NR==2{print $5}')
log_info "Uso do disco: $DISK_USAGE"

# Verificar memória
MEMORY_TOTAL=$(free -h | awk 'NR==2{print $2}')
MEMORY_AVAILABLE=$(free -h | awk 'NR==2{print $7}')
log_info "Memória total: $MEMORY_TOTAL, Disponível: $MEMORY_AVAILABLE"

echo ""
echo "🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
echo "===================================="
echo ""
log_success "Servidor instalado em: $PROJECT_DIR"
log_success "Porta configurada: 3001"
log_success "Token de auth: puppeteer-token-2024"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Iniciar o serviço: sudo systemctl start whatsapp-puppeteer"
echo "2. Verificar status: sudo systemctl status whatsapp-puppeteer"
echo "3. Ver logs: sudo journalctl -u whatsapp-puppeteer -f"
echo "4. Testar endpoint: curl http://localhost:3001/health"
echo ""
echo "🔧 COMANDOS ÚTEIS:"
echo "- Reiniciar: sudo systemctl restart whatsapp-puppeteer"
echo "- Parar: sudo systemctl stop whatsapp-puppeteer"
echo "- Logs: sudo journalctl -u whatsapp-puppeteer --since today"
echo ""
echo "✅ Sistema pronto para uso!" 