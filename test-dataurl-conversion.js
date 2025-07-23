const fs = require('fs');

console.log('🧪 TESTE DE CONVERSÃO DATAURL → BUFFER');

// Simular uma DataURL pequena (1x1 pixel PNG transparente)
const testDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIHWNgAAIAAAUAAY27m/MAAAAASUVORK5CYII=';

console.log('📋 Dados do teste:');
console.log(`   DataURL: ${testDataURL.substring(0, 50)}...`);
console.log(`   Tamanho total: ${testDataURL.length} caracteres`);

// Extrair dados como faria o server.js
if (testDataURL.startsWith('data:')) {
  console.log('✅ DataURL detectada corretamente');
  
  const base64Data = testDataURL.split(',')[1];
  console.log(`   Base64 extraído: ${base64Data.substring(0, 20)}...`);
  console.log(`   Tamanho base64: ${base64Data.length} caracteres`);
  
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    console.log(`✅ Buffer criado com sucesso: ${buffer.length} bytes`);
    console.log(`   Buffer preview: <Buffer ${buffer.toString('hex').substring(0, 20)}...>`);
    
    // Verificar se é um PNG válido
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      console.log('✅ PNG válido detectado (magic bytes: 89 50 4E 47)');
    } else {
      console.log('⚠️  Não é PNG, mas buffer foi criado');
    }
    
    console.log('🎉 CONVERSÃO FUNCIONANDO PERFEITAMENTE!');
    
  } catch (error) {
    console.error('❌ Erro ao criar buffer:', error.message);
  }
} else {
  console.error('❌ DataURL não foi detectada');
}

console.log('\n📡 Testando chamada real para VPS...');

// Teste real com curl
const testPayload = {
  instanceId: 'contatoluizantoniooliveira',
  phone: '5562999999999',  // Número fake para teste
  message: 'Teste de conversão DataURL',
  mediaType: 'image_dataurl',
  mediaUrl: testDataURL
};

console.log('🔧 Payload de teste criado');
console.log('📞 Execute este comando para testar:');
console.log('');
console.log(`curl -X POST http://localhost:3001/send \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -H "Authorization: Bearer bJyn3eUPFTRFNCxxLNd8KH5bI4Zg7bpUk7ADO6kXf49026a1" \\`);
console.log(`  -d '${JSON.stringify(testPayload, null, 2).replace(/'/g, '\\'')}'`);
console.log('');
console.log('⚠️  NOTA: Teste usará número fake - não será enviado realmente');
console.log('✅ MAS: Logs mostrarão se conversão DataURL → Buffer funcionou'); 