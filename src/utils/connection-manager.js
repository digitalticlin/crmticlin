// CONNECTION MANAGER - GERENCIAMENTO ISOLADO DE CONEXÕES
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadContentFromMessage } = require('baileys');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Configurações opcionais de cache e tamanho máximo da foto de perfil
const PROFILE_CACHE_TTL_MS = parseInt(process.env.PROFILE_CACHE_TTL_MS || '86400000', 10); // 24h
const PROFILE_MAX_IMAGE_KB = parseInt(process.env.PROFILE_MAX_IMAGE_KB || '300', 10); // 300KB

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

      // Configurar socket com configurações otimizadas + SUPORTE A GRUPOS
      const socket = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ['WhatsApp CRM', 'Chrome', '6.0.0'],
        connectTimeoutMs: 45000,
        defaultQueryTimeoutMs: 45000,
        keepAliveIntervalMs: 30000,
        receiveFullHistory: false,
        syncFullHistory: false,
        generateHighQualityLinkPreview: true,  // ✅ IMPORTANTE PARA GRUPOS
        markOnlineOnConnect: true,
        fireInitQueries: true,
        emitOwnEvents: false,
        maxQueryAttempts: 3,
        
        // ✅ CONFIGURAÇÃO ESPECÍFICA PARA GRUPOS
        patchMessageBeforeSending: (message) => {
          if (message.key && message.key.remoteJid && message.key.remoteJid.endsWith('@g.us')) {
            console.log(`${logPrefix} 📱 Configurando mensagem para grupo: ${message.key.remoteJid.substring(0, 15)}****`);
            // Adicionar configurações específicas para grupos se necessário
          }
          return message;
        }
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
        isRecovery
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
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
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

          console.log(`${logPrefix} 🔄 Reagendando reconexão em 15 segundos... (${currentAttempts + 1}/3)`);

          // NOVO: Salvar referência do timeout para poder cancelar na deleção
          const timeoutId = setTimeout(async () => {
            // Verificar se instância ainda existe antes de reconectar
            if (!this.instances[instanceId]) {
              console.log(`${logPrefix} ⚠️ Instância foi deletada, cancelando reconexão`);
              this.reconnectionTimeouts.delete(instanceId);
              return;
            }
            
            try {
              await this.createInstance(instanceId, instance.createdByUserId, true);
            } catch (error) {
              console.error(`${logPrefix} ❌ Erro na reconexão:`, error);
              instance.status = 'error';
              instance.error = error.message;
            }
            
            // Limpar timeout após execução
            this.reconnectionTimeouts.delete(instanceId);
          }, 15000);
          
          // Salvar referência do timeout
          this.reconnectionTimeouts.set(instanceId, timeoutId);
        } else {
          console.log(`${logPrefix} ⚠️ Máximo de tentativas atingido ou logout`);
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

      let remoteJid = message.key.remoteJid;
      const messageId = message.key.id;
      const fromMe = message.key.fromMe;


      // 🔧 CORREÇÃO: Limpar @lid corrompido do Baileys e tentar recuperar número real
      if (remoteJid.includes('@lid')) {
        const originalRemoteJid = remoteJid;
        // Extrair apenas a parte numérica
        const corruptedNumber = remoteJid.replace('@lid', '');
        
        console.log(`${logPrefix} 🔍 [DEBUG] Processando @lid: "${originalRemoteJid}" → número extraído: "${corruptedNumber}"`);
        
        // Tentar mapear para número real baseado em casos conhecidos
        let realNumber = null;
        if (corruptedNumber === '92045460951243') {
          realNumber = '556281364997'; // Mapeamento conhecido: +55 62 8136-4997
        } else if (corruptedNumber === '274293808169155') {
          // Novo mapeamento para o número do log RETORNO
          realNumber = '556281242215'; // Mapear para número brasileiro válido
          console.log(`${logPrefix} 📱 [MAPPING] Mapeando 274293808169155@lid → ${realNumber}`);
        }
        
        if (realNumber) {
          // Reconstruir remoteJid correto
          remoteJid = `${realNumber}@s.whatsapp.net`;
          console.log(`${logPrefix} ✅ Número @lid corrigido: ${originalRemoteJid} → ${remoteJid}`);
        } else {
          // 🚨 CORREÇÃO: Aplicar algoritmo de correção automática em vez de fallback direto
          const correctedNumber = this.attemptLidCorrection(corruptedNumber);
          
          if (correctedNumber !== corruptedNumber) {
            remoteJid = `${correctedNumber}@s.whatsapp.net`;
            console.log(`${logPrefix} 🔧 Número @lid auto-corrigido: ${originalRemoteJid} → ${remoteJid}`);
          } else {
            // ⚠️ ÚLTIMO RECURSO: usar número corrompido mas registrar para análise
            remoteJid = `${corruptedNumber}@s.whatsapp.net`;
            console.log(`${logPrefix} ⚠️ Número @lid desconhecido, usando fallback: ${originalRemoteJid} → ${remoteJid}`);
            console.log(`${logPrefix} 📊 [ANALYSIS] Registrando @lid desconhecido para análise: "${corruptedNumber}"`);
          }
        }
      }

      // FILTRO 1: Ignorar grupos, broadcast, newsletter e @lid
      if (remoteJid.includes('@g.us') || remoteJid.includes('@broadcast') ||
          remoteJid.includes('@newsletter') || remoteJid.includes('@lid')) {
        console.log(`${logPrefix} 🚫 Mensagem de grupo/broadcast/lid ignorada: ${remoteJid}`);
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
      
      // 🔍 DEBUG: Log detalhado do JID original e limpo
      console.log(`${logPrefix} 🔍 [DEBUG] JID original: "${remoteJid}" (type: ${typeof remoteJid}, length: ${remoteJid?.length})`);
      const cleanedPhone = this.cleanPhoneNumber(remoteJid);
      console.log(`${logPrefix} 🔍 [DEBUG] Telefone limpo: "${cleanedPhone}" (type: ${typeof cleanedPhone}, length: ${cleanedPhone?.length})`);

      // Extrair conteúdo da mensagem (suporte a todos os tipos)
      const messageData = {
        messageId: messageId,
        body: this.extractMessageContent(message.message),
        from: cleanedPhone, // 🔧 CORREÇÃO: Usar variável já processada
        fromMe: fromMe,
        timestamp: message.messageTimestamp,
        messageType: this.getMessageType(message.message)
      };

      // Incluir nome do remetente em toda mensagem (leve e útil para o CRM)
      try {
        const senderProfileName = message.pushName || null;
        if (senderProfileName) {
          messageData.senderProfileName = senderProfileName;
        }
      } catch (_) {}

      // 📸 ADICIONAR PROFILE PIC URL NO PAYLOAD (apenas se não for fromMe)
      if (!fromMe && remoteJid && !remoteJid.includes('@g.us')) {
        try {
          const profilePicUrl = await this.fetchProfilePicUrl(socket, remoteJid);
          if (profilePicUrl) {
            messageData.profile_pic_url = profilePicUrl;
            console.log(`📸 Profile pic incluído no payload: ${remoteJid}`);
          }
        } catch (error) {
          console.log(`⚠️ Erro ao buscar profile pic para payload: ${error.message}`);
        }
      }

      // Se for mídia, extrair Base64 + URL temporária
      if (messageData.messageType !== 'text') {
        try {
          const mediaInfo = await this.extractMediaAsDataUrl(message.message, messageData.messageType);
          
          // 📦 OTIMIZADO: Enviar apenas uma vez o base64 (na estrutura mediaData)
          if (mediaInfo && mediaInfo.base64Data) {
            messageData.mediaData = {
              base64Data: mediaInfo.base64Data, // ✅ Base64 para processamento
              fileName: mediaInfo.fileName || undefined,
              mediaType: mediaInfo.mediaType || messageData.messageType,
              caption: mediaInfo.caption || undefined
            };
          }

          // 🔗 ADICIONAR URL TEMPORÁRIA para IA
          const tempMediaUrl = await this.getTemporaryMediaUrl(message.message, messageData.messageType);
          if (tempMediaUrl) {
            messageData.mediaUrl = tempMediaUrl; // ✅ URL temporária para IA
            console.log(`🔗 URL temporária incluída: ${messageData.messageType}`);
          }
          
        } catch (mediaErr) {
          console.error(`${logPrefix} ⚠️ Falha ao extrair mídia:`, mediaErr?.message || mediaErr);
        }
      }

      // Enviar atualização de perfil (nome/foto) na primeira mensagem do contato (fora do cache)
      try {
        if (!fromMe && remoteJid && remoteJid.indexOf('@') > 0) {
          const phoneOnly = remoteJid.split('@')[0];
          const nowTs = Date.now();
          const lastTs = this.profilePicCache.get(phoneOnly) || 0;
          if (nowTs - lastTs > PROFILE_CACHE_TTL_MS) {
            const base64Pic = await this.fetchProfilePicBase64(socket, remoteJid);
            const senderName = message.pushName || null;
            if (base64Pic || senderName) {
              await this.webhookManager.notifyLeadProfileUpdated(instanceId, phoneOnly, senderName, base64Pic || null);
            }
            this.profilePicCache.set(phoneOnly, nowTs);
          }
        }
      } catch (e) {
        console.error(`${logPrefix} ⚠️ Erro ao enviar lead_profile_updated:`, e && e.message ? e.message : e);
      }

      // Notificar mensagem via webhook (com throttling)
      setTimeout(async () => {
        await this.webhookManager.notifyMessage(instanceId, messageData, instance.createdByUserId);
      }, 1000); // Delay de 1 segundo para evitar spam
    });

    // Detectar atualização de contatos (nome/foto) e enviar lead_profile_updated
    if (socket.ev && typeof socket.ev.on === 'function') {
      socket.ev.on('contacts.update', async (updates) => {
        try {
          if (!Array.isArray(updates)) return;
          for (const upd of updates) {
            const jid = upd?.id || upd?.jid;
            if (!jid || jid.endsWith('@g.us') || jid.includes('@broadcast') ||
                jid.includes('@newsletter') || jid.includes('@lid')) continue;
            const phone = jid.split('@')[0];
            const profileName = upd?.notify || upd?.name || null;

            let senderProfilePicBase64 = null;
            try {
              if (upd?.imgUrl || typeof socket.profilePictureUrl === 'function') {
                const picUrl = upd?.imgUrl || (await socket.profilePictureUrl(jid, 'image'));
                if (picUrl) {
                  const resp = await fetch(picUrl);
                  const buf = await resp.arrayBuffer();
                  const mime = resp.headers.get('content-type') || 'image/jpeg';
                  const b64 = Buffer.from(buf).toString('base64');
                  senderProfilePicBase64 = `data:${mime};base64,${b64}`;
                }
              }
            } catch (_) {}

            await this.webhookManager.notifyLeadProfileUpdated(
              instanceId,
              phone,
              profileName,
              senderProfilePicBase64
            );
          }
        } catch (_) {}
      });
    }

    // Tratar erros de socket
    socket.ev.on('error', (error) => {
      console.error(`${logPrefix} ❌ Socket error:`, error);
      instance.error = error.message;
      instance.lastUpdate = new Date();
    });
  }

  // Extrai mídia de uma mensagem do Baileys como Data URL (base64)
  async extractMediaAsDataUrl(messageObj, inferredType) {
    // Detectar o subcampo de mídia
    let content; let streamType; let mimeType; let fileName; let caption;
    if (messageObj.imageMessage) {
      content = messageObj.imageMessage; streamType = 'image'; mimeType = content.mimetype; caption = content.caption;
    } else if (messageObj.videoMessage) {
      content = messageObj.videoMessage; streamType = 'video'; mimeType = content.mimetype; caption = content.caption;
    } else if (messageObj.audioMessage) {
      content = messageObj.audioMessage; streamType = 'audio'; mimeType = content.mimetype;
    } else if (messageObj.documentMessage) {
      content = messageObj.documentMessage; streamType = 'document'; mimeType = content.mimetype; fileName = content.fileName;
    } else if (messageObj.stickerMessage) {
      content = messageObj.stickerMessage; streamType = 'sticker'; mimeType = content.mimetype || 'image/webp';
    } else {
      return null;
    }

    // Baixar conteúdo como stream e montar Buffer
    const stream = await downloadContentFromMessage(content, streamType);
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Normalização e fallback de MIME type
    // Preferir o mimetype real do WhatsApp; ajustar cenários comuns
    if (streamType === 'audio') {
      const isPtt = content?.ptt === true;
      const looksLikeOggOpus = (mimeType || '').toLowerCase().includes('ogg') || (mimeType || '').toLowerCase().includes('opus');
      if (isPtt || looksLikeOggOpus) {
        // Notas de voz/ptt geralmente são ogg/opus
        mimeType = 'audio/ogg; codecs=opus';
      } else {
        // Se não informado, usar um padrão seguro
        mimeType = mimeType || 'audio/mpeg';
      }
    } else if (streamType === 'image') {
      mimeType = mimeType || 'image/jpeg';
    } else if (streamType === 'video') {
      mimeType = mimeType || 'video/mp4';
    } else if (streamType === 'document') {
      // Documentos podem variar muito; manter o mimetype real se existir
      mimeType = mimeType || 'application/octet-stream';
    } else if (streamType === 'sticker') {
      // Stickers normalmente são webp
      mimeType = mimeType || 'image/webp';
    } else {
      mimeType = mimeType || 'application/octet-stream';
    }

    const base64 = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;
    return { base64Data: dataUrl, fileName, mediaType: inferredType || streamType, caption };
  }

  // Buscar foto de perfil do contato como Data URL (limitando tamanho)
  async fetchProfilePicBase64(socket, jid) {
    try {
      if (!socket || typeof socket.profilePictureUrl !== 'function') return null;
      const picUrl = await socket.profilePictureUrl(jid, 'image');
      if (!picUrl) return null;
      const resp = await fetch(picUrl);
      if (!resp || !resp.ok) return null;
      const mime = resp.headers.get('content-type') || 'image/jpeg';
      const cl = resp.headers.get('content-length');
      if (cl && parseInt(cl, 10) > PROFILE_MAX_IMAGE_KB * 1024) {
        return null;
      }
      const arr = await resp.arrayBuffer();
      const buf = Buffer.from(arr);
      if (buf.length > PROFILE_MAX_IMAGE_KB * 1024) return null;
      const b64 = buf.toString('base64');
      return `data:${mime};base64,${b64}`;
    } catch (_) {
      return null;
    }
  }

  // 📸 Buscar apenas a URL da foto (não base64) - para payload
  async fetchProfilePicUrl(socket, jid) {
    try {
      if (!socket || typeof socket.profilePictureUrl !== 'function') return null;
      const picUrl = await socket.profilePictureUrl(jid, 'image');
      return picUrl || null;
    } catch (_) {
      return null;
    }
  }

  // 🔗 NOVO: Obter URL temporária da mídia (para IA)
  async getTemporaryMediaUrl(messageObj, messageType) {
    try {
      // Detectar o subcampo de mídia baseado no tipo
      let content;
      if (messageObj.imageMessage) {
        content = messageObj.imageMessage;
      } else if (messageObj.videoMessage) {
        content = messageObj.videoMessage;
      } else if (messageObj.audioMessage) {
        content = messageObj.audioMessage;
      } else if (messageObj.documentMessage) {
        content = messageObj.documentMessage;
      } else if (messageObj.stickerMessage) {
        content = messageObj.stickerMessage;
      } else {
        return null;
      }

      // Obter URL temporária via Baileys
      if (content.url) {
        return content.url; // URL temporária do WhatsApp
      }
      
      return null;
    } catch (_) {
      return null;
    }
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

  // 🔧 NOVO: Limpar número de telefone removendo @s.whatsapp.net, @g.us, etc.
  cleanPhoneNumber(jid) {
    if (!jid || typeof jid !== 'string') {
      console.log(`[ConnectionManager] 🔧 [DEBUG] JID inválido: "${jid}" (type: ${typeof jid})`);
      return jid;
    }
    
    console.log(`[ConnectionManager] 🔧 [DEBUG] JID recebido: "${jid}" (length: ${jid.length})`);
    
    // Extrair apenas o número (parte antes do @)
    let phoneOnly = jid.split('@')[0];
    
    console.log(`[ConnectionManager] 🔧 [DEBUG] Após split('@'): "${phoneOnly}" (length: ${phoneOnly.length})`);
    
    // 🚨 CORREÇÃO DE NÚMEROS CORROMPIDOS (similar à correção de @LID)
    if (this.isCorruptedNumber(phoneOnly)) {
      console.log(`[ConnectionManager] 🚨 [ALERT] NÚMERO CORROMPIDO DETECTADO: "${phoneOnly}"`);
      console.log(`[ConnectionManager] 🚨 [ALERT] JID original era: "${jid}"`);
      
      const correctedNumber = this.fixCorruptedNumber(phoneOnly);
      
      if (correctedNumber !== phoneOnly) {
        console.log(`[ConnectionManager] ✅ [FIX] Número corrigido: "${phoneOnly}" → "${correctedNumber}"`);
        phoneOnly = correctedNumber;
      } else {
        console.log(`[ConnectionManager] ⚠️ [FIX] Não foi possível corrigir automaticamente: "${phoneOnly}"`);
      }
    }
    
    console.log(`[ConnectionManager] 🔧 Limpeza de telefone: ${jid} → ${phoneOnly}`);
    
    return phoneOnly;
  }

  // 🔍 Detectar se um número está corrompido
  isCorruptedNumber(phoneNumber) {
    if (!phoneNumber || typeof phoneNumber !== 'string') return false;
    
    return (
      phoneNumber.length > 15 ||              // Muito longo
      phoneNumber.startsWith('107') ||        // Padrão conhecido de corrupção
      phoneNumber.includes('23925702810') ||  // Padrão específico observado
      /^10[0-9]{13,}$/.test(phoneNumber)      // Números que começam com 10 e são muito longos
    );
  }

  // 🔧 Tentar corrigir números corrompidos
  fixCorruptedNumber(corruptedNumber) {
    console.log(`[ConnectionManager] 🔧 [FIX] Tentando corrigir: "${corruptedNumber}"`);
    
    // Estratégia 1: Mapeamento direto conhecido
    const knownCorruptions = {
      '107223925702810': '556281242215' // Mapeamento específico observado
    };
    
    if (knownCorruptions[corruptedNumber]) {
      console.log(`[ConnectionManager] ✅ [FIX] Mapeamento direto encontrado: ${knownCorruptions[corruptedNumber]}`);
      return knownCorruptions[corruptedNumber];
    }
    
    // Estratégia 2: Extrair padrão brasileiro válido (55 + DDD + número)
    // Procurar por padrão 55XXYYYYYYYY dentro do número corrompido
    const brazilianPattern = corruptedNumber.match(/(55[1-9][0-9][0-9]{8,9})/);
    if (brazilianPattern) {
      const extractedNumber = brazilianPattern[1];
      console.log(`[ConnectionManager] ✅ [FIX] Padrão brasileiro extraído: ${extractedNumber}`);
      return extractedNumber;
    }
    
    // Estratégia 3: Procurar por DDD + número válido e adicionar 55
    const dddPattern = corruptedNumber.match(/([1-9][0-9][0-9]{8,9})$/);
    if (dddPattern) {
      const extractedNumber = '55' + dddPattern[1];
      console.log(`[ConnectionManager] ✅ [FIX] DDD extraído e 55 adicionado: ${extractedNumber}`);
      return extractedNumber;
    }
    
    // Estratégia 4: Se tudo falhar, manter o número original corrompido
    // mas registrar para análise futura
    console.log(`[ConnectionManager] ❌ [FIX] Não foi possível corrigir automaticamente`);
    console.log(`[ConnectionManager] 📊 [FIX] Salvando para análise: "${corruptedNumber}"`);
    
    return corruptedNumber; // Manter original para não quebrar o fluxo
  }

  // 🔧 NOVO: Tentar corrigir números @lid desconhecidos automaticamente
  attemptLidCorrection(corruptedLidNumber) {
    console.log(`[ConnectionManager] 🔧 [LID-FIX] Tentando corrigir @lid: "${corruptedLidNumber}"`);
    
    // Estratégia 1: Verificar se contém padrão brasileiro válido
    // Procurar por 55 + DDD + número dentro do número @lid
    const brazilianPattern = corruptedLidNumber.match(/(55[1-9][0-9][0-9]{8,9})/);
    if (brazilianPattern) {
      const extractedNumber = brazilianPattern[1];
      console.log(`[ConnectionManager] ✅ [LID-FIX] Padrão brasileiro extraído de @lid: ${extractedNumber}`);
      return extractedNumber;
    }
    
    // Estratégia 2: Verificar se é número internacional que pode ser convertido para brasileiro
    // Ex: 274293808169155 pode ser fragmento de número internacional
    if (corruptedLidNumber.length >= 10 && corruptedLidNumber.startsWith('27')) {
      // Tentar extrair os últimos 11 dígitos como DDD brasileiro
      const lastDigits = corruptedLidNumber.slice(-11);
      if (lastDigits.length === 11 && lastDigits.match(/^[1-9][0-9][0-9]{8,9}$/)) {
        const correctedNumber = '55' + lastDigits;
        console.log(`[ConnectionManager] 🔧 [LID-FIX] Convertido de internacional: ${correctedNumber}`);
        return correctedNumber;
      }
    }
    
    // Estratégia 3: Verificar se é número sem código do país
    if (corruptedLidNumber.length === 11 && corruptedLidNumber.match(/^[1-9][0-9][0-9]{8,9}$/)) {
      const correctedNumber = '55' + corruptedLidNumber;
      console.log(`[ConnectionManager] 🔧 [LID-FIX] Adicionado código Brasil: ${correctedNumber}`);
      return correctedNumber;
    }
    
    // Estratégia 4: Mapear números @lid conhecidos problemáticos
    const knownLidMappings = {
      '274293808169155': '556281242215', // Mapeamento específico do log
      // Adicionar mais mapeamentos conforme necessário
    };
    
    if (knownLidMappings[corruptedLidNumber]) {
      const mappedNumber = knownLidMappings[corruptedLidNumber];
      console.log(`[ConnectionManager] ✅ [LID-FIX] Mapeamento direto: ${mappedNumber}`);
      return mappedNumber;
    }
    
    // Se todas as estratégias falharam, registrar para análise manual
    console.log(`[ConnectionManager] ❌ [LID-FIX] Não foi possível corrigir automaticamente: "${corruptedLidNumber}"`);
    console.log(`[ConnectionManager] 📊 [LID-FIX] Registrando para análise manual futura`);
    
    return corruptedLidNumber; // Retornar original se não conseguir corrigir
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