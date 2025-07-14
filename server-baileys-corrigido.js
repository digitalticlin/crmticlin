const express = require('express');
const { makeWASocket, DisconnectReason, useMultiFileAuthState, Browsers } = require('baileys');
const QRCode = require('qrcode');
const redis = require('redis');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3002;

// Configuração do Redis
const redisClient = redis.createClient({
    host: 'localhost',
    port: 6379,
    retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            console.log('Redis connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
            return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
    }
});

redisClient.on('error', (err) => {
    console.log('Redis Error:', err);
});

redisClient.on('connect', () => {
    console.log('Redis conectado');
});

// Middleware CORS
app.use(cors({
    origin: '*',
    credentials: true
}));

// Middleware para tratamento de erro de JSON - CORREÇÃO PRINCIPAL
app.use((req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                if (body.trim()) {
                    req.body = JSON.parse(body);
                } else {
                    req.body = {};
                }
            } catch (error) {
                console.log(`❌ Erro de JSON malformado: ${error.message}`);
                console.log(`📝 Body recebido: ${body.substring(0, 100)}...`);

                // Em vez de crashar, retorna erro HTTP
                return res.status(400).json({
                    error: 'Invalid JSON format',
                    message: 'The request body contains malformed JSON',
                    received: body.substring(0, 50) + '...'
                });
            }
            next();
        });
    } else {
        next();
    }
});

// Configurações de timeout para produção
app.use((req, res, next) => {
    req.setTimeout(30000); // 30 segundos
    res.setTimeout(30000);
    next();
});

// Armazenamento de instâncias
const instances = new Map();
const reconnectAttempts = new Map();
const MAX_RECONNECT_ATTEMPTS = 5;

// Webhooks configurados
const WEBHOOKS = {
    QR_RECEIVER: process.env.QR_RECEIVER_WEBHOOK || 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_qr_receiver',
    CONNECTION_SYNC: process.env.CONNECTION_SYNC_WEBHOOK || 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/auto_whatsapp_sync',
    BACKEND_MESSAGES: process.env.BACKEND_MESSAGES_WEBHOOK || 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_whatsapp_web',
    N8N_MESSAGES: process.env.N8N_MESSAGES_WEBHOOK || 'https://novo-ticlin-n8n.eirfpl.easypanel.host/webhook/ticlingeral'
};

// Headers para Supabase
const SUPABASE_HEADERS = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'}`,
    'apikey': process.env.SUPABASE_ANON_KEY || 'your-anon-key'
};

// Função para verificar se é mensagem de grupo
function isGroupMessage(message) {
    return message.key && message.key.remoteJid && message.key.remoteJid.includes('@g.us');
}

// Função para enviar webhook com retry
async function sendWebhook(url, data, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await axios.post(url, data, {
                headers: SUPABASE_HEADERS,
                timeout: 5000
            });
            console.log(`✅ Webhook enviado com sucesso (tentativa ${attempt}):`, url);
            return response.data;
        } catch (error) {
            console.log(`❌ Erro no webhook (tentativa ${attempt}/${retries}):`, error.message);
            if (attempt === retries) {
                console.log(`🚨 Falha definitiva no webhook após ${retries} tentativas:`, url);
            } else {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }
}

// Função para obter foto de perfil
async function getProfilePicture(sock, jid) {
    try {
        const profilePic = await sock.profilePictureUrl(jid, 'image');
        return profilePic;
    } catch (error) {
        console.log(`❌ Erro ao obter foto de perfil para ${jid}:`, error.message);
        return null;
    }
}

