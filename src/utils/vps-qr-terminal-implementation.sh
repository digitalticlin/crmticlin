
#!/bin/bash

# IMPLEMENTAÇÃO QR TERMINAL PARA VPS
echo "🖥️ IMPLEMENTAÇÃO QR TERMINAL PARA VPS"
echo "===================================="
echo "📅 Data: $(date)"
echo "🎯 Objetivo: Implementar QR Terminal para debug do Puppeteer"
echo ""

# Função de log
log_info() {
    echo "[$(date '+%H:%M:%S')] ℹ️ $1"
}

log_success() {
    echo "[$(date '+%H:%M:%S')] ✅ $1"
}

log_error() {
    echo "[$(date '+%H:%M:%S')] ❌ $1"
}

# FASE 1: INSTALAR DEPENDÊNCIAS QR TERMINAL
echo ""
echo "📦 FASE 1: INSTALAÇÃO DE DEPENDÊNCIAS QR TERMINAL"
echo "================================================"

log_info "Navegando para diretório do projeto..."
cd /root/whatsapp-server || exit 1

log_info "Instalando qrcode-terminal..."
if npm install qrcode-terminal --save; then
    log_success "qrcode-terminal instalado com sucesso"
else
    log_error "Falha na instalação do qrcode-terminal"
    exit 1
fi

log_info "Instalando chalk para cores no terminal..."
if npm install chalk --save; then
    log_success "chalk instalado com sucesso"
else
    log_error "Falha na instalação do chalk"
    exit 1
fi

# FASE 2: BACKUP DO SERVIDOR ATUAL
echo ""
echo "💾 FASE 2: BACKUP DO SERVIDOR ATUAL"
echo "=================================="

log_info "Criando backup do servidor atual..."
if cp whatsapp-server.js whatsapp-server-backup-qr-$(date +%Y%m%d_%H%M%S).js; then
    log_success "Backup criado com sucesso"
else
    log_error "Falha ao criar backup"
    exit 1
fi

# FASE 3: ATUALIZAR SERVIDOR COM QR TERMINAL
echo ""
echo "🔧 FASE 3: ATUALIZAÇÃO DO SERVIDOR COM QR TERMINAL"
echo "================================================="

log_info "Atualizando servidor para incluir QR Terminal..."

# Criar versão atualizada do servidor com QR Terminal
cat > whatsapp-server-qr-updated.js << 'EOF'
const express = require('express');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3002;
const AUTH_TOKEN = process.env.AUTH_TOKEN || '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web';

console.log(chalk.blue.bold('🎯 SERVIDOR WHATSAPP COM QR TERMINAL INICIADO - PORTA ' + PORT));

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, error: 'Token de acesso requerido' });
    }

    if (token !== AUTH_TOKEN) {
        return res.status(403).json({ success: false, error: 'Token inválido' });
    }

    next();
};

// Armazenar clientes ativos
const clients = new Map();

// Configuração robusta do Puppeteer para VPS
const PUPPETEER_CONFIG = {
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
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-extensions',
        '--disable-default-apps',
        '--memory-pressure-off',
        '--max_old_space_size=4096'
    ],
    ignoreHTTPSErrors: true,
    timeout: 60000
};

