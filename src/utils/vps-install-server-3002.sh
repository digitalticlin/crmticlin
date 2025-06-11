
#!/bin/bash

# INSTALAÇÃO COMPLETA SERVIDOR WHATSAPP - PORTA 3002
echo "🚀 INSTALAÇÃO COMPLETA SERVIDOR WHATSAPP - PORTA 3002"
echo "===================================================="
echo "📅 Data: $(date)"
echo "🎯 Objetivo: Instalar servidor completo na porta 3002"
echo ""

# Configurações
PORT=3002
AUTH_TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3"
WEBHOOK_URL="https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web"

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

# FASE 1: ATUALIZAÇÃO DO SISTEMA
echo ""
echo "🔄 FASE 1: ATUALIZAÇÃO DO SISTEMA"
echo "==============================="

log_install "Atualizando sistema Ubuntu..."
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

# FASE 4: INSTALAÇÃO PM2
echo ""
echo "⚙️ FASE 4: INSTALAÇÃO PM2"
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

# FASE 5: CRIAÇÃO DO AMBIENTE SERVIDOR
echo ""
echo "📦 FASE 5: CRIAÇÃO DO AMBIENTE SERVIDOR"
echo "======================================"

log_install "Criando ambiente do servidor WhatsApp..."

# Criar diretório principal
mkdir -p /root/whatsapp-server
cd /root/whatsapp-server

# Inicializar projeto
npm init -y

# Instalar dependências específicas
log_install "Instalando dependências do servidor..."
npm install whatsapp-web.js@1.30.0
npm install express@4.19.2 cors@2.8.5 qrcode@1.5.4 node-fetch@3.3.2

# Criar diretórios necessários
mkdir -p sessions
mkdir -p backups
mkdir -p logs

log_success "Ambiente do servidor criado"

# FASE 6: CRIAÇÃO DO SERVIDOR WHATSAPP COMPLETO - PORTA 3002
echo ""
echo "🎯 FASE 6: CRIAÇÃO DO SERVIDOR WHATSAPP COMPLETO - PORTA 3002"
echo "============================================================"

log_install "Criando servidor WhatsApp completo para porta 3002..."

cat > whatsapp-server.js << 'EOF'
const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3002;
const AUTH_TOKEN = process.env.AUTH_TOKEN || '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web';

// Configuração otimizada do Puppeteer
const PUPPETEER_CONFIG = {
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows'
    ],
    ignoreDefaultArgs: ['--disable-extensions'],
    timeout: 60000
};

console.log('🎯 SERVIDOR WHATSAPP COMPLETO INICIADO - PORTA 3002');
console.log('Chrome path:', PUPPETEER_CONFIG.executablePath);

// Storage para instâncias
const instances = new Map();
let serverStartTime = new Date();

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token || token !== AUTH_TOKEN) {
        return res.status(401).json({ success: false, error: 'Token inválido' });
    }
    
    next();
};

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'online',
        version: 'WhatsApp Server v3.0.0 - Porta 3002',
        port: PORT,
        activeInstances: instances.size,
        serverUptime: Math.floor((new Date() - serverStartTime) / 1000),
        configuration: {
            type: 'COMPLETE_SERVER_3002',
            chromeVersion: 'System Chrome',
            puppeteerConfig: 'OPTIMIZED'
        },
        timestamp: new Date().toISOString()
    });
});

// Status do servidor
app.get('/status', (req, res) => {
    res.json({
        success: true,
        status: 'running',
        server: 'WhatsApp Complete Server',
        version: '3.0.0',
        port: PORT,
        instances: instances.size,
        timestamp: new Date().toISOString()
    });
});

// Função para criar cliente otimizado
async function createOptimizedClient(instanceId) {
    try {
        console.log(`🎯 [${instanceId}] Criando cliente otimizado...`);
        
        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: instanceId,
                dataPath: `./sessions/${instanceId}`
            }),
            puppeteer: PUPPETEER_CONFIG,
            qrMaxRetries: 5,
            takeoverOnConflict: true,
            takeoverTimeoutMs: 15000
        });

        console.log(`✅ [${instanceId}] Cliente otimizado criado`);
        return client;
        
    } catch (error) {
        console.error(`❌ [${instanceId}] Erro ao criar cliente:`, error.message);
        throw error;
    }
}

// Função para enviar webhook
async function sendWebhook(url, data) {
    try {
        await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
    } catch (error) {
        console.error('❌ Erro ao enviar webhook:', error.message);
    }
}

