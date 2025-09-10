#!/usr/bin/env node

const fs = require('fs');

console.log('🧹 LIMPEZA COMPLETA - REMOVER TODAS AS LEGENDAS DESNECESSÁRIAS\n');

const serverPath = '/root/whatsapp-server/server.js';
const backupPath = '/root/whatsapp-server/server.js.backup-before-caption-cleanup';

// 1. FAZER BACKUP ANTES
console.log('💾 Fazendo backup antes da limpeza...');
let serverContent = fs.readFileSync(serverPath, 'utf8');
fs.writeFileSync(backupPath, serverContent, 'utf8');
console.log('✅ Backup salvo em:', backupPath);

console.log('\n🔍 PROBLEMAS IDENTIFICADOS:');
console.log('   📷 image: caption: message (nome do arquivo)');
console.log('   📹 video: caption: message (nome do arquivo) + fileName: message');
console.log('   🎵 audio: fileName: message (nome do arquivo)');
console.log('   📄 document: fileName: message (nome do arquivo)');

console.log('\n🛠️ APLICANDO CORREÇÕES...\n');

// 2. CORRIGIR IMAGEM - REMOVER CAPTION
console.log('📷 Corrigindo image caption...');
const imageDataUrlPattern = /(image: buffer,\s*)caption: message/g;
const imageUrlPattern = /(image: \{ url: mediaUrl \},\s*)caption: message/g;

if (imageDataUrlPattern.test(serverContent) || imageUrlPattern.test(serverContent)) {
  serverContent = serverContent.replace(imageDataUrlPattern, '$1// caption removida');
  serverContent = serverContent.replace(imageUrlPattern, '$1// caption removida');
  console.log('✅ Image caption removida!');
} else {
  console.log('⚠️ Image caption não encontrada');
}

// 3. CORRIGIR VÍDEO - REMOVER CAPTION E AJUSTAR FILENAME
console.log('📹 Corrigindo video caption e fileName...');
const videoDataUrlPattern = /(video: buffer,\s*)fileName: message\.trim\(\) \|\| 'video\.mp4'/g;
const videoCaptionPattern = /(video: \{ url: mediaUrl \},\s*)caption: message/g;

if (videoDataUrlPattern.test(serverContent)) {
  serverContent = serverContent.replace(videoDataUrlPattern, '$1fileName: \'video.mp4\' // nome fixo');
  console.log('✅ Video DataURL fileName corrigido!');
}

if (videoCaptionPattern.test(serverContent)) {
  serverContent = serverContent.replace(videoCaptionPattern, '$1// caption removida');
  console.log('✅ Video URL caption removida!');
}

// 4. CORRIGIR ÁUDIO - AJUSTAR FILENAME
console.log('🎵 Corrigindo audio fileName...');
const audioDataUrlPattern = /(audio: buffer,\s*)fileName: message\.trim\(\) \|\| 'audio\.mp3',/g;

if (audioDataUrlPattern.test(serverContent)) {
  serverContent = serverContent.replace(audioDataUrlPattern, '$1fileName: \'audio.mp3\', // nome fixo');
  console.log('✅ Audio DataURL fileName corrigido!');
}

// 5. CORRIGIR DOCUMENTO - AJUSTAR FILENAME
console.log('📄 Corrigindo document fileName...');
const documentDataUrlPattern = /(document: buffer,\s*)fileName: message\.trim\(\) \|\| 'documento\.pdf',/g;
const documentUrlPattern = /(document: \{ url: mediaUrl \},\s*)fileName: message \|\| 'documento\.pdf',/g;

if (documentDataUrlPattern.test(serverContent)) {
  serverContent = serverContent.replace(documentDataUrlPattern, '$1fileName: \'documento.pdf\', // nome fixo');
  console.log('✅ Document DataURL fileName corrigido!');
}

if (documentUrlPattern.test(serverContent)) {
  serverContent = serverContent.replace(documentUrlPattern, '$1fileName: \'documento.pdf\', // nome fixo');
  console.log('✅ Document URL fileName corrigido!');
}

// 6. VERIFICAR SINTAXE
console.log('\n🔍 Verificando sintaxe...');
const tempPath = '/root/whatsapp-server/server_temp_cleanup.js';
fs.writeFileSync(tempPath, serverContent, 'utf8');

const { execSync } = require('child_process');
try {
  execSync(`node -c ${tempPath}`, { stdio: 'pipe' });
  console.log('✅ Sintaxe OK!');
  
  // Salvar arquivo corrigido
  fs.writeFileSync(serverPath, serverContent, 'utf8');
  fs.unlinkSync(tempPath);
  
  console.log('\n🎉 LIMPEZA COMPLETA APLICADA COM SUCESSO!');
  console.log('\n📋 RESULTADO FINAL:');
  console.log('   📷 Imagens: SEM legenda (clean)');
  console.log('   📹 Vídeos: SEM legenda, nome fixo \'video.mp4\'');
  console.log('   🎵 Áudios: SEM legenda, nome fixo \'audio.mp3\'');
  console.log('   📄 Documentos: SEM legenda, nome fixo \'documento.pdf\'');
  
  console.log('\n✨ BENEFÍCIOS:');
  console.log('   ✅ Interface mais limpa');
  console.log('   ✅ Não mostra nomes técnicos de arquivo');
  console.log('   ✅ Funcionalidade preservada');
  console.log('   ✅ Compatibilidade mantida');
  
  // Reiniciar PM2
  console.log('\n🔄 Reiniciando PM2...');
  try {
    execSync('pm2 restart whatsapp-server', { stdio: 'inherit' });
    console.log('✅ Servidor reiniciado!');
    console.log('\n🚀 AGORA TODAS AS MÍDIAS SERÃO ENVIADAS SEM LEGENDAS TÉCNICAS!');
  } catch (pm2Error) {
    console.log('⚠️ Reinicie manualmente: pm2 restart whatsapp-server');
  }
  
} catch (syntaxError) {
  console.error('❌ ERRO DE SINTAXE:', syntaxError.message);
  fs.unlinkSync(tempPath);
  console.log('🔄 Arquivo original mantido inalterado');
  console.log('💾 Backup disponível em:', backupPath);
  process.exit(1);
} 