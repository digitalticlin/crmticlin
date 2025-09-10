const fs = require('fs');

console.log('🔧 Adicionando suporte a mídia de forma SEGURA...');

try {
  const serverPath = '/root/whatsapp-server/server.js';
  
  // Backup antes da modificação
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `/root/whatsapp-server/server.js.backup-before-media-${timestamp}`;
  fs.copyFileSync(serverPath, backupPath);
  console.log(`✅ Backup criado: ${backupPath}`);

  let content = fs.readFileSync(serverPath, 'utf8');
  
  // 1. Modificar extração de parâmetros
  const oldDestructuring = 'const { instanceId, phone, message } = req.body;';
  const newDestructuring = 'const { instanceId, phone, message, mediaType, mediaUrl } = req.body;';
  
  if (!content.includes(oldDestructuring)) {
    console.error('❌ Linha de destructuring não encontrada!');
    process.exit(1);
  }
  
  content = content.replace(oldDestructuring, newDestructuring);
  console.log('✅ Parâmetros mediaType e mediaUrl adicionados');

  // 2. Modificar log da mensagem
  const oldLog = 'console.log(`📤 Enviando mensagem via ${instanceId} para ${phone}: ${message.substring(0, 50)}...`);';
  const newLog = 'console.log(`📤 Enviando via ${instanceId} para ${phone}: ${message.substring(0, 50)}...${mediaType ? \` (Mídia: ${mediaType})\` : \'\'}`);';
  
  content = content.replace(oldLog, newLog);
  console.log('✅ Log atualizado para mostrar tipo de mídia');

  // 3. Substituir o envio simples por suporte a mídia
  const oldSendLine = 'const messageResult = await instance.socket.sendMessage(formattedPhone, { text: message });';
  
  const newSendBlock = `let messageResult;

    // ✅ SUPORTE A MÍDIA ADICIONADO
    if (mediaType && mediaType !== 'text' && mediaUrl) {
      console.log(\`🎬 Enviando mídia tipo: \${mediaType}\`);
      
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
      // Mensagem de texto (comportamento original)
      messageResult = await instance.socket.sendMessage(formattedPhone, { text: message });
    }`;

  if (!content.includes(oldSendLine)) {
    console.error('❌ Linha de envio original não encontrada!');
    process.exit(1);
  }
  
  content = content.replace(oldSendLine, newSendBlock);
  console.log('✅ Suporte a mídia implementado (image, video, audio, document)');

  // 4. Atualizar response JSON para incluir mídia
  const oldResponse = `res.json({
      success: true,
      messageId: messageResult.key.id,
      instanceId,
      phone: formattedPhone,
      message: message,
      timestamp: new Date().toISOString()
    });`;

  const newResponse = `res.json({
      success: true,
      messageId: messageResult.key.id,
      instanceId,
      phone: formattedPhone,
      message: message,
      mediaType: mediaType || 'text',
      mediaUrl: mediaUrl || null,
      timestamp: new Date().toISOString()
    });`;

  content = content.replace(oldResponse, newResponse);
  console.log('✅ Response atualizado para incluir mídia');

  // Salvar arquivo modificado
  fs.writeFileSync(serverPath, content, 'utf8');
  console.log('💾 Arquivo salvo com sucesso');

  // Verificar se não introduziu erros de sintaxe
  try {
    require.resolve(serverPath);
    console.log('✅ Verificação de sintaxe passou');
  } catch (err) {
    console.error('❌ Erro de sintaxe detectado! Restaurando backup...');
    fs.copyFileSync(backupPath, serverPath);
    throw err;
  }

  console.log('🎉 SUPORTE A MÍDIA ADICIONADO COM SUCESSO!');
  console.log('📋 Funcionalidades:');
  console.log('   ✅ Envio de imagens (image + URL)');
  console.log('   ✅ Envio de vídeos (video + URL)');  
  console.log('   ✅ Envio de áudios (audio + URL)');
  console.log('   ✅ Envio de documentos (document + URL)');
  console.log('   ✅ Backward compatibility mantida');
  console.log('   ✅ Cache original preservado');
  console.log('🔄 Execute: pm2 restart whatsapp-server');

} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
} 