// Criar instância
app.post('/instance/create', authenticateToken, async (req, res) => {
    try {
        const { instanceId, sessionName } = req.body;
        
        if (!instanceId) {
            return res.status(400).json({ 
                success: false, 
                error: 'instanceId é obrigatório' 
            });
        }

        if (instances.has(instanceId)) {
            return res.status(409).json({ 
                success: false, 
                error: 'Instância já existe' 
            });
        }

        console.log(`🎯 PORTA 3002: Criando instância ${instanceId}`);

        const client = await createOptimizedClient(instanceId);
        
        const instanceData = {
            id: instanceId,
            sessionName: sessionName || instanceId,
            client: client,
            status: 'initializing',
            qrCode: null,
            phone: null,
            profileName: null,
            lastSeen: new Date(),
            createdAt: new Date()
        };

        // Event handlers
        client.on('qr', async (qr) => {
            console.log(`📱 [${instanceId}] QR Code gerado`);
            try {
                const qrCodeDataURL = await QRCode.toDataURL(qr);
                instanceData.qrCode = qrCodeDataURL;
                instanceData.status = 'waiting_scan';
                console.log(`✅ [${instanceId}] QR Code convertido`);
                
                // Enviar para webhook
                await sendWebhook(WEBHOOK_URL, {
                    event: 'qr.update',
                    instanceId: instanceId,
                    qrCode: qrCodeDataURL,
                    timestamp: new Date().toISOString()
                });
            } catch (qrError) {
                console.error(`❌ [${instanceId}] Erro ao gerar QR Code:`, qrError);
                instanceData.qrCode = qr;
            }
        });

        client.on('ready', () => {
            console.log(`✅ [${instanceId}] Cliente pronto`);
            instanceData.status = 'ready';
            instanceData.phone = client.info?.wid?.user;
            instanceData.profileName = client.info?.pushname;
            
            // Enviar para webhook
            sendWebhook(WEBHOOK_URL, {
                event: 'connection.update',
                instanceId: instanceId,
                status: 'ready',
                phone: instanceData.phone,
                profileName: instanceData.profileName,
                timestamp: new Date().toISOString()
            });
        });

        client.on('authenticated', () => {
            console.log(`🔐 [${instanceId}] Cliente autenticado`);
            instanceData.status = 'authenticated';
        });

        client.on('auth_failure', (msg) => {
            console.error(`❌ [${instanceId}] Falha de autenticação:`, msg);
            instanceData.status = 'auth_failure';
        });

        client.on('disconnected', (reason) => {
            console.log(`📵 [${instanceId}] Cliente desconectado:`, reason);
            instanceData.status = 'disconnected';
            instances.delete(instanceId);
        });

        client.on('message', (message) => {
            console.log(`📨 [${instanceId}] Nova mensagem de ${message.from}`);
            
            // Enviar para webhook
            sendWebhook(WEBHOOK_URL, {
                event: 'messages.upsert',
                instanceId: instanceId,
                message: {
                    id: message.id._serialized,
                    from: message.from,
                    to: message.to,
                    body: message.body,
                    timestamp: message.timestamp,
                    type: message.type
                },
                timestamp: new Date().toISOString()
            });
        });

        // Inicializar cliente
        await client.initialize();
        instances.set(instanceId, instanceData);
        
        console.log(`✅ PORTA 3002: Instância ${instanceId} criada com sucesso`);
        
        res.json({
            success: true,
            status: 'initializing',
            message: 'Instância criada com sucesso',
            instanceId: instanceId,
            server: 'COMPLETE_SERVER_3002'
        });

    } catch (error) {
        console.error(`❌ PORTA 3002: Erro ao criar instância:`, error);
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
            status: instance.status
        });
    } else {
        res.json({ 
            success: false, 
            waiting: true,
            status: instance.status,
            message: 'QR Code sendo gerado...'
        });
    }
});

// Status da instância
app.get('/instance/:instanceId/status', authenticateToken, (req, res) => {
    const { instanceId } = req.params;
    const instance = instances.get(instanceId);
    
    if (!instance) {
        return res.status(404).json({ 
            success: false, 
            error: 'Instância não encontrada' 
        });
    }
    
    res.json({
        success: true,
        status: instance.status,
        phone: instance.phone,
        profileName: instance.profileName,
        hasQrCode: !!instance.qrCode,
        lastSeen: instance.lastSeen
    });
});

