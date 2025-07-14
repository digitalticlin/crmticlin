const { 
    makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion,
    Browsers
} = require('@whiskeysockets/baileys');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const redis = require('redis');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Redis client
let redisClient;

// Logger customizado para Baileys
const logger = {
    level: 'silent',
    info: () => {},
    error: () => {},
    warn: () => {},
    debug: () => {},
    trace: () => {},
    child: () => ({
        level: 'silent',
        info: () => {},
        error: () => {},
        warn: () => {},
        debug: () => {},
        trace: () => {}
    })
};

// Inicializar Redis
async function initRedis() {
    try {
        redisClient = redis.createClient({
            host: 'localhost',
            port: 6379
        });
        
        await redisClient.connect();
        console.log('✅ Redis conectado com sucesso');
    } catch (error) {
        console.error('❌ Erro ao conectar Redis:', error);
        process.exit(1);
    }
}

// Função para gerar QR Code em BASE64
async function generateQRCodeBase64(qrString) {
    try {
        const qrBase64 = await QRCode.toDataURL(qrString, {
            width: 256,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        return qrBase64;
    } catch (error) {
        console.error('❌ Erro ao gerar QR Code BASE64:', error);
        return null;
    }
}

// Armazenar instâncias
const instances = new Map();

// Carregar instâncias do arquivo
function loadInstancesFromFile() {
    const filePath = path.join(__dirname, 'instances.json');
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            const instancesData = JSON.parse(data);
            console.log(`📁 ${Object.keys(instancesData).length} instâncias carregadas do arquivo`);
            return instancesData;
        }
    } catch (error) {
        console.error('❌ Erro ao carregar instâncias:', error);
    }
    return {};
}

// Salvar instâncias no arquivo
function saveInstancesToFile() {
    const filePath = path.join(__dirname, 'instances.json');
    try {
        const instancesData = {};
        instances.forEach((instance, key) => {
            instancesData[key] = {
                id: instance.id,
                status: instance.status,
                qr: instance.qr || null,
                qrBase64: instance.qrBase64 || null,
                createdAt: instance.createdAt,
                lastSeen: instance.lastSeen
            };
        });
        fs.writeFileSync(filePath, JSON.stringify(instancesData, null, 2));
    } catch (error) {
        console.error('❌ Erro ao salvar instâncias:', error);
    }
}

// Criar instância WhatsApp
async function createWhatsAppInstance(instanceId) {
    try {
        console.log(`[${instanceId}] Criando instância...`);
        
        const authDir = path.join(__dirname, 'auth', instanceId);
        if (!fs.existsSync(authDir)) {
            fs.mkdirSync(authDir, { recursive: true });
        }

        const { state, saveCreds } = await useMultiFileAuthState(authDir);
        const { version } = await fetchLatestBaileysVersion();

        // Criar socket do WhatsApp
        const sock = makeWASocket({
            version,
            auth: state,
            browser: Browsers.ubuntu('WhatsApp Server'),
            printQRInTerminal: false,
            logger: logger
        });

        // Configurar eventos
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            console.log(`[${instanceId}] Connection update:`, connection);

            if (qr) {
                console.log(`[${instanceId}] ⚡ QR Code gerado rapidamente!`);
                
                // Gerar QR Code em BASE64
                const qrBase64 = await generateQRCodeBase64(qr);
                
                // Atualizar instância
                const instance = instances.get(instanceId);
                if (instance) {
                    instance.qr = qr;
                    instance.qrBase64 = qrBase64;
                    instance.status = 'qr_ready';
                    instance.lastSeen = new Date().toISOString();
                    
                    // Salvar no Redis com TTL de 5 minutos
                    await redisClient.setEx(`qr:${instanceId}`, 300, JSON.stringify({
                        qr,
                        qrBase64,
                        generatedAt: new Date().toISOString()
                    }));
                    
                    console.log(`[${instanceId}] ✅ QR Code salvo (string + BASE64)`);
                }
                
                saveInstancesToFile();
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log(`[${instanceId}] Conexão fechada. Reconectar:`, shouldReconnect);
                
                if (shouldReconnect) {
                    setTimeout(() => createWhatsAppInstance(instanceId), 3000);
                } else {
                    instances.delete(instanceId);
                    await redisClient.del(`qr:${instanceId}`);
                    saveInstancesToFile();
                }
            } else if (connection === 'open') {
                console.log(`[${instanceId}] ✅ Conectado ao WhatsApp`);
                
                const instance = instances.get(instanceId);
                if (instance) {
                    instance.status = 'connected';
                    instance.qr = null;
                    instance.qrBase64 = null;
                    instance.lastSeen = new Date().toISOString();
                    
                    // Limpar QR Code do Redis
                    await redisClient.del(`qr:${instanceId}`);
                }
                
                saveInstancesToFile();
            }
        });

        sock.ev.on('creds.update', saveCreds);

        // Armazenar instância
        instances.set(instanceId, {
            id: instanceId,
            socket: sock,
            status: 'connecting',
            qr: null,
            qrBase64: null,
            createdAt: new Date().toISOString(),
            lastSeen: new Date().toISOString()
        });

        return sock;
    } catch (error) {
        console.error(`[${instanceId}] ❌ Erro ao criar instância:`, error);
        throw error;
    }
}

