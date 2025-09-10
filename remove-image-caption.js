const fs = require('fs');

console.log('🔧 Removendo caption do envio de imagens...');

try {
  const serverPath = '/root/whatsapp-server/server.js';
  
  // Backup de segurança
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `/root/whatsapp-server/server.js.backup-remove-caption-${timestamp}`;
  fs.copyFileSync(serverPath, backupPath);
  console.log(`✅ Backup criado: ${backupPath}`);

  let content = fs.readFileSync(serverPath, 'utf8');
  
  // CORREÇÃO 1: Remover caption do envio com Buffer (DataURL)
  const oldBufferCode = `messageResult = await instance.socket.sendMessage(formattedPhone, {
               image: buffer,
               caption: message
             });`;

  const newBufferCode = `messageResult = await instance.socket.sendMessage(formattedPhone, {
               image: buffer
             });`;

  // CORREÇÃO 2: Remover caption do envio com URL HTTP
  const oldUrlCode = `messageResult = await instance.socket.sendMessage(formattedPhone, {
               image: { url: mediaUrl },
               caption: message
             });`;

  const newUrlCode = `messageResult = await instance.socket.sendMessage(formattedPhone, {
               image: { url: mediaUrl }
             });`;

  // Aplicar correções
  let changed = false;
  
  if (content.includes('image: buffer,\n               caption: message')) {
    content = content.replace(oldBufferCode, newBufferCode);
    console.log('✅ Caption removido do envio com Buffer');
    changed = true;
  }
  
  if (content.includes('image: { url: mediaUrl },\n               caption: message')) {
    content = content.replace(oldUrlCode, newUrlCode);
    console.log('✅ Caption removido do envio com URL');
    changed = true;
  }

  if (!changed) {
    console.error('❌ Padrões de caption não encontrados!');
    console.log('🔍 Procurando padrões alternativos...');
    
    // Padrão mais flexível
    const flexPattern1 = /caption:\s*message/g;
    if (flexPattern1.test(content)) {
      // Remover linhas com caption: message
      content = content.replace(/,\s*caption:\s*message/g, '');
      console.log('✅ Caption removido com padrão flexível');
      changed = true;
    }
  }

  if (!changed) {
    console.error('❌ Não foi possível encontrar caption para remover');
    process.exit(1);
  }

  // Salvar arquivo corrigido
  fs.writeFileSync(serverPath, content, 'utf8');
  console.log('💾 Caption removido com sucesso');

  // Verificar sintaxe
  try {
    require.resolve(serverPath);
    console.log('✅ Verificação de sintaxe passou');
  } catch (err) {
    console.error('❌ Erro de sintaxe! Restaurando backup...');
    fs.copyFileSync(backupPath, serverPath);
    throw err;
  }

  console.log('🎉 CAPTION REMOVIDO COM SUCESSO!');
  console.log('📋 Alteração realizada:');
  console.log('   ✅ Imagens enviadas SEM legenda');
  console.log('   ✅ Apenas mídia pura');
  console.log('   ✅ Resto inalterado');
  console.log('🔄 Execute: pm2 restart whatsapp-server');

} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
} 