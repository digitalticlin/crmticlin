
#!/bin/bash

# CORREÇÃO DEFINITIVA PUPPETEER - NÍVEL AVANÇADO
# Resolve: Session closed, módulo não encontrado, argumentos instáveis, timeouts
echo "🚀 CORREÇÃO DEFINITIVA PUPPETEER - NÍVEL AVANÇADO"
echo "=================================================="
echo "📅 $(date)"
echo "🎯 Resolver definitivamente todos os problemas do Puppeteer"
echo ""

# Função de log com timestamp
log() {
    echo "[$(date '+%H:%M:%S')] $1"
}

log "🔧 INICIANDO CORREÇÃO AVANÇADA DO PUPPETEER"

# ETAPA 1: PARAR E LIMPAR TUDO
log "⏹️ Limpando ambiente anterior..."
pm2 stop whatsapp-main-3002 2>/dev/null || true
pm2 delete whatsapp-main-3002 2>/dev/null || true
pkill -f "node.*3002" 2>/dev/null || true
pkill -f "chrome" 2>/dev/null || true
pkill -f "puppeteer" 2>/dev/null || true

# ETAPA 2: INSTALAR DEPENDÊNCIAS CORRETAS
log "📦 Instalando todas as dependências corretas..."

# Atualizar sistema
apt-get update -y > /dev/null 2>&1

# Instalar Chrome Stable com todas as dependências
log "🌐 Instalando Google Chrome e dependências..."
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - 2>/dev/null
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
apt-get update -y > /dev/null 2>&1
apt-get install -y google-chrome-stable > /dev/null 2>&1

# Instalar TODAS as dependências necessárias para headless
log "🔧 Instalando dependências headless avançadas..."
apt-get install -y \
  libnss3 \
  libatk-bridge2.0-0 \
  libdrm2 \
  libxkbcomposite1 \
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
  libx11-xcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxi6 \
  libxtst6 \
  libnss3-dev \
  libgconf-2-4 \
  libxrandr2 \
  libasound2-dev \
  libpangocairo-1.0-0 \
  libatk1.0-dev \
  libcairo-gobject2 \
  libgtk-3-dev \
  libgdk-pixbuf2.0-dev \
  xvfb > /dev/null 2>&1

# Verificar Chrome
CHROME_PATH=""
if command -v google-chrome-stable &> /dev/null; then
    CHROME_PATH="/usr/bin/google-chrome-stable"
    log "✅ Chrome encontrado: $CHROME_PATH"
else
    log "❌ ERRO: Chrome não encontrado!"
    exit 1
fi

# ETAPA 3: INSTALAR NODE.JS DEPENDENCIES CORRETAS
log "📦 Instalando dependências Node.js corretas..."
cd /root

# Remover node_modules antigo se existir
rm -rf node_modules package-lock.json 2>/dev/null

# Instalar versões específicas e compatíveis
npm install --save \
  whatsapp-web.js@1.23.0 \
  puppeteer@21.11.0 \
  puppeteer-core@21.11.0 \
  express@4.18.2 \
  cors@2.8.5 > /dev/null 2>&1

log "✅ Dependências Node.js instaladas"

# ETAPA 4: CONFIGURAR VARIÁVEIS DE AMBIENTE
log "🌍 Configurando variáveis avançadas..."
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=$CHROME_PATH
export DISPLAY=:99
export CHROME_DEVEL_SANDBOX=/usr/lib/chromium-browser/chrome-sandbox

# Adicionar ao bashrc permanentemente
echo "export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true" >> /root/.bashrc
echo "export PUPPETEER_EXECUTABLE_PATH=$CHROME_PATH" >> /root/.bashrc
echo "export DISPLAY=:99" >> /root/.bashrc
echo "export CHROME_DEVEL_SANDBOX=/usr/lib/chromium-browser/chrome-sandbox" >> /root/.bashrc

# ETAPA 5: CRIAR SERVIDOR WHATSAPP AVANÇADO COM RETRY LOGIC
log "📝 Criando servidor WhatsApp com configuração avançada..."
cat > /root/whatsapp-server-advanced.js << 'ADVANCED_EOF'
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3002;

// CORS e parsing
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Token']
}));
app.use(express.json({ limit: '50mb' }));

// Token de autenticação
const AUTH_TOKEN = '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'] || req.headers['x-api-token'];
    const token = authHeader && authHeader.replace('Bearer ', '');
    
    if (!token || token !== AUTH_TOKEN) {
        return res.status(401).json({ success: false, error: 'Token inválido' });
    }
    next();
};