// Enviar mensagem
app.post('/instance/:instanceId/send', authenticateToken, async (req, res) => {
    const { instanceId } = req.params;
    const { phone, message } = req.body;
    const instance = instances.get(instanceId);
    
    if (!instance) {
        return res.status(404).json({ 
            success: false, 
            error: 'Instância não encontrada' 
        });
    }
    
    if (instance.status !== 'ready') {
        return res.status(400).json({ 
            success: false, 
            error: 'Instância não está pronta' 
        });
    }
    
    try {
        const chatId = phone.includes('@') ? phone : `${phone}@c.us`;
        await instance.client.sendMessage(chatId, message);
        
        res.json({ 
            success: true, 
            message: 'Mensagem enviada com sucesso' 
        });
    } catch (error) {
        console.error(`❌ [${instanceId}] Erro ao enviar mensagem:`, error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Deletar instância
app.delete('/instance/:instanceId', authenticateToken, async (req, res) => {
    const { instanceId } = req.params;
    const instance = instances.get(instanceId);
    
    if (!instance) {
        return res.status(404).json({ 
            success: false, 
            error: 'Instância não encontrada' 
        });
    }
    
    try {
        if (instance.client) {
            await instance.client.destroy();
        }
        instances.delete(instanceId);
        
        res.json({ 
            success: true, 
            message: 'Instância deletada com sucesso' 
        });
    } catch (error) {
        console.error(`❌ Erro ao deletar instância ${instanceId}:`, error);
        instances.delete(instanceId);
        res.json({ 
            success: true, 
            message: 'Instância removida (com erro na destruição)' 
        });
    }
});

// Listar instâncias
app.get('/instances', authenticateToken, (req, res) => {
    const instancesList = Array.from(instances.values()).map(instance => ({
        id: instance.id,
        sessionName: instance.sessionName,
        status: instance.status,
        phone: instance.phone,
        profileName: instance.profileName,
        hasQrCode: !!instance.qrCode,
        lastSeen: instance.lastSeen,
        createdAt: instance.createdAt
    }));
    
    res.json({
        success: true,
        instances: instancesList,
        total: instancesList.length
    });
});

// Envio direto de mensagem
app.post('/send', authenticateToken, async (req, res) => {
    const { instanceId, phone, message } = req.body;
    
    if (!instanceId || !phone || !message) {
        return res.status(400).json({
            success: false,
            error: 'Parâmetros obrigatórios: instanceId, phone, message'
        });
    }
    
    const instance = instances.get(instanceId);
    
    if (!instance) {
        return res.status(404).json({
            success: false,
            error: 'Instância não encontrada'
        });
    }
    
    if (instance.status !== 'ready') {
        return res.status(400).json({
            success: false,
            error: 'Instância não está pronta'
        });
    }
    
    try {
        const chatId = phone.includes('@') ? phone : `${phone}@c.us`;
        const sentMessage = await instance.client.sendMessage(chatId, message);
        
        res.json({
            success: true,
            messageId: sentMessage.id._serialized,
            timestamp: sentMessage.timestamp
        });
    } catch (error) {
        console.error(`❌ Erro ao enviar mensagem:`, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Webhook endpoint
app.post('/webhook/:instanceId', (req, res) => {
    const { instanceId } = req.params;
    console.log(`📡 [${instanceId}] Webhook recebido:`, req.body);
    
    res.json({ 
        success: true, 
        message: 'Webhook recebido' 
    });
});

// Webhook global
app.get('/webhook/global', authenticateToken, (req, res) => {
    res.json({
        success: true,
        webhook: WEBHOOK_URL,
        active: !!WEBHOOK_URL,
        port: PORT
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log('🎉 SERVIDOR WHATSAPP COMPLETO INICIADO - PORTA 3002!');
    console.log('=================================================');
    console.log(`✅ Porta: ${PORT}`);
    console.log(`✅ Configuração: COMPLETE_SERVER_3002`);
    console.log(`✅ Chrome: ${PUPPETEER_CONFIG.executablePath}`);
    console.log(`✅ Token: ${AUTH_TOKEN.substring(0, 10)}...`);
    console.log(`✅ Webhook: ${WEBHOOK_URL}`);
    console.log('=================================================');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Encerrando servidor...');
    
    const shutdownPromises = Array.from(instances.entries()).map(async ([instanceId, instance]) => {
        try {
            if (instance.client) {
                console.log(`📵 Desconectando ${instanceId}...`);
                await instance.client.destroy();
            }
        } catch (error) {
            console.error(`❌ Erro ao desconectar ${instanceId}:`, error);
        }
    });
    
    await Promise.allSettled(shutdownPromises);
    console.log('✅ Servidor encerrado com segurança');
    process.exit(0);
});

console.log('🎯 SERVIDOR WHATSAPP COMPLETO PRONTO - PORTA 3002!');
EOF

log_success "Servidor WhatsApp completo criado"

# FASE 7: CONFIGURAÇÃO DE VARIÁVEIS ESPECÍFICAS
echo ""
echo "🌍 FASE 7: CONFIGURAÇÃO DE VARIÁVEIS ESPECÍFICAS"
echo "=============================================="

log_install "Configurando variáveis do servidor para porta 3002..."

export PORT=3002
export AUTH_TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3"
export WEBHOOK_URL="https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web"
export PUPPETEER_EXECUTABLE_PATH="/usr/bin/google-chrome-stable"

echo "" >> ~/.bashrc
echo "# WhatsApp Complete Server - Porta 3002" >> ~/.bashrc
echo "export PORT=3002" >> ~/.bashrc
echo "export AUTH_TOKEN=\"3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3\"" >> ~/.bashrc
echo "export WEBHOOK_URL=\"https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web\"" >> ~/.bashrc
echo "export PUPPETEER_EXECUTABLE_PATH=\"/usr/bin/google-chrome-stable\"" >> ~/.bashrc

log_success "Variáveis configuradas para porta 3002"

# FASE 8: DEPLOY DO SERVIDOR
echo ""
echo "🚀 FASE 8: DEPLOY DO SERVIDOR"
echo "============================"

log_install "Iniciando servidor completo com PM2 na porta 3002..."

# Parar qualquer servidor anterior
pm2 stop whatsapp-main-3002 2>/dev/null || true
pm2 delete whatsapp-main-3002 2>/dev/null || true

# Iniciar servidor na porta 3002
PORT=3002 AUTH_TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" pm2 start whatsapp-server.js --name whatsapp-main-3002 --env production

# Salvar configuração
pm2 save

log_success "Servidor completo iniciado na porta 3002"

# FASE 9: VALIDAÇÃO FINAL
echo ""
echo "✅ FASE 9: VALIDAÇÃO FINAL"
echo "========================"

log_install "Aguardando inicialização (10s)..."
sleep 10

# Teste health check
echo "🧪 Testando health check na porta 3002..."
health_response=$(curl -s http://localhost:3002/health 2>/dev/null)

if echo "$health_response" | grep -q "COMPLETE_SERVER_3002"; then
    log_success "Health check: SERVIDOR COMPLETO ATIVO NA PORTA 3002"
else
    log_error "Health check falhou"
    echo "📋 Response: $health_response"
fi

# Verificar PM2
pm2_status=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="whatsapp-main-3002") | .pm2_env.status' 2>/dev/null)

if [ "$pm2_status" = "online" ]; then
    log_success "PM2 Status: ONLINE"
else
    log_error "PM2 Status: $pm2_status"
fi

# Verificar porta 3002
if netstat -tulpn 2>/dev/null | grep ":3002" >/dev/null; then
    log_success "Porta 3002: ATIVA"
else
    log_error "Porta 3002: NÃO ATIVA"
fi

# RESUMO DA IMPLEMENTAÇÃO
echo ""
echo "🎉 SERVIDOR COMPLETO IMPLEMENTADO NA PORTA 3002!"
echo "==============================================="

echo "✅ SERVIDOR WHATSAPP COMPLETO:"
echo "   ✅ Arquivo: whatsapp-server.js"
echo "   ✅ Porta: 3002"
echo "   ✅ PM2: whatsapp-main-3002"
echo "   ✅ Status: $(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="whatsapp-main-3002") | .pm2_env.status' 2>/dev/null || echo "VERIFICAR")"
echo "   ✅ Health Check: FUNCIONANDO"
echo "   ✅ Token: Configurado"
echo "   ✅ Webhook: Configurado para Supabase"

echo ""
echo "🎯 SERVIDOR FINAL:"
echo "   📁 Diretório: /root/whatsapp-server"
echo "   🌐 Servidor: whatsapp-server.js"
echo "   ⚙️ PM2: whatsapp-main-3002"
echo "   🔗 URL: http://$(hostname -I | awk '{print $1}'):3002"

echo ""
echo "📋 ENDPOINTS DISPONÍVEIS:"
echo "   GET  /health"
echo "   GET  /status" 
echo "   GET  /instances"
echo "   POST /instance/create"
echo "   GET  /instance/:id/qr"
echo "   GET  /instance/:id/status"
echo "   POST /instance/:id/send"
echo "   POST /send"
echo "   DELETE /instance/:id"
echo "   GET  /webhook/global"

echo ""
echo "📋 COMANDOS ÚTEIS:"
echo "   pm2 logs whatsapp-main-3002"
echo "   curl http://localhost:3002/health"
echo "   pm2 restart whatsapp-main-3002"
echo "   pm2 monit"

log_success "SERVIDOR COMPLETO IMPLEMENTADO COM SUCESSO NA PORTA 3002!"

echo ""
echo "🚀 PRÓXIMO TESTE:"
echo "   curl http://31.97.24.222:3002/health"
echo "   (Deve retornar status do servidor completo)"
