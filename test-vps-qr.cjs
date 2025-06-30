const axios = require('axios');

// Configuração da VPS Puppeteer
const VPS_CONFIG = {
    baseUrl: 'http://31.97.163.57:3001',
    timeout: 120000 // 2 minutos
};

async function testVPSQRCode() {
    console.log('🧪 TESTANDO GERAÇÃO DE QR CODE NA VPS PUPPETEER');
    console.log('================================================');
    
    try {
        // Dados de teste
        const testData = {
            instanceId: `test_${Date.now()}`,
            instanceName: 'Teste QR Code',
            webhookUrl: 'https://webhook.teste.com'
        };
        
        console.log('📋 Dados do teste:', testData);
        console.log('🌐 URL da VPS:', VPS_CONFIG.baseUrl);
        
        console.log('\n🚀 Fazendo requisição para iniciar importação...');
        
        const response = await axios.post(`${VPS_CONFIG.baseUrl}/start-import`, testData, {
            timeout: VPS_CONFIG.timeout,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📊 Status da resposta:', response.status);
        console.log('📋 Headers da resposta:', response.headers);
        
        const data = response.data;
        console.log('\n✅ RESPOSTA RECEBIDA:');
        console.log('====================');
        console.log('Success:', data.success);
        console.log('Session ID:', data.sessionId);
        console.log('Status:', data.status);
        console.log('Message:', data.message);
        
        // Verificar se QR code foi retornado
        if (data.qrCode) {
            console.log('\n🎉 QR CODE ENCONTRADO!');
            console.log('======================');
            console.log('Tipo:', data.qrCode.startsWith('data:image/png;base64,') ? 'Base64 PNG ✅' : 'Formato desconhecido ❌');
            console.log('Tamanho:', data.qrCode.length, 'caracteres');
            console.log('Amostra (primeiros 100 chars):', data.qrCode.substring(0, 100) + '...');
            
            // Validar se é um base64 válido
            try {
                const base64Data = data.qrCode.replace('data:image/png;base64,', '');
                const buffer = Buffer.from(base64Data, 'base64');
                console.log('Buffer size:', buffer.length, 'bytes');
                console.log('✅ Base64 válido!');
                
                return {
                    success: true,
                    qrCode: data.qrCode,
                    sessionId: data.sessionId,
                    message: 'QR Code gerado com sucesso!'
                };
                
            } catch (error) {
                console.error('❌ Base64 inválido:', error.message);
                return {
                    success: false,
                    error: 'QR Code retornado mas base64 inválido'
                };
            }
            
        } else {
            console.log('\n❌ QR CODE NÃO ENCONTRADO');
            console.log('========================');
            console.log('A resposta não contém qrCode');
            
            return {
                success: false,
                error: 'QR Code não retornado na resposta',
                response: data
            };
        }
        
    } catch (error) {
        console.error('\n💥 ERRO NA REQUISIÇÃO:');
        console.error('======================');
        
        if (error.code === 'ECONNREFUSED') {
            console.error('❌ Conexão recusada - Servidor não está rodando na porta 3001');
            console.error('🔧 Verifique se o serviço está ativo: systemctl status whatsapp-puppeteer');
        } else if (error.code === 'ETIMEDOUT') {
            console.error('❌ Timeout - Servidor demorou muito para responder');
            console.error('⏰ Pode estar processando ou sobrecarregado');
        } else if (error.response) {
            console.error('❌ Resposta de erro do servidor:');
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('❌ Erro desconhecido:', error.message);
        }
        
        return {
            success: false,
            error: error.message,
            code: error.code
        };
    }
}

// Função auxiliar para testar conectividade
async function testVPSConnectivity() {
    console.log('🔌 Testando conectividade com a VPS...');
    
    try {
        const response = await axios.get(`${VPS_CONFIG.baseUrl}/`, {
            timeout: 10000
        });
        console.log('✅ VPS respondendo na porta 3001');
        return true;
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('❌ VPS não está respondendo na porta 3001');
            console.error('🔧 Servidor Puppeteer pode não estar rodando');
        } else {
            console.error('❌ Erro de conectividade:', error.message);
        }
        return false;
    }
}

// Executar teste completo
async function runCompleteTest() {
    console.log('🎯 INICIANDO TESTE COMPLETO DA VPS PUPPETEER\n');
    
    // 1. Testar conectividade
    const isConnected = await testVPSConnectivity();
    if (!isConnected) {
        console.log('\n❌ TESTE FALHADO: VPS não está acessível');
        return;
    }
    
    console.log(''); // Linha em branco
    
    // 2. Testar geração de QR code
    const result = await testVPSQRCode();
    
    console.log('\n📊 RESULTADO FINAL:');
    console.log('==================');
    if (result.success) {
        console.log('🎉 ✅ SUCESSO! QR Code gerado corretamente');
        console.log('📱 A VPS está funcionando e gerando QR codes em base64');
        console.log('🔗 Pronto para usar no frontend');
    } else {
        console.log('❌ ❌ FALHA! QR Code não foi gerado');
        console.log('🔧 Verifique os logs da VPS e dependências');
        console.log('💡 Pode ser necessário instalar as dependências');
    }
    
    return result;
}

// Executar se chamado diretamente
if (require.main === module) {
    runCompleteTest().catch(console.error);
}

module.exports = { testVPSQRCode, testVPSConnectivity, runCompleteTest }; 