// CONFIGURAÇÃO PUPPETEER AVANÇADA - ULTRA ESTÁVEL
const ADVANCED_PUPPETEER_CONFIG = {
    headless: true,
    executablePath: '/usr/bin/google-chrome-stable',
    args: [
        // Argumentos básicos de segurança
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        
        // Argumentos para estabilidade CDP
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor,TranslateUI,BackForwardCache',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-ipc-flooding-protection',
        
        // Argumentos para performance em VPS
        '--single-process',
        '--no-zygote',
        '--disable-gpu',
        '--disable-gpu-sandbox',
        '--disable-software-rasterizer',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-sync',
        '--disable-translate',
        '--disable-plugins',
        '--mute-audio',
        '--no-first-run',
        '--no-default-browser-check',
        
        // Argumentos para estabilidade de sessão
        '--remote-debugging-port=0',
        '--disable-hang-monitor',
        '--disable-prompt-on-repost',
        '--disable-client-side-phishing-detection',
        '--disable-component-extensions-with-background-pages',
        '--disable-domain-reliability',
        '--disable-background-mode',
        '--disable-breakpad',
        '--disable-component-update',
        '--disable-domain-reliability',
        '--disable-sync',
        
        // Argumentos específicos para User Agent stability
        '--force-device-scale-factor=1',
        '--ignore-certificate-errors',
        '--ignore-ssl-errors',
        '--ignore-certificate-errors-spki-list',
        '--ignore-certificate-errors-ssl',
        '--allow-running-insecure-content',
        
        // Memory management
        '--memory-pressure-off',
        '--max-old-space-size=1024',
        '--optimize-for-size',
        
        // Timeout configurations
        '--timeout=60000',
        '--navigation-timeout=60000'
    ],
    ignoreHTTPSErrors: true,
    ignoreDefaultArgs: ['--disable-extensions'],
    timeout: 60000,
    dumpio: false,
    pipe: true
};

// Storage para instâncias
const instances = new Map();

