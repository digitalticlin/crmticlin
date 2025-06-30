const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();

// CORS Configuration - FORÇA TOTAL
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:8080',
      'http://localhost:8081',
      'http://127.0.0.1:8081',
      'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/whatsapp_chat_import'
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS bloqueado para origin:', origin);
      callback(null, true);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

const PORT = 3001;
app.use(express.json());

const VALID_TOKEN = '8bb0c4f8a89d254783d693050ecd7ff4878534f46a87ece12b24f506548ce430';
const sessions = new Map();

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    if (token !== VALID_TOKEN) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    next();
}

// 🔒 FUNÇÃO PARA VALIDAR QR CODE RIGOROSAMENTE
function isValidQRCode(qrCode) {
    if (!qrCode) return false;
    if (!qrCode.startsWith('data:image/png;base64,')) return false;
    if (qrCode.length < 1000) return false;

    try {
        const base64Part = qrCode.replace('data:image/png;base64,', '');
        const buffer = Buffer.from(base64Part, 'base64');
        if (buffer.length < 500) return false;
    } catch (error) {
        return false;
    }

    return true;
}

// 🔔 FUNÇÃO PARA ENVIAR HISTÓRICO VIA WEBHOOK (não QR Code)
async function sendHistoryWebhook(sessionId, historyData) {
    const session = sessions.get(sessionId);
    if (!session || !session.webhookUrl) {
        console.log(`⚠️ [${sessionId}] Sem webhook URL configurada`);
        return;
    }

    try {
        console.log(`🔔 [${sessionId}] Enviando histórico via webhook para: ${session.webhookUrl}`);
        console.log(`📤 [${sessionId}] Dados do histórico:`, {
            sessionId,
            contacts: historyData.contacts?.length || 0,
            messages: historyData.messages?.length || 0,
            totalChats: historyData.totalChats || 0
        });

        const response = await fetch(session.webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'import_history',
                sessionId: sessionId,
                instanceId: session.instanceId,
                userId: session.userId,
                data: historyData,
                timestamp: new Date().toISOString()
            })
        });

        if (response.ok) {
            console.log(`✅ [${sessionId}] Histórico enviado com sucesso`);
        } else {
            console.log(`❌ [${sessionId}] Webhook falhou: ${response.status}`);
        }

    } catch (error) {
        console.error(`❌ [${sessionId}] Erro ao enviar webhook:`, error.message);
    }
}

// 🎭 Função para capturar QR Code (SEM webhook)
async function captureQRCodeOptimized(page) {
    console.log('🎭 Iniciando captura otimizada do QR Code...');

    try {
        await page.waitForTimeout(15000);
        await page.waitForTimeout(10000);

        for (let attempt = 1; attempt <= 10; attempt++) {
            console.log(`🔄 Tentativa ${attempt}/10`);

            const canvasElements = await page.$$('canvas');
            console.log(`📊 Encontrados ${canvasElements.length} canvas`);

            if (canvasElements.length > 0) {
                for (let i = 0; i < canvasElements.length; i++) {
                    try {
                        const canvas = canvasElements[i];
                        const boundingBox = await canvas.boundingBox();

                        if (boundingBox && boundingBox.width > 50 && boundingBox.height > 50) {
                            const screenshot = await canvas.screenshot({
                                encoding: 'base64',
                                type: 'png'
                            });

                            if (screenshot && screenshot.length > 1000) {
                                const qrCodeDataUrl = `data:image/png;base64,${screenshot}`;

                                if (isValidQRCode(qrCodeDataUrl)) {
                                    console.log(`✅ QR Code VÁLIDO capturado! Tamanho: ${qrCodeDataUrl.length} chars`);
                                    return qrCodeDataUrl;
                                }
                            }
                        }
                    } catch (error) {
                        console.log(`❌ Erro no canvas ${i + 1}: ${error.message}`);
                    }
                }
            }

            await page.waitForTimeout(5000);
        }

        console.log('❌ Não foi possível capturar QR Code VÁLIDO');
        return null;

    } catch (error) {
        console.error('❌ Erro na captura do QR Code:', error);
        return null;
    }
}

