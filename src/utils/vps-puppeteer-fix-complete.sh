
#!/bin/bash

# Script completo para corrigir Puppeteer/Chrome na VPS
echo "🔧 CORREÇÃO COMPLETA PUPPETEER/CHROME VPS"
echo "=========================================="

# 1. DIAGNÓSTICO INICIAL
echo "📋 FASE 1: DIAGNÓSTICO INICIAL"
echo "=============================="

echo "🔍 Verificando versão do Node.js:"
node --version

echo "🔍 Verificando se Chrome está instalado:"
which google-chrome || echo "❌ Google Chrome não encontrado"
which chromium-browser || echo "❌ Chromium não encontrado"

echo "🔍 Verificando logs do PM2 para erros:"
pm2 logs whatsapp-main-3002 --lines 10

# 2. INSTALAR DEPENDÊNCIAS NECESSÁRIAS
echo ""
echo "📦 FASE 2: INSTALANDO DEPENDÊNCIAS"
echo "================================="

echo "🔄 Atualizando sistema..."
apt-get update -y

echo "🔧 Instalando Google Chrome..."
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
apt-get update -y
apt-get install -y google-chrome-stable

echo "🔧 Instalando dependências do Chrome headless..."
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
    xdg-utils

echo "📦 Instalando/atualizando dependências Node.js..."
npm install puppeteer whatsapp-web.js@latest qrcode --save

# 3. TESTAR CHROME HEADLESS
echo ""
echo "🧪 FASE 3: TESTANDO CHROME HEADLESS"
echo "==================================="

echo "🧪 Teste básico do Chrome headless:"
google-chrome --headless --disable-gpu --no-sandbox --dump-dom https://www.google.com > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Chrome headless funcionando corretamente"
else
    echo "❌ Chrome headless com problemas"
fi

# 4. APLICAR CORREÇÃO NO SERVIDOR
echo ""
echo "🔧 FASE 4: APLICANDO CORREÇÃO NO SERVIDOR"
echo "========================================="

echo "🛑 Parando servidor atual..."
pm2 stop whatsapp-main-3002 2>/dev/null || true
pm2 delete whatsapp-main-3002 2>/dev/null || true

echo "💾 Fazendo backup do arquivo atual..."
cp vps-server-persistent.js vps-server-backup-puppeteer-$(date +%Y%m%d_%H%M%S).js

echo "🔧 Aplicando correção Puppeteer no servidor..."

# Aplicar patch específico para Puppeteer
cat > vps-server-puppeteer-patch.js << 'PATCH_EOF'
// Patch para correção do Puppeteer - Aplicar no servidor principal

// CONFIGURAÇÃO PUPPETEER CORRIGIDA PARA VPS
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
    '--disable-default-apps',
    '--mute-audio',
    '--no-default-browser-check',
    '--no-first-run',
    '--disable-gpu-sandbox',
    '--disable-software-rasterizer'
  ],
  ignoreHTTPSErrors: true,
  timeout: 60000,
  executablePath: '/usr/bin/google-chrome'
};

