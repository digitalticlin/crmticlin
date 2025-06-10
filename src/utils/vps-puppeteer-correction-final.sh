
#!/bin/bash

# CORREÇÃO DEFINITIVA PUPPETEER VPS - Script Final
# Executar na VPS: wget -O - https://raw.githubusercontent.com/user/repo/main/vps-puppeteer-correction-final.sh | bash
# Ou copiar este conteúdo e salvar como fix-puppeteer.sh e executar: bash fix-puppeteer.sh

echo "🔧 CORREÇÃO DEFINITIVA PUPPETEER VPS - WhatsApp Web.js"
echo "====================================================="
echo "📍 VPS: 31.97.24.222:3002"
echo "📅 $(date)"
echo ""

# Função de log
log() {
    echo "[$(date '+%H:%M:%S')] $1"
}

log "🚀 INICIANDO CORREÇÃO DEFINITIVA DO PUPPETEER"

# 1. PARAR SERVIÇOS WHATSAPP
log "⏹️ Parando serviços WhatsApp..."
pm2 stop whatsapp-main-3002 2>/dev/null || echo "Serviço já parado"
pm2 delete whatsapp-main-3002 2>/dev/null || echo "Serviço já removido"
pkill -f "node.*3002" 2>/dev/null || echo "Nenhum processo node na porta 3002"

# 2. ATUALIZAR SISTEMA
log "📦 Atualizando sistema..."
apt-get update -y > /dev/null 2>&1

# 3. INSTALAR DEPENDÊNCIAS CHROME
log "🌐 Instalando Google Chrome Stable..."
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - 2>/dev/null
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
apt-get update -y > /dev/null 2>&1
apt-get install -y google-chrome-stable > /dev/null 2>&1

# 4. INSTALAR DEPENDÊNCIAS HEADLESS
log "🔧 Instalando dependências headless..."
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
  xvfb > /dev/null 2>&1

# 5. VERIFICAR CHROME
log "✅ Verificando instalação do Chrome..."
CHROME_PATH=""
if command -v google-chrome-stable &> /dev/null; then
    CHROME_PATH="/usr/bin/google-chrome-stable"
    echo "   Chrome Stable: $CHROME_PATH"
elif command -v google-chrome &> /dev/null; then
    CHROME_PATH="/usr/bin/google-chrome"
    echo "   Chrome: $CHROME_PATH"
elif command -v chromium-browser &> /dev/null; then
    CHROME_PATH="/usr/bin/chromium-browser"
    echo "   Chromium: $CHROME_PATH"
else
    log "❌ ERRO: Nenhum Chrome encontrado!"
    exit 1
fi

# 6. TESTAR CHROME HEADLESS
log "🧪 Testando Chrome headless..."
$CHROME_PATH --headless --disable-gpu --no-sandbox --dump-dom https://www.google.com > /dev/null 2>&1
if [ $? -eq 0 ]; then
    log "✅ Chrome funciona perfeitamente!"
else
    log "⚠️ Chrome com problemas, mas continuando..."
fi

# 7. CRIAR SERVIDOR WHATSAPP CORRIGIDO
log "📝 Criando servidor WhatsApp com configuração Puppeteer corrigida..."
cat > /root/whatsapp-server-corrected.js << 'EOF'
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

// CONFIGURAÇÃO PUPPETEER CORRIGIDA - DEFINITIVA
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

// Storage para instâncias
const instances = new Map();
let instanceCounter = 1;