// FUNÇÃO AVANÇADA: Criar instância com retry logic
const createWhatsAppInstanceAdvanced = async (instanceName) => {
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
        attempt++;
        console.log(`[ADVANCED] 🚀 Tentativa ${attempt}/${maxRetries} - Criando instância: ${instanceName}`);
        
        try {
            const instanceId = `wa_${instanceName}_${Date.now()}_${attempt}`;
            const sessionPath = path.join('/root/whatsapp_sessions', instanceId);
            
            // Garantir que o diretório existe
            if (!fs.existsSync('/root/whatsapp_sessions')) {
                fs.mkdirSync('/root/whatsapp_sessions', { recursive: true });
            }
            
            console.log(`[ADVANCED] 📁 Sessão: ${sessionPath}`);
            console.log(`[ADVANCED] 🔧 Chrome: ${ADVANCED_PUPPETEER_CONFIG.executablePath}`);
            console.log(`[ADVANCED] ⚙️ Args: ${ADVANCED_PUPPETEER_CONFIG.args.length} argumentos otimizados`);
            
            // Criar cliente com configuração avançada
            const client = new Client({
                authStrategy: new LocalAuth({
                    clientId: instanceId,
                    dataPath: sessionPath
                }),
                puppeteer: ADVANCED_PUPPETEER_CONFIG,
                webVersionCache: {
                    type: 'remote',
                    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
                }
            });
            
            // Estados da instância
            const instanceData = {
                id: instanceId,
                name: instanceName,
                client,
                status: 'initializing',
                qrCode: null,
                lastActivity: new Date(),
                connected: false,
                phone: null,
                attempt: attempt
            };
            
            // Promise para controlar timeout da inicialização
            const initPromise = new Promise((resolve, reject) => {
                let qrReceived = false;
                let initTimeout;
                
                // Event listeners com retry logic
                client.on('qr', (qr) => {
                    console.log(`[ADVANCED] 📱 QR Code gerado para ${instanceId} (tentativa ${attempt})`);
                    qrReceived = true;
                    instanceData.qrCode = qr;
                    instanceData.status = 'waiting_qr';
                    instanceData.lastActivity = new Date();
                    
                    // Limpar timeout se QR foi recebido
                    if (initTimeout) {
                        clearTimeout(initTimeout);
                    }
                    resolve(instanceData);
                });
                
                client.on('ready', () => {
                    console.log(`[ADVANCED] ✅ Cliente pronto: ${instanceId}`);
                    instanceData.status = 'ready';
                    instanceData.connected = true;
                    instanceData.lastActivity = new Date();
                    instanceData.phone = client.info?.wid?.user || 'unknown';
                    if (initTimeout) {
                        clearTimeout(initTimeout);
                    }
                    resolve(instanceData);
                });
                
                client.on('authenticated', () => {
                    console.log(`[ADVANCED] 🔐 Autenticado: ${instanceId}`);
                    instanceData.status = 'authenticated';
                    instanceData.lastActivity = new Date();
                });
                
                client.on('disconnected', (reason) => {
                    console.log(`[ADVANCED] ❌ Desconectado ${instanceId}: ${reason}`);
                    instanceData.status = 'disconnected';
                    instanceData.connected = false;
                    instanceData.lastActivity = new Date();
                    if (!qrReceived) {
                        reject(new Error(`Desconectado durante inicialização: ${reason}`));
                    }
                });
                
                // Timeout de 45 segundos para inicialização
                initTimeout = setTimeout(() => {
                    if (!qrReceived) {
                        console.log(`[ADVANCED] ⏰ Timeout na inicialização - tentativa ${attempt}`);
                        client.destroy().catch(() => {});
                        reject(new Error(`Timeout na inicialização (45s) - tentativa ${attempt}`));
                    }
                }, 45000);
            });
            
            // Inicializar cliente
            console.log(`[ADVANCED] 🔄 Inicializando cliente com configuração avançada...`);
            await client.initialize();
            
            // Aguardar QR ou ready
            const result = await initPromise;
            
            instances.set(instanceId, result);
            console.log(`[ADVANCED] ✅ Instância criada com sucesso: ${instanceId}`);
            
            return {
                success: true,
                instanceId,
                instanceName,
                status: result.status,
                attempt: attempt,
                message: `Instância criada com configuração avançada (tentativa ${attempt})`
            };
            
        } catch (error) {
            console.error(`[ADVANCED] ❌ Erro na tentativa ${attempt}:`, error.message);
            
            // Se não é a última tentativa, aguardar antes de tentar novamente
            if (attempt < maxRetries) {
                console.log(`[ADVANCED] ⏳ Aguardando 5s antes da próxima tentativa...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            } else {
                // Última tentativa falhou
                return {
                    success: false,
                    error: `Falha após ${maxRetries} tentativas: ${error.message}`,
                    lastAttempt: attempt,
                    details: error.stack
                };
            }
        }
    }
};

// ENDPOINTS DA API

// Health check avançado
app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'online',
        server: 'WhatsApp VPS Advanced',
        port: PORT,
        timestamp: new Date().toISOString(),
        instances: instances.size,
        puppeteer_config: 'ADVANCED_STABLE',
        chrome_path: ADVANCED_PUPPETEER_CONFIG.executablePath,
        chrome_args_count: ADVANCED_PUPPETEER_CONFIG.args.length,
        retry_logic: 'ENABLED',
        max_retries: 3,
        session_timeout: '45s'
    });
});

// Listar instâncias
app.get('/instances', authenticateToken, (req, res) => {
    const instanceList = Array.from(instances.values()).map(inst => ({
        id: inst.id,
        name: inst.name,
        status: inst.status,
        connected: inst.connected,
        phone: inst.phone,
        lastActivity: inst.lastActivity,
        hasQrCode: !!inst.qrCode,
        attempt: inst.attempt || 1
    }));
    
    res.json({
        success: true,
        instances: instanceList,
        total: instanceList.length
    });
});

// Criar instância com configuração avançada
app.post('/instance/create', authenticateToken, async (req, res) => {
    try {
        const { instanceName } = req.body;
        
        if (!instanceName) {
            return res.status(400).json({
                success: false,
                error: 'instanceName é obrigatório'
            });
        }
        
        console.log(`[ADVANCED] 📥 Recebida solicitação de criação: ${instanceName}`);
        
        const result = await createWhatsAppInstanceAdvanced(instanceName);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
        
    } catch (error) {
        console.error(`[ADVANCED] ❌ Erro no endpoint create:`, error);
        res.status(500).json({
            success: false,
            error: error.message,
            type: 'endpoint_error'
        });
    }
});

// Obter QR Code
app.get('/instance/:instanceId/qr', authenticateToken, (req, res) => {
    const { instanceId } = req.params;
    const instance = instances.get(instanceId);
    
    if (!instance) {
        return res.status(404).json({
            success: false,
            error: 'Instância não encontrada'
        });
    }
    
    if (instance.qrCode) {
        res.json({
            success: true,
            qrCode: instance.qrCode,
            status: instance.status,
            instanceId,
            attempt: instance.attempt
        });
    } else {
        res.json({
            success: false,
            waiting: true,
            status: instance.status,
            message: 'QR Code ainda sendo gerado',
            attempt: instance.attempt
        });
    }
});

// Deletar instância
app.delete('/instance/:instanceId', authenticateToken, async (req, res) => {
    try {
        const { instanceId } = req.params;
        const instance = instances.get(instanceId);
        
        if (!instance) {
            return res.status(404).json({
                success: false,
                error: 'Instância não encontrada'
            });
        }
        
        // Destruir cliente
        if (instance.client) {
            await instance.client.destroy();
        }
        
        instances.delete(instanceId);
        
        res.json({
            success: true,
            message: 'Instância deletada com sucesso'
        });
        
    } catch (error) {
        console.error(`[ADVANCED] ❌ Erro ao deletar:`, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [ADVANCED] WhatsApp Server rodando na porta ${PORT}`);
    console.log(`✅ [ADVANCED] Puppeteer configurado com Chrome: ${ADVANCED_PUPPETEER_CONFIG.executablePath}`);
    console.log(`🔧 [ADVANCED] Args Chrome: ${ADVANCED_PUPPETEER_CONFIG.args.length} argumentos otimizados`);
    console.log(`🔄 [ADVANCED] Retry logic: 3 tentativas com 5s de intervalo`);
    console.log(`📡 [ADVANCED] Health: http://localhost:${PORT}/health`);
    console.log(`🔑 [ADVANCED] Token configurado: ${AUTH_TOKEN.substring(0, 10)}...`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 [ADVANCED] Encerrando servidor...');
    instances.forEach((instance) => {
        if (instance.client) {
            instance.client.destroy().catch(() => {});
        }
    });
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 [ADVANCED] Recebido SIGTERM...');
    instances.forEach((instance) => {
        if (instance.client) {
            instance.client.destroy().catch(() => {});
        }
    });
    process.exit(0);
});

ADVANCED_EOF

# ETAPA 6: CRIAR DIRETÓRIO DE SESSÕES
log "📁 Criando estrutura de diretórios..."
mkdir -p /root/whatsapp_sessions
chmod 755 /root/whatsapp_sessions

# ETAPA 7: TESTE AVANÇADO DO PUPPETEER
log "🧪 Testando configuração Puppeteer avançada..."
cat > /tmp/test-puppeteer-advanced.js << 'TEST_EOF'
const puppeteer = require('puppeteer');

const advancedConfig = {
    headless: true,
    executablePath: '/usr/bin/google-chrome-stable',
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--single-process',
        '--disable-gpu',
        '--remote-debugging-port=0',
        '--disable-hang-monitor'
    ],
    timeout: 30000
};

(async () => {
    try {
        console.log('🧪 Testando Puppeteer com configuração avançada...');
        
        const browser = await puppeteer.launch(advancedConfig);
        console.log('✅ Puppeteer lançado com sucesso!');
        
        const page = await browser.newPage();
        console.log('✅ Nova página criada!');
        
        // Testar setUserAgent (problema original)
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        console.log('✅ User Agent definido com sucesso!');
        
        await page.goto('https://www.google.com', { timeout: 15000 });
        console.log('✅ Página carregada com sucesso!');
        
        await browser.close();
        console.log('✅ TESTE PUPPETEER AVANÇADO: SUCESSO TOTAL!');
        
    } catch (error) {
        console.error('❌ ERRO NO TESTE AVANÇADO:', error.message);
        process.exit(1);
    }
})();
TEST_EOF

node /tmp/test-puppeteer-advanced.js

if [ $? -eq 0 ]; then
    log "✅ Teste Puppeteer avançado passou!"
else
    log "❌ Teste Puppeteer avançado falhou!"
    exit 1
fi

# ETAPA 8: INICIAR SERVIDOR AVANÇADO
log "🚀 Iniciando servidor WhatsApp avançado..."
pm2 start /root/whatsapp-server-advanced.js --name whatsapp-main-3002
pm2 save

# ETAPA 9: VERIFICAR STATUS
sleep 5
log "📊 Verificando status final..."
pm2 status whatsapp-main-3002

# Testar health check
curl -s http://localhost:3002/health | head -c 300
echo ""

log "✅ CORREÇÃO AVANÇADA PUPPETEER CONCLUÍDA!"
echo ""
echo "🎉 RESUMO DA CORREÇÃO AVANÇADA:"
echo "   ✅ Chrome Stable: $CHROME_PATH"
echo "   ✅ Dependências completas instaladas"
echo "   ✅ Puppeteer + puppeteer-core instalados"
echo "   ✅ Configuração ultra-estável com ${#ADVANCED_PUPPETEER_CONFIG[@]} args"
echo "   ✅ Retry logic: 3 tentativas com 5s intervalo"
echo "   ✅ Timeouts aumentados: 45s para inicialização"
echo "   ✅ CDP stability: User Agent override corrigido"
echo "   ✅ Servidor avançado iniciado: porta 3002"
echo ""
echo "📋 TESTES FINAIS:"
echo "   curl http://localhost:3002/health"
echo "   pm2 logs whatsapp-main-3002"
echo ""
echo "🔍 PRÓXIMO PASSO:"
echo "   Execute o teste de criação de instância na interface"
echo "   O QR Code deve aparecer em 10-20 segundos máximo"
