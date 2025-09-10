#!/usr/bin/env node

const fs = require('fs');

console.log('🎥 CORREÇÃO CIRÚRGICA - VÍDEO DATAURL NA VPS\n');

const serverPath = '/root/whatsapp-server/server.js';

if (!fs.existsSync(serverPath)) {
  console.error('❌ server.js não encontrado!');
  process.exit(1);
}

let serverContent = fs.readFileSync(serverPath, 'utf8');

console.log('🔍 Procurando seção de vídeo...');

// Buscar e substituir apenas a seção do vídeo
const videoRegex = /case 'video':\s*messageResult = await instance\.socket\.sendMessage\(formattedPhone, \{\s*video: \{ url: mediaUrl \},\s*caption: message\s*\}\);/;

const newVideoCode = `case 'video':
          if (mediaUrl.startsWith('data:')) {
            // ✅ DataURL → Buffer para vídeos
            console.log('📹 Convertendo vídeo DataURL para Buffer...');
            const base64Data = mediaUrl.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            messageResult = await instance.socket.sendMessage(formattedPhone, {
              video: buffer,
              fileName: message.trim() || 'video.mp4'
            });
          } else {
            // URL HTTP normal
            messageResult = await instance.socket.sendMessage(formattedPhone, {
              video: { url: mediaUrl },
              caption: message
            });
          }`;

if (videoRegex.test(serverContent)) {
  serverContent = serverContent.replace(videoRegex, newVideoCode);
  console.log('✅ Seção de vídeo encontrada e corrigida!');
} else {
  console.log('⚠️ Seção de vídeo não encontrada no formato esperado');
  console.log('🔍 Tentando busca mais ampla...');
  
  // Busca alternativa
  const altVideoRegex = /case 'video':[\s\S]*?break;/;
  if (altVideoRegex.test(serverContent)) {
    serverContent = serverContent.replace(altVideoRegex, newVideoCode + '\n          break;');
    console.log('✅ Seção de vídeo corrigida com busca alternativa!');
  } else {
    console.error('❌ Não foi possível encontrar seção de vídeo');
    process.exit(1);
  }
}

// Buscar e corrigir áudio também (se necessário)
const audioRegex = /case 'audio':\s*messageResult = await instance\.socket\.sendMessage\(formattedPhone, \{\s*audio: \{ url: mediaUrl \},\s*ptt: true\s*\}\);/;

const newAudioCode = `case 'audio':
          if (mediaUrl.startsWith('data:')) {
            // ✅ DataURL → Buffer para áudios
            console.log('🎵 Convertendo áudio DataURL para Buffer...');
            const base64Data = mediaUrl.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            messageResult = await instance.socket.sendMessage(formattedPhone, {
              audio: buffer,
              fileName: message.trim() || 'audio.mp3',
              mimetype: 'audio/mpeg'
            });
          } else {
            // URL HTTP normal
            messageResult = await instance.socket.sendMessage(formattedPhone, {
              audio: { url: mediaUrl },
              ptt: true
            });
          }`;

if (audioRegex.test(serverContent)) {
  serverContent = serverContent.replace(audioRegex, newAudioCode);
  console.log('✅ Seção de áudio também corrigida!');
}

// Salvar
fs.writeFileSync(serverPath, serverContent, 'utf8');

console.log('\n✅ CORREÇÃO APLICADA COM SUCESSO!');
console.log('📹 Vídeo DataURL agora será convertido para Buffer');
console.log('🎵 Áudio DataURL também corrigido');

console.log('\n🔄 Reiniciando PM2...');

const { exec } = require('child_process');
exec('pm2 restart whatsapp-server', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Erro ao reiniciar PM2:', error.message);
    console.log('\n⚠️ Reinicie manualmente: pm2 restart whatsapp-server');
    return;
  }
  
  console.log('✅ Servidor reiniciado!');
  console.log('\n🎬 TESTE AGORA: Envie vídeo novamente!');
}); 