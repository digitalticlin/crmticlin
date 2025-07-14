// Script para atualizar o webhook para processar corretamente os diferentes tipos de mídia
// Executar este script na VPS para modificar o arquivo webhook.js ou webhook_handler.js

const fs = require('fs');
const path = require('path');

// Caminho para o arquivo de webhook (ajustar conforme necessário)
const webhookPath = '/root/whatsapp-server/webhook_handler.js';

// Verificar se o arquivo existe
if (!fs.existsSync(webhookPath)) {
  console.error(`❌ Arquivo de webhook não encontrado em ${webhookPath}`);
  console.log(`🔍 Procurando por arquivos de webhook...`);
  
  // Procurar por arquivos de webhook no diretório
  const files = fs.readdirSync('/root/whatsapp-server');
  const webhookFiles = files.filter(file => 
    file.includes('webhook') && file.endsWith('.js')
  );
  
  if (webhookFiles.length > 0) {
    console.log(`📋 Arquivos de webhook encontrados:`);
    webhookFiles.forEach(file => console.log(`   - ${file}`));
    console.log(`\n⚠️ Por favor, modifique o script para usar o caminho correto.`);
  } else {
    console.log(`❌ Nenhum arquivo de webhook encontrado.`);
  }
  
  process.exit(1);
}

// Fazer backup do arquivo original
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = `${webhookPath}.backup-${timestamp}`;

console.log(`🔄 Iniciando atualização do processamento de mídia no webhook...`);
console.log(`📂 Criando backup do arquivo original em ${backupPath}...`);

