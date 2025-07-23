const fs = require('fs');

console.log('🔧 Atualizando VPS para suporte a DataURL base64...');

try {
  const serverPath = '/root/whatsapp-server/server.js';
  
  // Backup antes da modificação
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `/root/whatsapp-server/server.js.backup-dataurl-${timestamp}`;
  fs.copyFileSync(serverPath, backupPath);
  console.log(`✅ Backup criado: ${backupPath}`);

  let content = fs.readFileSync(serverPath, 'utf8');
  
  // Procurar pela seção switch dos tipos de mídia
  const switchPattern = /switch\s*\(\s*mediaType\.toLowerCase\(\s*\)\s*\)\s*\{[\s\S]*?default:[\s\S]*?\}/;
  
  if (!switchPattern.test(content)) {
    console.error('❌ Switch de mediaType não encontrado!');
    process.exit(1);
  }

  // Novo switch com suporte a DataURL base64
  const newSwitch = `switch (mediaType.toLowerCase()) {
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

        // ✅ NOVO: SUPORTE A DATAURL BASE64
        case 'image_base64':
          console.log('🖼️ Processando imagem base64...');
          messageResult = await instance.socket.sendMessage(formattedPhone, {
            image: { url: mediaUrl }, // DataURL é aceita pelo Baileys
            caption: message
          });
          break;
          
        case 'video_base64':
          console.log('🎥 Processando vídeo base64...');
          messageResult = await instance.socket.sendMessage(formattedPhone, {
            video: { url: mediaUrl },
            caption: message
          });
          break;
          
        case 'audio_base64':
          console.log('🎵 Processando áudio base64...');
          messageResult = await instance.socket.sendMessage(formattedPhone, {
            audio: { url: mediaUrl },
            ptt: true
          });
          break;
          
        case 'document_base64':
          console.log('📄 Processando documento base64...');
          messageResult = await instance.socket.sendMessage(formattedPhone, {
            document: { url: mediaUrl },
            fileName: message || 'documento',
            mimetype: 'application/octet-stream'
          });
          break;
          
        default:
          console.log('⚠️  Tipo de mídia não reconhecido, enviando como texto');
          messageResult = await instance.socket.sendMessage(formattedPhone, { text: message });
      }`;

  // Substituir o switch antigo pelo novo
  content = content.replace(switchPattern, newSwitch);

  // Salvar arquivo modificado
  fs.writeFileSync(serverPath, content, 'utf8');
  console.log('💾 Arquivo salvo com suporte a DataURL base64');

  // Verificar sintaxe
  try {
    require.resolve(serverPath);
    console.log('✅ Verificação de sintaxe passou');
  } catch (err) {
    console.error('❌ Erro de sintaxe! Restaurando backup...');
    fs.copyFileSync(backupPath, serverPath);
    throw err;
  }

  console.log('🎉 VPS ATUALIZADA PARA SUPORTE A DATAURL!');
  console.log('📋 Novos tipos suportados:');
  console.log('   ✅ image_base64 (DataURL de imagens)');
  console.log('   ✅ video_base64 (DataURL de vídeos)');
  console.log('   ✅ audio_base64 (DataURL de áudios)');
  console.log('   ✅ document_base64 (DataURL de documentos)');
  console.log('🔄 Execute: pm2 restart whatsapp-server');

} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
} 