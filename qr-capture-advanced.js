const puppeteer = require('puppeteer');

async function captureQRCodeAdvanced() {
    console.log('🚀 Iniciando captura avançada do QR Code...');
    
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
            '--window-size=1920,1080'
        ]
    });

    try {
        const page = await browser.newPage();
        
        // Configurar viewport e user agent
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        console.log('📱 Carregando WhatsApp Web...');
        await page.goto('https://web.whatsapp.com', { 
            waitUntil: 'domcontentloaded',
            timeout: 60000 
        });

        // Aguardar um pouco para a página carregar completamente
        await page.waitForTimeout(3000);

        console.log('⏱️ Aguardando QR code aparecer...');
        
        // Função para aguardar o QR code
        const waitForQRCode = async (maxAttempts = 30) => {
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                console.log(`🔄 Tentativa ${attempt}/${maxAttempts}`);
                
                // Verificar se existe canvas
                const canvasExists = await page.evaluate(() => {
                    const canvases = document.querySelectorAll('canvas');
                    return canvases.length > 0;
                });

                if (canvasExists) {
                    console.log('✅ Canvas encontrado!');
                    
                    // Tentar capturar o canvas
                    try {
                        const canvas = await page.$('canvas');
                        if (canvas) {
                            const boundingBox = await canvas.boundingBox();
                            
                            if (boundingBox && boundingBox.width > 50 && boundingBox.height > 50) {
                                console.log(`📐 Canvas size: ${boundingBox.width}x${boundingBox.height}`);
                                
                                // Capturar screenshot do canvas
                                const screenshot = await canvas.screenshot({ 
                                    encoding: 'base64',
                                    type: 'png'
                                });
                                
                                if (screenshot && screenshot.length > 1000) {
                                    console.log('🎉 QR Code capturado com sucesso!');
                                    console.log(`📏 Tamanho do base64: ${screenshot.length} characters`);
                                    return `data:image/png;base64,${screenshot}`;
                                }
                            }
                        }
                    } catch (error) {
                        console.log(`❌ Erro capturando canvas: ${error.message}`);
                    }
                }

                // Verificar se a página está pedindo para fazer login com telefone
                const hasPhoneLogin = await page.evaluate(() => {
                    const text = document.body.innerText.toLowerCase();
                    return text.includes('link with phone') || text.includes('phone number');
                });

                if (hasPhoneLogin) {
                    console.log('📞 Página mostrando opção de login por telefone');
                    
                    // Tentar clicar para mostrar QR code
                    try {
                        const qrOption = await page.$('button, a, div');
                        if (qrOption) {
                            console.log('🔄 Tentando forçar exibição do QR code...');
                            // Aqui você pode adicionar lógica específica se necessário
                        }
                    } catch (error) {
                        console.log('❌ Erro tentando forçar QR code:', error.message);
                    }
                }

                // Aguardar antes da próxima tentativa
                await page.waitForTimeout(2000);
            }
            
            return null;
        };

        // Tentar capturar o QR code
        const qrCodeBase64 = await waitForQRCode();
        
        if (qrCodeBase64) {
            console.log('✅ SUCESSO: QR Code capturado!');
            return qrCodeBase64;
        }

        // Se não conseguiu capturar, fazer screenshot completo para debug
        console.log('📸 Fazendo screenshot completo para debug...');
        const fullScreenshot = await page.screenshot({ 
            encoding: 'base64',
            fullPage: true,
            type: 'png'
        });

        console.log('📊 Screenshot completo capturado para análise');
        console.log(`📏 Tamanho: ${fullScreenshot.length} characters`);

        // Salvar informações da página
        const pageContent = await page.evaluate(() => {
            return {
                title: document.title,
                url: window.location.href,
                bodyText: document.body.innerText.substring(0, 1000),
                canvasCount: document.querySelectorAll('canvas').length,
                allCanvases: Array.from(document.querySelectorAll('canvas')).map((canvas, i) => ({
                    index: i,
                    width: canvas.width,
                    height: canvas.height,
                    offsetWidth: canvas.offsetWidth,
                    offsetHeight: canvas.offsetHeight,
                    style: canvas.style.cssText
                })),
                elementTypes: {
                    divs: document.querySelectorAll('div').length,
                    buttons: document.querySelectorAll('button').length,
                    images: document.querySelectorAll('img').length,
                    svgs: document.querySelectorAll('svg').length
                }
            };
        });

        console.log('📋 Informações da página:');
        console.log(JSON.stringify(pageContent, null, 2));

        return {
            error: 'QR Code não encontrado',
            debug: {
                screenshot: `data:image/png;base64,${fullScreenshot}`,
                pageContent
            }
        };

    } catch (error) {
        console.error('💥 Erro crítico:', error);
        return { error: error.message };
    } finally {
        await browser.close();
    }
}

// Executar a captura
captureQRCodeAdvanced().then(result => {
    if (typeof result === 'string' && result.startsWith('data:image/png;base64,')) {
        console.log('🎉 SUCCESS: QR Code capturado!');
        console.log('📋 Base64 URL pronto para usar');
    } else {
        console.log('❌ FAILURE: QR Code não capturado');
        console.log('📋 Resultado:', result);
    }
}).catch(error => {
    console.error('💥 CRASH:', error);
}); 