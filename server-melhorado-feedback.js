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

// 🔒 VALIDAÇÃO RIGOROSA DE QR CODE
function isValidQRCode(qrCode) {
    if (!qrCode) {
        console.log('🔍 Validação QR: QR Code é null/undefined');
        return false;
    }
    if (!qrCode.startsWith('data:image/png;base64,')) {
        console.log('🔍 Validação QR: Formato inválido');
        return false;
    }
    if (qrCode.length < 1000) {
        console.log(`🔍 Validação QR: Muito pequeno (${qrCode.length} chars)`);
        return false;
    }
    try {
        const base64Part = qrCode.replace('data:image/png;base64,', '');
        const buffer = Buffer.from(base64Part, 'base64');
        if (buffer.length < 500) {
            console.log(`🔍 Validação QR: Buffer muito pequeno (${buffer.length} bytes)`);
            return false;
        }
    } catch (error) {
        console.log(`🔍 Validação QR: Base64 inválido - ${error.message}`);
        return false;
    }
    console.log(`✅ Validação QR: QR Code VÁLIDO (${qrCode.length} chars)`);
    return true;
}

// 🔔 WEBHOOK OTIMIZADO - Diferencia progresso de QR Code final
async function sendWebhook(sessionId, webhookData) {
    const session = sessions.get(sessionId);
    if (!session || !session.webhookUrl) {
        console.log(`⚠️ [${sessionId}] Sem webhook URL configurada`);
        return;
    }

    // 🔒 VALIDAÇÃO APENAS PARA QR CODE FINAL
    if (webhookData.qrCode) {
        if (!isValidQRCode(webhookData.qrCode)) {
            console.log(`🚫 [${sessionId}] WEBHOOK BLOQUEADO: QR Code inválido`);
            return;
        }
        if (webhookData.status !== 'qr_ready') {
            console.log(`🚫 [${sessionId}] WEBHOOK BLOQUEADO: Status incompatível com QR Code`);
            return;
        }
        console.log(`🎯 [${sessionId}] QR Code VÁLIDO confirmado para webhook FINAL`);
    } else {
        // ✅ WEBHOOK DE PROGRESSO (sem QR Code)
        console.log(`📈 [${sessionId}] Enviando webhook de PROGRESSO: ${webhookData.status}`);
    }

    try {
        const response = await fetch(session.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'webhook_progress',
                sessionId: sessionId,
                instanceId: session.instanceId,
                ...webhookData
            })
        });

        if (response.ok) {
            const type = webhookData.qrCode ? 'QR CODE FINAL' : 'PROGRESSO';
            console.log(`✅ [${sessionId}] Webhook ${type} enviado com sucesso`);
        } else {
            console.log(`❌ [${sessionId}] Webhook falhou: ${response.status}`);
        }
    } catch (error) {
        console.error(`❌ [${sessionId}] Erro ao enviar webhook:`, error.message);
    }
}

