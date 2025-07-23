// CONNECTION MANAGER - GERENCIAMENTO ISOLADO DE CONEXÕES
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage } = require('baileys');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

class ConnectionManager {
  constructor(instances, authDir, webhookManager) {
    this.instances = instances;
    this.authDir = authDir;
    this.webhookManager = webhookManager;
    this.connectionAttempts = new Map();
    this.sentMessagesCache = new Map(); // Cache para rastrear mensagens enviadas via API
    
    console.log('🔌 ConnectionManager inicializado');
  }

  // Criar instância com gerenciamento robusto
  async createInstance(instanceId, createdByUserId = null, isRecovery = false) {
    const logPrefix = `[ConnectionManager ${instanceId}]`;
    
    if (this.instances[instanceId] && !isRecovery) {
      throw new Error('Instância já existe');
    }

    console.log(`${logPrefix} 🚀 ${isRecovery ? 'Recuperando' : 'Criando'} instância...`);

    try {
      // Configurar diretório de autenticação
      const instanceAuthDir = path.join(this.authDir, instanceId);
      if (!fs.existsSync(instanceAuthDir)) {
        fs.mkdirSync(instanceAuthDir, { recursive: true });
        console.log(`${logPrefix} 📁 Diretório de auth criado: ${instanceAuthDir}`);
      }

      // Configurar estado de autenticação persistente
      const { state, saveCreds } = await useMultiFileAuthState(instanceAuthDir);

      // Configurar socket com configurações otimizadas
      const socket = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ['WhatsApp CRM', 'Chrome', '6.0.0'],
        connectTimeoutMs: 45000,
        defaultQueryTimeoutMs: 45000,
        keepAliveIntervalMs: 30000,
        receiveFullHistory: false,
        syncFullHistory: false,
        generateHighQualityLinkPreview: false,
        logger: {
          level: 'error',
          child: () => ({ level: 'error', error: () => {}, warn: () => {}, info: () => {}, debug: () => {} })
        }
      });

      // Configurar dados da instância
      const instance = {
        instanceId,
        instanceName: instanceId,
        socket,
        status: 'connecting',
        connected: false,
        phone: null,
        profileName: null,
        qrCode: null,
        error: null,
        lastUpdate: new Date(),
        attempts: this.connectionAttempts.get(instanceId) || 0,
        createdByUserId,
        authDir: instanceAuthDir
      };

      this.instances[instanceId] = instance;

      // Configurar event listeners
      this.setupEventListeners(socket, instanceId, saveCreds);

