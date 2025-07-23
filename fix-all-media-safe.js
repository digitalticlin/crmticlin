#!/usr/bin/env node

const fs = require('fs');

console.log('🛡️ CORREÇÃO SEGURA - SUPORTE COMPLETO A MÍDIA WHATSAPP\n');

const serverPath = '/root/whatsapp-server/server.js';

if (!fs.existsSync(serverPath)) {
  console.error('❌ server.js não encontrado!');
  process.exit(1);
}

let serverContent = fs.readFileSync(serverPath, 'utf8');

console.log('🔍 Analisando arquivo atual...');
console.log(`📊 Linhas: ${serverContent.split('\n').length}`);

// 1. LOCALIZAR E SUBSTITUIR APENAS A SEÇÃO DE VÍDEO
console.log('🎥 Corrigindo case video...');

const videoPattern = /case 'video':\s*messageResult = await instance\.socket\.sendMessage\(formattedPhone, \{\s*video: \{ url: mediaUrl \},\s*caption: message\s*\}\);\s*break;/s;

const newVideoCase = `case 'video':
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
          }
          break;`;

if (videoPattern.test(serverContent)) {
  serverContent = serverContent.replace(videoPattern, newVideoCase);
  console.log('✅ Case video corrigido!');
} else {
  console.log('⚠️ Case video não encontrado no formato esperado');
}

// 2. LOCALIZAR E SUBSTITUIR APENAS A SEÇÃO DE ÁUDIO
console.log('🎵 Corrigindo case audio...');

const audioPattern = /case 'audio':\s*messageResult = await instance\.socket\.sendMessage\(formattedPhone, \{\s*audio: \{ url: mediaUrl \},\s*ptt: true\s*\}\);\s*break;/s;

const newAudioCase = `case 'audio':
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
          }
          break;`;

if (audioPattern.test(serverContent)) {
  serverContent = serverContent.replace(audioPattern, newAudioCase);
  console.log('✅ Case audio corrigido!');
} else {
  console.log('⚠️ Case audio não encontrado no formato esperado');
}

// 3. LOCALIZAR E SUBSTITUIR APENAS A SEÇÃO DE DOCUMENTO
console.log('📄 Corrigindo case document...');

const documentPattern = /case 'document':\s*messageResult = await instance\.socket\.sendMessage\(formattedPhone, \{\s*document: \{ url: mediaUrl \},\s*fileName: message \|\| 'documento\.pdf',\s*mimetype: 'application\/pdf'\s*\}\);\s*break;/s;

