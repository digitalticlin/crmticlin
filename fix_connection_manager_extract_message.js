// ========================================
// 🔧 PATCH PARA CONNECTION-MANAGER.JS - EXTRACTMESSAGECONTENT MELHORADO
// ========================================
// 
// PROBLEMA: Função extractMessageContent() retorna "[Mensagem não suportada]" 
// SOLUÇÃO: Melhorar lógica para retornar textos descritivos com emojis
//

// ✅ VERSÃO CORRIGIDA DA FUNÇÃO extractMessageContent
// Substituir a função existente no connection-manager.js por esta:

extractMessageContent(messageObj) {
  // 1. MENSAGENS DE TEXTO NORMAIS
  if (messageObj.conversation) {
    return messageObj.conversation;
  }

  // 2. MENSAGENS DE TEXTO ESTENDIDAS (com formatação, links, etc.)
  if (messageObj.extendedTextMessage?.text) {
    return messageObj.extendedTextMessage.text;
  }

  // 3. IMAGENS - Usar caption se houver, senão descrição com emoji
  if (messageObj.imageMessage) {
    if (messageObj.imageMessage.caption && messageObj.imageMessage.caption.trim()) {
      return messageObj.imageMessage.caption;
    }
    return '📷 Imagem';
  }

  // 4. VÍDEOS - Usar caption se houver, senão descrição com emoji
  if (messageObj.videoMessage) {
    if (messageObj.videoMessage.caption && messageObj.videoMessage.caption.trim()) {
      return messageObj.videoMessage.caption;
    }
    return '🎥 Vídeo';
  }

  // 5. ÁUDIOS - Distinguir entre nota de voz e arquivo de áudio
  if (messageObj.audioMessage) {
    const isPtt = messageObj.audioMessage.ptt === true;
    return isPtt ? '🎤 Nota de voz' : '🎵 Áudio';
  }

  // 6. DOCUMENTOS - Incluir nome do arquivo se disponível
  if (messageObj.documentMessage) {
    const fileName = messageObj.documentMessage.fileName;
    if (fileName && fileName.trim()) {
      return `📄 Documento: ${fileName}`;
    }
    return '📄 Documento';
  }

  // 7. STICKERS - Emoji mais apropriado
  if (messageObj.stickerMessage) {
    return '😊 Figurinha';
  }

  // 8. LOCALIZAÇÃO - Incluir informações se disponível
  if (messageObj.locationMessage) {
    const location = messageObj.locationMessage;
    if (location.name && location.name.trim()) {
      return `📍 Localização: ${location.name}`;
    }
    return '📍 Localização';
  }

  // 9. CONTATOS - Incluir nome se disponível
  if (messageObj.contactMessage) {
    const contact = messageObj.contactMessage;
    if (contact.displayName && contact.displayName.trim()) {
      return `👤 Contato: ${contact.displayName}`;
    }
    return '👤 Contato';
  }

  // 10. MENSAGENS DE LISTA/BOTÕES (WhatsApp Business)
  if (messageObj.listMessage) {
    return '📋 Lista de opções';
  }

  if (messageObj.buttonsMessage) {
    return '🔘 Mensagem com botões';
  }

  // 11. MENSAGENS INTERATIVAS
  if (messageObj.templateMessage) {
    return '📄 Modelo de mensagem';
  }

  if (messageObj.interactiveMessage) {
    return '🎮 Mensagem interativa';
  }

  // 12. REAÇÕES
  if (messageObj.reactionMessage) {
    const emoji = messageObj.reactionMessage.text || '👍';
    return `${emoji} Reação`;
  }

  // 13. MENSAGENS DE GRUPO ESPECÍFICAS
  if (messageObj.groupInviteMessage) {
    return '👥 Convite para grupo';
  }

  // 14. MENSAGENS DO SISTEMA
  if (messageObj.protocolMessage) {
    return '🔄 Mensagem do sistema';
  }

  // 15. MENSAGENS EDITADAS
  if (messageObj.editedMessage) {
    return '✏️ Mensagem editada';
  }

  // 16. POLL/ENQUETES (WhatsApp Business)
  if (messageObj.pollCreationMessage) {
    return '📊 Enquete';
  }

  // 17. PRODUTOS (WhatsApp Business)
  if (messageObj.productMessage) {
    return '🛍️ Produto';
  }

  // 18. CASO ESPECIAL: Mensagem vazia ou só com espaços
  if (messageObj.conversation === '' || 
      (messageObj.extendedTextMessage?.text === '')) {
    return '💬 Mensagem vazia';
  }

  // 19. FALLBACK FINAL - Melhor que "[Mensagem não suportada]"
  console.log('🔍 [CONNECTION-MANAGER] Tipo de mensagem não identificado:', Object.keys(messageObj));
  return '💬 Mensagem';
}

// ========================================
// 📋 INSTRUÇÕES DE APLICAÇÃO:
// ========================================
// 
// 1. Abrir o arquivo: src/utils/connection-manager.js
// 2. Localizar a função extractMessageContent (linha ~595)
// 3. Substituir toda a função pela versão acima
// 4. Salvar o arquivo
// 5. Reiniciar o servidor WhatsApp para aplicar as mudanças
//
// RESULTADO ESPERADO:
// - Imagens: "📷 Imagem" ou caption da imagem
// - Vídeos: "🎥 Vídeo" ou caption do vídeo  
// - Áudios: "🎤 Nota de voz" ou "🎵 Áudio"
// - Documentos: "📄 Documento: nome.pdf" ou "📄 Documento"
// - Stickers: "😊 Figurinha"
// - Localização: "📍 Localização: Nome do Local" ou "📍 Localização"
// - Contatos: "👤 Contato: Nome" ou "👤 Contato"
// - Mensagens não identificadas: "💬 Mensagem"
//
// ========================================

console.log('✅ Patch do extractMessageContent criado com sucesso!');
console.log('📁 Arquivo: fix_connection_manager_extract_message.js');
console.log('🎯 Próximo passo: aplicar no connection-manager.js e reiniciar servidor');