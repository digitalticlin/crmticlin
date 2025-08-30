// WEBHOOK MANAGER - GERENCIAMENTO ISOLADO DE WEBHOOKS
"use strict";
const axios = require('axios');

class WebhookManager {
  constructor(webhookUrls, serviceKey) {
    this.webhookUrls = webhookUrls || {};
    this.serviceKey = serviceKey || '';
    this.requestCount = 0;
    this.errorCount = 0;
    console.log('WebhookManager inicializado');
  }

  async sendWebhook(type, data, logType = 'general') {
    this.requestCount += 1;

    const url = this.webhookUrls[type];
    if (!url) {
      console.error('[Webhook ' + logType + '] URL não encontrada para tipo: ' + type);
      return false;
    }

    try {
      console.log('[Webhook ' + logType + '] Enviando para: ' + url);
      // console.log('[Webhook ' + logType + '] Dados:', JSON.stringify(data, null, 2));

      const response = await axios.post(url, data, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.serviceKey,
          'apikey': this.serviceKey,
          'User-Agent': 'WhatsApp-VPS-Server/6.0.0'
        }
      });

      console.log('[Webhook ' + logType + '] Sucesso: ' + response.status);
      return true;

    } catch (error) {
      this.errorCount += 1;

      if (error && error.response) {
        console.error('[Webhook ' + logType + '] HTTP ' + error.response.status + ':', error.response.data);
      } else if (error && error.request) {
        console.error('[Webhook ' + logType + '] Sem resposta:', error.message);
      } else {
        console.error('[Webhook ' + logType + '] Erro:', error && error.message);
      }
      return false;
    }
  }

  async notifyQRCode(instanceId, qrCode) {
    const data = {
      event: 'qr_update',
      instanceId: instanceId,
      instanceName: instanceId,
      qrCode: qrCode,
      timestamp: new Date().toISOString()
    };
    return await this.sendWebhook('QR_RECEIVER', data, 'QR');
  }

  async notifyConnection(instanceId, phone, profileName, status = 'connected', extra = {}) {
    const data = {
      event: status === 'connected' ? 'connection_established' : 'connection_lost',
      instanceId: instanceId,
      instanceName: instanceId,
      status: status,
      phone: phone,
      profileName: profileName,
      timestamp: new Date().toISOString()
    };
    // Mesclar campos extras de forma segura (ex.: instanceProfilePicBase64)
    try {
      if (extra && typeof extra === 'object') {
        for (const k of Object.keys(extra)) {
          if (extra[k] !== undefined && extra[k] !== null) {
            data[k] = extra[k];
          }
        }
      }
    } catch (e) { /* ignore */ }
    console.log('[Webhook Connection] Enviando status: ' + status + ' para auto_whatsapp_sync');
    return await this.sendWebhook('CONNECTION_SYNC', data, 'Connection');
  }

  async notifyMessage(instanceId, messageData, createdByUserId = null) {
    const data = {
      event: 'message_received',
      instanceId: instanceId,
      instanceName: instanceId,
      from: messageData.from,
      fromMe: messageData.fromMe || false,
      messageType: messageData.messageType || 'text',
      message: { text: messageData.body },
      timestamp: messageData.timestamp
        ? new Date(messageData.timestamp * 1000).toISOString()
        : new Date().toISOString(),
      createdByUserId: createdByUserId,
      data: messageData
    };

    const backendPromise = this.sendWebhook('BACKEND_MESSAGES', data, 'Backend');
    const n8nPromise = this.sendWebhook('N8N_MESSAGES', data, 'N8N');
    const results = await Promise.all([backendPromise, n8nPromise]);
    const backendResult = results[0];
    const n8nResult = results[1];

    console.log('[Webhook Message] Backend: ' + (backendResult ? 'OK' : 'FAIL') +
      ' | N8N: ' + (n8nResult ? 'OK' : 'FAIL') +
      ' | Type: ' + (messageData.messageType || 'text') +
      ' | FromMe: ' + (messageData.fromMe || false));

    return backendResult || n8nResult;
  }

  async notifyLeadProfileUpdated(instanceId, phone, profileName = null, profilePicBase64 = null) {
    const data = {
      event: 'lead_profile_updated',
      instanceId: instanceId,
      instanceName: instanceId,
      phone: phone,
      senderProfileName: profileName,
      senderProfilePicBase64: profilePicBase64,
      timestamp: new Date().toISOString()
    };
    return await this.sendWebhook('CONNECTION_SYNC', data, 'LeadUpdate');
  }

  getStats() {
    return {
      totalRequests: this.requestCount,
      totalErrors: this.errorCount,
      successRate: this.requestCount > 0
        ? (((this.requestCount - this.errorCount) / this.requestCount) * 100).toFixed(2) + '%'
        : '0%',
      configuredWebhooks: Object.keys(this.webhookUrls || {}).length,
      authenticated: !!this.serviceKey,
      timestamp: new Date().toISOString()
    };
  }

  // 📱 Notificar mensagens marcadas como lidas (sincronização com móvel)
  async notifyReadMessages(instanceId, chatJid, messageCount, userId = null) {
    try {
      const data = {
        event_type: 'read_messages',
        instance_id: instanceId,
        chat_jid: chatJid,
        phone: chatJid.replace('@s.whatsapp.net', ''),
        messages_marked: messageCount,
        user_id: userId,
        synced_with_mobile: true,
        timestamp: new Date().toISOString()
      };

      console.log(`📱 [Webhook] Notificando read messages: ${messageCount} mensagens de ${data.phone}`);
      return await this.sendWebhook('BACKEND_MESSAGES', data, 'read-messages');
    } catch (error) {
      console.error('❌ [Webhook] Erro ao notificar read messages:', error);
      return false;
    }
  }
}

module.exports = WebhookManager;