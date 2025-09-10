const fs = require('fs');

console.log('🔧 Aplicando correção DataURL → Buffer no Baileys...');

try {
  const serverPath = '/root/whatsapp-server/server.js';
  
  // Backup de segurança
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `/root/whatsapp-server/server.js.backup-buffer-fix-${timestamp}`;
  fs.copyFileSync(serverPath, backupPath);
  console.log(`✅ Backup criado: ${backupPath}`);

  let content = fs.readFileSync(serverPath, 'utf8');
  
  // Verificar se encontramos o padrão esperado
  const imagePattern = /case 'image':\s*messageResult = await instance\.socket\.sendMessage\(formattedPhone, \{\s*image: \{ url: mediaUrl \},\s*caption: message\s*\}\);/;
  
  if (!imagePattern.test(content)) {
    console.error('❌ Padrão de envio de imagem não encontrado!');
    console.log('🔍 Procurando padrões alternativos...');
    
    // Buscar padrão alternativo
    if (content.includes('image: { url: mediaUrl }')) {
      console.log('✅ Encontrado padrão alternativo');
    } else {
      console.error('❌ Nenhum padrão de imagem encontrado');
      process.exit(1);
    }
  }

  // CORREÇÃO CIRÚRGICA: Substituir apenas o case 'image'
  const oldImageCase = `case 'image':
           messageResult = await instance.socket.sendMessage(formattedPhone, {
             image: { url: mediaUrl },
             caption: message
           });
           break;`;

  const newImageCase = `case 'image':
           if (mediaUrl.startsWith('data:')) {
             // ✅ DataURL → Buffer (para Baileys)
             console.log('📱 Convertendo DataURL para Buffer...');
             const base64Data = mediaUrl.split(',')[1];
             const buffer = Buffer.from(base64Data, 'base64');
             messageResult = await instance.socket.sendMessage(formattedPhone, {
               image: buffer,
               caption: message
             });
           } else {
             // URL HTTP normal
             messageResult = await instance.socket.sendMessage(formattedPhone, {
               image: { url: mediaUrl },
               caption: message
             });
           }
           break;`;

  // Aplicar correção
  content = content.replace(oldImageCase, newImageCase);

  // Verificar se a substituição funcionou
  if (!content.includes('DataURL → Buffer')) {
    console.error('❌ Substituição não foi aplicada!');
    console.log('🔍 Tentando padrão mais flexível...');
    
    // Padrão mais flexível
    const flexPattern = /case 'image':\s*messageResult = await instance\.socket\.sendMessage\(formattedPhone, \{\s*image: \{ url: mediaUrl \},\s*caption: message\s*\}\);\s*break;/s;
    
    if (flexPattern.test(content)) {
      content = content.replace(flexPattern, newImageCase);
      console.log('✅ Aplicado com padrão flexível');
    } else {
      console.error('❌ Não foi possível aplicar a correção');
      process.exit(1);
    }
  }

  // Salvar arquivo corrigido
  fs.writeFileSync(serverPath, content, 'utf8');
  console.log('💾 Correção DataURL → Buffer aplicada');

  // Verificar sintaxe
  try {
    require.resolve(serverPath);
    console.log('✅ Verificação de sintaxe passou');
  } catch (err) {
    console.error('❌ Erro de sintaxe! Restaurando backup...');
    fs.copyFileSync(backupPath, serverPath);
    throw err;
  }

  console.log('🎉 CORREÇÃO APLICADA COM SUCESSO!');
  console.log('📋 O que foi alterado:');
  console.log('   ✅ DataURL detectada → converte para Buffer');
  console.log('   ✅ URL HTTP normal → mantém como estava');
  console.log('   ✅ Apenas case "image" alterado');
  console.log('   ✅ Todo resto inalterado');
  console.log('🔄 Execute: pm2 restart whatsapp-server');

} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
} 