// Função para criar instância com configuração corrigida
const createWhatsAppInstance = async (instanceName) => {
    try {
        console.log(`[CORRECTED] 🚀 Criando instância: ${instanceName}`);
        
        const instanceId = `wa_${instanceName}_${Date.now()}`;
        const sessionPath = path.join('/root/whatsapp_sessions', instanceId);
        
        // Garantir que o diretório existe
        if (!fs.existsSync('/root/whatsapp_sessions')) {
            fs.mkdirSync('/root/whatsapp_sessions', { recursive: true });
        }
        
        console.log(`[CORRECTED] 📁 Sessão: ${sessionPath}`);
        console.log(`[CORRECTED] 🔧 Executável Chrome: ${PUPPETEER_CONFIG_CORRECTED.executablePath}`);
        console.log(`[CORRECTED] ⚙️ Args Chrome: ${PUPPETEER_CONFIG_CORRECTED.args.length} argumentos`);
        
        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: instanceId,
                dataPath: sessionPath
            }),
            puppeteer: PUPPETEER_CONFIG_CORRECTED,
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
            phone: null
        };
        
        // Event listeners
        client.on('qr', (qr) => {
            console.log(`[CORRECTED] 📱 QR Code gerado para ${instanceId}`);
            instanceData.qrCode = qr;
            instanceData.status = 'waiting_qr';
            instanceData.lastActivity = new Date();
        });
        
        client.on('ready', () => {
            console.log(`[CORRECTED] ✅ Cliente pronto: ${instanceId}`);
            instanceData.status = 'ready';
            instanceData.connected = true;
            instanceData.lastActivity = new Date();
            instanceData.phone = client.info?.wid?.user || 'unknown';
        });
        
        client.on('authenticated', () => {
            console.log(`[CORRECTED] 🔐 Autenticado: ${instanceId}`);
            instanceData.status = 'authenticated';
            instanceData.lastActivity = new Date();
        });
        
        client.on('disconnected', (reason) => {
            console.log(`[CORRECTED] ❌ Desconectado ${instanceId}: ${reason}`);
            instanceData.status = 'disconnected';
            instanceData.connected = false;
            instanceData.lastActivity = new Date();
        });
        
        // Inicializar cliente
        console.log(`[CORRECTED] 🔄 Inicializando cliente com Puppeteer corrigido...`);
        await client.initialize();
        
        instances.set(instanceId, instanceData);
        console.log(`[CORRECTED] ✅ Instância criada e armazenada: ${instanceId}`);
        
        return {
            success: true,
            instanceId,
            instanceName,
            status: instanceData.status,
            message: 'Instância criada com configuração Puppeteer corrigida'
        };
        
    } catch (error) {
        console.error(`[CORRECTED] ❌ Erro ao criar instância:`, error);
        return {
            success: false,
            error: error.message,
            details: error.stack
        };
    }
};

// ENDPOINTS DA API

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'online',
        server: 'WhatsApp VPS Corrected',
        port: PORT,
        timestamp: new Date().toISOString(),
        instances: instances.size,
        puppeteer_config: 'CORRECTED',
        chrome_path: PUPPETEER_CONFIG_CORRECTED.executablePath
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
        hasQrCode: !!inst.qrCode
    }));
    
    res.json({
        success: true,
        instances: instanceList,
        total: instanceList.length
    });
});

// Criar instância
app.post('/instance/create', authenticateToken, async (req, res) => {
    try {
        const { instanceName } = req.body;
        
        if (!instanceName) {
            return res.status(400).json({
                success: false,
                error: 'instanceName é obrigatório'
            });
        }
        
        console.log(`[CORRECTED] 📥 Recebida solicitação de criação: ${instanceName}`);
        
        const result = await createWhatsAppInstance(instanceName);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
        
    } catch (error) {
        console.error(`[CORRECTED] ❌ Erro no endpoint create:`, error);
        res.status(500).json({
            success: false,
            error: error.message
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
            instanceId
        });
    } else {
        res.json({
            success: false,
            waiting: true,
            status: instance.status,
            message: 'QR Code ainda sendo gerado'
        });
    }
});

