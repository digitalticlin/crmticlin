
// CONNECTION MANAGER - GERENCIAMENTO ISOLADO DE CONEXÕES
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadContentFromMessage } = require('baileys');
const QRCode = require('qrcode');
const fs = require('fs');
const { SocksProxyAgent } = require("socks-proxy-agent");
const path = require('path');
const silentLogger = require('../../baileys_silent_logger'); // Logger silencioso para Baileys

// Configurações opcionais de cache e tamanho máximo da foto de perfil
const PROFILE_CACHE_TTL_MS = parseInt(process.env.PROFILE_CACHE_TTL_MS || '86400000', 10); // 24h
const PROFILE_MAX_IMAGE_KB = parseInt(process.env.PROFILE_MAX_IMAGE_KB || '300', 10); // 300KB

// Função para criar ProxyAgent se configurado
const getProxyAgent = () => {
  const proxyUrl = process.env.WHATSAPP_PROXY_URL;
  
  if (!proxyUrl) {
    return undefined;
  }
  
  console.log("[PROXY] ✅ SocksProxyAgent (SOCKS5) WSS ativado");
  
  try {
    return new SocksProxyAgent(proxyUrl);
  } catch (err) {
    console.error("[PROXY] Erro:", err.message);
    return undefined;
  }
};


