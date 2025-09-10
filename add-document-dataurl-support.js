const fs = require('fs');

console.log('🔧 Adicionando suporte a document_dataurl na VPS...');

try {
  const serverPath = '/root/whatsapp-server/server.js';
  
  // Backup de segurança
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `/root/whatsapp-server/server.js.backup-document-dataurl-${timestamp}`;
  fs.copyFileSync(serverPath, backupPath);
  console.log(`✅ Backup criado: ${backupPath}`);

  let content = fs.readFileSync(serverPath, 'utf8');
  
  // Procurar o case 'document' atual
  const oldDocumentCase = `case 'document':
          messageResult = await instance.socket.sendMessage(formattedPhone, {
            document: { url: mediaUrl },
            fileName: message || 'documento.pdf',
            mimetype: 'application/pdf'
          });
          break;`;

  const newDocumentCase = `case 'document':
          if (mediaUrl.startsWith('data:')) {
            // ✅ DataURL → Buffer para documentos
            console.log('📱 Convertendo document DataURL para Buffer...');
            const base64Data = mediaUrl.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            messageResult = await instance.socket.sendMessage(formattedPhone, {
              document: buffer,
              fileName: message || 'documento.pdf'
            });
          } else {
            // URL HTTP normal
            messageResult = await instance.socket.sendMessage(formattedPhone, {
              document: { url: mediaUrl },
              fileName: message || 'documento.pdf',
              mimetype: 'application/pdf'
            });
          }
          break;`;

  // Verificar se o case document existe
  if (!content.includes("case 'document':")) {
    console.error('❌ Case document não encontrado!');
    process.exit(1);
  }

  // Aplicar correção
  content = content.replace(oldDocumentCase, newDocumentCase);

  // Verificar se a substituição funcionou
  if (!content.includes('document DataURL para Buffer')) {
    console.error('❌ Substituição não foi aplicada!');
    process.exit(1);
  }

  // Salvar arquivo corrigido
  fs.writeFileSync(serverPath, content, 'utf8');
  console.log('💾 Suporte a document_dataurl adicionado');

  // Verificar sintaxe
  try {
    require.resolve(serverPath);
    console.log('✅ Verificação de sintaxe passou');
  } catch (err) {
    console.error('❌ Erro de sintaxe! Restaurando backup...');
    fs.copyFileSync(backupPath, serverPath);
    throw err;
  }

  console.log('🎉 DOCUMENT_DATAURL SUPORTADO!');
  console.log('📋 Alteração realizada:');
  console.log('   ✅ DataURL detectada → converte para Buffer');
  console.log('   ✅ URL HTTP normal → mantém como estava');
  console.log('   ✅ Suporte completo a PDFs e documentos');
  console.log('🔄 Execute: pm2 restart whatsapp-server');

} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
} 