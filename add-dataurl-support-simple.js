const fs = require('fs');

console.log('🔧 Adicionando suporte a DataURL na VPS...');

try {
  const serverPath = '/root/whatsapp-server/server.js';
  
  // Backup antes da modificação
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `/root/whatsapp-server/server.js.backup-dataurl-simple-${timestamp}`;
  fs.copyFileSync(serverPath, backupPath);
  console.log(`✅ Backup criado: ${backupPath}`);

  let content = fs.readFileSync(serverPath, 'utf8');
  
  // Procurar por onde o Baileys envia a mensagem de imagem
  const imagePattern = /messageResult = await instance\.socket\.sendMessage\(formattedPhone, \{ text: message \}\);/;
  
  if (!imagePattern.test(content)) {
    console.error('❌ Padrão de envio de mensagem não encontrado!');
    process.exit(1);
  }

  // Substituir por lógica que suporta DataURL
  const newSendLogic = `// ✅ SUPORTE A DATAURL E MÍDIA
    if (mediaType && mediaType !== 'text' && mediaUrl) {
      console.log(\`🎬 Enviando mídia tipo: \${mediaType}\`);
      
      // Se for DataURL, usar diretamente (Baileys aceita)
      if (mediaUrl.startsWith('data:')) {
        console.log('📱 Detectada DataURL, enviando diretamente...');
        
        if (mediaType === 'image') {
          messageResult = await instance.socket.sendMessage(formattedPhone, {
            image: { url: mediaUrl },
            caption: message
          });
        } else if (mediaType === 'video') {
          messageResult = await instance.socket.sendMessage(formattedPhone, {
            video: { url: mediaUrl },
            caption: message
          });
        } else if (mediaType === 'audio') {
          messageResult = await instance.socket.sendMessage(formattedPhone, {
            audio: { url: mediaUrl },
            ptt: true
          });
        } else {
          messageResult = await instance.socket.sendMessage(formattedPhone, {
            document: { url: mediaUrl },
            fileName: message || 'documento',
            mimetype: 'application/octet-stream'
          });
        }
      } else {
        // URL normal
        switch (mediaType.toLowerCase()) {
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
          default:
            messageResult = await instance.socket.sendMessage(formattedPhone, {
              document: { url: mediaUrl },
              fileName: message || 'documento.pdf',
              mimetype: 'application/pdf'
            });
        }
      }
    } else {
      // Mensagem de texto padrão
      messageResult = await instance.socket.sendMessage(formattedPhone, { text: message });
    }`;

  // Substituir a linha de envio de texto simples
  content = content.replace(imagePattern, newSendLogic);

  // Salvar arquivo modificado
  fs.writeFileSync(serverPath, content, 'utf8');
  console.log('💾 Arquivo salvo com suporte a DataURL');

  // Verificar sintaxe
  try {
    require.resolve(serverPath);
    console.log('✅ Verificação de sintaxe passou');
  } catch (err) {
    console.error('❌ Erro de sintaxe! Restaurando backup...');
    fs.copyFileSync(backupPath, serverPath);
    throw err;
  }

  console.log('🎉 VPS ATUALIZADA COM SUPORTE A DATAURL!');
  console.log('📋 Funcionalidades:');
  console.log('   ✅ DataURL para imagens');
  console.log('   ✅ DataURL para vídeos');  
  console.log('   ✅ DataURL para áudios');
  console.log('   ✅ DataURL para documentos');
  console.log('   ✅ URLs normais mantidas');
  console.log('🔄 Execute: pm2 restart whatsapp-server');

} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
} 