#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎵📹 ADICIONANDO SUPORTE A ÁUDIO E VÍDEO DATAURL NA VPS...\n');

const serverPath = path.join(__dirname, 'server.js');

if (!fs.existsSync(serverPath)) {
  console.error('❌ Arquivo server.js não encontrado!');
  process.exit(1);
}

// 1. Ler arquivo atual
const serverContent = fs.readFileSync(serverPath, 'utf8');

// 2. Verificar se já tem suporte
if (serverContent.includes('video_dataurl') && serverContent.includes('audio_dataurl')) {
  console.log('✅ Suporte a áudio/vídeo DataURL já está implementado!');
  process.exit(0);
}

// 3. Encontrar função de envio atual
const sendFunctionRegex = /\/\/ Enviar Mensagem\s*\napp\.post\('\/send'[\s\S]*?^\}/m;
const match = serverContent.match(sendFunctionRegex);

if (!match) {
  console.error('❌ Função de envio não encontrada! Estrutura do server.js mudou.');
  process.exit(1);
}

// 4. Nova implementação com suporte completo
const newSendFunction = `// Enviar Mensagem
app.post('/send', authenticateToken, async (req, res) => {
  const { instanceId, phone, message, mediaType, mediaUrl } = req.body;

  if (!instanceId || !phone || !message) {
    return res.status(400).json({
      success: false,
      error: 'instanceId, phone e message são obrigatórios',
      timestamp: new Date().toISOString()
    });
  }

  const instance = instances[instanceId];
  if (!instance) {
    return res.status(404).json({
      success: false,
      error: 'Instância não encontrada',
      instanceId,
      timestamp: new Date().toISOString()
    });
  }

  if (!instance.connected || !instance.socket) {
    return res.status(400).json({
      success: false,
      error: 'Instância não está conectada',
      status: instance.status,
      instanceId,
      timestamp: new Date().toISOString()
    });
  }

  try {
    console.log(\`📤 Enviando via \${instanceId} para \${phone}: \${message.substring(0, 50)}... (tipo: \${mediaType || 'text'})\`);

    // Formatar número de telefone
    const formattedPhone = phone.includes('@') ? phone : \`\${phone}@s.whatsapp.net\`;

    let messageResult;

    // ✅ SUPORTE COMPLETO A TODOS OS TIPOS DE MÍDIA
    if (!mediaType || mediaType === 'text') {
      // Mensagem de texto simples
      messageResult = await instance.socket.sendMessage(formattedPhone, { text: message });
      
    } else if (mediaType === 'image_dataurl' && mediaUrl?.startsWith('data:image/')) {
      // Imagem DataURL → Buffer
      console.log('🖼️ Processando imagem DataURL...');
      const base64Data = mediaUrl.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      messageResult = await instance.socket.sendMessage(formattedPhone, {
        image: buffer,
        fileName: message.trim() || 'image.jpg'
        // Sem caption para evitar mostrar nome do arquivo
      });
      
    } else if (mediaType === 'video_dataurl' && mediaUrl?.startsWith('data:video/')) {
      // ✅ NOVO: Vídeo DataURL → Buffer
      console.log('📹 Processando vídeo DataURL...');
      const base64Data = mediaUrl.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      messageResult = await instance.socket.sendMessage(formattedPhone, {
        video: buffer,
        fileName: message.trim() || 'video.mp4'
        // Sem caption para evitar mostrar nome do arquivo
      });
      
    } else if (mediaType === 'audio_dataurl' && mediaUrl?.startsWith('data:audio/')) {
      // ✅ NOVO: Áudio DataURL → Buffer
      console.log('🎵 Processando áudio DataURL...');
      const base64Data = mediaUrl.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      messageResult = await instance.socket.sendMessage(formattedPhone, {
        audio: buffer,
        fileName: message.trim() || 'audio.mp3',
        mimetype: 'audio/mpeg'
        // Sem caption para evitar mostrar nome do arquivo
      });
      
    } else if (mediaType === 'document_dataurl' && mediaUrl?.startsWith('data:application/')) {
      // Documento DataURL → Buffer (já implementado)
      console.log('📄 Processando documento DataURL...');
      const base64Data = mediaUrl.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      messageResult = await instance.socket.sendMessage(formattedPhone, {
        document: buffer,
        fileName: message.trim() || 'document.pdf',
        mimetype: 'application/pdf'
        // Sem caption para evitar mostrar nome do arquivo
      });
      
    } else {
      // Fallback: mensagem de texto se tipo não reconhecido
      console.log(\`⚠️ Tipo de mídia não suportado: \${mediaType}, enviando como texto\`);
      messageResult = await instance.socket.sendMessage(formattedPhone, { text: message });
    }

    // Adicionar ao cache para evitar reenvio de webhook
    connectionManager.addSentMessageToCache(instanceId, messageResult.key.id, formattedPhone);

    console.log(\`✅ Mensagem enviada com sucesso via \${instanceId} (tipo: \${mediaType || 'text'})\`);

    res.json({
      success: true,
      messageId: messageResult.key.id,
      instanceId,
      phone: formattedPhone,
      message: message,
      mediaType: mediaType || 'text',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(\`❌ Erro ao enviar mensagem via \${instanceId}:\`, error);
    res.status(500).json({
      success: false,
      error: 'Erro ao enviar mensagem',
      message: error.message,
      instanceId,
      timestamp: new Date().toISOString()
    });
  }
}`;

// 5. Substituir função antiga pela nova
const newServerContent = serverContent.replace(sendFunctionRegex, newSendFunction);

// 6. Salvar arquivo atualizado
fs.writeFileSync(serverPath, newServerContent, 'utf8');

console.log('✅ SUPORTE ADICIONADO COM SUCESSO!\n');

console.log('📋 TIPOS DE MÍDIA AGORA SUPORTADOS:');
console.log('   ✅ text (mensagens de texto)');
console.log('   ✅ image_dataurl (DataURLs de imagem)');
console.log('   ✅ video_dataurl (DataURLs de vídeo) 🆕');
console.log('   ✅ audio_dataurl (DataURLs de áudio) 🆕');
console.log('   ✅ document_dataurl (DataURLs de documento)');

console.log('\n🔄 Reinicie o servidor VPS para aplicar as alterações:');
console.log('   pm2 restart whatsapp-server');

console.log('\n🧪 TESTE OS NOVOS TIPOS:');
console.log('   📹 Envie um vídeo MP4 pela interface');
console.log('   🎵 Envie um áudio MP3 pela interface');
console.log('   📄 Envie um PDF pela interface');

console.log('\n✨ IMPLEMENTAÇÃO CONCLUÍDA!'); 