      console.log(`${logPrefix} ✅ Instância configurada, aguardando conexão...`);
      return instance;

    } catch (error) {
      console.error(`${logPrefix} ❌ Erro ao criar instância:`, error);
      
      if (this.instances[instanceId]) {
        this.instances[instanceId].status = 'error';
        this.instances[instanceId].error = error.message;
      }
      
      throw error;
    }
  }

  // Configurar event listeners para conexão e mensagens
  setupEventListeners(socket, instanceId, saveCreds) {
    const logPrefix = `[ConnectionManager ${instanceId}]`;
    const instance = this.instances[instanceId];

    // Gerenciar atualizações de conexão
    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      console.log(`${logPrefix} 🔄 Status: ${connection} | QR: ${!!qr}`);
      instance.lastUpdate = new Date();

      // QR Code gerado
      if (qr) {
        try {
          const qrCodeData = await QRCode.toDataURL(qr);
          instance.qrCode = qrCodeData;
          instance.status = 'qr_ready';
          
          console.log(`${logPrefix} 📱 QR Code gerado e enviado para webhook`);
          
          // Notificar QR via webhook
          await this.webhookManager.notifyQRCode(instanceId, qrCodeData);
        } catch (qrError) {
          console.error(`${logPrefix} ❌ Erro ao processar QR:`, qrError);
        }
      }

      // Conexão perdida
      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log(`${logPrefix} 🔌 Conexão fechada. Reconectar: ${shouldReconnect}`);
        
        instance.connected = false;
        instance.qrCode = null;

        if (shouldReconnect) {
          // Incrementar tentativas
          const currentAttempts = this.connectionAttempts.get(instanceId) || 0;
          this.connectionAttempts.set(instanceId, currentAttempts + 1);
          instance.attempts = currentAttempts + 1;

          if (currentAttempts < 5) {
            instance.status = 'reconnecting';
            console.log(`${logPrefix} 🔄 Tentativa ${currentAttempts + 1}/5 de reconexão em 5s...`);
            
            setTimeout(async () => {
              try {
                await this.createInstance(instanceId, instance.createdByUserId, true);
              } catch (reconnectError) {
                console.error(`${logPrefix} ❌ Erro na reconexão:`, reconnectError);
              }
            }, 5000);
          } else {
            instance.status = 'failed';
            console.log(`${logPrefix} ❌ Máximo de tentativas atingido`);
          }
        } else {
          instance.status = 'logged_out';
          console.log(`${logPrefix} 👋 Instância deslogada`);
        }

        // Notificar desconexão
        await this.webhookManager.notifyConnection(instanceId, instance.phone, instance.profileName, 'disconnected');
      }

      // Conexão estabelecida
      if (connection === 'open') {
        console.log(`${logPrefix} ✅ Conectado com sucesso!`);

        const userInfo = socket.user;
        const phone = userInfo?.id?.split(':')[0] || null;
        const profileName = userInfo?.name || userInfo?.notify || null;

        instance.status = 'connected';
        instance.connected = true;
        instance.phone = phone;
        instance.profileName = profileName;
        instance.qrCode = null;
        instance.error = null;
        
        // Resetar contador de tentativas
        this.connectionAttempts.delete(instanceId);
        instance.attempts = 0;

        // Notificar conexão via webhook
        console.log(`${logPrefix} 📡 Enviando webhook de conexão para auto_whatsapp_sync`);
        await this.webhookManager.notifyConnection(instanceId, phone, profileName, 'connected');
      }
    });

    // Gerenciar mensagens recebidas
    socket.ev.on('messages.upsert', async (m) => {
      const message = m.messages[0];
      if (!message?.key || !message?.message) return;

      const remoteJid = message.key.remoteJid;
      const messageId = message.key.id;
      const fromMe = message.key.fromMe;

      // FILTRO 1: Ignorar grupos e broadcast
      if (remoteJid.includes('@g.us') || remoteJid.includes('@broadcast')) {
        console.log(`${logPrefix} 🚫 Mensagem de grupo/broadcast ignorada: ${remoteJid}`);
        return;
      }

      // FILTRO 2: Se fromMe=true, verificar se foi enviada via API
      if (fromMe) {
        if (this.wasMessageSentViaAPI(instanceId, messageId)) {
          console.log(`${logPrefix} 🔄 Mensagem enviada via API ignorada: ${messageId}`);
          return;
        }
      }

      console.log(`${logPrefix} 📨 Nova mensagem de: ${remoteJid} (fromMe: ${fromMe})`);

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

      // Notificar mensagem via webhook (com throttling)
      setTimeout(async () => {
        await this.webhookManager.notifyMessage(instanceId, messageData, instance.createdByUserId);
      }, 1000); // Delay de 1 segundo para evitar spam
    });

    // Tratar erros de socket
    socket.ev.on('error', (error) => {
      console.error(`${logPrefix} ❌ Socket error:`, error);
      instance.error = error.message;
      instance.lastUpdate = new Date();
    });

    // Salvar credenciais quando atualizadas
    socket.ev.on('creds.update', saveCreds);
  }

  // Verificar se mensagem foi enviada via API (para evitar loops)
  wasMessageSentViaAPI(instanceId, messageId) {
    const cacheKey = `${instanceId}:${messageId}`;
    return this.sentMessagesCache.has(cacheKey);
  }

  // Adicionar mensagem ao cache de enviadas
  addSentMessageToCache(instanceId, messageId, phone) {
    const cacheKey = `${instanceId}:${messageId}`;
    this.sentMessagesCache.set(cacheKey, { phone, timestamp: Date.now() });
    
    // Limpar cache de mensagens antigas (após 5 minutos)
    setTimeout(() => {
      this.sentMessagesCache.delete(cacheKey);
    }, 5 * 60 * 1000);
  }

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

  // Identificar tipo da mensagem
  getMessageType(messageObj) {
    if (messageObj.conversation || messageObj.extendedTextMessage) {
      return 'text';
    }
    
    if (messageObj.imageMessage) {
      return 'image';
    }
    
    if (messageObj.videoMessage) {
      return 'video';
    }
    
    if (messageObj.audioMessage) {
      return 'audio';
    }
    
    if (messageObj.documentMessage) {
      return 'document';
    }
    
    if (messageObj.stickerMessage) {
      return 'sticker';
    }
    
    if (messageObj.locationMessage) {
      return 'location';
    }
    
    if (messageObj.contactMessage) {
      return 'contact';
    }
    
    return 'unknown';
  }

  // Deletar instância completamente
  async deleteInstance(instanceId) {
    const logPrefix = `[ConnectionManager ${instanceId}]`;
    
    try {
      const instance = this.instances[instanceId];
      
      if (instance?.socket) {
        console.log(`${logPrefix} 🔌 Fechando socket...`);
        await instance.socket.logout();
        instance.socket.end();
      }
      
      // Remover diretório de autenticação
      if (instance?.authDir && fs.existsSync(instance.authDir)) {
        console.log(`${logPrefix} 🗑️ Removendo diretório de auth...`);
        fs.rmSync(instance.authDir, { recursive: true, force: true });
      }
      
      // Limpar da memória
      delete this.instances[instanceId];
      this.connectionAttempts.delete(instanceId);
      
      // Limpar cache de mensagens enviadas
      for (const [key] of this.sentMessagesCache) {
        if (key.startsWith(`${instanceId}:`)) {
          this.sentMessagesCache.delete(key);
        }
      }
      
      console.log(`${logPrefix} ✅ Instância removida completamente`);
      
    } catch (error) {
      console.error(`${logPrefix} ❌ Erro ao deletar instância:`, error);
      throw error;
    }
  }

  // Obter estatísticas do ConnectionManager
  getStats() {
    const instances = Object.values(this.instances);
    
    return {
      total: instances.length,
      connected: instances.filter(i => i.connected).length,
      connecting: instances.filter(i => i.status === 'connecting').length,
      qr_ready: instances.filter(i => i.status === 'qr_ready').length,
      failed: instances.filter(i => i.status === 'failed').length,
      logged_out: instances.filter(i => i.status === 'logged_out').length,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };
  }
}

module.exports = ConnectionManager; 