// Função para criar cliente WhatsApp com QR Terminal
function createWhatsAppClient(instanceId, sessionName) {
    console.log(chalk.cyan(`📱 Criando cliente WhatsApp: ${instanceId}`));
    
    const client = new Client({
        authStrategy: new LocalAuth({
            clientId: sessionName || instanceId,
            dataPath: path.join(__dirname, '.wwebjs_auth')
        }),
        puppeteer: PUPPETEER_CONFIG,
        webVersionCache: {
            type: 'remote',
            remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
        }
    });

    // QR Code no Terminal com cores
    client.on('qr', (qr) => {
        console.log(chalk.yellow.bold('📱 QR CODE GERADO PARA: ' + instanceId));
        console.log(chalk.green('═'.repeat(60)));
        
        // Exibir QR Code no terminal
        qrcode.generate(qr, { small: true }, (qrString) => {
            console.log(chalk.blue(qrString));
        });
        
        console.log(chalk.green('═'.repeat(60)));
        console.log(chalk.yellow('👆 Escaneie o QR Code acima com seu WhatsApp'));
        console.log(chalk.cyan(`🔗 Instância: ${instanceId}`));
        console.log(chalk.cyan(`📋 Sessão: ${sessionName || instanceId}`));
        console.log(chalk.green('═'.repeat(60)));

        // Salvar QR para API
        const clientData = clients.get(instanceId) || {};
        clientData.qrCode = qr;
        clientData.status = 'waiting_qr';
        clientData.lastQR = new Date();
        clients.set(instanceId, { ...clientData, client });
    });

    // Cliente pronto
    client.on('ready', () => {
        console.log(chalk.green.bold(`✅ Cliente WhatsApp conectado: ${instanceId}`));
        const clientData = clients.get(instanceId) || {};
        clientData.status = 'ready';
        clientData.connectedAt = new Date();
        clients.set(instanceId, { ...clientData, client });
    });

    // Cliente autenticado
    client.on('authenticated', () => {
        console.log(chalk.blue(`🔐 Cliente autenticado: ${instanceId}`));
        const clientData = clients.get(instanceId) || {};
        clientData.status = 'authenticated';
        clients.set(instanceId, { ...clientData, client });
    });

    // Falha na autenticação
    client.on('auth_failure', (msg) => {
        console.log(chalk.red(`❌ Falha na autenticação ${instanceId}: ${msg}`));
        const clientData = clients.get(instanceId) || {};
        clientData.status = 'auth_failure';
        clientData.error = msg;
        clients.set(instanceId, { ...clientData, client });
    });

    // Cliente desconectado
    client.on('disconnected', (reason) => {
        console.log(chalk.yellow(`⚠️ Cliente desconectado ${instanceId}: ${reason}`));
        const clientData = clients.get(instanceId) || {};
        clientData.status = 'disconnected';
        clientData.disconnectedAt = new Date();
        clientData.disconnectReason = reason;
        clients.set(instanceId, { ...clientData, client });
    });

    // Mensagens recebidas
    client.on('message', async (message) => {
        console.log(chalk.magenta(`📨 Mensagem recebida em ${instanceId}: ${message.from} - ${message.body}`));
    });

    return client;
}

// ENDPOINTS DA API

// Health Check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'online',
        version: 'WhatsApp Server v3.0.0 - QR Terminal - Porta ' + PORT,
        port: PORT,
        activeInstances: clients.size,
        serverUptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Status geral
app.get('/status', (req, res) => {
    const instancesStatus = Array.from(clients.entries()).map(([id, data]) => ({
        instanceId: id,
        status: data.status || 'unknown',
        hasClient: !!data.client,
        lastQR: data.lastQR,
        connectedAt: data.connectedAt,
        disconnectedAt: data.disconnectedAt
    }));

    res.json({
        success: true,
        server: {
            status: 'online',
            uptime: process.uptime(),
            port: PORT,
            timestamp: new Date().toISOString()
        },
        instances: {
            total: clients.size,
            list: instancesStatus
        }
    });
});

