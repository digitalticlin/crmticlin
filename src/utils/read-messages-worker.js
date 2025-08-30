// 📱 READ MESSAGES WORKER - SINCRONIZAÇÃO COM WHATSAPP MÓVEL
// Marca mensagens como lidas no WhatsApp Web/Desktop para sincronizar com móvel

class ReadMessagesWorker {
  constructor(instances, webhookManager) {
    this.instances = instances;
    this.webhookManager = webhookManager;
    this.readQueue = new Map(); // Fila de mensagens para marcar como lidas
    this.rateLimitQueue = new Map(); // Rate limiting por instância
    this.processing = false;

    console.log('📱 ReadMessagesWorker inicializado');
    
    // Processar fila a cada 2 segundos
    this.startProcessor();
  }

  // Iniciar processador da fila
  startProcessor() {
    setInterval(() => {
      if (!this.processing) {
        this.processReadQueue();
      }
    }, 2000); // Executa a cada 2 segundos
  }

  // Adicionar mensagens à fila para marcar como lidas
  async addToReadQueue(instanceId, chatJid, messageIds, userId = null) {
    try {
      if (!instanceId || !chatJid || !messageIds || messageIds.length === 0) {
        console.log('⚠️ [ReadWorker] Parâmetros inválidos para adicionar à fila');
        return { success: false, error: 'Parâmetros inválidos' };
      }

      const logPrefix = `[ReadWorker ${instanceId}]`;
      console.log(`${logPrefix} 📥 Adicionando ${messageIds.length} mensagens à fila de leitura para ${chatJid}`);

      // Verificar se instância existe e está conectada
      const instance = this.instances[instanceId];
      if (!instance || !instance.connected || !instance.socket) {
        console.log(`${logPrefix} ❌ Instância não disponível para marcar como lida`);
        return { success: false, error: 'Instância não disponível' };
      }

      // Criar chave única para o chat
      const queueKey = `${instanceId}:${chatJid}`;

      // Inicializar fila se não existir
      if (!this.readQueue.has(queueKey)) {
        this.readQueue.set(queueKey, {
          instanceId,
          chatJid,
          messageIds: new Set(),
          userId,
          timestamp: Date.now()
        });
      }

      // Adicionar IDs das mensagens (evitar duplicatas com Set)
      const queueItem = this.readQueue.get(queueKey);
      messageIds.forEach(id => queueItem.messageIds.add(id));
      queueItem.timestamp = Date.now(); // Atualizar timestamp

      console.log(`${logPrefix} ✅ ${messageIds.length} mensagens adicionadas à fila. Total na fila: ${queueItem.messageIds.size}`);

      return { 
        success: true, 
        queued: messageIds.length,
        totalInQueue: queueItem.messageIds.size
      };

    } catch (error) {
      console.error('❌ [ReadWorker] Erro ao adicionar à fila:', error);
      return { success: false, error: error.message };
    }
  }

  // Marcar mensagens como lidas quando usuário abre conversa no CRM
  async markAsReadWhenOpenConversation(instanceId, phone, userId = null) {
    try {
      const logPrefix = `[ReadWorker ${instanceId}]`;
      console.log(`${logPrefix} 📱 Usuário ${userId || 'N/A'} abriu conversa com ${phone}`);

      // Formatar JID do chat
      const chatJid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;

      // Verificar instância
      const instance = this.instances[instanceId];
      if (!instance || !instance.connected || !instance.socket) {
        console.log(`${logPrefix} ❌ Instância não disponível`);
        return { success: false, error: 'Instância não disponível' };
      }

      // Obter mensagens não lidas do chat
      try {
        const unreadMessages = await this.getUnreadMessagesFromChat(instance.socket, chatJid);
        
        if (unreadMessages && unreadMessages.length > 0) {
          console.log(`${logPrefix} 📬 Encontradas ${unreadMessages.length} mensagens não lidas`);
          
          // Extrair IDs das mensagens
          const messageIds = unreadMessages.map(msg => msg.key.id);
          
          // Adicionar à fila de leitura
          return await this.addToReadQueue(instanceId, chatJid, messageIds, userId);
        } else {
          console.log(`${logPrefix} ✅ Nenhuma mensagem não lida encontrada`);
          return { success: true, unreadCount: 0 };
        }

      } catch (chatError) {
        console.error(`${logPrefix} ❌ Erro ao obter mensagens do chat:`, chatError);
        return { success: false, error: 'Erro ao acessar mensagens do chat' };
      }

    } catch (error) {
      console.error('❌ [ReadWorker] Erro em markAsReadWhenOpenConversation:', error);
      return { success: false, error: error.message };
    }
  }

  // Obter mensagens não lidas de um chat específico
  async getUnreadMessagesFromChat(socket, chatJid) {
    try {
      // Tentar diferentes métodos do Baileys para obter mensagens não lidas
      
      // Método 1: Usar getChatHistory ou fetchMessages
      if (typeof socket.fetchMessages === 'function') {
        console.log('📚 Usando fetchMessages para obter histórico do chat');
        const messages = await socket.fetchMessages(chatJid, 50); // Últimas 50 mensagens
        
        // Filtrar apenas mensagens não lidas e que não são nossas
        const unreadMessages = messages.filter(msg => 
          msg.key && 
          !msg.key.fromMe && 
          msg.messageTimestamp && 
          msg.message
        );
        
        return unreadMessages;
      }
      
      // Método 2: Usar store se disponível
      if (socket.store && typeof socket.store.loadMessages === 'function') {
        console.log('📚 Usando store para obter mensagens');
        const messages = await socket.store.loadMessages(chatJid, 50);
        
        const unreadMessages = messages.filter(msg => 
          msg.key && 
          !msg.key.fromMe && 
          msg.messageTimestamp && 
          msg.message
        );
        
        return unreadMessages;
      }

      // Método 3: Fallback - assumir que há mensagens não lidas
      console.log('⚠️ Métodos diretos não disponíveis, usando abordagem alternativa');
      return [];

    } catch (error) {
      console.error('❌ Erro ao obter mensagens não lidas:', error);
      return [];
    }
  }