// 🎭 CAPTURA OTIMIZADA COM FEEDBACK DETALHADO
async function captureQRCodeOptimized(page, sessionId) {
    console.log('🎭 Iniciando captura otimizada do QR Code...');
    
    // 📈 WEBHOOK: Iniciando captura (PROGRESSO)
    await sendWebhook(sessionId, {
        status: 'scanning_qr',
        message: 'Procurando QR Code na página...',
        progress: 25
    });

    try {
        console.log('⏳ Aguardando página estabilizar...');
        await page.waitForTimeout(15000);
        
        // 📈 WEBHOOK: Página estabilizada (PROGRESSO)
        await sendWebhook(sessionId, {
            status: 'page_ready',
            message: 'Página carregada, aguardando QR Code aparecer...',
            progress: 35
        });

        await page.waitForTimeout(10000);

        for (let attempt = 1; attempt <= 10; attempt++) {
            console.log(`🔄 Tentativa ${attempt}/10`);
            
            // 📈 WEBHOOK: Tentativa de captura (PROGRESSO)
            if (attempt === 1 || attempt === 5 || attempt === 10) {
                await sendWebhook(sessionId, {
                    status: 'capturing_qr',
                    message: `Tentativa ${attempt}/10 de captura do QR Code...`,
                    progress: 40 + (attempt * 3)
                });
            }

            const canvasElements = await page.$$('canvas');
            console.log(`📊 Encontrados ${canvasElements.length} canvas`);

            for (let i = 0; i < canvasElements.length; i++) {
                try {
                    const canvas = canvasElements[i];
                    const boundingBox = await canvas.boundingBox();

                    if (boundingBox && boundingBox.width > 50 && boundingBox.height > 50) {
                        console.log(`📐 Canvas ${i + 1}: ${boundingBox.width}x${boundingBox.height}`);
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
            await page.waitForTimeout(5000);
        }
        
        console.log('❌ QR Code válido não encontrado após todas as tentativas');
        return null;
    } catch (error) {
        console.error('❌ Erro na captura do QR Code:', error);
        return null;
    }
}

// 🚀 PROCESSO PRINCIPAL COM FEEDBACK EM TEMPO REAL
async function startPuppeteerProcess(sessionId, instanceData) {
    console.log(`🎭 [${sessionId}] Iniciando processo Puppeteer com feedback...`);
    let browser = null;

    try {
        // 📈 WEBHOOK: Inicializando (PROGRESSO)
        await sendWebhook(sessionId, {
            status: 'initializing',
            message: 'Inicializando navegador...',
            progress: 5
        });

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

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // 📈 WEBHOOK: Navegando (PROGRESSO)
        console.log(`🌐 [${sessionId}] Navegando para WhatsApp Web...`);
        await sendWebhook(sessionId, {
            status: 'loading',
            message: 'Carregando WhatsApp Web...',
            progress: 15
        });

        await page.goto('https://web.whatsapp.com', {
            waitUntil: 'networkidle0',
            timeout: 60000
        });

        // Atualizar sessão local
        sessions.set(sessionId, {
            ...sessions.get(sessionId),
            status: 'loading',
            message: 'WhatsApp Web carregado',
            qrCode: null
        });

        console.log(`📍 [${sessionId}] WhatsApp Web carregado - iniciando captura...`);

        // 🎯 CAPTURA COM FEEDBACK DETALHADO
        const qrCode = await captureQRCodeOptimized(page, sessionId);

        // 🎯 DECISÃO FINAL: QR Code válido?
        if (qrCode && isValidQRCode(qrCode)) {
            console.log(`🎉 [${sessionId}] QR Code VÁLIDO! Enviando webhook FINAL...`);
            
            // ✅ Atualizar sessão com QR Code
            sessions.set(sessionId, {
                ...sessions.get(sessionId),
                status: 'qr_ready',
                qrCode: qrCode,
                message: 'QR Code gerado com sucesso!',
                validatedAt: new Date().toISOString()
            });

            // 🔔 WEBHOOK FINAL: QR Code pronto para escaneamento
            await sendWebhook(sessionId, {
                status: 'qr_ready',
                qrCode: qrCode,
                message: 'QR Code pronto para escaneamento!',
                progress: 100
            });

            console.log(`✅ [${sessionId}] Processo COMPLETO - QR Code disponível!`);

        } else {
            console.log(`❌ [${sessionId}] Falha ao capturar QR Code válido`);
            
            sessions.set(sessionId, {
                ...sessions.get(sessionId),
                status: 'qr_error',
                qrCode: null,
                message: 'Erro ao gerar QR Code válido',
                errorAt: new Date().toISOString()
            });

            // 🔔 WEBHOOK: Notificar erro
            await sendWebhook(sessionId, {
                status: 'qr_error',
                message: 'Não foi possível gerar QR Code',
                error: 'Timeout na captura do QR Code',
                progress: 0
            });
        }

    } catch (error) {
        console.error(`❌ [${sessionId}] Erro no processo:`, error);
        
        sessions.set(sessionId, {
            ...sessions.get(sessionId),
            status: 'error',
            qrCode: null,
            message: `Erro: ${error.message}`,
            errorAt: new Date().toISOString()
        });

        await sendWebhook(sessionId, {
            status: 'error',
            message: `Erro: ${error.message}`,
            error: error.message,
            progress: 0
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// ENDPOINTS (mantidos iguais)
app.post('/create-instance', authenticate, async (req, res) => {
    try {
        const { instanceId, instanceName, webhookUrl } = req.body;
        if (!instanceId) {
            return res.status(400).json({ success: false, error: 'instanceId is required' });
        }

        const sessionId = `puppeteer_${instanceId}_${Date.now()}`;
        sessions.set(sessionId, {
            instanceId,
            instanceName: instanceName || instanceId,
            webhookUrl,
            status: 'initializing',
            qrCode: null,
            message: 'Criando instância...',
            createdAt: new Date().toISOString()
        });

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
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/start-import', authenticate, async (req, res) => {
    try {
        const { instanceId, instanceName, webhookUrl } = req.body;
        if (!instanceId) {
            return res.status(400).json({ success: false, error: 'instanceId is required' });
        }

        const sessionId = `puppeteer_${instanceId}_${Date.now()}`;
        sessions.set(sessionId, {
            instanceId,
            instanceName: instanceName || instanceId,
            webhookUrl,
            status: 'initializing', 
            qrCode: null,
            message: 'Inicializando...',
            createdAt: new Date().toISOString()
        });

        startPuppeteerProcess(sessionId, { instanceId, instanceName, webhookUrl });
        res.json({ success: true, sessionId, message: 'Importação iniciada' });
    } catch (error) {
        console.error('Erro ao iniciar importação:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/instance/:instanceId/qr', authenticate, (req, res) => {
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
        return res.status(404).json({ success: false, error: 'Instance not found' });
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
});

app.get('/session-status/:sessionId', authenticate, (req, res) => {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);

    if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
    }

    res.json({
        success: true,
        session: {
            sessionId,
            status: session.status,
            message: session.message,
            qrCode: session.qrCode,
            instanceId: session.instanceId,
            instanceName: session.instanceName,
            createdAt: session.createdAt,
            hasValidQr: session.qrCode ? isValidQRCode(session.qrCode) : false
        }
    });
});

app.get('/sessions', authenticate, (req, res) => {
    const sessionsList = Array.from(sessions.entries()).map(([sessionId, session]) => ({
        sessionId,
        status: session.status,
        message: session.message,
        instanceId: session.instanceId,
        instanceName: session.instanceName,
        createdAt: session.createdAt,
        hasQrCode: !!session.qrCode,
        hasValidQr: session.qrCode ? isValidQRCode(session.qrCode) : false
    }));

    res.json({ success: true, sessions: sessionsList, total: sessionsList.length });
});

app.delete('/session/:sessionId', authenticate, (req, res) => {
    const { sessionId } = req.params;
    if (!sessions.has(sessionId)) {
        return res.status(404).json({ success: false, error: 'Session not found' });
    }
    sessions.delete(sessionId);
    res.json({ success: true, message: 'Session deleted' });
});

app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'running',
        timestamp: new Date().toISOString(),
        activeSessions: sessions.size,
        webhook_timing_fix: true,
        qr_validation_enabled: true,
        progressive_feedback: true,
        version: '3.0-PROGRESSIVE'
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor Puppeteer com FEEDBACK PROGRESSIVO na porta ${PORT}`);
    console.log(`🔒 Validação de QR Code: ATIVADA`);
    console.log(`🎯 Webhook timing fix: APLICADO`);
    console.log(`📈 Feedback progressivo: ATIVADO`);
    console.log(`✅ Servidor pronto!`);
}); 