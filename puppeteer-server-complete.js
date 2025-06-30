const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;
const activeSessions = new Map();

// Configuração Puppeteer otimizada para VPS
const PUPPETEER_CONFIG = {
    headless: true,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote', 
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--window-size=1280,720'
    ]
};

// Função para capturar QR Code com retry
async function captureQRCodeWithRetry(page, maxAttempts = 20) {
    console.log('🔍 Iniciando captura de QR Code...');
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`🔄 Tentativa ${attempt}/${maxAttempts}`);
        
        try {
            await page.waitForSelector('canvas', { timeout: 5000 });
            
            const canvasInfo = await page.evaluate(() => {
                const canvas = document.querySelector('canvas');
                if (!canvas) return null;
                
                const rect = canvas.getBoundingClientRect();
                return {
                    width: rect.width,
                    height: rect.height,
                    visible: rect.width > 0 && rect.height > 0
                };
            });
            
            if (canvasInfo && canvasInfo.visible && canvasInfo.width > 100 && canvasInfo.height > 100) {
                console.log(`📐 Canvas válido: ${canvasInfo.width}x${canvasInfo.height}`);
                
                const canvas = await page.$('canvas');
                const screenshot = await canvas.screenshot({ 
                    encoding: 'base64',
                    type: 'png'
                });
                
                if (screenshot && screenshot.length > 1000) {
                    console.log(`✅ QR Code capturado! Tamanho: ${screenshot.length} chars`);
                    return `data:image/png;base64,${screenshot}`;
                }
            }
            
            await page.waitForTimeout(3000);
            
        } catch (error) {
            console.log(`⚠️ Tentativa ${attempt} falhou: ${error.message}`);
            await page.waitForTimeout(2000);
        }
    }
    
    return null;
}

// Endpoint para iniciar importação
app.post('/start-import', async (req, res) => {
    const { instanceId, instanceName, webhookUrl } = req.body;
    
    console.log(`🚀 Iniciando importação: ${instanceId}`);
    
    try {
        if (activeSessions.has(instanceId)) {
            const existingSession = activeSessions.get(instanceId);
            return res.json({
                success: true,
                sessionId: existingSession.sessionId,
                qrCode: existingSession.qrCode,
                status: existingSession.status
            });
        }
        
        const sessionId = `session_${instanceId}_${Date.now()}`;
        const browser = await puppeteer.launch(PUPPETEER_CONFIG);
        const page = await browser.newPage();
        
        await page.setViewport({ width: 1280, height: 720 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        console.log('📱 Carregando WhatsApp Web...');
        await page.goto('https://web.whatsapp.com', { 
            waitUntil: 'domcontentloaded',
            timeout: 60000 
        });
        
        await page.waitForTimeout(5000);
        
        const qrCode = await captureQRCodeWithRetry(page);
        
        if (!qrCode) {
            await browser.close();
            throw new Error('Não foi possível capturar o QR Code');
        }
        
        const sessionData = {
            sessionId,
            instanceId,
            instanceName,
            browser,
            page,
            qrCode,
            status: 'waiting_qr',
            createdAt: new Date(),
            webhookUrl: webhookUrl || 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/whatsapp_chat_import'
        };
        
        activeSessions.set(instanceId, sessionData);
        
        console.log(`✅ Sessão criada: ${sessionId}`);
        
        res.json({
            success: true,
            sessionId,
            qrCode,
            status: 'waiting_qr',
            message: 'QR Code gerado com sucesso'
        });
        
    } catch (error) {
        console.error('❌ Erro criando sessão:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Status da sessão
app.get('/session-status/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    
    const session = Array.from(activeSessions.values())
        .find(s => s.sessionId === sessionId);
    
    if (!session) {
        return res.status(404).json({
            success: false,
            error: 'Session not found'
        });
    }
    
    res.json({
        success: true,
        sessionId: session.sessionId,
        status: session.status,
        qrCode: session.qrCode,
        createdAt: session.createdAt
    });
});

// Deletar sessão
app.delete('/delete-session/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    
    const session = Array.from(activeSessions.values())
        .find(s => s.sessionId === sessionId);
    
    if (session) {
        try {
            await session.browser.close();
        } catch (error) {
            console.error('❌ Erro fechando browser:', error);
        }
        activeSessions.delete(session.instanceId);
        res.json({ success: true });
    } else {
        res.status(404).json({
            success: false,
            error: 'Session not found'
        });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor Puppeteer rodando na porta ${PORT}`);
    console.log(`📱 Pronto para importações WhatsApp`);
});

process.on('SIGINT', async () => {
    console.log('🛑 Fechando servidor...');
    for (const [instanceId, session] of activeSessions) {
        try {
            await session.browser.close();
        } catch (error) {
            console.error('❌ Erro fechando sessão:', error);
        }
    }
    process.exit(0);
}); 