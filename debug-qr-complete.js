const puppeteer = require('puppeteer');

async function debugQRCode() {
    console.log('🎭 Iniciando debug completo do QR Code...');
    
    const browser = await puppeteer.launch({
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
            '--disable-features=VizDisplayCompositor'
        ]
    });

    try {
        const page = await browser.newPage();
        
        // User agent do Chrome
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        console.log('📱 Navegando para WhatsApp Web...');
        await page.goto('https://web.whatsapp.com', { 
            waitUntil: 'networkidle0',
            timeout: 60000 
        });

        console.log('⏱️ Aguardando página carregar...');
        await page.waitForTimeout(5000);

        // Estratégia 1: Buscar canvas diretamente
        console.log('🔍 Estratégia 1: Buscando canvas...');
        const canvasElements = await page.$$('canvas');
        console.log(`📊 Encontrados ${canvasElements.length} elementos canvas`);

        if (canvasElements.length > 0) {
            for (let i = 0; i < canvasElements.length; i++) {
                try {
                    const canvas = canvasElements[i];
                    const boundingBox = await canvas.boundingBox();
                    
                    if (boundingBox && boundingBox.width > 50 && boundingBox.height > 50) {
                        console.log(`🎯 Canvas ${i + 1} - Tamanho: ${boundingBox.width}x${boundingBox.height}`);
                        
                        // Capturar screenshot do canvas
                        const screenshot = await canvas.screenshot({ encoding: 'base64' });
                        console.log(`✅ QR Code capturado do canvas ${i + 1}!`);
                        console.log(`📋 Base64 (primeiros 100 chars): ${screenshot.substring(0, 100)}...`);
                        
                        return `data:image/png;base64,${screenshot}`;
                    }
                } catch (error) {
                    console.log(`❌ Erro no canvas ${i + 1}: ${error.message}`);
                }
            }
        }

        // Estratégia 2: Buscar por seletores específicos
        console.log('🔍 Estratégia 2: Buscando por seletores específicos...');
        const selectors = [
            '[data-ref]',
            '[role="img"]',
            'div[data-testid="qr-code"]',
            'div[title*="qr" i]',
            '.qr-code',
            '#qr-code',
            'canvas[width]',
            'img[alt*="qr" i]'
        ];

        for (const selector of selectors) {
            try {
                const elements = await page.$$(selector);
                if (elements.length > 0) {
                    console.log(`🎯 Encontrados ${elements.length} elementos com seletor: ${selector}`);
                    
                    for (let i = 0; i < elements.length; i++) {
                        try {
                            const element = elements[i];
                            const boundingBox = await element.boundingBox();
                            
                            if (boundingBox && boundingBox.width > 50 && boundingBox.height > 50) {
                                const screenshot = await element.screenshot({ encoding: 'base64' });
                                console.log(`✅ QR Code capturado com seletor ${selector}!`);
                                console.log(`📋 Base64 (primeiros 100 chars): ${screenshot.substring(0, 100)}...`);
                                
                                return `data:image/png;base64,${screenshot}`;
                            }
                        } catch (error) {
                            console.log(`❌ Erro no elemento ${i + 1} do seletor ${selector}: ${error.message}`);
                        }
                    }
                }
            } catch (error) {
                console.log(`❌ Erro no seletor ${selector}: ${error.message}`);
            }
        }

        // Estratégia 3: Aguardar elemento específico aparecer
        console.log('🔍 Estratégia 3: Aguardando QR code aparecer...');
        try {
            await page.waitForSelector('canvas', { timeout: 30000 });
            console.log('✅ Canvas encontrado após aguardar');
            
            const canvas = await page.$('canvas');
            if (canvas) {
                const screenshot = await canvas.screenshot({ encoding: 'base64' });
                console.log('✅ QR Code capturado após aguardar!');
                console.log(`📋 Base64 (primeiros 100 chars): ${screenshot.substring(0, 100)}...`);
                
                return `data:image/png;base64,${screenshot}`;
            }
        } catch (error) {
            console.log(`❌ Timeout aguardando canvas: ${error.message}`);
        }

        // Estratégia 4: Screenshot da página inteira para debug
        console.log('🔍 Estratégia 4: Screenshot completo para debug...');
        const fullScreenshot = await page.screenshot({ 
            encoding: 'base64',
            fullPage: true 
        });
        console.log('📸 Screenshot completo capturado');
        console.log(`📋 Screenshot Base64 (primeiros 100 chars): ${fullScreenshot.substring(0, 100)}...`);

        // Informações da página para debug
        const pageInfo = await page.evaluate(() => {
            return {
                title: document.title,
                url: window.location.href,
                bodyText: document.body ? document.body.innerText.substring(0, 500) : 'No body',
                canvasCount: document.querySelectorAll('canvas').length,
                hasQRElements: document.querySelectorAll('[data-testid*="qr"], [class*="qr"], [id*="qr"]').length,
                allElements: Array.from(document.querySelectorAll('*')).slice(0, 20).map(el => ({
                    tag: el.tagName,
                    id: el.id,
                    className: el.className,
                    dataAttrs: Object.keys(el.dataset)
                }))
            };
        });

        console.log('📊 Informações da página:');
        console.log(JSON.stringify(pageInfo, null, 2));

        return null;

    } catch (error) {
        console.error('❌ Erro geral:', error);
        return null;
    } finally {
        await browser.close();
    }
}

// Executar o debug
debugQRCode().then(result => {
    if (result) {
        console.log('🎉 SUCCESS: QR Code capturado com sucesso!');
    } else {
        console.log('❌ FAILURE: Não foi possível capturar o QR Code');
    }
}).catch(error => {
    console.error('💥 CRASH:', error);
}); 