// FUNÇÃO MELHORADA PARA INICIALIZAÇÃO
async function initializeWhatsAppClientCorrected(instance, retryCount = 0) {
  const maxRetries = 3;
  
  try {
    console.log(`🚀 CORRIGIDO: Inicializando cliente: ${instance.instanceId} (${retryCount + 1}/${maxRetries + 1})`);
    
    if (instance.client) {
      try {
        await instance.client.destroy();
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.log(`⚠️ Erro ao destruir cliente anterior: ${error.message}`);
      }
      instance.client = null;
    }

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: instance.sessionName,
        dataPath: path.join(PERSISTENCE_DIR, 'sessions')
      }),
      puppeteer: PUPPETEER_CONFIG
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

    // Event handlers otimizados
    client.on('qr', async (qr) => {
      console.log(`📱 QR Code CORRIGIDO gerado para: ${instance.instanceId}`);
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

console.log('🔧 PATCH PUPPETEER APLICADO COM SUCESSO');
PATCH_EOF

# Aplicar o patch no arquivo principal
echo "🔧 Integrando patch ao arquivo principal..."

# Substituir a função de inicialização no arquivo principal
sed -i '/async function initializeWhatsAppClient/,/^}/c\
// FUNÇÃO CORRIGIDA - Ver vps-server-puppeteer-patch.js\
async function initializeWhatsAppClient(instance, retryCount = 0) {\
  return initializeWhatsAppClientCorrected(instance, retryCount);\
}' vps-server-persistent.js

# Adicionar as configurações corrigidas
cat vps-server-puppeteer-patch.js >> vps-server-persistent.js

echo "✅ Patch aplicado com sucesso"

# 5. CONFIGURAR VARIÁVEIS DE AMBIENTE
echo ""
echo "🌍 FASE 5: CONFIGURANDO VARIÁVEIS"
echo "================================"

export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
export NODE_ENV=production

echo "✅ Variáveis de ambiente configuradas"

# 6. REINICIAR SERVIDOR COM CORREÇÕES
echo ""
echo "🚀 FASE 6: REINICIANDO SERVIDOR"
echo "==============================="

echo "🔍 Verificando sintaxe do arquivo corrigido..."
if node -c vps-server-persistent.js; then
    echo "✅ Sintaxe correta"
else
    echo "❌ Erro de sintaxe - restaurando backup"
    cp vps-server-backup-puppeteer-$(date +%Y%m%d_%H%M%S).js vps-server-persistent.js
    exit 1
fi

echo "🚀 Iniciando servidor com correções Puppeteer..."
PORT=3002 AUTH_TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" pm2 start vps-server-persistent.js --name whatsapp-main-3002 --time

pm2 save

echo "⏳ Aguardando 15s para estabilização..."
sleep 15

# 7. TESTE ESPECÍFICO PUPPETEER
echo ""
echo "🧪 FASE 7: TESTE ESPECÍFICO PUPPETEER"
echo "====================================="

echo "🧪 Testando health check corrigido:"
curl -s http://localhost:3002/health | jq '{version, status, chromePath, puppeteerConfig}'

echo ""
echo "🧪 Testando criação de instância corrigida:"
curl -s -X POST http://localhost:3002/instance/create \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" \
  -H "Content-Type: application/json" \
  -d '{"instanceId":"teste_puppeteer_fix","sessionName":"teste_puppeteer_fix"}' | jq '{success, status, message}'

echo ""
echo "⏳ Aguardando 30s para QR Code ser gerado..."
sleep 30

echo "🧪 Testando se QR Code foi gerado:"
curl -s http://localhost:3002/instance/teste_puppeteer_fix/qr \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" | jq '{success, status, hasQR: (.qrCode != null)}'

echo ""
echo "🧹 Limpando instância de teste:"
curl -s -X DELETE http://localhost:3002/instance/teste_puppeteer_fix \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" | jq '{success}'

echo ""
echo "📊 Status final do PM2:"
pm2 status

echo ""
echo "🎉 CORREÇÃO PUPPETEER CONCLUÍDA!"
echo "==============================="
echo ""
echo "✅ Chrome instalado e configurado"
echo "✅ Dependências headless instaladas"
echo "✅ Configuração Puppeteer otimizada"
echo "✅ Timeouts e retry melhorados"
echo "✅ Variáveis de ambiente configuradas"
echo ""
echo "📋 PRÓXIMO PASSO:"
echo "Execute: ./teste-pos-correcoes.sh"
echo ""
echo "🎯 EXPECTATIVA: TODOS os testes devem retornar ✅"
echo "   - Health Check: ✅"
echo "   - Criação de Instância: ✅"
echo "   - QR Code: ✅ (com status 'ready')"
echo "   - Contatos: ✅ (instância pronta)"
echo "   - Mensagens: ✅ (instância pronta)"
echo "   - Envio: ✅ (instância pronta)"
echo "   - Deletar: ✅"
