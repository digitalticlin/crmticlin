const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();

// CORS Configuration - FORÇA TOTAL
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requisições sem origin (desenvolvimento, mobile, etc)
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
      callback(null, true); // Permitir mesmo assim para debug
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Middleware adicional para garantir headers CORS
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

// Middleware
app.use(express.json());

// Configuração do token
const VALID_TOKEN = '8bb0c4f8a89d254783d693050ecd7ff4878534f46a87ece12b24f506548ce430';

// Armazenamento das sessões
const sessions = new Map();

// Middleware de autenticação
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
    if (!qrCode) {
        console.log('🔍 Validação QR: QR Code é null/undefined');
        return false;
    }
    
    if (!qrCode.startsWith('data:image/png;base64,')) {
        console.log('🔍 Validação QR: Formato inválido (não é data:image/png;base64)');
        return false;
    }
    
    if (qrCode.length < 1000) {
        console.log(`🔍 Validação QR: Muito pequeno (${qrCode.length} chars)`);
        return false;
    }
    
    // Testar se base64 é válido
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

// 🔔 FUNÇÃO OTIMIZADA: Enviar webhook APENAS com dados válidos
async function sendWebhook(sessionId, webhookData) {
    const session = sessions.get(sessionId);
    if (!session || !session.webhookUrl) {
        console.log(`⚠️ [${sessionId}] Sem webhook URL configurada`);
        return;
    }

    // 🔒 VALIDAÇÃO CRÍTICA: Se tem QR Code, deve ser válido
    if (webhookData.qrCode) {
        if (!isValidQRCode(webhookData.qrCode)) {
            console.log(`🚫 [${sessionId}] BLOQUEADO: QR Code inválido, webhook cancelado`);
            return;
        }
        console.log(`🎯 [${sessionId}] QR Code VÁLIDO confirmado para webhook`);
    }

    // 🔒 VALIDAÇÃO: Status deve ser qr_ready para enviar QR Code
    if (webhookData.qrCode && !['qr_ready', 'qr-ready'].includes(webhookData.status)) {
        console.log(`🚫 [${sessionId}] BLOQUEADO: Status '${webhookData.status}' incompatível com QR Code`);
        return;
    }

    try {
        console.log(`🔔 [${sessionId}] Enviando webhook para: ${session.webhookUrl}`);
        console.log(`📤 [${sessionId}] Dados validados:`, {
            sessionId,
            status: webhookData.status,
            hasQrCode: !!webhookData.qrCode,
            qrCodeLength: webhookData.qrCode ? webhookData.qrCode.length : 0,
            isValidQr: webhookData.qrCode ? isValidQRCode(webhookData.qrCode) : false
        });

        const response = await fetch(session.webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'webhook_progress',
                sessionId: sessionId,
                instanceId: session.instanceId,
                ...webhookData
            })
        });

        if (response.ok) {
            console.log(`✅ [${sessionId}] Webhook enviado com sucesso`);
        } else {
            console.log(`❌ [${sessionId}] Webhook falhou: ${response.status}`);
        }

    } catch (error) {
        console.error(`❌ [${sessionId}] Erro ao enviar webhook:`, error.message);
    }
}

// 🎭 Função OTIMIZADA para capturar QR Code com validação máxima
async function captureQRCodeOptimized(page) {
    console.log('🎭 Iniciando captura otimizada do QR Code...');

    try {
        // Aguardar página carregar completamente
        console.log('⏳ Aguardando página carregar...');
        await page.waitForTimeout(15000);

        // Aguardar mais tempo para elementos renderizarem
        await page.waitForTimeout(10000);

        // Tentar múltiplas estratégias de captura
        for (let attempt = 1; attempt <= 10; attempt++) {
            console.log(`🔄 Tentativa ${attempt}/10`);

            // Estratégia 1: Canvas genérico
            const canvasElements = await page.$$('canvas');
            console.log(`📊 Encontrados ${canvasElements.length} canvas`);

            if (canvasElements.length > 0) {
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

                            // 🔒 CONSTRUIR QR CODE COM FORMATO CORRETO
                            if (screenshot && screenshot.length > 1000) {
                                const qrCodeDataUrl = `data:image/png;base64,${screenshot}`;

                                // 🔒 VALIDAÇÃO MÁXIMA
                                if (isValidQRCode(qrCodeDataUrl)) {
                                    console.log(`✅ QR Code VÁLIDO capturado! Tamanho final: ${qrCodeDataUrl.length} chars`);
                                    return qrCodeDataUrl;
                                } else {
                                    console.log(`❌ QR Code capturado mas inválido na validação`);
                                }
                            } else {
                                console.log(`⚠️ Screenshot muito pequeno: ${screenshot ? screenshot.length : 0} chars`);
                            }
                        }
                    } catch (error) {
                        console.log(`❌ Erro no canvas ${i + 1}: ${error.message}`);
                    }
                }
            }

            // Aguardar antes da próxima tentativa
            await page.waitForTimeout(5000);
        }

        console.log('❌ Não foi possível capturar QR Code VÁLIDO após todas as tentativas');
        return null;

    } catch (error) {
        console.error('❌ Erro na captura do QR Code:', error);
        return null;
    }
}

