
// IMPORT MANAGER - MÓDULO ISOLADO PARA IMPORTAÇÃO DE HISTÓRICO
class ImportManager {
  constructor(instances) {
    this.instances = instances;
    console.log('📦 ImportManager inicializado');
  }

  // Método principal de importação - TOTALMENTE ISOLADO
  async importHistory(instanceId, options = {}) {
    const {
      importType = 'both',
      batchSize = 50,
      lastSyncTimestamp
    } = options;

    console.log(`[ImportManager] 📥 Iniciando importação para ${instanceId}:`, {
      importType,
      batchSize,
      lastSyncTimestamp
    });

    // Validar instância
    const instance = this.instances[instanceId];
    if (!instance) {
      throw new Error('Instância não encontrada');
    }

    if (!instance.connected || !instance.socket) {
      throw new Error(`Instância não está conectada. Status: ${instance.status}`);
    }

    const result = {
      success: true,
      instanceId,
      importType,
      contacts: [],
      messages: [],
      totalContacts: 0,
      totalMessages: 0,
      timestamp: new Date().toISOString(),
      nextBatchAvailable: false,
      metadata: {
        processingTime: 0,
        errors: [],
        warnings: []
      }
    };

    const startTime = Date.now();

    try {
      const socket = instance.socket;

      // Importar contatos se solicitado
      if (importType === 'contacts' || importType === 'both') {
        console.log(`[ImportManager] 👥 Importando contatos...`);
        result.contacts = await this.importContacts(socket, batchSize, lastSyncTimestamp);
        result.totalContacts = result.contacts.length;
        console.log(`[ImportManager] ✅ ${result.totalContacts} contatos importados`);
      }

      // Importar mensagens se solicitado
      if (importType === 'messages' || importType === 'both') {
        console.log(`[ImportManager] 💬 Importando mensagens...`);
        result.messages = await this.importMessages(socket, batchSize, lastSyncTimestamp);
        result.totalMessages = result.messages.length;
        console.log(`[ImportManager] ✅ ${result.totalMessages} mensagens importadas`);
      }

      // Calcular tempo de processamento
      result.metadata.processingTime = Date.now() - startTime;
      
      // Verificar se há mais dados disponíveis
      result.nextBatchAvailable = result.totalContacts >= batchSize || result.totalMessages >= batchSize;

      console.log(`[ImportManager] 🎉 Importação concluída em ${result.metadata.processingTime}ms`);
      return result;

    } catch (error) {
      console.error(`[ImportManager] ❌ Erro na importação:`, error);
      
      result.success = false;
      result.error = error.message;
      result.metadata.processingTime = Date.now() - startTime;
      result.metadata.errors.push({
        type: 'import_error',
        message: error.message,
        timestamp: new Date().toISOString()
      });

      return result;
    }
  }

  // Importar contatos usando socket.store
  async importContacts(socket, batchSize, lastSyncTimestamp) {
    const contacts = [];
    
    try {
      console.log(`[ImportManager] 🔍 Acessando socket.store.contacts...`);
      
      // Verificar se socket.store existe e tem contatos
      if (!socket.store || !socket.store.contacts) {
        console.log(`[ImportManager] ⚠️ socket.store.contacts não disponível, tentando métodos alternativos`);
        return await this.importContactsAlternative(socket, batchSize);
      }

      const storeContacts = socket.store.contacts;
      console.log(`[ImportManager] 📊 Encontrados ${Object.keys(storeContacts).length} contatos no store`);

      let processedCount = 0;
      const cutoffTime = lastSyncTimestamp ? new Date(lastSyncTimestamp) : null;

      for (const [contactId, contactData] of Object.entries(storeContacts)) {
        if (processedCount >= batchSize) break;

        // Filtrar grupos (não importar grupos)
        if (contactId.includes('@g.us')) continue;

        // Verificar filtro de timestamp se fornecido
        if (cutoffTime && contactData.lastSeen && new Date(contactData.lastSeen * 1000) <= cutoffTime) {
          continue;
        }

        const phone = contactId.split('@')[0];
        if (phone && phone.length >= 10) { // Validar número de telefone
          contacts.push({
            phone: phone,
            name: contactData.name || contactData.notify || contactData.verifiedName || `Contato +${phone}`,
            profilePictureUrl: contactData.imgUrl || null,
            lastMessageTime: contactData.lastMessageTime ? new Date(contactData.lastMessageTime * 1000).toISOString() : null,
            isBlocked: contactData.isBlocked || false,
            isContact: contactData.isMyContact || false,
            status: contactData.status || null,
            source: 'socket_store',
            instanceId: socket.user?.id?.split('@')[0] || 'unknown',
            importTimestamp: new Date().toISOString()
          });
          
          processedCount++;
        }
      }

      console.log(`[ImportManager] ✅ ${contacts.length} contatos processados do socket.store`);
      return contacts;

    } catch (error) {
      console.error(`[ImportManager] ❌ Erro ao importar contatos:`, error);
      
      // Tentar método alternativo em caso de erro
      return await this.importContactsAlternative(socket, batchSize);
    }
  }

