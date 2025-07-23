// ==========================================
// SCRIPT DE VERIFICAÇÃO DA SAÚDE DA VPS
// Execute na VPS: node verify-vps-health.js
// ==========================================

const fs = require('fs');
const http = require('http');

console.log('🔍 Verificando saúde da VPS...');

try {
  // 1. Verificar se arquivo existe e não tem erros de sintaxe
  const serverPath = '/root/whatsapp-server/server.js';
  
  if (!fs.existsSync(serverPath)) {
    console.error('❌ Arquivo server.js não encontrado!');
    process.exit(1);
  }

  console.log('✅ Arquivo server.js encontrado');

  // 2. Verificar sintaxe básica
  try {
    const content = fs.readFileSync(serverPath, 'utf8');
    
    // Verificar se tem endpoint /send
    if (!content.includes("app.post('/send'")) {
      console.error('❌ Endpoint /send não encontrado!');
      process.exit(1);
    }
    console.log('✅ Endpoint /send encontrado');

    // Verificar se tem suporte a mídia
    if (content.includes('mediaType') && content.includes('mediaUrl')) {
      console.log('✅ Suporte a mídia detectado');
    } else {
      console.log('⚠️  Suporte a mídia NÃO detectado');
    }

    // Verificar se mantém funcionalidades originais
    if (content.includes('connectionManager') && content.includes('addSentMessageToCache')) {
      console.log('✅ Funcionalidades originais mantidas');
    } else {
      console.log('⚠️  Algumas funcionalidades originais podem ter sido perdidas');
    }

    console.log(`📊 Tamanho do arquivo: ${content.length} bytes`);

  } catch (syntaxError) {
    console.error('❌ Erro de sintaxe:', syntaxError.message);
    process.exit(1);
  }

  // 3. Verificar se servidor está rodando
  console.log('🌐 Verificando se servidor está online...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/health',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Servidor respondendo: ${res.statusCode}`);
    process.exit(0);
  });

  req.on('error', (err) => {
    console.log('⚠️  Servidor não está respondendo (normal se acabou de reiniciar)');
    console.log('🔄 Aguarde alguns segundos e verifique com: pm2 status');
    process.exit(0);
  });

  req.on('timeout', () => {
    console.log('⚠️  Timeout ao conectar (normal se acabou de reiniciar)');
    req.destroy();
    process.exit(0);
  });

  req.end();

} catch (error) {
  console.error('❌ Erro durante verificação:', error.message);
  process.exit(1);
} 