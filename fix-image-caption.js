#!/usr/bin/env node

const fs = require('fs');

console.log('🖼️ CORREÇÃO SIMPLES - REMOVER LEGENDA DE IMAGEM\n');

const serverPath = '/root/whatsapp-server/server.js';
const backupPath = '/root/whatsapp-server/server.js.backup-before-caption-fix';

// 1. FAZER BACKUP ANTES
console.log('💾 Fazendo backup antes da correção...');
const serverContent = fs.readFileSync(serverPath, 'utf8');
fs.writeFileSync(backupPath, serverContent, 'utf8');
console.log('✅ Backup salvo em:', backupPath);

// 2. LOCALIZAR E CORRIGIR APENAS A LEGENDA DA IMAGEM
console.log('🔍 Procurando caption na seção de imagem...');

// Pattern específico: caption: message dentro do case image
const imageCaptionPattern = /(case 'image':[\s\S]*?image: buffer,\s*)(caption: message)/;

if (imageCaptionPattern.test(serverContent)) {
  // Remover apenas a linha caption: message
  const correctedContent = serverContent.replace(imageCaptionPattern, '$1// caption removida para não mostrar nome do arquivo');
  
  console.log('✅ Caption encontrada e removida!');
  
  // 3. VERIFICAR SINTAXE
  console.log('🔍 Verificando sintaxe...');
  const tempPath = '/root/whatsapp-server/server_temp_caption.js';
  fs.writeFileSync(tempPath, correctedContent, 'utf8');
  
  const { execSync } = require('child_process');
  try {
    execSync(`node -c ${tempPath}`, { stdio: 'pipe' });
    console.log('✅ Sintaxe OK!');
    
    // Salvar arquivo corrigido
    fs.writeFileSync(serverPath, correctedContent, 'utf8');
    fs.unlinkSync(tempPath);
    
    console.log('\n🎉 CORREÇÃO APLICADA COM SUCESSO!');
    console.log('📱 Agora as imagens serão enviadas SEM o nome do arquivo como legenda');
    
    // Reiniciar PM2
    console.log('\n🔄 Reiniciando PM2...');
    try {
      execSync('pm2 restart whatsapp-server', { stdio: 'inherit' });
      console.log('✅ Servidor reiniciado!');
    } catch (pm2Error) {
      console.log('⚠️ Reinicie manualmente: pm2 restart whatsapp-server');
    }
    
  } catch (syntaxError) {
    console.error('❌ ERRO DE SINTAXE:', syntaxError.message);
    fs.unlinkSync(tempPath);
    console.log('🔄 Arquivo original mantido inalterado');
    process.exit(1);
  }
  
} else {
  console.log('⚠️ Pattern de caption não encontrado no case image');
  console.log('📋 Verificando se já foi removido anteriormente...');
  
  if (serverContent.includes('// caption removida')) {
    console.log('✅ Caption já foi removida anteriormente!');
  } else {
    console.log('❓ Estrutura diferente do esperado');
  }
} 