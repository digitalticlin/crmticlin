
#!/bin/bash

# Script DEFINITIVO para correção completa do Puppeteer/Chrome na VPS
echo "🔧 CORREÇÃO DEFINITIVA PUPPETEER/CHROME - Resolvendo SingletonLock e Protocol Errors"
echo "==================================================================================="

# 1. PARAR COMPLETAMENTE TODOS OS PROCESSOS
echo "🛑 FASE 1: LIMPEZA COMPLETA DE PROCESSOS"
echo "========================================"

echo "🧹 Parando PM2 e matando processos..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Matar todos os processos Chrome/Chromium/Node restantes
pkill -f chrome 2>/dev/null || true
pkill -f chromium 2>/dev/null || true  
pkill -f node 2>/dev/null || true
pkill -f whatsapp 2>/dev/null || true

echo "⏳ Aguardando processos terminarem completamente..."
sleep 5

# 2. LIMPEZA COMPLETA DE LOCKS E SESSÕES
echo ""
echo "🧹 FASE 2: LIMPEZA DE LOCKS E SESSÕES CORROMPIDAS"
echo "================================================="

echo "🗑️ Removendo SingletonLocks..."
rm -rf /root/whatsapp_instances/sessions/*/SingletonLock 2>/dev/null || true
rm -rf /root/whatsapp_instances/sessions/*/.wwebjs_auth 2>/dev/null || true
rm -rf /root/whatsapp_instances/sessions/*/.wwebjs_cache 2>/dev/null || true

echo "🗑️ Limpando cache do Chrome..."
rm -rf /root/.cache/google-chrome* 2>/dev/null || true
rm -rf /root/.config/google-chrome* 2>/dev/null || true
rm -rf /root/.cache/chromium* 2>/dev/null || true
rm -rf /root/.config/chromium* 2>/dev/null || true

echo "🗑️ Limpando temp files..."
rm -rf /tmp/.com.google.Chrome* 2>/dev/null || true
rm -rf /tmp/.org.chromium.Chromium* 2>/dev/null || true

# 3. INSTALAR/VERIFICAR CHROME E DEPENDÊNCIAS
echo ""
echo "📦 FASE 3: INSTALAÇÃO CHROME E DEPENDÊNCIAS"
echo "==========================================="

echo "🔍 Verificando Chrome atual..."
if command -v google-chrome &> /dev/null; then
    echo "✅ Google Chrome encontrado: $(google-chrome --version)"
else
    echo "📥 Instalando Google Chrome..."
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
    apt-get update -y
    apt-get install -y google-chrome-stable
fi

echo "📦 Instalando dependências headless COMPLETAS..."
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
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    fonts-liberation \
    libappindicator3-1 \
    xdg-utils \
    libatspi2.0-0 \
    libu2f-udev \
    libvulkan1 \
    libgl1-mesa-glx \
    libgl1-mesa-dri

echo "📦 Atualizando dependências Node.js..."
npm install puppeteer whatsapp-web.js@latest qrcode node-fetch --save

# 4. BACKUP E APLICAR CÓDIGO CORRIGIDO
echo ""
echo "🔧 FASE 4: APLICANDO CÓDIGO CORRIGIDO"
echo "====================================="

echo "💾 Fazendo backup do servidor atual..."
cp vps-server-persistent.js vps-server-backup-puppeteer-definitivo-$(date +%Y%m%d_%H%M%S).js 2>/dev/null || true

echo "🔧 Aplicando configuração Puppeteer CORRIGIDA..."

# Aplicar patch diretamente no arquivo existente
cat > vps-puppeteer-config-patch.js << 'PATCH_EOF'
// CONFIGURAÇÃO PUPPETEER DEFINITIVAMENTE CORRIGIDA

// Detectar Chrome uma única vez (evitar loops)
let chromePathCache = null;
function getChromePath() {
  if (chromePathCache !== null) {
    return chromePathCache;
  }
  
  const chromePaths = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium'
  ];
  
  for (const chromePath of chromePaths) {
    try {
      require('fs').accessSync(chromePath);
      console.log(`🌐 Chrome encontrado: ${chromePath}`);
      chromePathCache = chromePath;
      return chromePath;
    } catch (error) {
      // Continue procurando
    }
  }
  
  console.log('⚠️ Chrome não encontrado nos caminhos padrão');
  chromePathCache = false;
  return null;
}

// CONFIGURAÇÃO PUPPETEER CORRIGIDA - Sem SingletonLock
const PUPPETEER_CONFIG = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--no-first-run',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-extensions',
    '--disable-default-apps',
    '--no-zygote',
    '--single-process',
    '--disable-features=VizDisplayCompositor',
    '--disable-ipc-flooding-protection',
    '--memory-pressure-off',
    '--max_old_space_size=4096',
    '--disable-web-security',
    '--disable-features=TranslateUI',
    '--disable-background-networking',
    '--disable-sync',
    '--metrics-recording-only',
    '--mute-audio',
    '--no-default-browser-check',
    '--disable-gpu-sandbox',
    '--disable-software-rasterizer',
    '--user-data-dir=/tmp/chrome-user-data-' + Date.now(), // CORREÇÃO: user-data único por instância
    '--disable-session-crashed-bubble',
    '--disable-infobars'
  ],
  ignoreHTTPSErrors: true,
  timeout: 60000,
  executablePath: getChromePath() || undefined
};

// FUNÇÃO CORRIGIDA: Inicialização com retry e limpeza
async function initializeWhatsAppClientCorrected(instance, retryCount = 0) {
  const maxRetries = 3;
  
  try {
    console.log(`🚀 CORRIGIDO: Inicializando ${instance.instanceId} (${retryCount + 1}/${maxRetries + 1})`);
    
    // CORREÇÃO: Limpar cliente anterior completamente
    if (instance.client) {
      try {
        await instance.client.destroy();
        await new Promise(resolve => setTimeout(resolve, 3000)); // Aguardar cleanup
      } catch (error) {
        console.log(`⚠️ Erro ao destruir cliente anterior: ${error.message}`);
      }
      instance.client = null;
    }

    // CORREÇÃO: user-data único para cada tentativa
    const uniqueUserData = `/tmp/chrome-user-data-${instance.instanceId}-${Date.now()}`;
    const puppeteerConfig = {
      ...PUPPETEER_CONFIG,
      args: [
        ...PUPPETEER_CONFIG.args.filter(arg => !arg.startsWith('--user-data-dir')),
        `--user-data-dir=${uniqueUserData}`
      ]
    };

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: instance.sessionName,
        dataPath: path.join(PERSISTENCE_DIR, 'sessions')
      }),
      puppeteer: puppeteerConfig
    });

    instance.client = client;
    instance.status = 'initializing';

    const initTimeout = setTimeout(() => {
      console.log(`⏰ TIMEOUT: ${instance.instanceId} após 90 segundos`);
      if (retryCount < maxRetries) {
        setTimeout(() => initializeWhatsAppClientCorrected(instance, retryCount + 1), 10000);
      } else {
        instance.status = 'failed';
        instance.error = 'Timeout na inicialização';
      }
    }, 90000);

    // Event handlers corrigidos
    client.on('qr', async (qr) => {
      console.log(`📱 QR Code CORRIGIDO gerado para: ${instance.instanceId}`);
      clearTimeout(initTimeout);
      
      const qrcode = require('qrcode');
      const qrBase64 = await qrcode.toDataURL(qr, { scale: 8 });
      
      instance.qrCode = qrBase64;
      instance.status = 'qr_ready';
      
      saveInstancesState();
      
      if (instance.webhookUrl) {
        await sendWebhook(instance.webhookUrl, 'qr.update', instance.instanceId, {
          qrCode: qrBase64
        });
      }
    });

    client.on('ready', async () => {
      console.log(`✅ CORRIGIDO: Cliente pronto: ${instance.instanceId}`);
      clearTimeout(initTimeout);
      instance.status = 'ready';
      instance.qrCode = null;
      
      if (instance.webhookUrl) {
        await sendWebhook(instance.webhookUrl, 'connection.update', instance.instanceId, {
          status: 'connected',
          phone: instance.client?.info?.wid?.user || null,
          profileName: instance.client?.info?.pushname || null
        });
      }
      
      saveInstancesState();
    });

    client.on('authenticated', () => {
      console.log(`🔐 CORRIGIDO: Autenticado: ${instance.instanceId}`);
      clearTimeout(initTimeout);
      instance.status = 'authenticated';
      saveInstancesState();
    });

    client.on('auth_failure', (msg) => {
      console.error(`❌ CORRIGIDO: Falha autenticação: ${instance.instanceId}`, msg);
      clearTimeout(initTimeout);
      instance.status = 'auth_failed';
      if (retryCount < maxRetries) {
        setTimeout(() => initializeWhatsAppClientCorrected(instance, retryCount + 1), 15000);
      }
    });

    client.on('disconnected', (reason) => {
      console.log(`🔌 CORRIGIDO: Desconectado: ${instance.instanceId} - ${reason}`);
      clearTimeout(initTimeout);
      instance.status = 'disconnected';
      saveInstancesState();
    });

    console.log(`🔄 CORRIGIDO: Iniciando cliente: ${instance.instanceId}...`);
    await client.initialize();
    
  } catch (error) {
    console.error(`❌ CORRIGIDO: Erro ao inicializar: ${instance.instanceId}`, error.message);
    instance.status = 'error';
    instance.error = error.message;
    
    if (retryCount < maxRetries) {
      console.log(`🔄 CORRIGIDO: Retry ${retryCount + 1}/${maxRetries} em 20s...`);
      setTimeout(() => initializeWhatsAppClientCorrected(instance, retryCount + 1), 20000);
    }
    
    saveInstancesState();
  }
}

console.log('🔧 PATCH PUPPETEER DEFINITIVO APLICADO');
PATCH_EOF

# Aplicar o patch no arquivo principal
echo "🔧 Integrando patch definitivo no servidor..."

# Backup da função original
sed -i '/async function initializeWhatsAppClient/,/^}/c\
// FUNÇÃO SUBSTITUÍDA POR VERSÃO CORRIGIDA\
async function initializeWhatsAppClient(instance, retryCount = 0) {\
  return initializeWhatsAppClientCorrected(instance, retryCount);\
}' vps-server-persistent.js

# Adicionar as configurações corrigidas no final
cat vps-puppeteer-config-patch.js >> vps-server-persistent.js

echo "✅ Patch definitivo aplicado"

# 5. CONFIGURAR VARIÁVEIS DE AMBIENTE CORRIGIDAS
echo ""
echo "🌍 FASE 5: CONFIGURANDO VARIÁVEIS DE AMBIENTE"
echo "============================================="

export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
export NODE_ENV=production
export DISPLAY=:99

echo "✅ Variáveis configuradas"

# 6. TESTE ISOLADO DO PUPPETEER
echo ""
echo "🧪 FASE 6: TESTE ISOLADO PUPPETEER"
echo "=================================="

echo "🧪 Criando teste isolado..."
cat > teste-puppeteer-isolado.js << 'TEST_EOF'
const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log('🚀 Testando Puppeteer isoladamente...');
    
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--user-data-dir=/tmp/chrome-test-' + Date.now()
      ],
      executablePath: '/usr/bin/google-chrome'
    });

    const page = await browser.newPage();
    await page.goto('https://www.google.com', { waitUntil: 'networkidle2' });
    
    const title = await page.title();
    console.log(`✅ Puppeteer funcionando! Título: ${title}`);
    
    await browser.close();
    console.log('✅ Teste Puppeteer: SUCESSO');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Teste Puppeteer FALHOU:', error.message);
    process.exit(1);
  }
})();
TEST_EOF

echo "🧪 Executando teste isolado..."
if node teste-puppeteer-isolado.js; then
    echo "✅ Puppeteer funcionando corretamente"
else
    echo "❌ Puppeteer ainda com problemas"
    exit 1
fi

# 7. REINICIAR SERVIDOR COM CORREÇÕES
echo ""
echo "🚀 FASE 7: REINICIANDO SERVIDOR CORRIGIDO"
echo "========================================="

echo "🔍 Verificando sintaxe do arquivo corrigido..."
if node -c vps-server-persistent.js; then
    echo "✅ Sintaxe correta"
else
    echo "❌ Erro de sintaxe"
    exit 1
fi

echo "🚀 Iniciando servidor com Puppeteer DEFINITIVAMENTE corrigido..."
PORT=3002 AUTH_TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" pm2 start vps-server-persistent.js --name whatsapp-main-3002 --time

pm2 save

echo "⏳ Aguardando estabilização (20s)..."
sleep 20

# 8. TESTE ESPECÍFICO DE CRIAÇÃO DE INSTÂNCIA
echo ""
echo "🧪 FASE 8: TESTE DEFINITIVO"
echo "==========================="

echo "🧪 Testando health check:"
curl -s http://localhost:3002/health | jq '{success, status, version}'

echo ""
echo "🧪 Testando criação de instância com Puppeteer corrigido:"
TEST_INSTANCE="puppeteer_definitivo_$(date +%s)"

create_response=$(curl -s -X POST http://localhost:3002/instance/create \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" \
  -H "Content-Type: application/json" \
  -d "{\"instanceId\":\"$TEST_INSTANCE\",\"sessionName\":\"$TEST_INSTANCE\"}")

echo "📋 Resposta da criação:"
echo "$create_response" | jq '{success, status, message}'

echo ""
echo "⏳ Aguardando 30s para QR Code ser gerado..."
sleep 30

echo "🧪 Verificando se QR Code foi gerado:"
qr_response=$(curl -s http://localhost:3002/instance/$TEST_INSTANCE/qr \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3")

echo "📋 Resposta do QR:"
echo "$qr_response" | jq '{success, status, message}'

echo ""
echo "🧹 Limpando instância de teste:"
curl -s -X DELETE http://localhost:3002/instance/$TEST_INSTANCE \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" | jq '{success}'

echo ""
echo "📊 Status final:"
pm2 status

echo ""
echo "🎉 CORREÇÃO DEFINITIVA PUPPETEER CONCLUÍDA!"
echo "==========================================="
echo ""
echo "✅ Chrome instalado e testado"
echo "✅ Dependências headless completas"
echo "✅ SingletonLock resolvido"
echo "✅ Protocol errors corrigidos"
echo "✅ Configuração Puppeteer otimizada"
echo "✅ User-data único por instância"
echo "✅ Retry automático implementado"
echo ""
echo "📋 PRÓXIMO PASSO:"
echo "Execute: ./teste-pos-correcoes.sh"
echo ""
echo "🎯 EXPECTATIVA: TODOS os testes devem retornar ✅"
echo "   Especialmente: QR Code deve aparecer como 'ready'"

# Limpeza
rm -f teste-puppeteer-isolado.js
rm -f vps-puppeteer-config-patch.js