// Função para criar instância WhatsApp
async function createWhatsAppInstance(instanceId, webhookUrl = null) {
    try {
        console.log(`[${instanceId}] Criando instância...`);

        const { state, saveCreds } = await useMultiFileAuthState(`./sessions/${instanceId}`);

        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            browser: ["WhatsApp Web", "Desktop", "2.2412.54"],
            logger: {
                level: 'debug',
                child: () => ({
                    level: 'debug',
                    info: () => {},
                    error: () => {},
                    warn: () => {},
                    debug: () => {},
                    trace: () => {}
                }),
                info: () => {},
                error: () => {},
                warn: () => {},
                debug: () => {},
                trace: () => {}
            }
        });

        instances.set(instanceId, {
            sock,
            qr: null,
            status: 'connecting',
            webhookUrl,
            lastSeen: new Date(),
            messageCount: 0
        });

        // Handler de conexão
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            console.log(`[${instanceId}] Connection update:`, connection);

            if (qr) {
                console.log(`[${instanceId}] QR Code gerado`);
                
                const qrBase64 = await QRCode.toDataURL(qr);

                // Salvar QR no Redis
                await redisClient.set(`qr:${instanceId}`, qrBase64, { EX: 300 });

                // Atualizar instância
                const instance = instances.get(instanceId);
                if (instance) {
                    instance.qr = qrBase64;
                    instance.status = 'qr_generated';
                }

                // Enviar webhook de QR
                const qrData = {
                    instanceId,
                    qr: qrBase64,
                    timestamp: new Date().toISOString(),
                    event: 'qr_generated'
                };

                await sendWebhook(WEBHOOKS.QR_RECEIVER, qrData);
                if (webhookUrl) {
                    await sendWebhook(webhookUrl, qrData);
                }
            }

            if (connection === 'open') {
                console.log(`[${instanceId}] Conectado com sucesso!`);

                const instance = instances.get(instanceId);
                if (instance) {
                    instance.status = 'connected';
                    instance.qr = null;
                }

                // Limpar tentativas de reconexão
                reconnectAttempts.delete(instanceId);

                // Remover QR do Redis
                await redisClient.del(`qr:${instanceId}`);

                // Enviar webhook de conexão
                const connectionData = {
                    instanceId,
                    status: 'connected',
                    timestamp: new Date().toISOString(),
                    event: 'connection_established'
                };

                await sendWebhook(WEBHOOKS.CONNECTION_SYNC, connectionData);
                if (webhookUrl) {
                    await sendWebhook(webhookUrl, connectionData);
                }
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log(`[${instanceId}] Conexão fechada. Reconectando:`, shouldReconnect);

                if (shouldReconnect) {
                    const attempts = reconnectAttempts.get(instanceId) || 0;
                    if (attempts < MAX_RECONNECT_ATTEMPTS) {
                        reconnectAttempts.set(instanceId, attempts + 1);
                        console.log(`[${instanceId}] Tentativa de reconexão ${attempts + 1}/${MAX_RECONNECT_ATTEMPTS}`);
                        setTimeout(() => createWhatsAppInstance(instanceId, webhookUrl), 5000);
                    } else {
                        console.log(`[${instanceId}] Máximo de tentativas de reconexão atingido`);
                        instances.delete(instanceId);
                        reconnectAttempts.delete(instanceId);
                    }
                } else {
                    instances.delete(instanceId);
                    reconnectAttempts.delete(instanceId);
                }
            }
        });

        // Handler de mensagens
        sock.ev.on('messages.upsert', async (m) => {
            const message = m.messages[0];
            if (!message.message || message.key.fromMe) return;

            // Filtrar mensagens de grupo
            if (isGroupMessage(message)) {
                console.log(`[${instanceId}] Mensagem de grupo ignorada`);
                return;
            }

            const instance = instances.get(instanceId);
            if (instance) {
                instance.messageCount++;
                instance.lastSeen = new Date();
            }

            console.log(`[${instanceId}] Nova mensagem recebida`);

            // Obter foto de perfil
            const profilePic = await getProfilePicture(sock, message.key.remoteJid);

            // Processar diferentes tipos de mensagem
            let messageData = {
                instanceId,
                messageId: message.key.id,
                from: message.key.remoteJid,
                timestamp: new Date(message.messageTimestamp * 1000).toISOString(),
                profilePicture: profilePic,
                event: 'message_received'
            };

            // Texto
            if (message.message.conversation) {
                messageData.type = 'text';
                messageData.text = message.message.conversation;
            }
            // Texto extendido
            else if (message.message.extendedTextMessage) {
                messageData.type = 'text';
                messageData.text = message.message.extendedTextMessage.text;
            }
            // Imagem
            else if (message.message.imageMessage) {
                messageData.type = 'image';
                messageData.caption = message.message.imageMessage.caption || '';
                messageData.mimetype = message.message.imageMessage.mimetype;
                messageData.url = message.message.imageMessage.url;
            }
            // Vídeo
            else if (message.message.videoMessage) {
                messageData.type = 'video';
                messageData.caption = message.message.videoMessage.caption || '';
                messageData.mimetype = message.message.videoMessage.mimetype;
                messageData.url = message.message.videoMessage.url;
            }
            // Áudio
            else if (message.message.audioMessage) {
                messageData.type = 'audio';
                messageData.mimetype = message.message.audioMessage.mimetype;
                messageData.url = message.message.audioMessage.url;
            }
            // Documento
            else if (message.message.documentMessage) {
                messageData.type = 'document';
                messageData.caption = message.message.documentMessage.caption || '';
                messageData.mimetype = message.message.documentMessage.mimetype;
                messageData.fileName = message.message.documentMessage.fileName;
                messageData.url = message.message.documentMessage.url;
            }
            // Sticker
            else if (message.message.stickerMessage) {
                messageData.type = 'sticker';
                messageData.mimetype = message.message.stickerMessage.mimetype;
                messageData.url = message.message.stickerMessage.url;
            }

            // Enviar para webhooks
            await sendWebhook(WEBHOOKS.BACKEND_MESSAGES, messageData);
            await sendWebhook(WEBHOOKS.N8N_MESSAGES, messageData);

            if (webhookUrl) {
                await sendWebhook(webhookUrl, messageData);
            }
        });

        sock.ev.on('creds.update', saveCreds);

    } catch (error) {
        console.log(`❌ Erro ao criar instância [${instanceId}]:`, error.message);
        instances.delete(instanceId);
    }
}