  // Método alternativo para importar contatos
  async importContactsAlternative(socket, batchSize) {
    console.log(`[ImportManager] 🔄 Usando método alternativo para contatos...`);
    
    const contacts = [];
    
    try {
      // Tentar obter chats e extrair contatos únicos
      if (socket.store && socket.store.chats) {
        const chats = socket.store.chats;
        console.log(`[ImportManager] 📊 Extraindo contatos de ${Object.keys(chats).length} chats`);

        const uniqueContacts = new Set();
        let processedCount = 0;

        for (const [chatId, chatData] of Object.entries(chats)) {
          if (processedCount >= batchSize) break;
          
          // Ignorar grupos
          if (chatId.includes('@g.us')) continue;

          const phone = chatId.split('@')[0];
          if (phone && phone.length >= 10 && !uniqueContacts.has(phone)) {
            uniqueContacts.add(phone);
            
            contacts.push({
              phone: phone,
              name: chatData.name || `Contato +${phone}`,
              profilePictureUrl: null,
              lastMessageTime: chatData.lastMessageTime ? new Date(chatData.lastMessageTime * 1000).toISOString() : null,
              isBlocked: false,
              isContact: true,
              status: null,
              source: 'chat_extraction',
              instanceId: socket.user?.id?.split('@')[0] || 'unknown',
              importTimestamp: new Date().toISOString()
            });
            
            processedCount++;
          }
        }
      }

      console.log(`[ImportManager] ✅ ${contacts.length} contatos extraídos de chats`);
      return contacts;

    } catch (error) {
      console.error(`[ImportManager] ❌ Erro no método alternativo de contatos:`, error);
      return [];
    }
  }

  // Importar mensagens usando socket.store
  async importMessages(socket, batchSize, lastSyncTimestamp) {
    const messages = [];
    
    try {
      console.log(`[ImportManager] 🔍 Acessando socket.store.messages...`);
      
      // Verificar se socket.store existe e tem mensagens
      if (!socket.store || !socket.store.messages) {
        console.log(`[ImportManager] ⚠️ socket.store.messages não disponível, tentando chats`);
        return await this.importMessagesFromChats(socket, batchSize, lastSyncTimestamp);
      }

      const storeMessages = socket.store.messages;
      console.log(`[ImportManager] 📊 Encontradas ${Object.keys(storeMessages).length} conversas no store`);

      let processedCount = 0;
      const cutoffTime = lastSyncTimestamp ? new Date(lastSyncTimestamp) : null;

      for (const [chatId, chatMessages] of Object.entries(storeMessages)) {
        if (processedCount >= batchSize) break;
        
        // Ignorar grupos
        if (chatId.includes('@g.us')) continue;

        if (Array.isArray(chatMessages)) {
          for (const message of chatMessages) {
            if (processedCount >= batchSize) break;

            // Verificar filtro de timestamp
            const messageTime = message.messageTimestamp ? new Date(message.messageTimestamp * 1000) : new Date();
            if (cutoffTime && messageTime <= cutoffTime) continue;

            const messageText = this.extractMessageText(message);
            if (messageText) {
              messages.push({
                messageId: message.key?.id || `msg_${Date.now()}_${Math.random()}`,
                from: message.key?.remoteJid || chatId,
                fromMe: message.key?.fromMe || false,
                body: messageText,
                timestamp: messageTime.toISOString(),
                messageType: this.getMessageType(message),
                mediaUrl: this.getMediaUrl(message),
                hasMedia: this.hasMedia(message),
                instanceId: socket.user?.id?.split('@')[0] || 'unknown',
                chatId: chatId,
                source: 'socket_store',
                importTimestamp: new Date().toISOString()
              });
              
              processedCount++;
            }
          }
        }
      }

      console.log(`[ImportManager] ✅ ${messages.length} mensagens processadas do socket.store`);
      return messages;

    } catch (error) {
      console.error(`[ImportManager] ❌ Erro ao importar mensagens:`, error);
      
      // Tentar método alternativo
      return await this.importMessagesFromChats(socket, batchSize, lastSyncTimestamp);
    }
  }

