const puppeteer = require('puppeteer');

async function fixQRCodeTiming() {
    console.log('🎯 Script focado em timing do QR Code...');
    
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
            '--disable-features=VizDisplayCompositor',
            '--window-size=1280,720'
        ]
    });

    try {
        const page = await browser.newPage();
        
        // Configurar viewport
        await page.setViewport({ width: 1280, height: 720 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        console.log('📱 Carregando WhatsApp Web...');
        await page.goto('https://web.whatsapp.com', { 
            waitUntil: 'domcontentloaded',
            timeout: 60000 
        });

        console.log('⏳ Aguardando 5 segundos iniciais...');
        await page.waitForTimeout(5000);

        // Função para verificar e capturar QR code
        const checkForQRCode = async () => {
            try {
                // Verificar canvas
                const canvas = await page.$('canvas');
                if (!canvas) {
                    console.log('❌ Canvas não encontrado');
                    return null;
                }

                // Verificar tamanho do canvas
                const boundingBox = await canvas.boundingBox();
                if (!boundingBox) {
                    console.log('❌ Canvas sem bounding box');
                    return null;
                }

                console.log(`📐 Canvas encontrado: ${boundingBox.width}x${boundingBox.height}`);

                // Se canvas é muito pequeno, não é o QR code
                if (boundingBox.width < 100 || boundingBox.height < 100) {
                    console.log('⚠️ Canvas muito pequeno, provavelmente não é QR code');
                    return null;
                }

                // Tentar capturar screenshot
                const screenshot = await canvas.screenshot({ 
                    encoding: 'base64',
                    type: 'png'
                });

                // Verificar se screenshot tem conteúdo suficiente
                if (!screenshot || screenshot.length < 1000) {
                    console.log('⚠️ Screenshot muito pequeno ou vazio');
                    return null;
                }

                console.log(`✅ QR Code capturado! Tamanho: ${screenshot.length} chars`);
                return `data:image/png;base64,${screenshot}`;

            } catch (error) {
                console.log(`❌ Erro verificando QR code: ${error.message}`);
                return null;
            }
        };

        // Tentar capturar QR code com múltiplas tentativas
        let qrCode = null;
        const maxAttempts = 20;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            console.log(`🔄 Tentativa ${attempt}/${maxAttempts}`);
            
            qrCode = await checkForQRCode();
            
            if (qrCode) {
                console.log('🎉 QR Code capturado com sucesso!');
                break;
            }

            // Aguardar antes da próxima tentativa
            console.log('⏳ Aguardando 3 segundos...');
            await page.waitForTimeout(3000);
        }

        if (!qrCode) {
            console.log('📸 Fazendo screenshot completo para debug...');
            const fullScreenshot = await page.screenshot({ 
                encoding: 'base64',
                fullPage: false,
                type: 'png'
            });

            console.log(`📊 Screenshot completo: ${fullScreenshot.length} chars`);
            
            // Informações detalhadas da página
            const pageInfo = await page.evaluate(() => {
                const canvases = Array.from(document.querySelectorAll('canvas'));
                return {
                    title: document.title,
                    url: window.location.href,
                    canvasCount: canvases.length,
                    canvasDetails: canvases.map((canvas, i) => ({
                        index: i,
                        width: canvas.width,
                        height: canvas.height,
                        offsetWidth: canvas.offsetWidth,
                        offsetHeight: canvas.offsetHeight,
                        clientWidth: canvas.clientWidth,
                        clientHeight: canvas.clientHeight,
                        visible: canvas.offsetParent !== null,
                        style: canvas.style.cssText
                    })),
                    bodyText: document.body.innerText.substring(0, 500)
                };
            });

            console.log('📋 Informações detalhadas:');
            console.log(JSON.stringify(pageInfo, null, 2));

            return {
                error: 'QR Code não capturado após múltiplas tentativas',
                screenshot: `data:image/png;base64,${fullScreenshot}`,
                pageInfo
            };
        }

        return qrCode;

    } catch (error) {
        console.error('💥 Erro crítico:', error);
        return { error: error.message };
    } finally {
        await browser.close();
    }
}

// Executar
fixQRCodeTiming().then(result => {
    if (typeof result === 'string' && result.startsWith('data:image/png;base64,')) {
        console.log('🎉 SUCESSO! QR Code Base64 gerado');
        console.log('✅ Pronto para usar no frontend');
    } else {
        console.log('❌ FALHA na captura do QR Code');
        if (result && result.error) {
            console.log('Erro:', result.error);
        }
    }
}).catch(error => {
    console.error('💥 CRASH:', error);
}); 