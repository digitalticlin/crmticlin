#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎥 CORRIGINDO ERRO DE VÍDEO NA VPS - DataURL → Buffer\n');

const serverPath = '/root/server.js'; // Caminho na VPS

// Leia o conteúdo atual do server.js (este script será executado na VPS)
if (!fs.existsSync(serverPath)) {
  console.error('❌ server.js não encontrado na VPS!');
  process.exit(1);
}

const serverContent = fs.readFileSync(serverPath, 'utf8');

// Verificar se já tem suporte a vídeo
if (serverContent.includes('video_dataurl')) {
  console.log('✅ Suporte a vídeo já implementado!');
  
  // Verificar se há erro específico no vídeo
  if (serverContent.includes('ENAMETOOLONG')) {
    console.log('🔍 Erro ENAMETOOLONG detectado - corrigindo lógica do vídeo...');
  } else {
    console.log('📹 Lógica de vídeo parece estar correta.');
    process.exit(0);
  }
}

// Encontrar a função de envio atual
const sendFunctionRegex = /app\.post\('\/send'[^}]*authentication[^}]*\{[\s\S]*?^\}/m;
const match = serverContent.match(sendFunctionRegex);

if (!match) {
  console.error('❌ Função /send não encontrada!');
  process.exit(1);
}

console.log('🔍 Função /send encontrada, aplicando correção...');

// Nova implementação com correção específica para vídeo
const newSendFunction = `app.post('/send', authenticateToken, async (req, res) => {
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

    // ✅ SUPORTE COMPLETO COM CORREÇÃO DE VÍDEO
    if (!mediaType || mediaType === 'text') {
      messageResult = await instance.socket.sendMessage(formattedPhone, { text: message });
      
    } else if (mediaType === 'image_dataurl' && mediaUrl?.startsWith('data:image/')) {
      console.log('🖼️ Processando imagem DataURL...');
      const base64Data = mediaUrl.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      messageResult = await instance.socket.sendMessage(formattedPhone, {
        image: buffer,
        fileName: message.trim() || 'image.jpg'
      });
      
    } else if (mediaType === 'video_dataurl' && mediaUrl?.startsWith('data:video/')) {
      // ✅ CORREÇÃO ESPECÍFICA PARA VÍDEO
      console.log('📹 Processando vídeo DataURL - CORREÇÃO APLICADA...');
      console.log(\`📹 Tamanho da DataURL: \${mediaUrl.length} caracteres\`);
      
      try {
        const base64Data = mediaUrl.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        
        console.log(\`📹 Buffer criado: \${buffer.length} bytes\`);
        
        messageResult = await instance.socket.sendMessage(formattedPhone, {
          video: buffer,
          fileName: message.trim() || 'video.mp4',
          mimetype: 'video/mp4'
        });
        
        console.log('📹 Vídeo enviado com sucesso!');
        
      } catch (videoError) {
        console.error('❌ Erro específico no vídeo:', videoError.message);
        throw new Error(\`Erro ao processar vídeo: \${videoError.message}\`);
      }
      
    } else if (mediaType === 'audio_dataurl' && mediaUrl?.startsWith('data:audio/')) {
      console.log('🎵 Processando áudio DataURL...');
      const base64Data = mediaUrl.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      messageResult = await instance.socket.sendMessage(formattedPhone, {
        audio: buffer,
        fileName: message.trim() || 'audio.mp3',
        mimetype: 'audio/mpeg'
      });
      
    } else if (mediaType === 'document_dataurl' && mediaUrl?.startsWith('data:application/')) {
      console.log('📄 Processando documento DataURL...');
      const base64Data = mediaUrl.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      messageResult = await instance.socket.sendMessage(formattedPhone, {
        document: buffer,
        fileName: message.trim() || 'document.pdf',
        mimetype: 'application/pdf'
      });
      
    } else {
      console.log(\`⚠️ Tipo não suportado: \${mediaType}, enviando como texto\`);
      messageResult = await instance.socket.sendMessage(formattedPhone, { text: message });
    }

    // Cache para evitar webhook
    connectionManager.addSentMessageToCache(instanceId, messageResult.key.id, formattedPhone);

    console.log(\`✅ Mensagem enviada via \${instanceId} (tipo: \${mediaType || 'text'})\`);

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
    console.error(\`❌ Erro ao enviar via \${instanceId}:\`, error);
    res.status(500).json({
      success: false,
      error: 'Erro ao enviar mensagem',
      message: error.message,
      instanceId,
      timestamp: new Date().toISOString()
    });
  }
}`;

// Substituir a função
const newServerContent = serverContent.replace(sendFunctionRegex, newSendFunction);

// Salvar
fs.writeFileSync(serverPath, newServerContent, 'utf8');

console.log('✅ CORREÇÃO DE VÍDEO APLICADA!\n');

console.log('📋 SUPORTE COMPLETO:');
console.log('   ✅ text (texto)');
console.log('   ✅ image_dataurl (imagens)');
console.log('   ✅ video_dataurl (vídeos) 🎥 CORRIGIDO');
console.log('   ✅ audio_dataurl (áudios)');
console.log('   ✅ document_dataurl (documentos)');

console.log('\n🔄 Reiniciando servidor...');

// Reiniciar PM2
const { exec } = require('child_process');
exec('pm2 restart whatsapp-server', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Erro ao reiniciar PM2:', error.message);
    return;
  }
  
  console.log('✅ Servidor reiniciado com sucesso!');
  console.log('🎥 Agora teste enviando vídeo novamente!');
}); 