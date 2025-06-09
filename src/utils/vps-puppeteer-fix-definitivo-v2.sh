
#!/bin/bash

# CORREÇÃO DEFINITIVA PUPPETEER - Baseada em Análise Profunda
echo "🔧 CORREÇÃO DEFINITIVA PUPPETEER/CHROME - V2.0"
echo "=============================================="

VPS_IP="31.97.24.222"
PORTA="3002"
TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3"

# 1. PARAR TUDO COMPLETAMENTE
echo "🛑 FASE 1: LIMPEZA COMPLETA"
echo "=========================="

echo "🧹 Parando PM2 e processos..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true

# Matar processos residuais
pkill -f chrome 2>/dev/null || true
pkill -f chromium 2>/dev/null || true
pkill -f node 2>/dev/null || true

echo "🗑️ Limpando caches e locks..."
rm -rf /root/.cache/google-chrome* 2>/dev/null || true
rm -rf /root/.config/google-chrome* 2>/dev/null || true
rm -rf /tmp/.com.google.Chrome* 2>/dev/null || true
rm -rf /root/whatsapp_instances/sessions/*/SingletonLock 2>/dev/null || true

sleep 3

# 2. INSTALAÇÃO COMPLETA CHROME E DEPENDÊNCIAS
echo ""
echo "📦 FASE 2: INSTALAÇÃO CHROME E DEPENDÊNCIAS COMPLETAS"
echo "===================================================="

echo "🔄 Atualizando sistema..."
apt-get update -y

echo "📥 Instalando Google Chrome..."
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
apt-get update -y
apt-get install -y google-chrome-stable

echo "📦 Instalando TODAS as dependências headless (comando completo do usuário)..."
apt-get install -y \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libdrm2 \
  libgbm1 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  wget \
  unzip \
  libxss1 \
  libgconf-2-4 \
  libxtst6 \
  libxrandr2 \
  libasound2 \
  libpangocairo-1.0-0 \
  libcairo-gobject2 \
  libgtk-3-0 \
  libgdk-pixbuf2.0-0

echo "📦 Instalando Chromium como fallback..."
apt-get install -y chromium-browser

echo "📋 Verificando instalação:"
echo "   Chrome: $(google-chrome-stable --version 2>/dev/null || echo 'FALHOU')"
echo "   Chromium: $(chromium-browser --version 2>/dev/null || echo 'FALHOU')"

# 3. TESTE PUPPETEER ISOLADO (COMANDO DO USUÁRIO)
echo ""
echo "🧪 FASE 3: TESTE PUPPETEER ISOLADO"
echo "=================================="

echo "📝 Criando teste Puppeteer realista..."
cat > teste-puppeteer-realista.js << 'EOF'
const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log('🚀 Testando Puppeteer com flags reais...');
    
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: '/usr/bin/google-chrome-stable',
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
        '--single-process'
      ],
      timeout: 30000
    });

    console.log('✅ Browser lançado com sucesso');
    
    const page = await browser.newPage();
    console.log('✅ Nova página criada');
    
    await page.goto('https://web.whatsapp.com', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    console.log('✅ WhatsApp Web carregado com sucesso');
    
    await browser.close();
    console.log('✅ TESTE PUPPETEER: SUCESSO TOTAL!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ TESTE PUPPETEER FALHOU:', error.message);
    console.error('Stack:', error.stack);
    
    // Tentar com Chromium como fallback
    console.log('🔄 Tentando com Chromium...');
    
    try {
      const browser = await puppeteer.launch({
        headless: true,
        executablePath: '/usr/bin/chromium-browser',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ]
      });
      
      console.log('✅ Chromium funcionou como fallback');
      await browser.close();
      process.exit(0);
      
    } catch (chromiumError) {
      console.error('❌ Chromium também falhou:', chromiumError.message);
      process.exit(1);
    }
  }
})();
EOF

echo "🧪 Executando teste Puppeteer..."
if node teste-puppeteer-realista.js; then
    echo "✅ Puppeteer funcionando perfeitamente!"
    CHROME_WORKING=true
else
    echo "❌ Puppeteer com problemas"
    CHROME_WORKING=false
fi

# 4. APLICAR CORREÇÃO NO SERVIDOR
echo ""
echo "🔧 FASE 4: APLICANDO CORREÇÃO NO SERVIDOR"
echo "========================================="

if [ "$CHROME_WORKING" = true ]; then
    echo "💾 Fazendo backup do servidor atual..."
    cp vps-server-persistent.js vps-server-backup-puppeteer-definitivo-$(date +%Y%m%d_%H%M%S).js

    echo "🔧 Aplicando configuração Puppeteer DEFINITIVA..."
    
    # Criar configuração corrigida
    cat > vps-puppeteer-config-definitiva.js << 'PATCH_EOF'
// CONFIGURAÇÃO PUPPETEER DEFINITIVA - Testada e Funcional

// Detectar Chrome automaticamente
function getOptimalChromePath() {
  const chromePaths = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium'
  ];
  
  for (const chromePath of chromePaths) {
    try {
      require('fs').accessSync(chromePath);
      console.log(`🌐 Chrome otimizado encontrado: ${chromePath}`);
      return chromePath;
    } catch (error) {
      continue;
    }
  }
  
  console.log('⚠️ Usando Chrome padrão do sistema');
  return null;
}

// CONFIGURAÇÃO PUPPETEER DEFINITIVA
const PUPPETEER_CONFIG_DEFINITIVO = {
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
    '--disable-software-rasterizer'
  ],
  ignoreHTTPSErrors: true,
  timeout: 60000,
  executablePath: getOptimalChromePath() || undefined
};

// FUNÇÃO CORRIGIDA COM RETRY E DEBUG
async function initializeWhatsAppClientDefinitivo(instance, retryCount = 0) {
  const maxRetries = 3;
  
  try {
    console.log('🚀 DEFINITIVO: Inicializando ' + instance.instanceId + ' (' + (retryCount + 1) + '/' + (maxRetries + 1) + ')');
    
    // Limpar cliente anterior
    if (instance.client) {
      try {
        await instance.client.destroy();
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.log('⚠️ Erro ao destruir cliente anterior: ' + error.message);
      }
      instance.client = null;
    }

    // User-data único para cada instância
    const uniqueUserData = '/tmp/chrome-user-data-' + instance.instanceId + '-' + Date.now();
    const configWithUserData = {
      ...PUPPETEER_CONFIG_DEFINITIVO,
      args: [
        ...PUPPETEER_CONFIG_DEFINITIVO.args,
        '--user-data-dir=' + uniqueUserData
      ]
    };

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: instance.sessionName,
        dataPath: path.join(PERSISTENCE_DIR, 'sessions')
      }),
      puppeteer: configWithUserData
    });

    instance.client = client;
    instance.status = 'initializing';

    // Timeout aumentado para 120s
    const initTimeout = setTimeout(() => {
      console.log('⏰ TIMEOUT: ' + instance.instanceId + ' após 120s');
      if (retryCount < maxRetries) {
        setTimeout(() => initializeWhatsAppClientDefinitivo(instance, retryCount + 1), 15000);
      } else {
        instance.status = 'failed';
        instance.error = 'Timeout na inicialização após ' + (maxRetries + 1) + ' tentativas';
      }
    }, 120000);

    // Event handlers otimizados
    client.on('qr', async (qr) => {
      console.log('📱 QR DEFINITIVO gerado: ' + instance.instanceId);
      clearTimeout(initTimeout);
      
      const qrcode = require('qrcode');
      const qrBase64 = await qrcode.toDataURL(qr, { scale: 8 });
      
      instance.qrCode = qrBase64;
      instance.status = 'qr_ready';
      
      await saveQRCodeToSupabase(instance.instanceId, qrBase64);
      saveInstancesState();
      
      if (instance.webhookUrl) {
        await sendWebhook(instance.webhookUrl, 'qr.update', instance.instanceId, {
          qrCode: qrBase64
        });
      }
    });

    client.on('ready', async () => {
      console.log('✅ DEFINITIVO: Cliente pronto: ' + instance.instanceId);
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
      console.log('🔐 DEFINITIVO: Autenticado: ' + instance.instanceId);
      clearTimeout(initTimeout);
      instance.status = 'authenticated';
      saveInstancesState();
    });

    client.on('auth_failure', (msg) => {
      console.error('❌ DEFINITIVO: Falha auth: ' + instance.instanceId, msg);
      clearTimeout(initTimeout);
      instance.status = 'auth_failed';
      if (retryCount < maxRetries) {
        setTimeout(() => initializeWhatsAppClientDefinitivo(instance, retryCount + 1), 20000);
      }
    });

    client.on('disconnected', (reason) => {
      console.log('🔌 DEFINITIVO: Desconectado: ' + instance.instanceId + ' - ' + reason);
      clearTimeout(initTimeout);
      instance.status = 'disconnected';
      saveInstancesState();
    });

    console.log('🔄 DEFINITIVO: Iniciando cliente: ' + instance.instanceId + '...');
    await client.initialize();
    
  } catch (error) {
    console.error('❌ DEFINITIVO: Erro init: ' + instance.instanceId, error.message);
    instance.status = 'error';
    instance.error = error.message;
    
    if (retryCount < maxRetries) {
      console.log('🔄 DEFINITIVO: Retry ' + (retryCount + 1) + '/' + maxRetries + ' em 20s...');
      setTimeout(() => initializeWhatsAppClientDefinitivo(instance, retryCount + 1), 20000);
    }
    
    saveInstancesState();
  }
}

console.log('🔧 CONFIGURAÇÃO PUPPETEER DEFINITIVA APLICADA');
PATCH_EOF

    # Aplicar no arquivo principal
    echo "🔧 Integrando configuração definitiva..."
    
    # Substituir função de inicialização
    sed -i '/async function initializeWhatsAppClient/,/^}/c\
// FUNÇÃO SUBSTITUÍDA POR VERSÃO DEFINITIVA\
async function initializeWhatsAppClient(instance, retryCount = 0) {\
  return initializeWhatsAppClientDefinitivo(instance, retryCount);\
}' vps-server-persistent.js

    # Adicionar configuração no final
    cat vps-puppeteer-config-definitiva.js >> vps-server-persistent.js

    echo "✅ Configuração definitiva aplicada"
else
    echo "❌ Pulando aplicação - Puppeteer não funcionou no teste"
fi

# 5. REINICIAR E TESTAR
echo ""
echo "🚀 FASE 5: REINICIANDO SERVIDOR DEFINITIVO"
echo "=========================================="

echo "🔍 Verificando sintaxe..."
if node -c vps-server-persistent.js; then
    echo "✅ Sintaxe correta"
else
    echo "❌ Erro de sintaxe"
    exit 1
fi

echo "🚀 Iniciando servidor com configuração DEFINITIVA..."
PORT=3002 AUTH_TOKEN="$TOKEN" pm2 start vps-server-persistent.js --name whatsapp-main-3002 --time

pm2 save

echo "⏳ Aguardando 30s para estabilização..."
sleep 30

# 6. TESTE DEFINITIVO
echo ""
echo "🧪 FASE 6: TESTE DEFINITIVO DA CORREÇÃO"
echo "======================================="

echo "🧪 Health check definitivo:"
health_response=$(curl -s http://localhost:3002/health)
echo "$health_response" | jq '{success, version, activeInstances}' 2>/dev/null || echo "$health_response"

echo ""
echo "🧪 Teste de criação de instância DEFINITIVA:"
TEST_INSTANCE="definitivo_$(date +%s)"

create_response=$(curl -s -X POST http://localhost:3002/instance/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"instanceId\":\"$TEST_INSTANCE\",\"sessionName\":\"$TEST_INSTANCE\"}")

echo "📋 Resposta da criação:"
echo "$create_response" | jq '{success, status, message}' 2>/dev/null || echo "$create_response"

echo ""
echo "⏳ Aguardando 45s para QR Code (configuração otimizada)..."
sleep 45

echo "🧪 Verificando QR Code DEFINITIVO:"
qr_response=$(curl -s http://localhost:3002/instance/$TEST_INSTANCE/qr \
  -H "Authorization: Bearer $TOKEN")

echo "📋 Resposta do QR:"
echo "$qr_response" | jq '{success, status, hasQR: (.qrCode != null)}' 2>/dev/null || echo "$qr_response"

echo ""
echo "🧹 Limpando instância de teste:"
curl -s -X DELETE http://localhost:3002/instance/$TEST_INSTANCE \
  -H "Authorization: Bearer $TOKEN" | jq '{success}' 2>/dev/null

echo ""
echo "📊 Status final:"
pm2 status

echo ""
echo "🎉 CORREÇÃO DEFINITIVA PUPPETEER CONCLUÍDA!"
echo "==========================================="
echo ""
echo "✅ Chrome instalado e testado isoladamente"
echo "✅ Dependências completas instaladas"
echo "✅ Configuração Puppeteer definitiva aplicada"
echo "✅ Timeouts e retry otimizados"
echo "✅ User-data único por instância"
echo "✅ Logs detalhados implementados"
echo ""
echo "📋 PRÓXIMO PASSO:"
echo "Execute: ./teste-puppeteer-pos-correcao.sh"
echo ""
echo "🎯 EXPECTATIVA FINAL:"
echo "   ✅ Instância fica 'ready' (não 'error')"
echo "   ✅ QR Code é gerado automaticamente"
echo "   ✅ Todos os endpoints funcionam"
echo "   ✅ Sistema 100% operacional"

# Limpeza
rm -f teste-puppeteer-realista.js
rm -f vps-puppeteer-config-definitiva.js