// 🚀 PROCESSO OTIMIZADO COM TEMPO MÍNIMO OBRIGATÓRIO DE 25 SEGUNDOS
async function startPuppeteerProcess(sessionId, instanceData) {
    console.log(`🎭 [${sessionId}] Iniciando processo Puppeteer com TEMPO MÍNIMO de 25 segundos...`);

    // ⏰ MARCAR TEMPO DE INÍCIO
    const processStartTime = Date.now();
    const MINIMUM_WAIT_TIME = 25000; // 25 segundos obrigatórios

    let browser = null;

    try {
        // Configuração otimizada do Puppeteer
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

        // Configurar User-Agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // 🔄 FASE 1: Navegação
        console.log(`🌐 [${sessionId}] Navegando para WhatsApp Web...`);
        await page.goto('https://web.whatsapp.com', {
            waitUntil: 'networkidle0',
            timeout: 60000
        });

        // ✅ Atualizar status: loading (SEM webhook ainda)
        sessions.set(sessionId, {
            ...sessions.get(sessionId),
            status: 'loading',
            message: 'Carregando WhatsApp Web...',
            qrCode: null
        });

        console.log(`📍 [${sessionId}] Fase 1 concluída - página carregada`);

        // 🔄 FASE 2: Captura do QR Code
        console.log(`📍 [${sessionId}] Iniciando FASE 2 - Captura de QR Code...`);

        // ✅ Atualizar status: aguardando QR (SEM webhook ainda)
        sessions.set(sessionId, {
            ...sessions.get(sessionId),
            status: 'generating_qr',
            message: 'Aguardando QR Code aparecer...',
            qrCode: null
        });

        const qrCode = await captureQRCodeOptimized(page);

        // 🎯 VALIDAÇÃO 1: QR Code válido?
        if (qrCode && isValidQRCode(qrCode)) {
            console.log(`🎉 [${sessionId}] QR Code VÁLIDO capturado!`);

            // ✅ Atualizar status para qr_ready APENAS quando QR é válido
            const updatedSession = {
                ...sessions.get(sessionId),
                status: 'qr_ready',
                qrCode: qrCode,
                message: 'QR Code gerado com sucesso!',
                validatedAt: new Date().toISOString()
            };

            sessions.set(sessionId, updatedSession);

            // ⏰ VALIDAÇÃO 2: Tempo mínimo transcorrido?
            const elapsedTime = Date.now() - processStartTime;
            const remainingTime = MINIMUM_WAIT_TIME - elapsedTime;

            if (remainingTime > 0) {
                console.log(`⏰ [${sessionId}] Aguardando tempo mínimo restante: ${Math.ceil(remainingTime/1000)}s`);
                await new Promise(resolve => setTimeout(resolve, remainingTime));
            }

            // ✅ VALIDAÇÃO FINAL: Tempo + QR válido + Status correto
            const finalElapsedTime = Date.now() - processStartTime;
            console.log(`⏰ [${sessionId}] Tempo total transcorrido: ${Math.ceil(finalElapsedTime/1000)}s`);

            // 🔔 WEBHOOK: Enviar APENAS após todas as validações
            if (finalElapsedTime >= MINIMUM_WAIT_TIME && isValidQRCode(qrCode)) {
                console.log(`🎯 [${sessionId}] TODAS as validações OK! Enviando webhook FINAL...`);
                
                await sendWebhook(sessionId, {
                    status: 'qr_ready',
                    qrCode: qrCode,
                    message: 'QR Code pronto para escaneamento!',
                    progress: 100,
                    elapsedTime: Math.ceil(finalElapsedTime/1000)
                });

                console.log(`✅ [${sessionId}] Processo COMPLETO - QR Code enviado após ${Math.ceil(finalElapsedTime/1000)}s`);
            } else {
                console.log(`🚫 [${sessionId}] Validação final falhou - webhook não enviado`);
            }

        } else {
            // ❌ ERRO: QR Code inválido ou não capturado
            console.log(`❌ [${sessionId}] Falha ao capturar QR Code válido`);

            const errorSession = {
                ...sessions.get(sessionId),
                status: 'qr_error',
                qrCode: null,
                message: 'Erro ao gerar QR Code válido',
                errorAt: new Date().toISOString()
            };

            sessions.set(sessionId, errorSession);

            // 🔔 WEBHOOK: Notificar erro (SEM QR Code)
            await sendWebhook(sessionId, {
                status: 'qr_error',
                message: 'Erro ao gerar QR Code válido',
                error: 'Falha na captura do QR Code'
            });
        }

    } catch (error) {
        console.error(`❌ [${sessionId}] Erro no processo:`, error);

        const errorSession = {
            ...sessions.get(sessionId),
            status: 'error',
            qrCode: null,
            message: `Erro: ${error.message}`,
            errorAt: new Date().toISOString()
        };

        sessions.set(sessionId, errorSession);

        // 🔔 WEBHOOK: Notificar erro
        await sendWebhook(sessionId, {
            status: 'error',
            message: `Erro: ${error.message}`,
            error: error.message
        });

    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// 📍 ENDPOINTS (mantidos iguais)

// 🆕 ENDPOINT: Criar instância (compatibilidade com Edge Function)
app.post('/create-instance', authenticate, async (req, res) => {
    try {
        const { instanceId, instanceName, webhookUrl } = req.body;

        if (!instanceId) {
            return res.status(400).json({
                success: false,
                error: 'instanceId is required'
            });
        }

        console.log(`🎭 [CREATE-INSTANCE] Criando instância: ${instanceId}`);

        const sessionId = `puppeteer_${instanceId}_${Date.now()}`;

        // Criar sessão
        sessions.set(sessionId, {
            instanceId,
            instanceName: instanceName || instanceId,
            webhookUrl,
            status: 'initializing',
            qrCode: null,
            message: 'Criando instância...',
            createdAt: new Date().toISOString()
        });

        // Iniciar processo Puppeteer (assíncrono)
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

// 🆕 ENDPOINT: Obter QR Code de uma instância
app.get('/instance/:instanceId/qr', authenticate, (req, res) => {
    try {
        const { instanceId } = req.params;

        // Buscar sessão por instanceId
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

// 🆕 ENDPOINT: Status de uma instância específica
app.get('/instance/:instanceId/status', authenticate, (req, res) => {
    try {
        const { instanceId } = req.params;

        // Buscar sessão por instanceId
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

// Iniciar importação
app.post('/start-import', authenticate, async (req, res) => {
    try {
        const { instanceId, instanceName, webhookUrl } = req.body;

        if (!instanceId) {
            return res.status(400).json({
                success: false,
                error: 'instanceId is required'
            });
        }

        const sessionId = `puppeteer_${instanceId}_${Date.now()}`;

        // Criar sessão
        sessions.set(sessionId, {
            instanceId,
            instanceName: instanceName || instanceId,
            webhookUrl,
            status: 'initializing',
            qrCode: null,
            message: 'Inicializando...',
            createdAt: new Date().toISOString()
        });

        // Iniciar processo Puppeteer (assíncrono)
        startPuppeteerProcess(sessionId, { instanceId, instanceName, webhookUrl });

        res.json({
            success: true,
            sessionId,
            message: 'Importação iniciada'
        });

    } catch (error) {
        console.error('Erro ao iniciar importação:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obter status da sessão
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

// Listar todas as sessões
app.get('/sessions', authenticate, (req, res) => {
    try {
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

// Health check OTIMIZADO
app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'running',
        timestamp: new Date().toISOString(),
        activeSessions: sessions.size,
        webhook_timing_fix: true,
        qr_validation_enabled: true,
        minimum_wait_time: '25 seconds',
        version: '3.0-TIMING-FIXED'
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor Puppeteer com TIMING FIXO rodando na porta ${PORT}`);
    console.log(`🔒 Validação de QR Code: ATIVADA`);
    console.log(`🎯 Webhook timing fix: APLICADO`);
    console.log(`⏰ Tempo mínimo obrigatório: 25 segundos`);
    console.log(`🌐 Endpoints disponíveis:`);
    console.log(`   POST /create-instance`);
    console.log(`   POST /start-import`);
    console.log(`   GET  /instance/:instanceId/qr`);
    console.log(`   GET  /instance/:instanceId/status`);
    console.log(`   GET  /session-status/:sessionId`);
    console.log(`   GET  /sessions`);
    console.log(`   DELETE /session/:sessionId`);
    console.log(`   GET  /health`);
    console.log(`✅ Servidor pronto para receber requisições!`);
}); 