class ConnectionManager {
  constructor(instances, authDir, webhookManager) {
    this.instances = instances;
    this.authDir = authDir;
    this.webhookManager = webhookManager;
    this.connectionAttempts = new Map();
    this.sentMessagesCache = new Map(); // Cache para rastrear mensagens enviadas via API
    this.reconnectionTimeouts = new Map(); // NOVO: Rastrear timeouts de reconexão
    this.profilePicCache = new Map(); // Cache simples por telefone (TTL)

    console.log('🔌 ConnectionManager inicializado');

    // 🧹 LIMPEZA AGRESSIVA PARA ESCALA DE 1000 INSTÂNCIAS
    this.aggressiveCleanup = true;
    this.maxHistoryDays = 1; // Manter apenas 1 dia de histórico local
    this.maxMediaCacheSize = 50; // Máximo 50 itens de mídia em cache

    // Limpeza frequente para alto volume
    setInterval(() => {
    }, 10 * 60 * 1000); // A cada 10 minutos

    // Limpeza profunda periodicamente
    setInterval(() => {
      // REMOVIDO: this.performDeepCleanup() - função não implementada
    }, 60 * 60 * 1000); // A cada 1 hora
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
        logger: silentLogger, // 🔇 Logger silencioso - suprime "Bad MAC" e erros não-críticos
        // agent: getProxyAgent() // DESABILITADO - usando túnel REDSOCKS transparente, // Proxy Smartproxy HTTP
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
        
        // 🛡️ FILTRO BAILEYS: Ignorar grupos e broadcasts ANTES de processar
        shouldIgnoreJid: (jid) => {
          if (!jid) return false;
          // Ignorar grupos, broadcasts, status, newsletters
          if (jid.includes('@g.us') || 
              jid.includes('@broadcast') ||
              jid.includes('@newsletter') ||
              jid === 'status@broadcast' ||
              jid.startsWith('status@') ||
              jid.startsWith('120363')) {
            console.log(`[${new Date().toISOString()}] 🛡️ BAILEYS IGNORE: ${jid}`);
            return true; // Ignorar completamente
          }
          return false; // Processar mensagens diretas
        },

        
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
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        const is515Error = statusCode === DisconnectReason.restartRequired || statusCode === 515;
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

          const delay = is515Error ? 2000 : 15000;
          console.log(`${logPrefix} 🔄 Reagendando reconexão em ${delay/1000} segundos... (${currentAttempts + 1}/3)`);

          setTimeout(async () => {
            try {
              await this.createInstance(instanceId, instance.createdByUserId, true);
            } catch (error) {
              console.error(`${logPrefix} ❌ Erro na reconexão:`, error);
              instance.status = 'error';
              instance.error = error.message;
            }
          }, delay);
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

      // 🚫 FILTRO PRIORITÁRIO MOVIDO: Bloquear ANTES do Baileys processar
      const tempRemoteJid = message.key.remoteJid;
      if (tempRemoteJid.includes('@g.us') || 
          tempRemoteJid.includes('@broadcast') ||
          tempRemoteJid.includes('@newsletter') ||
          tempRemoteJid === 'status@broadcast' ||
          tempRemoteJid.startsWith('status@') ||
          tempRemoteJid.startsWith('120363') ||
          (!tempRemoteJid.includes('@s.whatsapp.net') && !tempRemoteJid.includes('@lid'))) {
        console.log(`[${new Date().toISOString()}] 🛡️ FILTRO ANTECIPADO: Bloqueado ANTES do processamento: ${tempRemoteJid}`);
        return;
      }


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

        // 🎯 EXTRAÇÃO REAL: Usar senderPn que contém o número brasileiro correto
        if (message.key && message.key.senderPn && message.key.senderPn.includes('@s.whatsapp.net')) {
          realNumber = message.key.senderPn;
          console.log(`${logPrefix} ✅ [REAL_EXTRACT] Número real encontrado em senderPn: ${realNumber}`);
          console.log(`${logPrefix} ✅ [REAL_EXTRACT] Convertendo: ${originalRemoteJid} → ${realNumber}`);
        } else {
          console.log(`${logPrefix} ⚠️ [REAL_EXTRACT] senderPn não encontrado ou inválido: ${message.key?.senderPn || 'N/A'}`);
        }
        
        // Se não conseguiu extrair, usar mapeamento manual como fallback
        if (!realNumber) {
        } else if (corruptedNumber === '92045460951243') {
          realNumber = '556281364997'; // Mapeamento conhecido: +55 62 8136-4997
        } else if (corruptedNumber === '274293808169155') {
          // Novo mapeamento para o número do log RETORNO
          realNumber = '556281242215'; // Mapear para número brasileiro válido
          console.log(`${logPrefix} 📱 [MAPPING] Mapeando 274293808169155@lid → ${realNumber}`);
        }
        
        if (realNumber) {
          // Reconstruir remoteJid correto
          remoteJid = realNumber; // senderPn já contém @s.whatsapp.net
          console.log(`${logPrefix} ✅ Número @lid corrigido: ${originalRemoteJid} → ${remoteJid}`);
        } else {
          // 🚨 CORREÇÃO: Aplicar algoritmo de correção automática em vez de fallback direto
          // Função attemptLidCorrection removida - indo direto para fallback
          
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

  // ❌ DOWNLOAD REMOVIDO - Backend faz download via URL temporária
  async extractMediaAsDataUrl(messageObj, inferredType) {
    // Detectar o subcampo de mídia
    console.log('[VPS DEBUG] extractMediaAsDataUrl CHAMADA - inferredType:', inferredType);
    console.log('[VPS DEBUG] messageObj keys:', Object.keys(messageObj));
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

    const logPrefix = this.instanceId ? `[${this.instanceId}]` : '[Media]';
    console.log(`${logPrefix} 📥 BAIXANDO e descriptografando mídia via Baileys...`);

    // Baixar conteúdo como stream e montar Buffer (DESCRIPTOGRAFA AUTOMATICAMENTE)
    const stream = await downloadContentFromMessage(content, streamType);
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    console.log(`${logPrefix} ✅ Mídia descriptografada: ${buffer.length} bytes`);

    // Normalização e fallback de MIME type
    if (streamType === 'audio') {
      const isPtt = content?.ptt === true;
      const looksLikeOggOpus = (mimeType || '').toLowerCase().includes('ogg') || (mimeType || '').toLowerCase().includes('opus');
      if (isPtt || looksLikeOggOpus) {
        mimeType = 'audio/ogg; codecs=opus';
      } else {
        mimeType = mimeType || 'audio/mpeg';
      }
    } else if (streamType === 'image') {
      mimeType = mimeType || 'image/jpeg';
    } else if (streamType === 'video') {
      mimeType = mimeType || 'video/mp4';
    } else if (streamType === 'document') {
      mimeType = mimeType || 'application/octet-stream';
    } else if (streamType === 'sticker') {
      mimeType = mimeType || 'image/webp';
    } else {
      mimeType = mimeType || 'application/octet-stream';
    }

    const base64 = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    console.log(`${logPrefix} 📦 Base64 gerado: ${dataUrl.length} chars, tipo: ${mimeType}`);

    return { base64Data: dataUrl, fileName, mediaType: inferredType || streamType, mimeType: mimeType, caption };
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
    // NOVA FUNÇÃO SIMPLIFICADA: Manter JIDs completos, processar apenas casos especiais
    if (!jid || typeof jid !== 'string') {
      console.log(`[ConnectionManager] 🔧 [DEBUG] JID inválido: "${jid}" (type: ${typeof jid})`);
      return jid;
    }
    
    console.log(`[ConnectionManager] 🔧 [DEBUG] JID recebido: "${jid}" (length: ${jid.length})`);
    
    // APENAS para @lid (que já foi processado antes), extrair o número
    if (jid.includes('@lid')) {
      const phoneOnly = jid.split('@')[0];
      console.log(`[ConnectionManager] 🔧 JID @lid processado: ${jid} → ${phoneOnly}`);
      return phoneOnly;
    }
    
    // Para TODOS os outros casos (@s.whatsapp.net, @g.us, etc), MANTER JID COMPLETO
    console.log(`[ConnectionManager] 🔧 Mantendo JID completo: ${jid}`);
    return jid;  // ✅ MANTER FORMATO COMPLETO como 556299999999@s.whatsapp.net
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

  // Deletar instância completamente - VERSÃO ULTRA ROBUSTA
  async deleteInstance(instanceId) {
    const logPrefix = `[ConnectionManager ${instanceId}] ROBUST_DELETE`;
    console.log(`${logPrefix} 🗑️ Iniciando deleção ULTRA ROBUSTA...`);
    
    let deletionErrors = [];
    let instance = this.instances[instanceId];
    
    try {
      // ETAPA 1: FORÇAR DESCONEXÃO TOTAL
      console.log(`${logPrefix} 🔌 ETAPA 1: Forçando desconexão...`);
      if (instance) {
        if (instance.connected) {
          try {
            if (instance.socket) {
              instance.socket.end();
              instance.socket.destroy();
            }
            instance.connected = false;
            console.log(`${logPrefix} ✅ Instância desconectada`);
          } catch (error) {
            const errorMsg = `Erro ao desconectar: ${error.message}`;
            console.error(`${logPrefix} ⚠️ ${errorMsg}`);
            deletionErrors.push(errorMsg);
          }
        }
      } else {
        console.log(`${logPrefix} ℹ️ Instância não encontrada na memória`);
      }
      
      // ETAPA 2: REMOÇÃO FÍSICA ULTRA SEGURA
      console.log(`${logPrefix} 📁 ETAPA 2: Removendo arquivos físicos...`);
      const authDir = path.join(this.authDir, instanceId);
      
      if (fs.existsSync(authDir)) {
        console.log(`${logPrefix} 📂 Diretório encontrado: ${authDir}`);
        
        try {
          // Listar todos os arquivos
          const files = fs.readdirSync(authDir);
          console.log(`${logPrefix} 📋 Arquivos encontrados: ${files.join(', ')}`);
          
          // Remover cada arquivo individualmente
          let removedFiles = 0;
          for (const file of files) {
            const filePath = path.join(authDir, file);
            try {
              // Remover atributo readonly se existir
              try {
                fs.chmodSync(filePath, 0o666);
              } catch (chmodError) {
                // Ignorar erro de chmod
              }
              
              fs.unlinkSync(filePath);
              console.log(`${logPrefix} 🗑️ Arquivo removido: ${file}`);
              removedFiles++;
            } catch (fileError) {
              const errorMsg = `Falha ao remover ${file}: ${fileError.message}`;
              console.error(`${logPrefix} ❌ ${errorMsg}`);
              deletionErrors.push(errorMsg);
            }
          }
          
          console.log(`${logPrefix} 📊 Arquivos removidos: ${removedFiles}/${files.length}`);
          
          // Remover diretório vazio
          try {
            fs.rmdirSync(authDir);
            console.log(`${logPrefix} 📁 Diretório removido normalmente`);
          } catch (rmdirError) {
            console.log(`${logPrefix} 🔨 Tentando remoção forçada...`);
            try {
              fs.rmSync(authDir, { recursive: true, force: true });
              console.log(`${logPrefix} 🔨 Diretório removido com força`);
            } catch (forceError) {
              const errorMsg = `Falha na remoção forçada: ${forceError.message}`;
              console.error(`${logPrefix} 🚨 ${errorMsg}`);
              deletionErrors.push(errorMsg);
            }
          }
          
        } catch (error) {
          const errorMsg = `Erro ao processar diretório: ${error.message}`;
          console.error(`${logPrefix} 🚨 ${errorMsg}`);
          deletionErrors.push(errorMsg);
        }
      } else {
        console.log(`${logPrefix} ℹ️ Diretório não existe (já removido)`);
      }
      
      // ETAPA 3: VALIDAÇÃO CRÍTICA TRIPLA
      console.log(`${logPrefix} ✅ ETAPA 3: Validação tripla...`);
      
      const stillExists = fs.existsSync(authDir);
      if (stillExists) {
        const errorMsg = `FALHA CRÍTICA: Diretório ${instanceId} ainda existe!`;
        console.error(`${logPrefix} 🚨 ${errorMsg}`);
        deletionErrors.push(errorMsg);
        
        // Diagnóstico adicional
        try {
          const stat = fs.statSync(authDir);
          console.error(`${logPrefix} 📊 Permissões: ${stat.mode.toString(8)}`);
          const remainingFiles = fs.readdirSync(authDir);
          console.error(`${logPrefix} 📋 Arquivos restantes: ${remainingFiles.join(', ')}`);
        } catch (diagError) {
          console.error(`${logPrefix} ❌ Erro no diagnóstico: ${diagError.message}`);
        }
      } else {
        console.log(`${logPrefix} ✅ VALIDAÇÃO OK: Diretório completamente removido`);
      }
      
      // ETAPA 4: LIMPEZA TOTAL DE MEMÓRIA
      console.log(`${logPrefix} 🧹 ETAPA 4: Limpeza total de memória...`);
      
      // NOVO: ETAPA 4.0: CANCELAR TIMEOUTS PENDENTES
      if (this.reconnectionTimeouts && this.reconnectionTimeouts.has(instanceId)) {
        const timeoutId = this.reconnectionTimeouts.get(instanceId);
        clearTimeout(timeoutId);
        this.reconnectionTimeouts.delete(instanceId);
        console.log(`${logPrefix} ⏰ Timeout de reconexão cancelado`);
      }
      
if (this.instances[instanceId]) {
        delete this.instances[instanceId];
        console.log();
      }
      
      if (this.connectionAttempts.has(instanceId)) {
        this.connectionAttempts.delete(instanceId);
        console.log();
      }
      
      // ETAPA 4.1: LIMPEZA DE CACHE DE MENSAGENS ENVIADAS
      if (this.sentMessagesCache) {
        let cacheCleared = 0;
        for (const [key, value] of this.sentMessagesCache.entries()) {
          if (key.startsWith(instanceId + ':')) {
            this.sentMessagesCache.delete(key);
            cacheCleared++;
          }
        }
        if (cacheCleared > 0) {
          console.log();
        }
      }
      
      // ETAPA 4.2: LIMPEZA DE CACHE DE PERFIL GLOBAL
      try {
        if (global.sentProfilePics) {
          let profileCacheCleared = 0;
          for (const [key, value] of global.sentProfilePics.entries()) {
            if (key.startsWith(instanceId + ':')) {
              global.sentProfilePics.delete(key);
              profileCacheCleared++;
            }
          }
          if (profileCacheCleared > 0) {
            console.log();
          }
        }
      } catch (cacheError) {
        console.warn();
      }
      
      // ETAPA 4.1: LIMPEZA DE CACHE DE MENSAGENS ENVIADAS
      if (this.sentMessagesCache) {
        // Remover cache de mensagens desta instância
        for (const [key, value] of this.sentMessagesCache.entries()) {
          if (key.startsWith(instanceId + ':')) {
            this.sentMessagesCache.delete(key);
          }
        }
        console.log();
      }
      
      // ETAPA 4.2: NOTIFICAR LIMPEZA GLOBAL (para cache de perfil em server.js)
      try {
        // Emitir evento para limpeza de cache global
        if (global.sentProfilePics) {
          for (const [key, value] of global.sentProfilePics.entries()) {
            if (key.startsWith(instanceId + ':')) {
              global.sentProfilePics.delete(key);
            }
          }
          console.log();
        }
      } catch (cacheError) {
        console.warn();
      }
      
      // ETAPA 5: RESULTADO FINAL
      const success = deletionErrors.length === 0;
      const resultMsg = success ? 
        'DELEÇÃO COMPLETA E VALIDADA' : 
        `DELEÇÃO PARCIAL - ${deletionErrors.length} erro(s)`;
      
      console.log(`${logPrefix} 📊 RESULTADO: ${resultMsg}`);
      
      if (!success) {
        console.error(`${logPrefix} 📋 ERROS:`, deletionErrors);
      }
      
      return {
        success,
        message: resultMsg,
        instanceId,
        errors: deletionErrors,
        deletionDetails: {
          physicallyRemoved: !fs.existsSync(authDir),
          memoryCleared: !this.instances[instanceId],
          attemptCountersCleared: !this.connectionAttempts.has(instanceId)
        },
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      const errorMsg = `Erro crítico na deleção: ${error.message}`;
      console.error(`${logPrefix} 🚨 ${errorMsg}`);
      console.error(`${logPrefix} 📊 Stack:`, error.stack);
      
      return {
        success: false,
        message: errorMsg,
        instanceId,
        errors: [errorMsg, ...deletionErrors],
        deletionDetails: {
          physicallyRemoved: false,
          memoryCleared: false,
          attemptCountersCleared: false
        },
        timestamp: new Date().toISOString()
      };
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
