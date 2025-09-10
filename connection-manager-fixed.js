// CONNECTION MANAGER - VERSÃO CORRIGIDA DA VPS (LOOPS DE RECONEXÃO RESOLVIDOS)
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadContentFromMessage } = require('baileys');
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
    this.profilePicCache = new Map(); // Cache simples por telefone (TTL)
    this.reconnectionTimeouts = new Map(); // NOVO: Rastrear timeouts de reconexão

    console.log('🔌 ConnectionManager inicializado');
  }

  // 🚫 MARCAR INSTÂNCIA PARA NÃO RECONECTAR (chamado antes de exclusão)
  markForIntentionalDisconnect(instanceId) {
    const logPrefix = `[ConnectionManager ${instanceId}]`;
    console.log(`${logPrefix} 🚫 Marcando para desconexão intencional`);
    
    if (this.instances[instanceId]) {
      this.instances[instanceId].intentionalDisconnect = true;
    }
    
    // Cancelar qualquer timeout de reconexão pendente
    if (this.reconnectionTimeouts && this.reconnectionTimeouts.has(instanceId)) {
      const timeoutId = this.reconnectionTimeouts.get(instanceId);
      clearTimeout(timeoutId);
      this.reconnectionTimeouts.delete(instanceId);
      console.log(`${logPrefix} ⏰ Timeout de reconexão cancelado`);
    }
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
        markOnlineOnConnect: true,
        fireInitQueries: true,
        emitOwnEvents: false,
        maxQueryAttempts: 3
      });

      // Criar instância no armazenamento
      this.instances[instanceId] = {
        socket,
        instanceId,
        instanceName: instanceId,
        status: 'connecting',
        phone: null,
        profileName: null,
        connected: false,
        qrCode: null,
        lastUpdate: new Date(),
        attempts: this.connectionAttempts.get(instanceId) || 0,
        createdByUserId,
        authDir: instanceAuthDir,
        isRecovery,
        intentionalDisconnect: false // NOVO: Flag para evitar loops
      };

      // Configurar event listeners
      this.setupEventListeners(socket, instanceId, saveCreds);

      console.log(`${logPrefix} ✅ Instância ${isRecovery ? 'recuperada' : 'criada'} com sucesso`);
      return socket;

    } catch (error) {
      console.error(`${logPrefix} ❌ Erro:`, error);

      // Marcar instância como erro
      this.instances[instanceId] = {
        instanceId,
        instanceName: instanceId,
        status: 'error',
        connected: false,
        error: error.message,
        lastUpdate: new Date(),
        attempts: this.connectionAttempts.get(instanceId) || 0,
        createdByUserId,
        isRecovery
      };

      throw error;
    }
  }

  // Configurar event listeners para a instância
  setupEventListeners(socket, instanceId, saveCreds) {
    const logPrefix = `[ConnectionManager ${instanceId}]`;
    const instance = this.instances[instanceId];

    // Salvar credenciais automaticamente
    socket.ev.on('creds.update', saveCreds);

    // Gerenciar atualizações de conexão
    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      console.log(`${logPrefix} 🔄 Connection update: ${connection}`);

      instance.lastUpdate = new Date();

      // QR Code gerado
      if (qr) {
        console.log(`${logPrefix} 📱 QR Code gerado`);
        try {
          const qrCodeDataURL = await QRCode.toDataURL(qr, {
            type: 'png',
            width: 512,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });

          instance.qrCode = qrCodeDataURL;
          instance.status = 'waiting_qr';

          // Notificar via webhook
          await this.webhookManager.notifyQRCode(instanceId, qrCodeDataURL);

        } catch (qrError) {
          console.error(`${logPrefix} ❌ Erro no QR Code:`, qrError);
          instance.status = 'qr_error';
          instance.error = qrError.message;
        }
      }

      // Conexão fechada
      if (connection === 'close') {
        // 🔧 LÓGICA DE RECONEXÃO CORRIGIDA - APENAS EM CASOS LEGÍTIMOS
        const disconnectCode = lastDisconnect?.error?.output?.statusCode;
        const errorMessage = lastDisconnect?.error?.message || '';
        
        // ❌ NUNCA RECONECTAR EM:
        const isLoggedOut = disconnectCode === DisconnectReason.loggedOut;
        const isConflict = errorMessage.includes('conflict') || errorMessage.includes('replaced');
        const isIntentionalDisconnect = instance.intentionalDisconnect === true;
        
        // ✅ APENAS RECONECTAR EM CASOS LEGÍTIMOS:
        const shouldReconnect = !isLoggedOut && !isConflict && !isIntentionalDisconnect;
        
        console.log(`${logPrefix} 🔍 Análise de reconexão:`, {
          disconnectCode,
          errorMessage: errorMessage.substring(0, 50),
          isLoggedOut,
          isConflict,
          isIntentionalDisconnect,
          shouldReconnect
        });

        const currentAttempts = this.connectionAttempts.get(instanceId) || 0;

        console.log(`${logPrefix} ❌ Conexão fechada. Reconectar: ${shouldReconnect}, Tentativas: ${currentAttempts}/3`);

        instance.status = 'disconnected';
        instance.connected = false;
        instance.qrCode = null;

        // Notificar desconexão via webhook
        await this.webhookManager.notifyConnection(instanceId, instance.phone, instance.profileName, 'disconnected');

        if (shouldReconnect && currentAttempts < 3) {
          this.connectionAttempts.set(instanceId, currentAttempts + 1);
          instance.attempts = currentAttempts + 1;
          instance.status = 'reconnecting';

          // 🔄 DELAY EXPONENCIAL: 15s, 30s, 60s ao invés de sempre 15s
          const baseDelay = 15000; // 15 segundos
          const exponentialDelay = baseDelay * Math.pow(2, currentAttempts); // 15s, 30s, 60s
          const maxDelay = 60000; // Máximo 1 minuto
          const finalDelay = Math.min(exponentialDelay, maxDelay);
          
          console.log(`${logPrefix} 🔄 Reagendando reconexão em ${finalDelay/1000}s... (${currentAttempts + 1}/3)`);

          const timeoutId = setTimeout(async () => {
            try {
              // Verificar se ainda deve reconectar (pode ter sido marcada para exclusão)
              if (this.instances[instanceId]?.intentionalDisconnect) {
                console.log(`${logPrefix} 🚫 Reconexão cancelada - desconexão intencional`);
                return;
              }
              
              await this.createInstance(instanceId, instance.createdByUserId, true);
            } catch (error) {
              console.error(`${logPrefix} ❌ Erro na reconexão:`, error);
              instance.status = 'error';
              instance.error = error.message;
            } finally {
              // Limpar timeout do mapa
              if (this.reconnectionTimeouts) {
                this.reconnectionTimeouts.delete(instanceId);
              }
            }
          }, finalDelay);
          
          // Salvar timeout para poder cancelar depois
          if (!this.reconnectionTimeouts) {
            this.reconnectionTimeouts = new Map();
          }
          this.reconnectionTimeouts.set(instanceId, timeoutId);
        } else {
          console.log(`${logPrefix} ⚠️ Máximo de tentativas atingido ou logout/conflito`);
          instance.status = lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut ? 'logged_out' : 'error';
          this.connectionAttempts.delete(instanceId);
        }
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
        instance.intentionalDisconnect = false; // Reset flag

        // Resetar contador de tentativas
        this.connectionAttempts.delete(instanceId);
        instance.attempts = 0;

        // Notificar conexão via webhook (nome sempre; foto da instância apenas neste evento)
        console.log(`${logPrefix} 📡 Enviando webhook de conexão para auto_whatsapp_sync`);
        let instanceProfilePicBase64 = null;
        try {
          if (typeof socket.profilePictureUrl === 'function' && userInfo?.id) {
            const picUrl = await socket.profilePictureUrl(userInfo.id, 'image');
            if (picUrl) {
              const resp = await fetch(picUrl);
              const buf = await resp.arrayBuffer();
              const mime = resp.headers.get('content-type') || 'image/jpeg';
              const b64 = Buffer.from(buf).toString('base64');
              instanceProfilePicBase64 = `data:${mime};base64,${b64}`;
            }
          }
        } catch (_) {}

        await this.webhookManager.notifyConnection(
          instanceId,
          phone,
          profileName,
          'connected',
          instanceProfilePicBase64 ? { instanceProfilePicBase64 } : {}
        );
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
      if (remoteJid.includes('@g.us') || remoteJid.includes('@broadcast') ||
          remoteJid.includes('@newsletter') || remoteJid.includes('@lid')) {
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

      // ✅ NOVO: Extrair dados com Base64 processado
      const messageData = await this.extractMessageDataWithBase64(message, socket);

      console.log(`${logPrefix} 📊 Dados processados:`, {
        messageId: messageData.messageId,
        messageType: messageData.messageType,
        hasMediaBase64: !!messageData.mediaBase64,
        hasInstancePhone: !!messageData.instancePhone,
        textLength: messageData.body?.length || 0,
        hasMediaUrl: !!messageData.mediaUrl
      });

      // Notificar mensagem via webhook (com throttling)
      setTimeout(async () => {
        // ✅ ADICIONAR TELEFONE DA INSTÂNCIA
        const webhookData = {
          ...messageData,
          instancePhone: instance.phone // ✅ NOVO: Número da instância
        };
        await this.webhookManager.notifyMessage(instanceId, webhookData, instance.createdByUserId);
      }, 1000); // Delay de 1 segundo para evitar spam
    });

    // Tratar erros de socket
    socket.ev.on('error', (error) => {
      console.error(`${logPrefix} ❌ Socket error:`, error);
      instance.error = error.message;
      instance.lastUpdate = new Date();
    });
  }

  // Adicionar mensagem ao cache (enviada via API)
  addSentMessageToCache(instanceId, messageId, phone) {
    const cacheKey = `${instanceId}:${messageId}`;
    this.sentMessagesCache.set(cacheKey, {
      instanceId,
      messageId,
      phone,
      timestamp: Date.now(),
      sentViaAPI: true
    });

    // Limpar cache após 5 minutos
    setTimeout(() => {
      this.sentMessagesCache.delete(cacheKey);
    }, 5 * 60 * 1000);
  }

  // Verificar se mensagem foi enviada via API
  wasMessageSentViaAPI(instanceId, messageId) {
    const cacheKey = `${instanceId}:${messageId}`;
    return this.sentMessagesCache.has(cacheKey);
  }

  // ✅ NOVA: Extrair dados com Base64 processado
  async extractMessageDataWithBase64(message, socket) {
    const logPrefix = `[MediaProcessor]`;
    
    const remoteJid = message.key.remoteJid;
    const messageId = message.key.id;
    const fromMe = message.key.fromMe;
    
    // Dados básicos da mensagem
    const messageData = {
      messageId: messageId,
      body: this.extractMessageContent(message.message),
      from: remoteJid,
      fromMe: fromMe,
      timestamp: message.messageTimestamp,
      messageType: this.getMessageType(message.message),
      mediaUrl: null,
      mediaBase64: null,
      mediaSize: null
    };
    
    // Se não é mídia, retornar dados básicos
    const messageType = this.getMessageType(message.message);
    if (!['image', 'video', 'audio', 'document'].includes(messageType)) {
      return messageData;
    }
    
    try {
      console.log(`${logPrefix} 🎬 Processando mídia tipo: ${messageType}`);
      
      // ✅ BAIXAR E CONVERTER MÍDIA PARA BASE64
      const buffer = await downloadMediaMessage(message, 'buffer', {});
      
      if (buffer && buffer.length > 0) {
        // Verificar tamanho (limite 5MB para base64)
        const sizeMB = buffer.length / (1024 * 1024);
        
        if (sizeMB <= 5) {
          // Detectar MIME type
          let mimeType = 'application/octet-stream';
          const mediaMessage = message.message.imageMessage || 
                              message.message.videoMessage || 
                              message.message.audioMessage || 
                              message.message.documentMessage;
          
          if (messageType === 'image') mimeType = 'image/jpeg';
          else if (messageType === 'video') mimeType = 'video/mp4';
          else if (messageType === 'audio') mimeType = 'audio/mpeg';
          else if (messageType === 'document') mimeType = mediaMessage?.mimetype || 'application/pdf';
          
          // ✅ CONVERTER PARA BASE64
          const base64Data = `data:${mimeType};base64,${buffer.toString('base64')}`;
          
          console.log(`${logPrefix} ✅ Base64 gerado: ${messageType} (${sizeMB.toFixed(1)}MB)`);
          
          messageData.mediaBase64 = base64Data;
          messageData.mediaSize = buffer.length;
        } else {
          console.log(`${logPrefix} ⚠️ Arquivo muito grande (${sizeMB.toFixed(1)}MB) - apenas URL`);
        }
        
        // Tentar obter URL da mídia (se disponível)
        const mediaMessage = message.message.imageMessage || 
                            message.message.videoMessage || 
                            message.message.audioMessage || 
                            message.message.documentMessage;
        
        if (mediaMessage?.url) {
          messageData.mediaUrl = mediaMessage.url;
          console.log(`${logPrefix} 🔗 URL direta da ${messageType} encontrada: ${(mediaMessage.url ? mediaMessage.url.substring(0, 50) : 'N/A')}...`);
        }
      }
    } catch (error) {
      console.error(`${logPrefix} ❌ Erro ao processar mídia:`, error);
    }
    
    return messageData;
  }

  // Extrair conteúdo da mensagem (suporte a todos os tipos)
  extractMessageContent(messageObj) {
    if (messageObj.conversation) {
      return messageObj.conversation;
    }

    if (messageObj.extendedTextMessage?.text) {
      return messageObj.extendedTextMessage.text;
    }

    if (messageObj.imageMessage?.caption) {
      return messageObj.imageMessage.caption || '[Imagem]';
    }

    if (messageObj.videoMessage?.caption) {
      return messageObj.videoMessage.caption || '[Vídeo]';
    }

    if (messageObj.audioMessage) {
      return '[Áudio]';
    }

    if (messageObj.documentMessage) {
      return `[Documento: ${messageObj.documentMessage.fileName || 'arquivo'}]`;
    }

    if (messageObj.stickerMessage) {
      return '[Sticker]';
    }

    if (messageObj.locationMessage) {
      return '[Localização]';
    }

    if (messageObj.contactMessage) {
      return '[Contato]';
    }

    return '[Mensagem não suportada]';
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
    const instance = this.instances[instanceId];

    if (!instance) {
      throw new Error('Instância não encontrada');
    }

    console.log(`${logPrefix} 🗑️ Deletando instância...`);

    try {
      // NOVO: Marcar para desconexão intencional ANTES de fechar
      this.markForIntentionalDisconnect(instanceId);

      // Fechar socket se existir
      if (instance.socket) {
        try {
          instance.socket.end();
          console.log(`${logPrefix} 🔌 Socket fechado`);
        } catch (error) {
          console.error(`${logPrefix} ⚠️ Erro ao fechar socket:`, error.message);
        }
      }

      // Remover diretório de autenticação
      const authDir = path.join(this.authDir, instanceId);
      if (fs.existsSync(authDir)) {
        fs.rmSync(authDir, { recursive: true, force: true });
        console.log(`${logPrefix} 📁 Diretório de auth removido`);
      }

      // Limpar contadores
      this.connectionAttempts.delete(instanceId);

      // Remover da memória
      delete this.instances[instanceId];

      console.log(`${logPrefix} ✅ Instância deletada completamente`);

    } catch (error) {
      console.error(`${logPrefix} ❌ Erro ao deletar:`, error);
      throw error;
    }
  }

  // Obter estatísticas das conexões
  getConnectionStats() {
    const instances = Object.values(this.instances);

    return {
      total: instances.length,
      connected: instances.filter(i => i.connected).length,
      connecting: instances.filter(i => i.status === 'connecting').length,
      waiting_qr: instances.filter(i => i.status === 'waiting_qr').length,
      reconnecting: instances.filter(i => i.status === 'reconnecting').length,
      error: instances.filter(i => i.status === 'error').length,
      logged_out: instances.filter(i => i.status === 'logged_out').length,
      activeAttempts: this.connectionAttempts.size,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = ConnectionManager; 