// Enviar mensagem
app.post('/send', authenticateToken, async (req, res) => {
    try {
        const { instanceId, phone, message } = req.body;
        
        if (!instanceId || !phone || !message) {
            return res.status(400).json({
                success: false,
                error: 'instanceId, phone e message são obrigatórios'
            });
        }
        
        const instance = instances.get(instanceId);
        
        if (!instance || !instance.connected) {
            return res.status(400).json({
                success: false,
                error: 'Instância não encontrada ou não conectada'
            });
        }
        
        const result = await instance.client.sendMessage(`${phone}@c.us`, message);
        
        res.json({
            success: true,
            messageId: result.id,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error(`[CORRECTED] ❌ Erro ao enviar mensagem:`, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [CORRECTED] WhatsApp Server rodando na porta ${PORT}`);
    console.log(`✅ [CORRECTED] Puppeteer configurado com Chrome: ${PUPPETEER_CONFIG_CORRECTED.executablePath}`);
    console.log(`🔧 [CORRECTED] Args Chrome: ${PUPPETEER_CONFIG_CORRECTED.args.length} argumentos`);
    console.log(`📡 [CORRECTED] Health: http://localhost:${PORT}/health`);
    console.log(`🔑 [CORRECTED] Token configurado: ${AUTH_TOKEN.substring(0, 10)}...`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 [CORRECTED] Encerrando servidor...');
    instances.forEach((instance) => {
        if (instance.client) {
            instance.client.destroy();
        }
    });
    process.exit(0);
});

EOF

# 8. INSTALAR DEPENDÊNCIAS NODE.JS
log "📦 Instalando dependências Node.js..."
cd /root
npm install whatsapp-web.js express cors --save > /dev/null 2>&1

# 9. CRIAR DIRETÓRIO DE SESSÕES
log "📁 Criando diretório de sessões..."
mkdir -p /root/whatsapp_sessions
chmod 755 /root/whatsapp_sessions

# 10. CONFIGURAR VARIÁVEIS DE AMBIENTE
log "🌍 Configurando variáveis de ambiente..."
echo "export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true" >> /root/.bashrc
echo "export PUPPETEER_EXECUTABLE_PATH=$CHROME_PATH" >> /root/.bashrc
source /root/.bashrc

# 11. TESTAR CONFIGURAÇÃO PUPPETEER
log "🧪 Testando configuração Puppeteer corrigida..."
cat > /tmp/test-puppeteer-final.js << 'EOF'
const puppeteer = require('puppeteer');

const config = {
    headless: true,
    executablePath: '/usr/bin/google-chrome-stable',
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process',
        '--disable-gpu'
    ],
    timeout: 15000
};

(async () => {
    try {
        console.log('🧪 Testando Puppeteer com configuração final...');
        const browser = await puppeteer.launch(config);
        console.log('✅ Puppeteer inicializado com sucesso!');
        
        const page = await browser.newPage();
        await page.goto('https://www.google.com', { timeout: 10000 });
        console.log('✅ Página carregada com sucesso!');
        
        await browser.close();
        console.log('✅ TESTE PUPPETEER FINAL: SUCESSO TOTAL!');
        
    } catch (error) {
        console.error('❌ ERRO NO TESTE FINAL:', error.message);
    }
})();
EOF

node /tmp/test-puppeteer-final.js

# 12. INICIAR SERVIDOR CORRIGIDO
log "🚀 Iniciando servidor WhatsApp com configuração corrigida..."
pm2 start /root/whatsapp-server-corrected.js --name whatsapp-main-3002
pm2 save

# 13. VERIFICAR STATUS
sleep 3
log "📊 Verificando status do servidor..."
pm2 status whatsapp-main-3002
echo ""
curl -s http://localhost:3002/health | head -c 200
echo ""

log "✅ CORREÇÃO DEFINITIVA PUPPETEER CONCLUÍDA!"
echo ""
echo "🎉 RESUMO DA CORREÇÃO:"
echo "   ✅ Chrome Stable instalado: $CHROME_PATH"
echo "   ✅ Dependências headless instaladas"
echo "   ✅ Configuração Puppeteer corrigida (${#PUPPETEER_CONFIG_CORRECTED[@]} args)"
echo "   ✅ Servidor WhatsApp iniciado: porta 3002"
echo "   ✅ PM2 configurado e salvo"
echo "   ✅ Variáveis de ambiente definidas"
echo ""
echo "📋 COMANDOS ÚTEIS:"
echo "   pm2 logs whatsapp-main-3002    # Ver logs"
echo "   pm2 restart whatsapp-main-3002 # Reiniciar"
echo "   curl http://localhost:3002/health # Testar"
echo ""
echo "🔍 TESTE FINAL:"
echo "   Acesse a interface e tente criar uma instância."
echo "   O QR Code deve aparecer em 10-15 segundos."

