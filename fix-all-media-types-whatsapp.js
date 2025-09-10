#!/usr/bin/env node

const fs = require('fs');

console.log('📱 CORREÇÃO COMPLETA - TODOS OS TIPOS DE MÍDIA WHATSAPP\n');

const serverPath = '/root/whatsapp-server/server.js';

if (!fs.existsSync(serverPath)) {
  console.error('❌ server.js não encontrado!');
  process.exit(1);
}

let serverContent = fs.readFileSync(serverPath, 'utf8');

console.log('🔍 Aplicando correções para todos os tipos de mídia...');

// NOVO SWITCH CASE COMPLETO COM TODOS OS TIPOS DE MÍDIA
const newMediaSwitch = `      switch (baseType.toLowerCase()) {
        case 'image':
           if (mediaUrl.startsWith('data:')) {
             // ✅ DataURL → Buffer (para Baileys)
             console.log('🖼️ Convertendo imagem DataURL para Buffer...');
             const base64Data = mediaUrl.split(',')[1];
             const buffer = Buffer.from(base64Data, 'base64');
             messageResult = await instance.socket.sendMessage(formattedPhone, {
               image: buffer,
               fileName: message.trim() || 'image.jpg'
             });
           } else {
             // URL HTTP normal
             messageResult = await instance.socket.sendMessage(formattedPhone, {
               image: { url: mediaUrl },
               fileName: message.trim() || 'image.jpg'
             });
           }
           break;

        case 'video':
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
          break;

        case 'audio':
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
          break;

        case 'document':
          if (mediaUrl.startsWith('data:')) {
            // ✅ DataURL → Buffer para documentos
            console.log('📄 Convertendo documento DataURL para Buffer...');
            const base64Data = mediaUrl.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            
            // Detectar MIME type baseado no DataURL
            const mimeMatch = mediaUrl.match(/data:([^;]+)/);
            const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
            
            // Extensão baseada no MIME type
            let extension = '.bin';
            if (mimeType.includes('pdf')) extension = '.pdf';
            else if (mimeType.includes('word')) extension = '.docx';
            else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) extension = '.xlsx';
            else if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) extension = '.pptx';
            else if (mimeType.includes('text')) extension = '.txt';
            else if (mimeType.includes('zip')) extension = '.zip';
            else if (mimeType.includes('rar')) extension = '.rar';
            
            const fileName = message.trim() || \`documento\${extension}\`;
            
            messageResult = await instance.socket.sendMessage(formattedPhone, {
              document: buffer,
              fileName: fileName,
              mimetype: mimeType
            });
          } else {
            // URL HTTP normal
            messageResult = await instance.socket.sendMessage(formattedPhone, {
              document: { url: mediaUrl },
              fileName: message.trim() || 'documento.pdf',
              mimetype: 'application/pdf'
            });
          }
          break;

        // ✅ NOVOS TIPOS ADICIONADOS
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

        case 'location':
          // Localização não usa DataURL, mas coordenadas
          const [latitude, longitude] = (mediaUrl || '0,0').split(',').map(parseFloat);
          messageResult = await instance.socket.sendMessage(formattedPhone, {
            location: {
              degreesLatitude: latitude,
              degreesLongitude: longitude
            }
          });
          break;

        case 'contact':
          // Contato via vCard
          if (mediaUrl.startsWith('data:text/vcard') || mediaUrl.startsWith('BEGIN:VCARD')) {
            const vCardData = mediaUrl.startsWith('data:') 
              ? Buffer.from(mediaUrl.split(',')[1], 'base64').toString('utf8')
              : mediaUrl;
            
            messageResult = await instance.socket.sendMessage(formattedPhone, {
              contacts: {
                displayName: message.trim() || 'Contato',
                contacts: [{ vcard: vCardData }]
              }
            });
          } else {
            // Fallback para texto
            messageResult = await instance.socket.sendMessage(formattedPhone, {
              text: \`Contato: \${message}\\nTelefone: \${mediaUrl}\`
            });
          }
          break;

        default:
          console.log(\`⚠️ Tipo de mídia não reconhecido: \${mediaType}, enviando como texto\`);
          messageResult = await instance.socket.sendMessage(formattedPhone, {
            text: message
          });
          break;
      }`;

// Encontrar e substituir o switch case completo
const switchRegex = /switch \(baseType\.toLowerCase\(\)\) \{[\s\S]*?default:[\s\S]*?break;\s*\}/;

if (switchRegex.test(serverContent)) {
  serverContent = serverContent.replace(switchRegex, newMediaSwitch);
  console.log('✅ Switch case de mídia substituído completamente!');
} else {
  console.log('⚠️ Switch case não encontrado no formato esperado');
  
  // Tentar encontrar apenas a seção de switch
  const altSwitchRegex = /switch \(baseType\.toLowerCase\(\)\) \{[\s\S]*?\}/;
  if (altSwitchRegex.test(serverContent)) {
    serverContent = serverContent.replace(altSwitchRegex, newMediaSwitch);
    console.log('✅ Switch case corrigido com busca alternativa!');
  } else {
    console.error('❌ Não foi possível encontrar switch case para mídia');
    console.log('🔍 Procurando por qualquer switch...');
    
    // Última tentativa - procurar qualquer case 'image'
    const imageRegex = /case 'image':[\s\S]*?break;/;
    if (imageRegex.test(serverContent)) {
      // Substituir toda a área de cases
      const fullCaseRegex = /(case 'image':[\s\S]*?)(\s*}\s*else)/;
      const match = serverContent.match(fullCaseRegex);
      if (match) {
        serverContent = serverContent.replace(match[1], newMediaSwitch + '\n        ');
        console.log('✅ Cases de mídia substituídos com busca manual!');
      }
    } else {
      console.error('❌ Impossível localizar seção de mídia');
      process.exit(1);
    }
  }
}

// Salvar
fs.writeFileSync(serverPath, serverContent, 'utf8');

console.log('\n🎉 CORREÇÃO COMPLETA APLICADA COM SUCESSO!');
console.log('\n📋 TIPOS DE MÍDIA SUPORTADOS:');
console.log('   📷 image (jpg, png, webp)');
console.log('   📹 video (mp4, avi, mov)');
console.log('   🎵 audio (mp3, wav, ogg)');
console.log('   📄 document (pdf, docx, xlsx, pptx, txt, zip)');
console.log('   🏷️ sticker (webp, png)');
console.log('   🎞️ gif (animações)');
console.log('   🎙️ voice/ptt (áudio de voz)');
console.log('   📍 location (coordenadas)');
console.log('   👤 contact (vCard)');

console.log('\n🔧 FUNCIONALIDADES:');
console.log('   ✅ DataURL → Buffer (todos os tipos)');
console.log('   ✅ URL HTTP normal (fallback)');
console.log('   ✅ Detecção automática de MIME type');
console.log('   ✅ Extensões corretas por tipo');
console.log('   ✅ Nomes de arquivo inteligentes');

console.log('\n🔄 Reiniciando PM2...');

const { exec } = require('child_process');
exec('pm2 restart whatsapp-server', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Erro ao reiniciar PM2:', error.message);
    console.log('\n⚠️ Reinicie manualmente: pm2 restart whatsapp-server');
    return;
  }
  
  console.log('✅ Servidor reiniciado!');
  console.log('\n🚀 AGORA SUA VPS SUPORTA TODOS OS TIPOS DE MÍDIA!');
  console.log('📱 Teste envio de: vídeos, áudios, documentos, GIFs, stickers...');
}); 