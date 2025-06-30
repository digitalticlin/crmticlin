const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const app = express();

// Configurações
app.use(cors());
app.use(express.json());

const PORT = 3001;
const WEBHOOK_URL = 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/whatsapp_chat_import';

// Armazenar sessões ativas
const activeSessions = new Map();

// 🎭 Configuração otimizada do Puppeteer para VPS
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
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--window-size=1280,720'
    ]
};

// 🆕 Função melhorada para capturar QR Code
async function captureQRCodeWithRetry(page, maxAttempts = 20) {
    console.log('🔍 Iniciando captura de QR Code...');
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`🔄 Tentativa ${attempt}/${maxAttempts}`);
        
        try {
            // Aguardar canvas aparecer
            await page.waitForSelector('canvas', { timeout: 5000 });
            
            // Verificar se canvas existe e tem tamanho adequado
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
                console.log(`📐 Canvas válido encontrado: ${canvasInfo.width}x${canvasInfo.height}`);
                
                // Capturar screenshot do canvas
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
            
            // Aguardar antes da próxima tentativa
            await page.waitForTimeout(3000);
            
        } catch (error) {
            console.log(`⚠️ Tentativa ${attempt} falhou: ${error.message}`);
            await page.waitForTimeout(2000);
        }
    }
    
    console.log('❌ QR Code não encontrado após múltiplas tentativas');
    return null;
}