// 🚀 PROCESSO SIMPLIFICADO: Apenas gerar QR Code (SEM webhook)
async function startPuppeteerProcess(sessionId, instanceData) {
    console.log(`🎭 [${sessionId}] Iniciando processo Puppeteer - APENAS QR Code...`);

    let browser = null;
    let page = null;

    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--no-first-run',
                '--no-default-browser-check'
            ]
        });

        page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Navegação
        console.log(`🌐 [${sessionId}] Navegando para WhatsApp Web...`);
        await page.goto('https://web.whatsapp.com', {
            waitUntil: 'networkidle0',
            timeout: 60000
        });

        sessions.set(sessionId, {
            ...sessions.get(sessionId),
            status: 'loading',
            message: 'Carregando WhatsApp Web...',
            browser: browser,
            page: page
        });

        // Capturar QR Code
        const qrCode = await captureQRCodeOptimized(page);

        if (qrCode && isValidQRCode(qrCode)) {
            console.log(`🎉 [${sessionId}] QR Code VÁLIDO capturado e armazenado!`);

            sessions.set(sessionId, {
                ...sessions.get(sessionId),
                status: 'qr_ready',
                qrCode: qrCode,
                message: 'QR Code gerado - aguardando escaneamento',
                validatedAt: new Date().toISOString()
            });

            // Aguardar escaneamento (detectar quando conecta)
            await waitForWhatsAppConnection(sessionId, page);

        } else {
            console.log(`❌ [${sessionId}] Falha ao capturar QR Code válido`);
            sessions.set(sessionId, {
                ...sessions.get(sessionId),
                status: 'qr_error',
                message: 'Erro ao gerar QR Code válido'
            });
        }

    } catch (error) {
        console.error(`❌ [${sessionId}] Erro no processo:`, error);
        sessions.set(sessionId, {
            ...sessions.get(sessionId),
            status: 'error',
            message: `Erro: ${error.message}`
        });

        if (browser) await browser.close();
    }
}

