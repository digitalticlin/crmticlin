// PATCH PARA CONNECTION-MANAGER: ADIÇÃO DE EXTRAÇÃO DE URLs DE MÍDIA
// Aplicar este patch no arquivo /root/whatsapp-server/src/utils/connection-manager.js

// 1. ADICIONAR IMPORT NO TOPO DO ARQUIVO:
const { downloadMediaMessage } = require('baileys');

// 2. SUBSTITUIR A FUNÇÃO extractMessageContent EXISTENTE POR ESTA VERSÃO:
  
  // ✅ FUNÇÃO CORRIGIDA: Extrair conteúdo da mensagem COM URLS DE MÍDIA
  async extractMessageContent(messageObj, socket = null) {
    if (messageObj.conversation) {
      return {
        text: messageObj.conversation,
        mediaUrl: null
      };
    }
    
    if (messageObj.extendedTextMessage?.text) {
      return {
        text: messageObj.extendedTextMessage.text,
        mediaUrl: null
      };
    }
    
    // ✅ IMAGEM COM URL
    if (messageObj.imageMessage) {
      const caption = messageObj.imageMessage.caption || '[Imagem]';
      let mediaUrl = null;
      
      try {
        // Prioridade 1: URL direta do WhatsApp
        if (messageObj.imageMessage.url) {
          mediaUrl = messageObj.imageMessage.url;
          console.log(`[ConnectionManager] 🔗 URL direta da imagem encontrada: ${mediaUrl.substring(0, 50)}...`);
        }
        // Prioridade 2: Download via Baileys (para casos sem URL)
        else if (socket) {
          console.log(`[ConnectionManager] 📥 Baixando imagem via Baileys...`);
          const mediaData = await downloadMediaMessage(
            { message: { imageMessage: messageObj.imageMessage } },
            'buffer',
            {},
            { logger: console }
          );
          
          if (mediaData && mediaData.length > 0) {
            // Converter para base64 para envio
            const base64 = mediaData.toString('base64');
            mediaUrl = `data:image/jpeg;base64,${base64}`;
            console.log(`[ConnectionManager] ✅ Imagem convertida para base64: ${(mediaData.length / 1024).toFixed(1)}KB`);
          }
        }
      } catch (error) {
        console.error(`[ConnectionManager] ❌ Erro ao extrair imagem:`, error.message);
        mediaUrl = null;
      }
      
      return {
        text: caption,
        mediaUrl: mediaUrl
      };
    }
    
    // ✅ VÍDEO COM URL
    if (messageObj.videoMessage) {
      const caption = messageObj.videoMessage.caption || '[Vídeo]';
      let mediaUrl = null;
      
      try {
        if (messageObj.videoMessage.url) {
          mediaUrl = messageObj.videoMessage.url;
          console.log(`[ConnectionManager] 🔗 URL direta do vídeo encontrada: ${mediaUrl.substring(0, 50)}...`);
        } else if (socket) {
          console.log(`[ConnectionManager] 📥 Baixando vídeo via Baileys...`);
          const mediaData = await downloadMediaMessage(
            { message: { videoMessage: messageObj.videoMessage } },
            'buffer',
            {},
            { logger: console }
          );
          
          if (mediaData && mediaData.length > 0) {
            const base64 = mediaData.toString('base64');
            mediaUrl = `data:video/mp4;base64,${base64}`;
            console.log(`[ConnectionManager] ✅ Vídeo convertido para base64: ${(mediaData.length / 1024).toFixed(1)}KB`);
          }
        }
      } catch (error) {
        console.error(`[ConnectionManager] ❌ Erro ao extrair vídeo:`, error.message);
        mediaUrl = null;
      }
      
      return {
        text: caption,
        mediaUrl: mediaUrl
      };
    }
    
    // ✅ ÁUDIO COM URL
    if (messageObj.audioMessage) {
      let mediaUrl = null;
      
      try {
        if (messageObj.audioMessage.url) {
          mediaUrl = messageObj.audioMessage.url;
          console.log(`[ConnectionManager] 🔗 URL direta do áudio encontrada: ${mediaUrl.substring(0, 50)}...`);
        } else if (socket) {
          console.log(`[ConnectionManager] 📥 Baixando áudio via Baileys...`);
          const mediaData = await downloadMediaMessage(
            { message: { audioMessage: messageObj.audioMessage } },
            'buffer',
            {},
            { logger: console }
          );
          
          if (mediaData && mediaData.length > 0) {
            const base64 = mediaData.toString('base64');
            mediaUrl = `data:audio/ogg;base64,${base64}`;
            console.log(`[ConnectionManager] ✅ Áudio convertido para base64: ${(mediaData.length / 1024).toFixed(1)}KB`);
          }
        }
      } catch (error) {
        console.error(`[ConnectionManager] ❌ Erro ao extrair áudio:`, error.message);
        mediaUrl = null;
      }
      
      return {
        text: '[Áudio]',
        mediaUrl: mediaUrl
      };
    }
    
    // ✅ DOCUMENTO COM URL
    if (messageObj.documentMessage) {
      const fileName = messageObj.documentMessage.fileName || 'arquivo';
      let mediaUrl = null;
      
      try {
        if (messageObj.documentMessage.url) {
          mediaUrl = messageObj.documentMessage.url;
          console.log(`[ConnectionManager] 🔗 URL direta do documento encontrada: ${mediaUrl.substring(0, 50)}...`);
        } else if (socket) {
          console.log(`[ConnectionManager] 📥 Baixando documento via Baileys...`);
          const mediaData = await downloadMediaMessage(
            { message: { documentMessage: messageObj.documentMessage } },
            'buffer',
            {},
            { logger: console }
          );
          
          if (mediaData && mediaData.length > 0) {
            const mimeType = messageObj.documentMessage.mimetype || 'application/octet-stream';
            const base64 = mediaData.toString('base64');
            mediaUrl = `data:${mimeType};base64,${base64}`;
            console.log(`[ConnectionManager] ✅ Documento convertido para base64: ${(mediaData.length / 1024).toFixed(1)}KB`);
          }
        }
      } catch (error) {
        console.error(`[ConnectionManager] ❌ Erro ao extrair documento:`, error.message);
        mediaUrl = null;
      }
      
      return {
        text: `[Documento: ${fileName}]`,
        mediaUrl: mediaUrl
      };
    }
    
    // Outros tipos sem mídia
    if (messageObj.stickerMessage) {
      return { text: '[Sticker]', mediaUrl: null };
    }
    
    if (messageObj.locationMessage) {
      return { text: '[Localização]', mediaUrl: null };
    }
    
    if (messageObj.contactMessage) {
      return { text: '[Contato]', mediaUrl: null };
    }
    
    return { text: '[Mensagem não suportada]', mediaUrl: null };
  }

// 3. MODIFICAR A CHAMADA DA FUNÇÃO NO EVENT LISTENER messages.upsert:
// TROCAR ESTA LINHA:
//   body: this.extractMessageContent(message.message),
// POR ESTAS LINHAS:
      
      // ✅ EXTRAIR CONTEÚDO DA MENSAGEM COM MÍDIA
      const messageContent = await this.extractMessageContent(message.message, socket);
      
      const messageData = {
        messageId: messageId,
        body: messageContent.text,
        mediaUrl: messageContent.mediaUrl, // ✅ AGORA INCLUI URL DE MÍDIA
        from: remoteJid,
        fromMe: fromMe,
        timestamp: message.messageTimestamp,
        messageType: this.getMessageType(message.message)
      };

      console.log(`${logPrefix} 📋 Dados da mensagem extraídos:`, {
        messageId: messageData.messageId,
        type: messageData.messageType,
        textLength: messageData.body?.length || 0,
        hasMediaUrl: !!messageData.mediaUrl,
        mediaUrlPreview: messageData.mediaUrl ? messageData.mediaUrl.substring(0, 50) + '...' : null
      });

// APLICAR ESTAS MODIFICAÇÕES E REINICIAR O SERVIDOR 