// Listar instâncias
app.get('/instances', (req, res) => {
    const instances = Array.from(clients.entries()).map(([id, data]) => ({
        instanceId: id,
        status: data.status || 'unknown',
        hasQrCode: !!data.qrCode,
        lastActivity: data.lastQR || data.connectedAt || data.disconnectedAt
    }));

    res.json({
        success: true,
        instances,
        total: instances.length
    });
});

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

        if (clients.has(instanceId)) {
            return res.status(409).json({
                success: false,
                error: 'Instância já existe'
            });
        }

        console.log(chalk.blue.bold(`🆕 Criando nova instância: ${instanceId}`));

        const client = createWhatsAppClient(instanceId, sessionName);
        
        // Inicializar dados da instância
        clients.set(instanceId, {
            client,
            status: 'initializing',
            createdAt: new Date(),
            instanceId,
            sessionName
        });

        // Inicializar cliente
        await client.initialize();

        console.log(chalk.green(`✅ Instância ${instanceId} inicializada`));

        res.json({
            success: true,
            message: 'Instância criada e inicializada',
            instanceId,
            sessionName,
            status: 'initializing'
        });

    } catch (error) {
        console.error(chalk.red(`❌ Erro ao criar instância: ${error.message}`));
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obter QR Code
app.get('/instance/:instanceId/qr', authenticateToken, (req, res) => {
    const { instanceId } = req.params;
    const clientData = clients.get(instanceId);

    if (!clientData) {
        return res.status(404).json({
            success: false,
            error: 'Instância não encontrada'
        });
    }

    if (clientData.qrCode) {
        res.json({
            success: true,
            qrCode: clientData.qrCode,
            status: clientData.status,
            lastGenerated: clientData.lastQR
        });
    } else {
        res.json({
            success: false,
            waiting: true,
            message: 'QR Code ainda não foi gerado',
            status: clientData.status
        });
    }
});

// Status da instância
app.get('/instance/:instanceId/status', authenticateToken, (req, res) => {
    const { instanceId } = req.params;
    const clientData = clients.get(instanceId);

    if (!clientData) {
        return res.status(404).json({
            success: false,
            error: 'Instância não encontrada'
        });
    }

    res.json({
        success: true,
        instanceId,
        status: clientData.status || 'unknown',
        hasQrCode: !!clientData.qrCode,
        createdAt: clientData.createdAt,
        connectedAt: clientData.connectedAt,
        disconnectedAt: clientData.disconnectedAt,
        error: clientData.error
    });
});

// Deletar instância
app.delete('/instance/:instanceId', authenticateToken, async (req, res) => {
    try {
        const { instanceId } = req.params;
        const clientData = clients.get(instanceId);

        if (!clientData) {
            return res.status(404).json({
                success: false,
                error: 'Instância não encontrada'
            });
        }

        console.log(chalk.yellow(`🗑️ Deletando instância: ${instanceId}`));

        // Destruir cliente se existir
        if (clientData.client) {
            await clientData.client.destroy();
        }

        // Remover da memória
        clients.delete(instanceId);

        console.log(chalk.green(`✅ Instância ${instanceId} deletada`));

        res.json({
            success: true,
            message: 'Instância deletada com sucesso'
        });

    } catch (error) {
        console.error(chalk.red(`❌ Erro ao deletar instância: ${error.message}`));
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Enviar mensagem
app.post('/send', authenticateToken, async (req, res) => {
    try {
        const { instanceId, to, message } = req.body;

        if (!instanceId || !to || !message) {
            return res.status(400).json({
                success: false,
                error: 'instanceId, to e message são obrigatórios'
            });
        }

        const clientData = clients.get(instanceId);

        if (!clientData || !clientData.client) {
            return res.status(404).json({
                success: false,
                error: 'Instância não encontrada ou não conectada'
            });
        }

        if (clientData.status !== 'ready') {
            return res.status(400).json({
                success: false,
                error: 'Instância não está pronta para enviar mensagens',
                status: clientData.status
            });
        }

        // Formatear número se necessário
        let phoneNumber = to;
        if (!phoneNumber.includes('@')) {
            phoneNumber = phoneNumber.replace(/\D/g, '') + '@c.us';
        }

        const result = await clientData.client.sendMessage(phoneNumber, message);

        console.log(chalk.green(`📤 Mensagem enviada de ${instanceId} para ${phoneNumber}`));

        res.json({
            success: true,
            message: 'Mensagem enviada com sucesso',
            messageId: result.id._serialized
        });

    } catch (error) {
        console.error(chalk.red(`❌ Erro ao enviar mensagem: ${error.message}`));
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(chalk.green.bold('🎯 SERVIDOR WHATSAPP COM QR TERMINAL PRONTO - PORTA ' + PORT + '!'));
    console.log(chalk.blue('🎉 SERVIDOR WHATSAPP COM QR TERMINAL INICIADO - PORTA ' + PORT + '!'));
    console.log(chalk.yellow('='.repeat(60)));
    console.log(chalk.cyan('✅ Porta: ' + PORT));
    console.log(chalk.cyan('✅ Token: ' + AUTH_TOKEN.substring(0, 10) + '...'));
    console.log(chalk.cyan('✅ Webhook: ' + WEBHOOK_URL));
    console.log(chalk.magenta('✅ QR Terminal: ATIVADO'));
    console.log(chalk.yellow('='.repeat(60)));
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log(chalk.yellow('\n🛑 Encerrando servidor...'));
    
    for (const [instanceId, clientData] of clients.entries()) {
        if (clientData.client) {
            console.log(chalk.yellow(`🔌 Desconectando ${instanceId}...`));
            await clientData.client.destroy();
        }
    }
    
    console.log(chalk.green('✅ Servidor encerrado com segurança'));
    process.exit(0);
});
EOF

# Substituir servidor atual
log_info "Substituindo servidor atual..."
if mv whatsapp-server-qr-updated.js whatsapp-server.js; then
    log_success "Servidor atualizado com QR Terminal"
else
    log_error "Falha ao atualizar servidor"
    exit 1
fi

# FASE 4: REINICIAR SERVIDOR
echo ""
echo "🔄 FASE 4: REINICIAR SERVIDOR COM QR TERMINAL"
echo "============================================"

log_info "Parando servidor atual..."
pm2 stop whatsapp-main-3002 2>/dev/null || true

log_info "Deletando processo PM2 anterior..."
pm2 delete whatsapp-main-3002 2>/dev/null || true

log_info "Iniciando servidor com QR Terminal..."
PORT=3002 \
PUPPETEER_EXECUTABLE_PATH="/usr/bin/google-chrome-stable" \
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
AUTH_TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" \
pm2 start whatsapp-server.js --name whatsapp-main-3002 --time

pm2 save

log_info "Aguardando 10s para inicialização..."
sleep 10

# FASE 5: VERIFICAR STATUS
echo ""
echo "🧪 FASE 5: VERIFICAÇÃO DO STATUS"
echo "==============================="

log_info "Verificando status do PM2..."
pm2 status

log_info "Testando health check..."
health_response=$(curl -s http://localhost:3002/health 2>/dev/null)
if echo "$health_response" | grep -q "QR Terminal"; then
    log_success "Servidor com QR Terminal funcionando!"
    echo "Response: $health_response"
else
    log_error "Problema na inicialização"
    echo "Response: $health_response"
fi

# RELATÓRIO FINAL
echo ""
echo "🎉 IMPLEMENTAÇÃO QR TERMINAL CONCLUÍDA!"
echo "======================================"

echo ""
echo "✅ FUNCIONALIDADES IMPLEMENTADAS:"
echo "   ✅ QR Code exibido no terminal com cores"
echo "   ✅ Logs detalhados com chalk"
echo "   ✅ Status de instâncias melhorado"
echo "   ✅ Debug visual de conexões"
echo "   ✅ Configuração Puppeteer robusta"

echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "   1. Testar criação de instância"
echo "   2. Monitorar QR Code no terminal: pm2 logs whatsapp-main-3002"
echo "   3. Verificar estabilidade do Puppeteer"

echo ""
echo "🔧 COMANDOS ÚTEIS:"
echo "   pm2 logs whatsapp-main-3002        # Ver logs com QR Terminal"
echo "   curl http://localhost:3002/health  # Testar servidor"
echo "   curl http://localhost:3002/status  # Status detalhado"

log_success "IMPLEMENTAÇÃO QR TERMINAL FINALIZADA!"
