// IMPORT MANAGER CORRIGIDO - COMPATÍVEL COM BAILEYS
class ImportManagerCorrected {
  constructor(instances) {
    this.instances = instances;
    console.log('📦 ImportManagerCorrected inicializado');
  }

  // Método principal de importação corrigido
  async importHistory(instanceId, options = {}) {
    const {
      importType = 'both',
      batchSize = 50,
      lastSyncTimestamp
    } = options;

    console.log(`[ImportManagerCorrected] 📥 Iniciando importação para ${instanceId}:`, {
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
      method: 'corrected',
      metadata: {
        processingTime: 0,
        errors: [],
        warnings: [],
        dataSource: 'unknown'
      }
    };

    const startTime = Date.now();

    try {
      const socket = instance.socket;

      // Importar contatos se solicitado
      if (importType === 'contacts' || importType === 'both') {
        console.log(`[ImportManagerCorrected] 👥 Importando contatos...`);
        const contactsResult = await this.importContactsRobust(socket, batchSize, lastSyncTimestamp);
        result.contacts = contactsResult.data;
        result.totalContacts = contactsResult.data.length;
        result.metadata.dataSource = contactsResult.source;
        console.log(`[ImportManagerCorrected] ✅ ${result.totalContacts} contatos importados via ${contactsResult.source}`);
      }

      // Importar mensagens se solicitado
      if (importType === 'messages' || importType === 'both') {
        console.log(`[ImportManagerCorrected] 💬 Importando mensagens...`);
        const messagesResult = await this.importMessagesRobust(socket, batchSize, lastSyncTimestamp);
        result.messages = messagesResult.data;
        result.totalMessages = messagesResult.data.length;
        result.metadata.messageSource = messagesResult.source;
        console.log(`[ImportManagerCorrected] ✅ ${result.totalMessages} mensagens importadas via ${messagesResult.source}`);
      }

      // Calcular tempo de processamento
      result.metadata.processingTime = Date.now() - startTime;
      
      // Verificar se há mais dados disponíveis
      result.nextBatchAvailable = result.totalContacts >= batchSize || result.totalMessages >= batchSize;

      console.log(`[ImportManagerCorrected] 🎉 Importação concluída em ${result.metadata.processingTime}ms`);
      return result;

    } catch (error) {
      console.error(`[ImportManagerCorrected] ❌ Erro na importação:`, error);
      
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

  // Importação robusta de contatos com múltiplas estratégias
  async importContactsRobust(socket, batchSize, lastSyncTimestamp) {
    const strategies = [
      { name: 'getContacts', method: this.getContactsViaMethod.bind(this) },
      { name: 'store.contacts', method: this.getContactsViaStore.bind(this) },
      { name: 'chats_extraction', method: this.getContactsViaChats.bind(this) }
    ];

    for (const strategy of strategies) {
      try {
        console.log(`[ImportManagerCorrected] 🔄 Tentando estratégia: ${strategy.name}`);
        const result = await strategy.method(socket, batchSize, lastSyncTimestamp);
        
        if (result.data && result.data.length > 0) {
          console.log(`[ImportManagerCorrected] ✅ Sucesso com ${strategy.name}: ${result.data.length} contatos`);
          return { data: result.data, source: strategy.name };
        }
        
        console.log(`[ImportManagerCorrected] ⚠️ ${strategy.name} retornou dados vazios`);
      } catch (error) {
        console.log(`[ImportManagerCorrected] ❌ Falha com ${strategy.name}: ${error.message}`);
        continue;
      }
    }

    console.log(`[ImportManagerCorrected] ⚠️ Todas as estratégias falharam para contatos`);
    return { data: [], source: 'none' };
  }

  // Estratégia 1: Usar método getContacts() do Baileys
  async getContactsViaMethod(socket, batchSize, lastSyncTimestamp) {
    if (typeof socket.getContacts !== 'function') {
      throw new Error('Método getContacts não disponível');
    }

    const contacts = await socket.getContacts();
    if (!contacts || !Array.isArray(contacts)) {
      throw new Error('getContacts retornou dados inválidos');
    }

    return {
      data: contacts.slice(0, batchSize).map(contact => this.formatContact(contact, 'getContacts'))
    };
  }

  // Estratégia 2: Usar socket.store.contacts
  async getContactsViaStore(socket, batchSize, lastSyncTimestamp) {
    if (!socket.store || !socket.store.contacts) {
      throw new Error('socket.store.contacts não disponível');
    }

    const storeContacts = socket.store.contacts;
    const contactIds = Object.keys(storeContacts);
    
    if (contactIds.length === 0) {
      throw new Error('socket.store.contacts está vazio');
    }

    const contacts = [];
    let processedCount = 0;

    for (const contactId of contactIds) {
      if (processedCount >= batchSize) break;
      
      const contactData = storeContacts[contactId];
      if (contactData && !contactId.includes('@g.us')) { // Ignorar grupos
        contacts.push(this.formatContact({ id: contactId, ...contactData }, 'store'));
        processedCount++;
      }
    }

    return { data: contacts };
  }

  // Estratégia 3: Extrair contatos dos chats
  async getContactsViaChats(socket, batchSize, lastSyncTimestamp) {
    if (!socket.store || !socket.store.chats) {
      throw new Error('socket.store.chats não disponível');
    }

    const chats = socket.store.chats;
    const chatIds = Object.keys(chats);
    
    if (chatIds.length === 0) {
      throw new Error('socket.store.chats está vazio');
    }

    const contacts = [];
    const uniqueContacts = new Set();
    let processedCount = 0;

    for (const chatId of chatIds) {
      if (processedCount >= batchSize) break;
      
      if (!chatId.includes('@g.us')) { // Ignorar grupos
        const phone = chatId.split('@')[0];
        if (phone && phone.length >= 10 && !uniqueContacts.has(phone)) {
          uniqueContacts.add(phone);
          const chatData = chats[chatId];
          
          contacts.push(this.formatContact({
            id: chatId,
            phone: phone,
            name: chatData.name || `Contato +${phone}`,
            ...chatData
          }, 'chats_extraction'));
          
          processedCount++;
        }
      }
    }

    return { data: contacts };
  }

  // Importação robusta de mensagens
  async importMessagesRobust(socket, batchSize, lastSyncTimestamp) {
    const strategies = [
      { name: 'getChatMessages', method: this.getMessagesViaMethod.bind(this) },
      { name: 'store.messages', method: this.getMessagesViaStore.bind(this) },
      { name: 'chats_data', method: this.getMessagesViaChatsData.bind(this) }
    ];

    for (const strategy of strategies) {
      try {
        console.log(`[ImportManagerCorrected] 🔄 Tentando estratégia: ${strategy.name}`);
        const result = await strategy.method(socket, batchSize, lastSyncTimestamp);
        
        if (result.data && result.data.length > 0) {
          console.log(`[ImportManagerCorrected] ✅ Sucesso com ${strategy.name}: ${result.data.length} mensagens`);
          return { data: result.data, source: strategy.name };
        }
        
        console.log(`[ImportManagerCorrected] ⚠️ ${strategy.name} retornou dados vazios`);
      } catch (error) {
        console.log(`[ImportManagerCorrected] ❌ Falha com ${strategy.name}: ${error.message}`);
        continue;
      }
    }

    console.log(`[ImportManagerCorrected] ⚠️ Todas as estratégias falharam para mensagens`);
    return { data: [], source: 'none' };
  }

  // Estratégia 1: Usar getChatMessages()
  async getMessagesViaMethod(socket, batchSize, lastSyncTimestamp) {
    if (typeof socket.getChatMessages !== 'function') {
      throw new Error('Método getChatMessages não disponível');
    }

    // Primeiro, obter lista de chats
    const chats = await this.getChatsForMessages(socket);
    if (!chats || chats.length === 0) {
      throw new Error('Nenhum chat disponível para buscar mensagens');
    }

    const messages = [];
    let processedCount = 0;

    for (const chat of chats.slice(0, 5)) { // Limitar a 5 chats para evitar timeout
      if (processedCount >= batchSize) break;
      
      try {
        const chatId = chat.id || chat.key?.remoteJid;
        if (chatId && !chatId.includes('@g.us')) { // Ignorar grupos
          const chatMessages = await socket.getChatMessages(chatId, Math.min(10, batchSize - processedCount));
          
          if (chatMessages && Array.isArray(chatMessages)) {
            for (const message of chatMessages) {
              if (processedCount >= batchSize) break;
              messages.push(this.formatMessage(message, chatId, 'getChatMessages'));
              processedCount++;
            }
          }
        }
      } catch (error) {
        console.log(`[ImportManagerCorrected] ⚠️ Erro ao buscar mensagens do chat: ${error.message}`);
        continue;
      }
    }

    return { data: messages };
  }

  // Estratégia 2: Usar socket.store.messages
  async getMessagesViaStore(socket, batchSize, lastSyncTimestamp) {
    if (!socket.store || !socket.store.messages) {
      throw new Error('socket.store.messages não disponível');
    }

    const storeMessages = socket.store.messages;
    const messageKeys = Object.keys(storeMessages);
    
    if (messageKeys.length === 0) {
      throw new Error('socket.store.messages está vazio');
    }

    const messages = [];
    let processedCount = 0;

    for (const messageKey of messageKeys) {
      if (processedCount >= batchSize) break;
      
      const messageData = storeMessages[messageKey];
      if (messageData) {
        if (Array.isArray(messageData)) {
          for (const msg of messageData) {
            if (processedCount >= batchSize) break;
            messages.push(this.formatMessage(msg, messageKey, 'store'));
            processedCount++;
          }
        } else {
          messages.push(this.formatMessage(messageData, messageKey, 'store'));
          processedCount++;
        }
      }
    }

    return { data: messages };
  }

  // Estratégia 3: Usar dados dos chats
  async getMessagesViaChatsData(socket, batchSize, lastSyncTimestamp) {
    if (!socket.store || !socket.store.chats) {
      throw new Error('socket.store.chats não disponível');
    }

    const chats = socket.store.chats;
    const chatIds = Object.keys(chats);
    
    if (chatIds.length === 0) {
      throw new Error('socket.store.chats está vazio');
    }

    const messages = [];
    let processedCount = 0;

    for (const chatId of chatIds) {
      if (processedCount >= batchSize) break;
      
      const chatData = chats[chatId];
      if (chatData && chatData.lastMessage && !chatId.includes('@g.us')) {
        messages.push({
          messageId: `chat_${chatId}_${chatData.lastMessageTime || Date.now()}`,
          from: chatId,
          fromMe: false,
          body: chatData.lastMessage || 'Mensagem do histórico',
          timestamp: chatData.lastMessageTime ? 
            new Date(chatData.lastMessageTime * 1000).toISOString() : 
            new Date().toISOString(),
          messageType: 'text',
          mediaUrl: null,
          hasMedia: false,
          instanceId: socket.user?.id?.split('@')[0] || 'unknown',
          chatId: chatId,
          source: 'chats_data',
          importTimestamp: new Date().toISOString()
        });
        
        processedCount++;
      }
    }

    return { data: messages };
  }

  // Obter chats para buscar mensagens
  async getChatsForMessages(socket) {
    if (typeof socket.getChats === 'function') {
      return await socket.getChats();
    } else if (socket.store && socket.store.chats) {
      return Object.keys(socket.store.chats).map(chatId => ({
        id: chatId,
        ...socket.store.chats[chatId]
      }));
    }
    throw new Error('Nenhum método disponível para obter chats');
  }

  // Formatar contato para padrão consistente
  formatContact(contact, source) {
    const phone = contact.phone || contact.id?.split('@')[0] || 'unknown';
    
    return {
      phone: phone,
      name: contact.name || contact.notify || contact.verifiedName || `Contato +${phone}`,
      profilePictureUrl: contact.profilePictureUrl || contact.imgUrl || null,
      lastMessageTime: contact.lastMessageTime ? 
        new Date(contact.lastMessageTime * 1000).toISOString() : null,
      isBlocked: contact.isBlocked || false,
      isContact: contact.isMyContact || contact.isContact || true,
      status: contact.status || null,
      source: source,
      instanceId: 'unknown', // Será preenchido pelo contexto
      importTimestamp: new Date().toISOString()
    };
  }

  // Formatar mensagem para padrão consistente
  formatMessage(message, chatId, source) {
    const messageText = this.extractMessageText(message);
    
    return {
      messageId: message.key?.id || message.id || `msg_${Date.now()}_${Math.random()}`,
      from: message.key?.remoteJid || chatId,
      fromMe: message.key?.fromMe || false,
      body: messageText || 'Mensagem sem conteúdo',
      timestamp: message.messageTimestamp ? 
        new Date(message.messageTimestamp * 1000).toISOString() : 
        new Date().toISOString(),
      messageType: this.getMessageType(message),
      mediaUrl: this.getMediaUrl(message),
      hasMedia: this.hasMedia(message),
      instanceId: 'unknown', // Será preenchido pelo contexto
      chatId: chatId,
      source: source,
      importTimestamp: new Date().toISOString()
    };
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
}

module.exports = ImportManagerCorrected;