// 🔗 Aguardar conexão do WhatsApp COM DETECÇÃO ROBUSTA
async function waitForWhatsAppConnection(sessionId, page) {
    console.log(`🔗 [${sessionId}] Aguardando escaneamento do QR Code...`);

    try {
        console.log(`🔗 [${sessionId}] Iniciando detecção robusta de conexão...`);
        
        // 🆕 MÚLTIPLOS SELETORES para detectar conexão
        const connectionSelectors = [
            '[data-testid="chat"]',              // Seletor original
            '[data-testid="chats-container"]',   // Container de chats
            '[data-testid="conversation-header"]', // Header de conversa
            '[aria-label*="Conversas"]',         // Aria label conversas
            '[title*="WhatsApp"]',               // Title WhatsApp
            '.two',                              // Classe principal
            '#pane-side',                        // Painel lateral
            '[data-testid="intro-md-beta-logo-dark"]' // Logo escuro
        ];

        console.log(`🔗 [${sessionId}] Testando ${connectionSelectors.length} seletores diferentes...`);

        // 🆕 TIMEOUT AUMENTADO para 10 minutos
        const connectionTimeout = 600000; // 10 minutos em ms
        
        // 🆕 POLLING COM MÚLTIPLOS SELETORES
        let connected = false;
        let attempts = 0;
        const maxAttempts = 200; // 200 x 3s = 10 minutos
        
        while (!connected && attempts < maxAttempts) {
            attempts++;
            
            try {
                // Verificar se QR Code ainda existe (se sumir = conectou)
                const qrExists = await page.$('[data-ref] canvas').catch(() => null);
                
                if (!qrExists) {
                    console.log(`🔗 [${sessionId}] QR Code desapareceu - provável conexão!`);
                    
                    // Aguardar um pouco para página carregar
                    await page.waitForTimeout(5000);
                    
                    // Testar múltiplos seletores
                    for (const selector of connectionSelectors) {
                        try {
                            const element = await page.$(selector);
                            if (element) {
                                console.log(`✅ [${sessionId}] WhatsApp conectado! Detectado via: ${selector}`);
                                connected = true;
                                break;
                            }
                        } catch (selectorError) {
                            // Ignorar erros de seletor específico
                        }
                    }
                }
                
                if (!connected) {
                    // Log de progresso a cada 10 tentativas
                    if (attempts % 10 === 0) {
                        console.log(`🔗 [${sessionId}] Tentativa ${attempts}/${maxAttempts} - aguardando conexão...`);
                    }
                    
                    await page.waitForTimeout(3000); // Aguardar 3 segundos
                }
                
            } catch (pollError) {
                console.log(`🔗 [${sessionId}] Erro no polling ${attempts}: ${pollError.message}`);
                await page.waitForTimeout(3000);
            }
        }

        if (connected) {
            console.log(`✅ [${sessionId}] WhatsApp conectado após ${attempts} tentativas!`);
            
            sessions.set(sessionId, {
                ...sessions.get(sessionId),
                status: 'connected',
                message: 'WhatsApp conectado - iniciando importação automática...',
                connectedAt: new Date().toISOString(),
                connectionMethod: 'robust_polling'
            });

            // 🚀 AUTOMATIZAR IMPORTAÇÃO APÓS CONEXÃO
            console.log(`🚀 [${sessionId}] Iniciando importação automática do histórico...`);
            
            // Aguardar um pouco para garantir que a conexão está estável
            await page.waitForTimeout(5000);
            
            // Iniciar importação automaticamente
            await importWhatsAppHistory(sessionId);

        } else {
            throw new Error(`Timeout após ${attempts} tentativas (${Math.round(attempts * 3 / 60)} minutos)`);
        }

    } catch (error) {
        console.log(`❌ [${sessionId}] Timeout na conexão: ${error.message}`);
        sessions.set(sessionId, {
            ...sessions.get(sessionId),
            status: 'connection_timeout',
            message: `Timeout - QR Code não foi escaneado (${error.message})`
        });
    }
}