try {
  // Criar backup
  fs.copyFileSync(webhookPath, backupPath);
  console.log(`✅ Backup criado com sucesso!`);

  // Ler o arquivo do webhook
  let webhookContent = fs.readFileSync(webhookPath, 'utf8');
  console.log(`📖 Arquivo do webhook carregado (${webhookContent.length} bytes)`);

  // Verificar se o arquivo já tem processamento de mídia
  const hasMediaProcessing = webhookContent.includes('mediaType') && 
                            (webhookContent.includes('imageMessage') || 
                             webhookContent.includes('videoMessage') || 
                             webhookContent.includes('audioMessage') || 
                             webhookContent.includes('documentMessage'));

  if (hasMediaProcessing) {
    console.log(`✅ O arquivo já possui processamento de mídia.`);
    
    // Podemos melhorar o processamento existente
    console.log(`🔄 Verificando possíveis melhorias no processamento de mídia...`);
    
    // Adicionar suporte para mais tipos de mídia se necessário
    let updated = false;
    
    if (!webhookContent.includes('imageMessage')) {
      webhookContent = webhookContent.replace(
        /(\s*)(\/\/\s*Extrair dados da mensagem|\/\/\s*Processar mensagem)/i,
        `$1// Extrair dados da mensagem - com suporte a imagens
$1if (msg?.imageMessage) {
$1  messageText = msg.imageMessage.caption || '[Imagem]';
$1  mediaType = 'image';
$1  mediaUrl = msg.imageMessage.url || msg.imageMessage.directPath;
$1}
$1`
      );
      updated = true;
    }
    
    if (!webhookContent.includes('videoMessage')) {
      webhookContent = webhookContent.replace(
        /(\s*)(\/\/\s*Extrair dados da mensagem|\/\/\s*Processar mensagem)/i,
        `$1// Extrair dados da mensagem - com suporte a vídeos
$1if (msg?.videoMessage) {
$1  messageText = msg.videoMessage.caption || '[Vídeo]';
$1  mediaType = 'video';
$1  mediaUrl = msg.videoMessage.url || msg.videoMessage.directPath;
$1}
$1`
      );
      updated = true;
    }
    
    if (!webhookContent.includes('audioMessage')) {
      webhookContent = webhookContent.replace(
        /(\s*)(\/\/\s*Extrair dados da mensagem|\/\/\s*Processar mensagem)/i,
        `$1// Extrair dados da mensagem - com suporte a áudios
$1if (msg?.audioMessage) {
$1  messageText = '[Áudio]';
$1  mediaType = 'audio';
$1  mediaUrl = msg.audioMessage.url || msg.audioMessage.directPath;
$1}
$1`
      );
      updated = true;
    }
    
    if (!webhookContent.includes('documentMessage')) {
      webhookContent = webhookContent.replace(
        /(\s*)(\/\/\s*Extrair dados da mensagem|\/\/\s*Processar mensagem)/i,
        `$1// Extrair dados da mensagem - com suporte a documentos
$1if (msg?.documentMessage) {
$1  messageText = msg.documentMessage.caption || msg.documentMessage.fileName || '[Documento]';
$1  mediaType = 'document';
$1  mediaUrl = msg.documentMessage.url || msg.documentMessage.directPath;
$1}
$1`
      );
      updated = true;
    }
    
    if (updated) {
      console.log(`✅ Melhorias no processamento de mídia adicionadas.`);
    } else {
      console.log(`✅ O processamento de mídia já está completo.`);
    }
    
  } else {
    // Adicionar processamento de mídia completo
    console.log(`🔄 Adicionando processamento completo de mídia...`);
    
    // Encontrar o ponto onde processar a mensagem
    const processMessageRegex = /(\s*)(\/\/\s*Processar mensagem|\/\/\s*Extrair dados da mensagem)/i;
    
    if (processMessageRegex.test(webhookContent)) {
      const mediaProcessingCode = `$1// Extrair dados da mensagem com suporte completo a mídia
$1let messageText = '';
$1let mediaType = 'text';
$1let mediaUrl = null;
$1
$1// Processamento completo de mídia
$1if (data?.messages && Array.isArray(data.messages)) {
$1  const firstMessage = data.messages[0];
$1  const msg = firstMessage?.message;
$1  
$1  if (msg?.conversation) {
$1    messageText = msg.conversation;
$1    mediaType = 'text';
$1  } else if (msg?.extendedTextMessage?.text) {
$1    messageText = msg.extendedTextMessage.text;
$1    mediaType = 'text';
$1  } else if (msg?.imageMessage) {
$1    messageText = msg.imageMessage.caption || '[Imagem]';
$1    mediaType = 'image';
$1    mediaUrl = msg.imageMessage.url || msg.imageMessage.directPath;
$1  } else if (msg?.videoMessage) {
$1    messageText = msg.videoMessage.caption || '[Vídeo]';
$1    mediaType = 'video';
$1    mediaUrl = msg.videoMessage.url || msg.videoMessage.directPath;
$1  } else if (msg?.audioMessage) {
$1    messageText = '[Áudio]';
$1    mediaType = 'audio';
$1    mediaUrl = msg.audioMessage.url || msg.audioMessage.directPath;
$1  } else if (msg?.documentMessage) {
$1    messageText = msg.documentMessage.caption || msg.documentMessage.fileName || '[Documento]';
$1    mediaType = 'document';
$1    mediaUrl = msg.documentMessage.url || msg.documentMessage.directPath;
$1  } else {
$1    messageText = '[Mensagem de mídia]';
$1    mediaType = 'text';
$1  }
$1}`;
      
      webhookContent = webhookContent.replace(processMessageRegex, mediaProcessingCode);
      console.log(`✅ Processamento de mídia adicionado com sucesso!`);
    } else {
      console.log(`❌ Não foi possível encontrar o ponto para adicionar o processamento de mídia.`);
      console.log(`⚠️ O arquivo precisará ser modificado manualmente.`);
    }
  }

  // Salvar o arquivo modificado
  fs.writeFileSync(webhookPath, webhookContent, 'utf8');
  console.log(`✅ Arquivo de webhook atualizado com sucesso!`);
  
  console.log(`\n⚠️ IMPORTANTE: Reinicie o servidor para aplicar as alterações:`);
  console.log(`   pm2 restart all`);
  
} catch (error) {
  console.error(`❌ Erro ao atualizar o arquivo:`, error);
  console.log(`🔄 Tentando restaurar o backup...`);
  
  try {
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, webhookPath);
      console.log(`✅ Backup restaurado com sucesso!`);
    }
  } catch (restoreError) {
    console.error(`❌ Erro ao restaurar o backup:`, restoreError);
  }
} 