  // Método alternativo para importar mensagens de chats
  async importMessagesFromChats(socket, batchSize, lastSyncTimestamp) {
    console.log(`[ImportManager] 🔄 Importando mensagens de chats...`);
    
    const messages = [];
    
    try {
      if (!socket.store || !socket.store.chats) {
        console.log(`[ImportManager] ⚠️ socket.store.chats não disponível`);
        return [];
      }

      const chats = socket.store.chats;
      console.log(`[ImportManager] 📊 Processando ${Object.keys(chats).length} chats para mensagens`);

      let processedCount = 0;
      const cutoffTime = lastSyncTimestamp ? new Date(lastSyncTimestamp) : null;

      for (const [chatId, chatData] of Object.entries(chats)) {
        if (processedCount >= batchSize) break;
        
        // Ignorar grupos
        if (chatId.includes('@g.us')) continue;

        // Simular algumas mensagens baseadas nos dados do chat
        if (chatData.lastMessageTime) {
          const lastMessageTime = new Date(chatData.lastMessageTime * 1000);
          
          if (!cutoffTime || lastMessageTime > cutoffTime) {
            messages.push({
              messageId: `chat_msg_${chatId}_${chatData.lastMessageTime}`,
              from: chatId,
              fromMe: false,
              body: chatData.lastMessage || 'Mensagem importada do histórico',
              timestamp: lastMessageTime.toISOString(),
              messageType: 'text',
              mediaUrl: null,
              hasMedia: false,
              instanceId: socket.user?.id?.split('@')[0] || 'unknown',
              chatId: chatId,
              source: 'chat_data',
              importTimestamp: new Date().toISOString()
            });
            
            processedCount++;
          }
        }
      }

      console.log(`[ImportManager] ✅ ${messages.length} mensagens extraídas de dados de chat`);
      return messages;

    } catch (error) {
      console.error(`[ImportManager] ❌ Erro ao importar mensagens de chats:`, error);
      return [];
    }
  }

  // Utilitários para processar mensagens
  extractMessageText(message) {
    if (!message || !message.message) return null;
    
    const messageContent = message.message;
    
    return messageContent.conversation ||
           messageContent.extendedTextMessage?.text ||
           messageContent.imageMessage?.caption ||
           messageContent.videoMessage?.caption ||
           messageContent.documentMessage?.caption ||
           messageContent.audioMessage?.caption ||
           '[Mídia]';
  }

  getMessageType(message) {
    if (!message || !message.message) return 'text';
    
    const messageContent = message.message;
    
    if (messageContent.imageMessage) return 'image';
    if (messageContent.videoMessage) return 'video';
    if (messageContent.audioMessage) return 'audio';
    if (messageContent.documentMessage) return 'document';
    if (messageContent.stickerMessage) return 'sticker';
    if (messageContent.locationMessage) return 'location';
    if (messageContent.contactMessage) return 'contact';
    
    return 'text';
  }

  getMediaUrl(message) {
    if (!message || !message.message) return null;
    
    const messageContent = message.message;
    
    return messageContent.imageMessage?.url ||
           messageContent.videoMessage?.url ||
           messageContent.audioMessage?.url ||
           messageContent.documentMessage?.url ||
           null;
  }

  hasMedia(message) {
    if (!message || !message.message) return false;
    
    const messageContent = message.message;
    
    return !!(messageContent.imageMessage ||
              messageContent.videoMessage ||
              messageContent.audioMessage ||
              messageContent.documentMessage ||
              messageContent.stickerMessage);
  }

  // Método para obter estatísticas de importação
  getImportStats(instanceId) {
    const instance = this.instances[instanceId];
    if (!instance || !instance.socket) {
      return null;
    }

    try {
      const socket = instance.socket;
      const stats = {
        instanceId,
        connected: instance.connected,
        status: instance.status,
        storeAvailable: !!(socket.store),
        contacts: socket.store?.contacts ? Object.keys(socket.store.contacts).length : 0,
        chats: socket.store?.chats ? Object.keys(socket.store.chats).length : 0,
        messages: socket.store?.messages ? Object.keys(socket.store.messages).length : 0,
        timestamp: new Date().toISOString()
      };

      console.log(`[ImportManager] 📊 Stats para ${instanceId}:`, stats);
      return stats;
      
    } catch (error) {
      console.error(`[ImportManager] ❌ Erro ao obter stats:`, error);
      return null;
    }
  }
}

module.exports = ImportManager;