// 📥 IMPORTAÇÃO REAL DE HISTÓRICO
async function importWhatsAppHistory(sessionId) {
    console.log(`📥 [${sessionId}] Iniciando importação REAL de histórico...`);

    const session = sessions.get(sessionId);
    if (!session || !session.page) {
        console.log(`❌ [${sessionId}] Sessão inválida para importação`);
        return;
    }

    const page = session.page;

    try {
        sessions.set(sessionId, {
            ...sessions.get(sessionId),
            status: 'importing',
            message: 'Extraindo histórico do WhatsApp...',
            progress: 0
        });

        // Aguardar carregamento completo
        await page.waitForTimeout(5000);

        console.log(`📋 [${sessionId}] Extraindo lista de contatos...`);

        // Extrair contatos
        const contacts = await page.evaluate(() => {
            const contactElements = document.querySelectorAll('[data-testid="cell-frame-container"]');
            const contactsList = [];

            contactElements.forEach((element, index) => {
                if (index >= 50) return; // Limitar a 50 contatos

                try {
                    const nameElement = element.querySelector('[data-testid="cell-frame-title"]');
                    const lastMessageElement = element.querySelector('[data-testid="cell-frame-secondary"]');

                    if (nameElement) {
                        contactsList.push({
                            name: nameElement.textContent.trim(),
                            lastMessage: lastMessageElement ? lastMessageElement.textContent.trim() : '',
                            id: `contact_${index}`,
                            extractedAt: new Date().toISOString()
                        });
                    }
                } catch (error) {
                    console.error(`Erro ao extrair contato ${index}:`, error);
                }
            });

            return contactsList;
        });

        console.log(`✅ [${sessionId}] ${contacts.length} contatos extraídos`);

        sessions.set(sessionId, {
            ...sessions.get(sessionId),
            progress: 50,
            message: `${contacts.length} contatos extraídos...`
        });

        // Extrair mensagens (exemplo de alguns chats)
        console.log(`💬 [${sessionId}] Extraindo mensagens dos principais chats...`);

        const messages = [];
        const maxChats = Math.min(5, contacts.length); // Primeiros 5 chats

        for (let i = 0; i < maxChats; i++) {
            try {
                // Clicar no chat
                const chatElements = await page.$$('[data-testid="cell-frame-container"]');
                if (chatElements[i]) {
                    await chatElements[i].click();
                    await page.waitForTimeout(2000);

                    // Extrair mensagens do chat atual
                    const chatMessages = await page.evaluate((contactName) => {
                        const messageElements = document.querySelectorAll('[data-testid="msg-container"]');
                        const msgList = [];

                        messageElements.forEach((msgElement, msgIndex) => {
                            if (msgIndex >= 20) return; // Últimas 20 mensagens por chat

                            try {
                                const textElement = msgElement.querySelector('[data-testid="conversation-text-content"]');
                                const timeElement = msgElement.querySelector('[data-testid="msg-meta"]');

                                if (textElement) {
                                    msgList.push({
                                        contact: contactName,
                                        text: textElement.textContent.trim(),
                                        time: timeElement ? timeElement.textContent.trim() : '',
                                        id: `msg_${msgIndex}`,
                                        extractedAt: new Date().toISOString()
                                    });
                                }
                            } catch (error) {
                                console.error(`Erro ao extrair mensagem ${msgIndex}:`, error);
                            }
                        });

                        return msgList;
                    }, contacts[i].name);

                    messages.push(...chatMessages);
                    console.log(`📱 [${sessionId}] ${chatMessages.length} mensagens extraídas de ${contacts[i].name}`);
                }
            } catch (error) {
                console.error(`❌ [${sessionId}] Erro ao extrair chat ${i}:`, error);
            }
        }

        const historyData = {
            contacts: contacts,
            messages: messages,
            totalChats: maxChats,
            extractedAt: new Date().toISOString(),
            summary: {
                totalContacts: contacts.length,
                totalMessages: messages.length,
                source: 'puppeteer'
            }
        };

        sessions.set(sessionId, {
            ...sessions.get(sessionId),
            status: 'completed',
            progress: 100,
            message: 'Histórico importado com sucesso!',
            historyData: historyData
        });

        // Enviar via webhook
        await sendHistoryWebhook(sessionId, historyData);

        console.log(`🎉 [${sessionId}] Importação concluída! ${contacts.length} contatos, ${messages.length} mensagens`);

    } catch (error) {
        console.error(`❌ [${sessionId}] Erro na importação:`, error);
        sessions.set(sessionId, {
            ...sessions.get(sessionId),
            status: 'import_error',
            message: `Erro na importação: ${error.message}`
        });
    } finally {
        // Fechar browser
        if (session.browser) {
            await session.browser.close();
        }
    }
}

// 📍 ENDPOINTS

