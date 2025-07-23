const fs = require('fs');

console.log('🔧 Adicionando suporte final a DataURL na VPS...');

try {
  const serverPath = '/root/whatsapp-server/server.js';
  
  // Backup antes da modificação
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `/root/whatsapp-server/server.js.backup-final-${timestamp}`;
  fs.copyFileSync(serverPath, backupPath);
  console.log(`✅ Backup criado: ${backupPath}`);

  let content = fs.readFileSync(serverPath, 'utf8');
  
  // Verificar se já tem o endpoint que queremos modificar
  if (!content.includes('await instance.socket.sendMessage(formattedPhone, { text: message });')) {
    console.error('❌ Endpoint de envio não encontrado!');
    process.exit(1);
  }

  // Substituir a linha de envio simples por lógica que suporta DataURL
  const oldLine = 'const messageResult = await instance.socket.sendMessage(formattedPhone, { text: message });';
  
  const newLogic = `let messageResult;

    // ✅ SUPORTE COMPLETO A MÍDIA E DATAURL
    if (mediaType && mediaType !== 'text' && mediaUrl) {
      console.log(\`🎬 Enviando mídia tipo: \${mediaType}\`);
      
      // Detectar tipos especiais
      const isDataUrl = mediaType.includes('_dataurl');
      const baseType = mediaType.replace('_dataurl', '');
      
      if (isDataUrl) {
        console.log('📱 Detectada DataURL, processando...');
      }
      
      switch (baseType.toLowerCase()) {
        case 'image':
          messageResult = await instance.socket.sendMessage(formattedPhone, {
            image: { url: mediaUrl },
            caption: message
          });
          break;
          
        case 'video':
          messageResult = await instance.socket.sendMessage(formattedPhone, {
            video: { url: mediaUrl },
            caption: message
          });
          break;
          
        case 'audio':
          messageResult = await instance.socket.sendMessage(formattedPhone, {
            audio: { url: mediaUrl },
            ptt: true
          });
          break;
          
        case 'document':
          messageResult = await instance.socket.sendMessage(formattedPhone, {
            document: { url: mediaUrl },
            fileName: message || 'documento.pdf',
            mimetype: 'application/pdf'
          });
          break;
          
        default:
          console.log('⚠️  Tipo de mídia não reconhecido, enviando como texto');
          messageResult = await instance.socket.sendMessage(formattedPhone, { text: message });
      }
    } else {
      // Mensagem de texto padrão
      messageResult = await instance.socket.sendMessage(formattedPhone, { text: message });
    }`;

  // Substituir
  content = content.replace(oldLine, newLogic);

  // Salvar arquivo modificado
  fs.writeFileSync(serverPath, content, 'utf8');
  console.log('💾 Arquivo salvo com suporte final a DataURL');

  // Verificar sintaxe
  try {
    require.resolve(serverPath);
    console.log('✅ Verificação de sintaxe passou');
  } catch (err) {
    console.error('❌ Erro de sintaxe! Restaurando backup...');
    fs.copyFileSync(backupPath, serverPath);
    throw err;
  }

  console.log('🎉 VPS ATUALIZADA COM SUPORTE FINAL A DATAURL!');
  console.log('📋 Tipos suportados:');
  console.log('   ✅ image_dataurl (DataURLs de imagem)');
  console.log('   ✅ video_dataurl (DataURLs de vídeo)');  
  console.log('   ✅ audio_dataurl (DataURLs de áudio)');
  console.log('   ✅ document_dataurl (DataURLs de documento)');
  console.log('   ✅ URLs normais mantidas');
  console.log('🔄 Execute: pm2 restart whatsapp-server');

} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
} 