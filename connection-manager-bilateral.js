// CONNECTION MANAGER - VERSÃO BILATERAL COM SUPORTE COMPLETO A MÍDIA
// ✅ MANTÉM TODA ESTRUTURA ORIGINAL + ADICIONA CONVERSAS BILATERAIS
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

class ConnectionManager {
  constructor(instances, authDir, webhookManager) {
    this.instances = instances;
    this.authDir = authDir;
    this.webhookManager = webhookManager;
    this.connectionAttempts = new Map();
    
    console.log('🔌 ConnectionManager inicializado - VERSÃO BILATERAL');
  }

  // ✅ MANTÉM MÉTODO ORIGINAL - SEM ALTERAÇÕES
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

  // ✅ MÉTODO CORRIGIDO - CONVERSAS BILATERAIS + TODOS TIPOS DE MÍDIA
  setupEventListeners(socket, instanceId, saveCreds) {
    const logPrefix = `[ConnectionManager ${instanceId}]`;
    const instance = this.instances[instanceId];

    // Salvar credenciais automaticamente
    socket.ev.on('creds.update', saveCreds);

    // ✅ MANTÉM TODA LÓGICA DE CONEXÃO ORIGINAL
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

        if (shouldReconnect && currentAttempts < 3) {
          this.connectionAttempts.set(instanceId, currentAttempts + 1);
          instance.attempts = currentAttempts + 1;
          instance.status = 'reconnecting';
          
          console.log(`${logPrefix} 🔄 Reagendando reconexão em 15 segundos... (${currentAttempts + 1}/3)`);
          
          setTimeout(async () => {
            try {
              await this.createInstance(instanceId, instance.createdByUserId, true);
            } catch (error) {
              console.error(`${logPrefix} ❌ Erro na reconexão:`, error);
              instance.status = 'error';
              instance.error = error.message;
            }
          }, 15000);
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

        // Notificar conexão via webhook
        await this.webhookManager.notifyConnection(instanceId, phone, profileName);
      }
    });

    // ✅🔥 CORREÇÃO PRINCIPAL: MENSAGENS BILATERAIS + TODOS OS TIPOS DE MÍDIA
    socket.ev.on('messages.upsert', async (m) => {
      const message = m.messages[0];
      
      // ✅ REMOVIDO FILTRO: !message?.key?.fromMe 
      // ✅ AGORA PROCESSA INCOMING E OUTGOING
      if (message?.message) {
        const isOutgoing = message.key?.fromMe || false;
        const direction = isOutgoing ? 'ENVIADA PARA' : 'RECEBIDA DE';
        
        // ✅ EXTRAÇÃO COMPLETA DE DADOS DA MENSAGEM COM TODOS OS TIPOS
        let messageText = '';
        let mediaType = 'text';
        let mediaUrl = null;
        
        const msg = message.message;
        
        if (msg.conversation) {
          messageText = msg.conversation;
          mediaType = 'text';
        } else if (msg.extendedTextMessage?.text) {
          messageText = msg.extendedTextMessage.text;
          mediaType = 'text';
        } else if (msg.imageMessage) {
          messageText = msg.imageMessage.caption || '[Imagem]';
          mediaType = 'image';
          mediaUrl = msg.imageMessage.url || msg.imageMessage.directPath;
        } else if (msg.videoMessage) {
          messageText = msg.videoMessage.caption || '[Vídeo]';
          mediaType = 'video';
          mediaUrl = msg.videoMessage.url || msg.videoMessage.directPath;
        } else if (msg.audioMessage) {
          messageText = '[Áudio]';
          mediaType = 'audio';
          mediaUrl = msg.audioMessage.url || msg.audioMessage.directPath;
        } else if (msg.documentMessage) {
          messageText = msg.documentMessage.caption || msg.documentMessage.fileName || '[Documento]';
          mediaType = 'document';
          mediaUrl = msg.documentMessage.url || msg.documentMessage.directPath;
        } else {
          messageText = '[Mensagem de mídia]';
        }

        console.log(`${logPrefix} 📨 Mensagem ${direction} (${mediaType.toUpperCase()}): ${message.key.remoteJid} | ${messageText.substring(0, 50)}`);

        // ✅ DADOS COMPLETOS PARA WEBHOOK
        const messageData = {
          messageId: message.key.id,
          body: messageText,
          from: message.key.remoteJid,
          fromMe: isOutgoing,
          timestamp: message.messageTimestamp,
          mediaType: mediaType,
          mediaUrl: mediaUrl,
          direction: direction
        };

        // ✅ NOTIFICAR MENSAGEM VIA WEBHOOK (BILATERAL + MÍDIA COMPLETA)
        setTimeout(async () => {
          await this.webhookManager.notifyMessage(instanceId, messageData, instance.createdByUserId);
        }, 1000); // Delay de 1 segundo para evitar spam
      }
    });

    // ✅ MANTÉM TRATAMENTO DE ERROS ORIGINAL
    socket.ev.on('error', (error) => {
      console.error(`${logPrefix} ❌ Socket error:`, error);
      instance.error = error.message;
      instance.lastUpdate = new Date();
    });
  }

  // ✅ MANTÉM TODOS OS OUTROS MÉTODOS ORIGINAIS
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

  // ✅ MANTÉM MÉTODO ORIGINAL
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