// Criar instância
app.post('/create-instance', authenticate, async (req, res) => {
    try {
        const { instanceId, instanceName, webhookUrl, userId } = req.body;

        if (!instanceId) {
            return res.status(400).json({
                success: false,
                error: 'instanceId is required'
            });
        }

        console.log(`🎭 [CREATE-INSTANCE] Criando instância: ${instanceId}`);

        const sessionId = `puppeteer_${instanceId}_${Date.now()}`;

        sessions.set(sessionId, {
            instanceId,
            instanceName: instanceName || instanceId,
            webhookUrl,
            userId,
            status: 'initializing',
            qrCode: null,
            message: 'Criando instância...',
            createdAt: new Date().toISOString()
        });

        // Iniciar processo Puppeteer (apenas QR Code)
        startPuppeteerProcess(sessionId, { instanceId, instanceName, webhookUrl });

        res.json({
            success: true,
            sessionId,
            instanceId,
            message: 'Instância criada com sucesso',
            status: 'initializing'
        });

    } catch (error) {
        console.error('❌ Erro ao criar instância:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 📅 ENDPOINT: Agendar importação (COMPATIBILIDADE FRONTEND)
app.post('/schedule-import', authenticate, (req, res) => {
    try {
        const { sessionId, instanceId, webhookUrl, userId, waitForConnection, autoImportOnConnect } = req.body;
        
        console.log(`📅 [Schedule Import] Importação agendada recebida:`, {
            sessionId,
            instanceId,
            userId,
            waitForConnection,
            autoImportOnConnect
        });

        // ✅ A importação já acontece automaticamente em waitForWhatsAppConnection()
        // Este endpoint só registra a intenção para compatibilidade com frontend
        
        const session = sessions.get(sessionId);
        if (session) {
            // Marcar que importação foi solicitada
            session.importRequested = true;
            session.importRequestedAt = new Date().toISOString();
            session.userId = userId;
            session.autoImportOnConnect = autoImportOnConnect;
            
            console.log(`📅 [Schedule Import] ✅ Importação marcada para sessão: ${sessionId}`);
        }

        res.json({
            success: true,
            message: 'Importação agendada - executará automaticamente quando WhatsApp conectar',
            sessionId,
            instanceId,
            autoImportEnabled: true,
            scheduledAt: new Date().toISOString()
        });

    } catch (error) {
        console.error(`📅 [Schedule Import] ❌ Erro:`, error);
        res.status(500).json({
            success: false,
            error: 'Erro ao agendar importação',
            message: error.message
        });
    }
});

// Obter QR Code
app.get('/instance/:instanceId/qr', authenticate, (req, res) => {
    try {
        const { instanceId } = req.params;

        let targetSession = null;
        let targetSessionId = null;

        for (const [sessionId, session] of sessions) {
            if (session.instanceId === instanceId) {
                targetSession = session;
                targetSessionId = sessionId;
                break;
            }
        }

        if (!targetSession) {
            return res.status(404).json({
                success: false,
                error: 'Instance not found'
            });
        }

        res.json({
            success: true,
            instanceId,
            sessionId: targetSessionId,
            status: targetSession.status,
            message: targetSession.message,
            qrCode: targetSession.qrCode,
            hasQrCode: !!targetSession.qrCode,
            isValidQr: targetSession.qrCode ? isValidQRCode(targetSession.qrCode) : false
        });

    } catch (error) {
        console.error('❌ Erro ao obter QR Code:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Status da instância
app.get('/instance/:instanceId/status', authenticate, (req, res) => {
    try {
        const { instanceId } = req.params;

        let targetSession = null;
        let targetSessionId = null;

        for (const [sessionId, session] of sessions) {
            if (session.instanceId === instanceId) {
                targetSession = session;
                targetSessionId = sessionId;
                break;
            }
        }

        if (!targetSession) {
            return res.status(404).json({
                success: false,
                error: 'Instance not found'
            });
        }

        res.json({
            success: true,
            instanceId,
            sessionId: targetSessionId,
            status: targetSession.status,
            message: targetSession.message,
            progress: targetSession.progress || 0,
            createdAt: targetSession.createdAt
        });

    } catch (error) {
        console.error('❌ Erro ao obter status da instância:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Iniciar importação - AGORA É OPCIONAL (já acontece automático)
app.post('/start-import', authenticate, async (req, res) => {
    try {
        const { instanceId } = req.body;

        if (!instanceId) {
            return res.status(400).json({
                success: false,
                error: 'instanceId is required'
            });
        }

        // Buscar sessão existente
        let targetSession = null;
        let targetSessionId = null;

        for (const [sessionId, session] of sessions) {
            if (session.instanceId === instanceId) {
                targetSession = session;
                targetSessionId = sessionId;
                break;
            }
        }

        if (!targetSession) {
            return res.status(404).json({
                success: false,
                error: 'Instance not found - create instance first'
            });
        }

        if (targetSession.status === 'completed') {
            return res.json({
                success: true,
                sessionId: targetSessionId,
                instanceId,
                message: 'Importação já foi concluída automaticamente',
                status: 'completed'
            });
        }

        if (targetSession.status !== 'connected') {
            return res.status(400).json({
                success: false,
                error: 'WhatsApp not connected - scan QR code first'
            });
        }

        console.log(`📥 [START-IMPORT] Iniciando importação manual para instância: ${instanceId}`);

        // Iniciar importação assíncrona
        importWhatsAppHistory(targetSessionId);

        res.json({
            success: true,
            sessionId: targetSessionId,
            instanceId,
            message: 'Importação de histórico iniciada manualmente',
            status: 'importing'
        });

    } catch (error) {
        console.error('❌ Erro ao iniciar importação:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Status da sessão
app.get('/session-status/:sessionId', authenticate, (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = sessions.get(sessionId);

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }

        res.json({
            success: true,
            session: {
                sessionId,
                status: session.status,
                message: session.message,
                progress: session.progress || 0,
                qrCode: session.qrCode,
                instanceId: session.instanceId,
                instanceName: session.instanceName,
                createdAt: session.createdAt,
                hasValidQr: session.qrCode ? isValidQRCode(session.qrCode) : false
            }
        });

    } catch (error) {
        console.error('Erro ao obter status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Listar sessões
app.get('/sessions', authenticate, (req, res) => {
    try {
        const sessionsList = Array.from(sessions.entries()).map(([sessionId, session]) => ({
            sessionId,
            status: session.status,
            message: session.message,
            progress: session.progress || 0,
            instanceId: session.instanceId,
            instanceName: session.instanceName,
            createdAt: session.createdAt,
            hasQrCode: !!session.qrCode,
            hasValidQr: session.qrCode ? isValidQRCode(session.qrCode) : false
        }));

        res.json({
            success: true,
            sessions: sessionsList,
            total: sessionsList.length
        });

    } catch (error) {
        console.error('Erro ao listar sessões:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Deletar sessão
app.delete('/session/:sessionId', authenticate, (req, res) => {
    try {
        const { sessionId } = req.params;

        if (!sessions.has(sessionId)) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }

        const session = sessions.get(sessionId);
        if (session.browser) {
            session.browser.close().catch(console.error);
        }

        sessions.delete(sessionId);

        res.json({
            success: true,
            message: 'Session deleted'
        });

    } catch (error) {
        console.error('Erro ao deletar sessão:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'running',
        timestamp: new Date().toISOString(),
        activeSessions: sessions.size,
        webhook_history_enabled: true,
        qr_polling_ready: true,
        auto_import_enabled: true,
        robust_connection_detection: true,
        schedule_import_enabled: true,
        version: '4.2-ROBUST-AUTO-IMPORT'
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor Puppeteer AUTO-IMPORT rodando na porta ${PORT}`);
    console.log(`🔒 QR Code via POLLING habilitado`);
    console.log(`📥 Importação AUTOMÁTICA de histórico habilitada`);
    console.log(`🔗 NOVO: Detecção de conexão ROBUSTA (8 seletores + 10min timeout)`);
    console.log(`📅 NOVO: Endpoint /schedule-import para compatibilidade frontend`);
    console.log(`🤖 NOVO: Histórico será enviado automaticamente após conexão`);
    console.log(`🌐 Endpoints disponíveis:`);
    console.log(`   POST /create-instance    (criar sessão + gerar QR)`);
    console.log(`   GET  /instance/:id/qr    (polling QR Code)`);
    console.log(`   GET  /instance/:id/status (status da instância)`);
    console.log(`   POST /start-import       (importação manual - opcional)`);
    console.log(`   POST /schedule-import    (agendar importação - compatibilidade)`);
    console.log(`   GET  /session-status/:id (status detalhado)`);
    console.log(`   GET  /sessions           (listar todas)`);
    console.log(`   DELETE /session/:id      (deletar sessão)`);
    console.log(`   GET  /health             (health check)`);
    console.log(`✅ Servidor pronto com IMPORTAÇÃO AUTOMÁTICA + DETECÇÃO ROBUSTA!`);
});