// 🚀 Iniciar importação
app.post('/start-import', async (req, res) => {
    const { instanceId, instanceName, webhookUrl } = req.body;
    
    console.log(`🚀 Iniciando importação para instância: ${instanceId}`);
    
    try {
        // Verificar se já existe sessão ativa
        if (activeSessions.has(instanceId)) {
            const existingSession = activeSessions.get(instanceId);
            return res.json({
                success: true,
                sessionId: existingSession.sessionId,
                qrCode: existingSession.qrCode,
                status: existingSession.status,
                message: 'Sessão já ativa'
            });
        }
        
        // Criar nova sessão
        const sessionId = `session_${instanceId}_${Date.now()}`;
        const browser = await puppeteer.launch(PUPPETEER_CONFIG);
        const page = await browser.newPage();
        
        // Configurar página
        await page.setViewport({ width: 1280, height: 720 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        console.log('📱 Carregando WhatsApp Web...');
        await page.goto('https://web.whatsapp.com', { 
            waitUntil: 'domcontentloaded',
            timeout: 60000 
        });
        
        // Aguardar página carregar
        await page.waitForTimeout(5000);
        
        // Capturar QR Code
        const qrCode = await captureQRCodeWithRetry(page);
        
        if (!qrCode) {
            await browser.close();
            throw new Error('Não foi possível capturar o QR Code');
        }
        
        // Salvar sessão
        const sessionData = {
            sessionId,
            instanceId,
            instanceName,
            browser,
            page,
            qrCode,
            status: 'waiting_qr',
            createdAt: new Date(),
            webhookUrl: webhookUrl || WEBHOOK_URL
        };
        
        activeSessions.set(instanceId, sessionData);
        
        // Monitorar conexão
        monitorWhatsAppConnection(sessionData);
        
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

// 🔄 Monitorar conexão WhatsApp
async function monitorWhatsAppConnection(sessionData) {
    const { sessionId, instanceId, page, webhookUrl } = sessionData;
    
    console.log(`🔄 Monitorando conexão para sessão: ${sessionId}`);
    
    try {
        // Aguardar conexão (desaparecimento do QR code)
        await page.waitForFunction(() => {
            const canvas = document.querySelector('canvas');
            return !canvas || canvas.offsetParent === null;
        }, { timeout: 300000 }); // 5 minutos
        
        console.log(`✅ WhatsApp conectado para sessão: ${sessionId}`);
        
        // Atualizar status
        sessionData.status = 'connected';
        await sendWebhook(webhookUrl, {
            sessionId,
            status: 'connected',
            progress: 10
        });
        
        // Aguardar um pouco para garantir que conectou
        await page.waitForTimeout(10000);
        
        // Iniciar importação de contatos
        await importContacts(sessionData);
        
    } catch (error) {
        console.error(`❌ Erro na conexão: ${error}`);
        sessionData.status = 'error';
        await sendWebhook(webhookUrl, {
            sessionId,
            status: 'error',
            error: error.message
        });
    }
}

// 📥 Importar contatos
async function importContacts(sessionData) {
    const { sessionId, page, webhookUrl } = sessionData;
    
    console.log(`📥 Iniciando importação de contatos: ${sessionId}`);
    
    try {
        sessionData.status = 'importing';
        await sendWebhook(webhookUrl, {
            sessionId,
            status: 'importing',
            progress: 20
        });
        
        // Aguardar interface carregar
        await page.waitForTimeout(10000);
        
        // Extrair contatos da interface
        const contacts = await page.evaluate(() => {
            const contactElements = document.querySelectorAll('[data-testid="cell-frame-container"]');
            const extractedContacts = [];
            
            contactElements.forEach((element, index) => {
                try {
                    const nameElement = element.querySelector('[data-testid="cell-frame-title"]');
                    const lastMessageElement = element.querySelector('[data-testid="cell-frame-secondary"]');
                    
                    if (nameElement) {
                        const name = nameElement.textContent.trim();
                        const lastMessage = lastMessageElement ? lastMessageElement.textContent.trim() : '';
                        
                        // Extrair número se possível
                        const phoneMatch = name.match(/\+\d{1,3}\s\d{1,3}\s\d{4,}/);
                        const phone = phoneMatch ? phoneMatch[0] : name;
                        
                        extractedContacts.push({
                            id: `contact_${index}`,
                            name: name,
                            phone: phone,
                            lastMessage: lastMessage
                        });
                    }
                } catch (error) {
                    console.error('Erro extraindo contato:', error);
                }
            });
            
            return extractedContacts;
        });
        
        console.log(`📊 Contatos extraídos: ${contacts.length}`);
        
        // Enviar contatos via webhook
        if (contacts.length > 0) {
            await sendWebhook(webhookUrl, {
                sessionId,
                status: 'importing',
                progress: 50,
                contacts: contacts,
                totalContacts: contacts.length
            });
        }
        
        // Iniciar importação de mensagens
        await importMessages(sessionData, contacts);
        
    } catch (error) {
        console.error(`❌ Erro importando contatos: ${error}`);
        sessionData.status = 'error';
        await sendWebhook(webhookUrl, {
            sessionId,
            status: 'error',
            error: error.message
        });
    }
}

// 📨 Importar mensagens
async function importMessages(sessionData, contacts) {
    const { sessionId, page, webhookUrl } = sessionData;
    
    console.log(`📨 Iniciando importação de mensagens: ${sessionId}`);
    
    try {
        let totalMessages = 0;
        const batchSize = 5; // Processar 5 contatos por vez
        
        for (let i = 0; i < Math.min(contacts.length, batchSize); i++) {
            const contact = contacts[i];
            console.log(`📨 Processando mensagens do contato: ${contact.name}`);
            
            // Simular clique no contato (implementação básica)
            // Em uma implementação real, você precisaria implementar navegação entre chats
            
            const messages = [
                {
                    id: `msg_${contact.id}_1`,
                    from: contact.phone,
                    to: 'me',
                    body: contact.lastMessage,
                    timestamp: Date.now(),
                    type: 'text'
                }
            ];
            
            totalMessages += messages.length;
            
            // Enviar batch de mensagens
            await sendWebhook(webhookUrl, {
                sessionId,
                status: 'importing',
                progress: 50 + (i / contacts.length) * 40,
                messages: messages,
                totalMessages: totalMessages
            });
            
            await page.waitForTimeout(2000); // Aguardar entre contatos
        }
        
        // Finalizar importação
        sessionData.status = 'completed';
        await sendWebhook(webhookUrl, {
            sessionId,
            status: 'completed',
            progress: 100,
            totalContacts: contacts.length,
            totalMessages: totalMessages
        });
        
        console.log(`✅ Importação concluída: ${sessionId}`);
        
        // Limpar sessão após um tempo
        setTimeout(() => {
            cleanupSession(sessionData.instanceId);
        }, 60000);
        
    } catch (error) {
        console.error(`❌ Erro importando mensagens: ${error}`);
        sessionData.status = 'error';
        await sendWebhook(webhookUrl, {
            sessionId,
            status: 'error',
            error: error.message
        });
    }
}

// 🔗 Enviar webhook
async function sendWebhook(webhookUrl, data) {
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'webhook_progress',
                ...data
            })
        });
        
        if (!response.ok) {
            console.warn(`⚠️ Webhook failed: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ Webhook error:', error);
    }
}

// 📊 Status da sessão
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

// 🗑️ Deletar sessão
app.delete('/delete-session/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    
    const session = Array.from(activeSessions.values())
        .find(s => s.sessionId === sessionId);
    
    if (session) {
        await cleanupSession(session.instanceId);
        res.json({ success: true });
    } else {
        res.status(404).json({
            success: false,
            error: 'Session not found'
        });
    }
});

// 🧹 Limpar sessão
async function cleanupSession(instanceId) {
    const session = activeSessions.get(instanceId);
    if (session) {
        try {
            await session.browser.close();
        } catch (error) {
            console.error('❌ Erro fechando browser:', error);
        }
        activeSessions.delete(instanceId);
        console.log(`🧹 Sessão limpa: ${instanceId}`);
    }
}

// 🚀 Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor de importação Puppeteer rodando na porta ${PORT}`);
    console.log(`📱 Pronto para receber requisições de importação WhatsApp`);
});

// Limpar sessões antigas ao iniciar
process.on('SIGINT', async () => {
    console.log('🛑 Fechando servidor...');
    for (const [instanceId] of activeSessions) {
        await cleanupSession(instanceId);
    }
    process.exit(0);
}); 