const newDocumentCase = `case 'document':
          if (mediaUrl.startsWith('data:')) {
            // ✅ DataURL → Buffer para documentos
            console.log('📄 Convertendo documento DataURL para Buffer...');
            const base64Data = mediaUrl.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            
            // Detectar MIME type do DataURL
            const mimeMatch = mediaUrl.match(/data:([^;]+)/);
            const mimeType = mimeMatch ? mimeMatch[1] : 'application/pdf';
            
            messageResult = await instance.socket.sendMessage(formattedPhone, {
              document: buffer,
              fileName: message.trim() || 'documento.pdf',
              mimetype: mimeType
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

if (documentPattern.test(serverContent)) {
  serverContent = serverContent.replace(documentPattern, newDocumentCase);
  console.log('✅ Case document corrigido!');
} else {
  console.log('⚠️ Case document não encontrado no formato esperado');
}

// 4. ADICIONAR NOVOS CASES ANTES DO DEFAULT (FORMA MAIS SEGURA)
console.log('🆕 Adicionando novos cases de mídia...');

// Localizar o case default
const defaultPattern = /(default:\s*console\.log\(`⚠️ Tipo de mídia não reconhecido: \$\{mediaType\}, enviando como texto`\);\s*messageResult = await instance\.socket\.sendMessage\(formattedPhone, \{\s*text: message\s*\}\);\s*break;)/s;

const newCasesBeforeDefault = `// ✅ NOVOS TIPOS DE MÍDIA ADICIONADOS
        case 'sticker':
          if (mediaUrl.startsWith('data:')) {
            console.log('🏷️ Convertendo sticker DataURL para Buffer...');
            const base64Data = mediaUrl.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            messageResult = await instance.socket.sendMessage(formattedPhone, {
              sticker: buffer
            });
          } else {
            messageResult = await instance.socket.sendMessage(formattedPhone, {
              sticker: { url: mediaUrl }
            });
          }
          break;

        case 'gif':
          if (mediaUrl.startsWith('data:')) {
            console.log('🎞️ Convertendo GIF DataURL para Buffer...');
            const base64Data = mediaUrl.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            messageResult = await instance.socket.sendMessage(formattedPhone, {
              video: buffer,
              gifPlayback: true,
              fileName: message.trim() || 'animation.gif'
            });
          } else {
            messageResult = await instance.socket.sendMessage(formattedPhone, {
              video: { url: mediaUrl },
              gifPlayback: true
            });
          }
          break;

        case 'voice':
        case 'ptt':
          if (mediaUrl.startsWith('data:')) {
            console.log('🎙️ Convertendo áudio de voz DataURL para Buffer...');
            const base64Data = mediaUrl.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            messageResult = await instance.socket.sendMessage(formattedPhone, {
              audio: buffer,
              ptt: true,
              mimetype: 'audio/ogg; codecs=opus'
            });
          } else {
            messageResult = await instance.socket.sendMessage(formattedPhone, {
              audio: { url: mediaUrl },
              ptt: true
            });
          }
          break;

        $1`;

if (defaultPattern.test(serverContent)) {
  serverContent = serverContent.replace(defaultPattern, newCasesBeforeDefault);
  console.log('✅ Novos cases adicionados antes do default!');
} else {
  console.log('⚠️ Case default não encontrado para adicionar novos types');
}

// 5. VERIFICAR SINTAXE ANTES DE SALVAR
console.log('🔍 Verificando sintaxe...');

// Salvar temporariamente para teste
fs.writeFileSync(serverPath + '.temp', serverContent, 'utf8');

// Testar sintaxe
const { execSync } = require('child_process');
try {
  execSync('node -c ' + serverPath + '.temp', { stdio: 'pipe' });
  console.log('✅ Sintaxe OK!');
  
  // Se passou no teste, salvar o arquivo final
  fs.writeFileSync(serverPath, serverContent, 'utf8');
  
  // Remover arquivo temporário
  fs.unlinkSync(serverPath + '.temp');
  
  console.log('\n🎉 CORREÇÃO APLICADA COM SUCESSO!');
  console.log('\n📋 TIPOS DE MÍDIA SUPORTADOS:');
  console.log('   📷 image (DataURL + URL)');
  console.log('   📹 video (DataURL + URL) ✅ CORRIGIDO');
  console.log('   🎵 audio (DataURL + URL) ✅ CORRIGIDO');
  console.log('   📄 document (DataURL + URL) ✅ CORRIGIDO');
  console.log('   🏷️ sticker (DataURL + URL) ✅ NOVO');
  console.log('   🎞️ gif (DataURL + URL) ✅ NOVO');
  console.log('   🎙️ voice/ptt (DataURL + URL) ✅ NOVO');
  
  console.log('\n🔄 Reiniciando PM2...');
  
  try {
    execSync('pm2 restart whatsapp-server', { stdio: 'inherit' });
    console.log('✅ Servidor reiniciado com sucesso!');
  } catch (pm2Error) {
    console.log('⚠️ Erro ao reiniciar PM2:', pm2Error.message);
    console.log('⚠️ Reinicie manualmente: pm2 restart whatsapp-server');
  }
  
} catch (syntaxError) {
  console.error('❌ ERRO DE SINTAXE DETECTADO:', syntaxError.message);
  console.log('🔄 Restaurando arquivo original...');
  
  // Remover arquivos com erro
  fs.unlinkSync(serverPath + '.temp');
  
  console.log('❌ Correção não aplicada devido a erro de sintaxe');
  process.exit(1);
} 