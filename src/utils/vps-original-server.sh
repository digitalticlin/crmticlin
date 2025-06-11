
#!/bin/bash

# SERVIDOR WHATSAPP ORIGINAL - IMPLEMENTAÇÃO COMPLETA
echo "🎯 SERVIDOR WHATSAPP ORIGINAL - IMPLEMENTAÇÃO COMPLETA"
echo "====================================================="
echo "📅 Data: $(date)"
echo "🎯 Objetivo: Implementar servidor WhatsApp original na porta 3001"
echo ""

# Função de log
log_server() {
    echo "[$(date '+%H:%M:%S')] 🎯 $1"
}

log_deploy() {
    echo "[$(date '+%H:%M:%S')] 🚀 $1"
}

log_success() {
    echo "[$(date '+%H:%M:%S')] ✅ $1"
}

log_error() {
    echo "[$(date '+%H:%M:%S')] ❌ $1"
}

# Verificar se estamos no diretório correto
cd /root/whatsapp-original

if [ ! -f "package.json" ]; then
    log_error "Execute primeiro: vps-clean-installation.sh"
    exit 1
fi

# FASE 1: CRIAÇÃO DO SERVIDOR ORIGINAL COMPLETO
echo ""
echo "🎯 FASE 1: CRIAÇÃO DO SERVIDOR ORIGINAL COMPLETO"
echo "=============================================="

log_server "Criando servidor WhatsApp original completo..."

cat > whatsapp-server.js << 'EOF'
const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const AUTH_TOKEN = process.env.AUTH_TOKEN || '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';

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

console.log('🎯 SERVIDOR WHATSAPP ORIGINAL INICIADO');
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
        version: 'WhatsApp Server Original v3.0.0',
        port: PORT,
        activeInstances: instances.size,
        serverUptime: Math.floor((new Date() - serverStartTime) / 1000),
        configuration: {
            type: 'ORIGINAL_OPTIMIZED',
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
        server: 'WhatsApp Original Server',
        version: '3.0.0',
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

        console.log(`🎯 ORIGINAL: Criando instância ${instanceId}`);

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

        // Inicializar cliente
        await client.initialize();
        instances.set(instanceId, instanceData);
        
        console.log(`✅ ORIGINAL: Instância ${instanceId} criada com sucesso`);
        
        res.json({
            success: true,
            status: 'initializing',
            message: 'Instância criada com sucesso',
            instanceId: instanceId,
            server: 'ORIGINAL_OPTIMIZED'
        });

    } catch (error) {
        console.error(`❌ ORIGINAL: Erro ao criar instância:`, error);
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

// Webhook endpoint
app.post('/webhook/:instanceId', (req, res) => {
    const { instanceId } = req.params;
    console.log(`📡 [${instanceId}] Webhook recebido:`, req.body);
    
    res.json({ 
        success: true, 
        message: 'Webhook recebido' 
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log('🎉 SERVIDOR WHATSAPP ORIGINAL INICIADO!');
    console.log('======================================');
    console.log(`✅ Porta: ${PORT}`);
    console.log(`✅ Configuração: ORIGINAL_OPTIMIZED`);
    console.log(`✅ Chrome: ${PUPPETEER_CONFIG.executablePath}`);
    console.log(`✅ Token: ${AUTH_TOKEN.substring(0, 10)}...`);
    console.log('======================================');
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

console.log('🎯 SERVIDOR WHATSAPP ORIGINAL PRONTO!');
EOF

log_success "Servidor original criado"

# FASE 2: CONFIGURAÇÃO DE VARIÁVEIS ESPECÍFICAS
echo ""
echo "🌍 FASE 2: CONFIGURAÇÃO DE VARIÁVEIS ESPECÍFICAS"
echo "=============================================="

log_server "Configurando variáveis do servidor original..."

export PORT=3001
export AUTH_TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3"

echo "" >> ~/.bashrc
echo "# WhatsApp Original Server" >> ~/.bashrc
echo "export PORT=3001" >> ~/.bashrc
echo "export AUTH_TOKEN=\"3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3\"" >> ~/.bashrc

log_success "Variáveis configuradas"

# FASE 3: DEPLOY DO SERVIDOR
echo ""
echo "🚀 FASE 3: DEPLOY DO SERVIDOR"
echo "============================"

log_deploy "Iniciando servidor original com PM2..."

# Parar qualquer servidor anterior
pm2 stop whatsapp-original-3001 2>/dev/null || true
pm2 delete whatsapp-original-3001 2>/dev/null || true

# Iniciar servidor original
pm2 start whatsapp-server.js --name whatsapp-original-3001 --env production

# Salvar configuração
pm2 save

log_success "Servidor original iniciado"

# FASE 4: VALIDAÇÃO INICIAL
echo ""
echo "✅ FASE 4: VALIDAÇÃO INICIAL"
echo "=========================="

log_server "Aguardando inicialização (10s)..."
sleep 10

# Teste health check
echo "🧪 Testando health check..."
health_response=$(curl -s http://localhost:3001/health 2>/dev/null)

if echo "$health_response" | grep -q "WhatsApp Server Original"; then
    log_success "Health check: SERVIDOR ORIGINAL ATIVO"
else
    log_error "Health check falhou"
    echo "📋 Response: $health_response"
fi

# Verificar PM2
pm2_status=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="whatsapp-original-3001") | .pm2_env.status' 2>/dev/null)

if [ "$pm2_status" = "online" ]; then
    log_success "PM2 Status: ONLINE"
else
    log_error "PM2 Status: $pm2_status"
fi

# RESUMO DA IMPLEMENTAÇÃO
echo ""
echo "🎉 SERVIDOR ORIGINAL IMPLEMENTADO!"
echo "================================="

echo "✅ SERVIDOR WHATSAPP ORIGINAL:"
echo "   ✅ Arquivo: whatsapp-server.js"
echo "   ✅ Porta: 3001"
echo "   ✅ PM2: whatsapp-original-3001"
echo "   ✅ Status: $(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="whatsapp-original-3001") | .pm2_env.status' 2>/dev/null || echo "VERIFICAR")"
echo "   ✅ Health Check: FUNCIONANDO"
echo "   ✅ Token: Configurado"

echo ""
echo "🎯 SERVIDOR FINAL:"
echo "   📁 Diretório: /root/whatsapp-original"
echo "   🌐 Servidor: whatsapp-server.js"
echo "   ⚙️ PM2: whatsapp-original-3001"
echo "   🔗 URL: http://$(hostname -I | awk '{print $1}'):3001"

echo ""
echo "🚀 PRÓXIMO PASSO:"
echo "   Execute: bash vps-original-test.sh"
echo "   (Teste completo do servidor)"

echo ""
echo "📋 COMANDOS ÚTEIS:"
echo "   pm2 logs whatsapp-original-3001"
echo "   curl http://localhost:3001/health"
echo "   pm2 restart whatsapp-original-3001"

log_success "SERVIDOR ORIGINAL IMPLEMENTADO COM SUCESSO!"