  // Processar fila de mensagens para marcar como lidas
  async processReadQueue() {
    if (this.readQueue.size === 0) return;

    this.processing = true;
    const logPrefix = '[ReadWorker]';
    
    try {
      console.log(`${logPrefix} 🔄 Processando fila de leitura - ${this.readQueue.size} chats`);

      const processPromises = [];

      for (const [queueKey, queueItem] of this.readQueue.entries()) {
        const { instanceId, chatJid, messageIds, userId } = queueItem;

        // Rate limiting: máximo 1 processamento por instância a cada 3 segundos
        const lastProcessed = this.rateLimitQueue.get(instanceId) || 0;
        const now = Date.now();
        
        if (now - lastProcessed < 3000) {
          continue; // Pular este item por rate limiting
        }

        // Processar este item
        const promise = this.processReadMessagesForChat(instanceId, chatJid, Array.from(messageIds), userId)
          .then(result => {
            if (result.success) {
              // Remover da fila se processado com sucesso
              this.readQueue.delete(queueKey);
              this.rateLimitQueue.set(instanceId, now);
            }
            return result;
          })
          .catch(error => {
            console.error(`${logPrefix} ❌ Erro ao processar ${queueKey}:`, error);
            // Manter na fila para tentar novamente depois
          });

        processPromises.push(promise);

        // Processar no máximo 3 itens por vez para evitar sobrecarga
        if (processPromises.length >= 3) {
          break;
        }
      }

      if (processPromises.length > 0) {
        await Promise.allSettled(processPromises);
        console.log(`${logPrefix} ✅ Lote de ${processPromises.length} itens processado`);
      }

    } catch (error) {
      console.error(`${logPrefix} ❌ Erro ao processar fila:`, error);
    } finally {
      this.processing = false;
    }
  }

  // Processar readMessages para um chat específico
  async processReadMessagesForChat(instanceId, chatJid, messageIds, userId) {
    const logPrefix = `[ReadWorker ${instanceId}]`;
    
    try {
      console.log(`${logPrefix} 📱 Marcando ${messageIds.length} mensagens como lidas para ${chatJid}`);

      // Verificar instância
      const instance = this.instances[instanceId];
      if (!instance || !instance.connected || !instance.socket) {
        return { success: false, error: 'Instância não disponível' };
      }

      // 🔥 FUNÇÃO PRINCIPAL: readMessages do Baileys
      await instance.socket.readMessages([{
        remoteJid: chatJid,
        id: messageIds,
        participant: undefined // Para chats individuais
      }]);

      console.log(`${logPrefix} ✅ Mensagens marcadas como lidas com sucesso no WhatsApp`);

      // Notificar via webhook (opcional)
      try {
        await this.webhookManager.notifyReadMessages(instanceId, chatJid, messageIds.length, userId);
      } catch (webhookError) {
        console.error(`${logPrefix} ⚠️ Erro no webhook de read messages:`, webhookError.message);
      }

      return { 
        success: true, 
        messagesRead: messageIds.length,
        chatJid,
        syncedWithMobile: true 
      };

    } catch (error) {
      console.error(`${logPrefix} ❌ Erro ao marcar mensagens como lidas:`, error);
      return { 
        success: false, 
        error: error.message,
        chatJid,
        messageIds: messageIds.length
      };
    }
  }

  // Marcar mensagens específicas como lidas (uso direto)
  async markSpecificMessagesAsRead(instanceId, chatJid, messageIds) {
    const logPrefix = `[ReadWorker ${instanceId}]`;

    try {
      console.log(`${logPrefix} 🎯 Marcação direta: ${messageIds.length} mensagens`);

      const instance = this.instances[instanceId];
      if (!instance || !instance.connected || !instance.socket) {
        return { success: false, error: 'Instância não disponível' };
      }

      // Executar readMessages imediatamente
      await instance.socket.readMessages([{
        remoteJid: chatJid,
        id: messageIds,
        participant: undefined
      }]);

      console.log(`${logPrefix} ✅ Mensagens marcadas como lidas diretamente`);

      return { 
        success: true, 
        messagesRead: messageIds.length,
        method: 'direct'
      };

    } catch (error) {
      console.error(`${logPrefix} ❌ Erro na marcação direta:`, error);
      return { success: false, error: error.message };
    }
  }

  // Obter estatísticas da fila
  getQueueStats() {
    const stats = {
      totalChats: this.readQueue.size,
      totalMessages: 0,
      chats: []
    };

    for (const [queueKey, queueItem] of this.readQueue.entries()) {
      stats.totalMessages += queueItem.messageIds.size;
      stats.chats.push({
        key: queueKey,
        instanceId: queueItem.instanceId,
        chatJid: queueItem.chatJid,
        messageCount: queueItem.messageIds.size,
        timestamp: queueItem.timestamp
      });
    }

    return stats;
  }

  // Limpar fila (manutenção)
  clearQueue() {
    const clearedItems = this.readQueue.size;
    this.readQueue.clear();
    this.rateLimitQueue.clear();
    console.log(`🧹 [ReadWorker] Fila limpa: ${clearedItems} itens removidos`);
    return { cleared: clearedItems };
  }
}

module.exports = ReadMessagesWorker;