// Rotas da API
app.get('/health', async (req, res) => {
    try {
        const redisStatus = redisClient.isOpen ? 'connected' : 'disconnected';
        const instanceCount = instances.size;
        
        res.json({
            status: 'ok',
            redis: redisStatus,
            instances: instanceCount,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

app.get('/instances', (req, res) => {
    const instanceList = Array.from(instances.values()).map(instance => ({
        id: instance.id,
        status: instance.status,
        hasQr: !!instance.qr,
        hasQrBase64: !!instance.qrBase64,
        createdAt: instance.createdAt,
        lastSeen: instance.lastSeen
    }));
    
    res.json({
        instances: instanceList,
        total: instanceList.length
    });
});

app.post('/create-instance', async (req, res) => {
    try {
        const instanceId = req.body.instanceId || uuidv4();
        
        if (instances.has(instanceId)) {
            return res.status(400).json({
                status: 'error',
                message: 'Instância já existe'
            });
        }

        await createWhatsAppInstance(instanceId);
        
        res.json({
            status: 'success',
            instanceId: instanceId,
            message: 'Instância criada com sucesso'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

app.get('/qr/:instanceId', async (req, res) => {
    try {
        const instanceId = req.params.instanceId;
        const instance = instances.get(instanceId);
        
        if (!instance) {
            return res.status(404).json({
                status: 'error',
                message: 'Instância não encontrada'
            });
        }

        if (instance.status === 'connected') {
            return res.json({
                status: 'connected',
                message: 'Instância já está conectada'
            });
        }

        if (instance.qr && instance.qrBase64) {
            return res.json({
                status: 'qr_ready',
                qr: instance.qr,
                qrBase64: instance.qrBase64,
                message: 'QR Code disponível'
            });
        }

        // Tentar buscar do Redis
        const redisQr = await redisClient.get(`qr:${instanceId}`);
        if (redisQr) {
            const qrData = JSON.parse(redisQr);
            return res.json({
                status: 'qr_ready',
                qr: qrData.qr,
                qrBase64: qrData.qrBase64,
                message: 'QR Code disponível (Redis)'
            });
        }

        res.json({
            status: 'waiting',
            message: 'Aguardando QR Code...'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

app.delete('/instance/:instanceId', async (req, res) => {
    try {
        const instanceId = req.params.instanceId;
        const instance = instances.get(instanceId);
        
        if (!instance) {
            return res.status(404).json({
                status: 'error',
                message: 'Instância não encontrada'
            });
        }

        // Fechar socket
        if (instance.socket) {
            instance.socket.end();
        }

        // Remover instância
        instances.delete(instanceId);
        
        // Limpar Redis
        await redisClient.del(`qr:${instanceId}`);
        
        // Remover diretório de auth
        const authDir = path.join(__dirname, 'auth', instanceId);
        if (fs.existsSync(authDir)) {
            fs.rmSync(authDir, { recursive: true, force: true });
        }

        saveInstancesToFile();

        res.json({
            status: 'success',
            message: 'Instância removida com sucesso'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Inicializar servidor
async function startServer() {
    try {
        await initRedis();
        
        // Carregar instâncias existentes
        const savedInstances = loadInstancesFromFile();
        for (const [instanceId, instanceData] of Object.entries(savedInstances)) {
            if (instanceData.status !== 'connected') {
                setTimeout(() => createWhatsAppInstance(instanceId), 1000);
            }
        }
        
        app.listen(PORT, () => {
            console.log(`🚀 Servidor WhatsApp rodando na porta ${PORT}`);
            console.log(`📱 Baileys versão: 6.7.18`);
            console.log(`🔴 Redis Store ativo`);
            console.log(`🔗 Health check: http://localhost:${PORT}/health`);
            console.log(`📋 Instâncias: http://localhost:${PORT}/instances`);
        });
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

// Capturar erros não tratados
process.on('uncaughtException', (error) => {
    console.error('🚨 Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Promise rejeitada:', reason);
});

// Iniciar servidor
startServer(); 