// Endpoints da API

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        instances: instances.size,
        uptime: process.uptime()
    });
});

// Status detalhado
app.get('/status', (req, res) => {
    res.json({
        status: 'running',
        timestamp: new Date().toISOString(),
        server: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            pid: process.pid
        },
        instances: {
            total: instances.size,
            connected: Array.from(instances.values()).filter(i => i.status === 'connected').length,
            connecting: Array.from(instances.values()).filter(i => i.status === 'connecting').length,
            qr_pending: Array.from(instances.values()).filter(i => i.status === 'qr_generated').length
        },
        webhooks: WEBHOOKS,
        features: {
            redis: true,
            qr_base64: true,
            media_support: true,
            group_filter: true,
            auto_reconnect: true,
            webhook_retry: true,
            profile_pictures: true
        }
    });
});

// Listar instâncias
app.get('/instances', async (req, res) => {
    try {
        const instanceList = Array.from(instances.entries()).map(([id, instance]) => ({
            id,
            status: instance.status,
            lastSeen: instance.lastSeen,
            messageCount: instance.messageCount,
            hasQR: !!instance.qr
        }));

        res.json({
            instances: instanceList,
            total: instanceList.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Criar instância
app.post('/instance/create', async (req, res) => {
    try {
        const { instanceId, webhookUrl } = req.body;

        if (!instanceId) {
            return res.status(400).json({ error: 'instanceId é obrigatório' });
        }

        if (instances.has(instanceId)) {
            return res.status(400).json({ error: 'Instância já existe' });
        }

        await createWhatsAppInstance(instanceId, webhookUrl);
        res.json({ message: 'Instância criada com sucesso', instanceId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obter QR Code
app.get('/instance/:instanceId/qr', async (req, res) => {
    try {
        const { instanceId } = req.params;

        // Tentar do Redis primeiro
        const qrFromRedis = await redisClient.get(`qr:${instanceId}`);
        if (qrFromRedis) {
            return res.json({ qr: qrFromRedis, source: 'redis' });
        }

        // Tentar da instância
        const instance = instances.get(instanceId);
        if (instance && instance.qr) {
            return res.json({ qr: instance.qr, source: 'instance' });
        }

        res.status(404).json({ error: 'QR Code não encontrado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Status de instância específica
app.get('/instance/:instanceId', (req, res) => {
    try {
        const { instanceId } = req.params;
        const instance = instances.get(instanceId);

        if (!instance) {
            return res.status(404).json({ error: 'Instância não encontrada' });
        }

        res.json({
            instanceId,
            status: instance.status,
            lastSeen: instance.lastSeen,
            messageCount: instance.messageCount,
            hasQR: !!instance.qr,
            reconnectAttempts: reconnectAttempts.get(instanceId) || 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Enviar mensagem
app.post('/instance/:instanceId/message', async (req, res) => {
    try {
        const { instanceId } = req.params;
        const { to, message } = req.body;

        const instance = instances.get(instanceId);
        if (!instance || instance.status !== 'connected') {
            return res.status(400).json({ error: 'Instância não conectada' });
        }

        await instance.sock.sendMessage(to, { text: message });
        res.json({ message: 'Mensagem enviada com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Envio simplificado
app.post('/send', async (req, res) => {
    try {
        const { instanceId, to, message } = req.body;

        const instance = instances.get(instanceId);
        if (!instance || instance.status !== 'connected') {
            return res.status(400).json({ error: 'Instância não conectada' });
        }

        await instance.sock.sendMessage(to, { text: message });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Deletar instância (POST para compatibilidade)
app.post('/instance/delete', async (req, res) => {
    try {
        const { instanceId } = req.body;

        if (!instanceId) {
            return res.status(400).json({ error: 'instanceId é obrigatório' });
        }

        const instance = instances.get(instanceId);
        if (instance) {
            instance.sock.end();
            instances.delete(instanceId);
            reconnectAttempts.delete(instanceId);
            await redisClient.del(`qr:${instanceId}`);
        }

        res.json({ message: 'Instância deletada com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Deletar instância (DELETE)
app.delete('/instance/:instanceId', async (req, res) => {
    try {
        const { instanceId } = req.params;

        const instance = instances.get(instanceId);
        if (instance) {
            instance.sock.end();
            instances.delete(instanceId);
            reconnectAttempts.delete(instanceId);
            await redisClient.del(`qr:${instanceId}`);
        }

        res.json({ message: 'Instância deletada com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Debug do Redis
app.get('/debug/store/:instanceId', async (req, res) => {
    try {
        const { instanceId } = req.params;
        const qrData = await redisClient.get(`qr:${instanceId}`);
        const instance = instances.get(instanceId);

        res.json({
            instanceId,
            redis: {
                hasQR: !!qrData,
                qrLength: qrData ? qrData.length : 0
            },
            memory: {
                hasInstance: !!instance,
                status: instance ? instance.status : null,
                hasQR: instance ? !!instance.qr : false
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Middleware global de tratamento de erros
app.use((error, req, res, next) => {
    console.log('❌ Erro não tratado:', error.message);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

// Inicializar servidor
app.listen(PORT, async () => {
    console.log(`🚀 Servidor WhatsApp rodando na porta ${PORT}`);
    console.log(`📊 Webhooks configurados:`, Object.keys(WEBHOOKS));
    console.log(`🔧 Recursos ativos: Redis, QR Base64, Filtro de Grupos, Auto-reconexão`);

    // Tentar conectar ao Redis
    try {
        await redisClient.connect();
        console.log('✅ Redis conectado com sucesso');
    } catch (error) {
        console.log('❌ Erro ao conectar Redis:', error.message);
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Recebido SIGTERM, fechando servidor...');
    instances.forEach((instance, id) => {
        instance.sock.end();
    });
    redisClient.quit();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Recebido SIGINT, fechando servidor...');
    instances.forEach((instance, id) => {
        instance.sock.end();
    });
    redisClient.quit();
    process.exit(0);
});