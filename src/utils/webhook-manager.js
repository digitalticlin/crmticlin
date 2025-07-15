
// WEBHOOK MANAGER - GERENCIAMENTO ISOLADO DE WEBHOOKS
const axios = require('axios');

class WebhookManager {
  constructor(webhookUrls, serviceKey) {
    this.webhookUrls = webhookUrls;
    this.serviceKey = serviceKey;
    this.requestCount = 0;
    this.errorCount = 0;
    
    console.log('🔗 WebhookManager inicializado com autenticação');
  }

  // Enviar webhook com autenticação correta
  async sendWebhook(type, data, logType = 'general') {
    this.requestCount++;
    
    const url = this.webhookUrls[type];
    if (!url) {
      console.error(`[Webhook ${logType}] ❌ URL não encontrada para tipo: ${type}`);
      return false;
    }

    try {
      console.log(`[Webhook ${logType}] 📡 Enviando para: ${url}`);
      console.log(`[Webhook ${logType}] 📋 Dados:`, JSON.stringify(data, null, 2));
      
      const response = await axios.post(url, data, {
        timeout: 15000,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.serviceKey}`,
          'User-Agent': 'WhatsApp-VPS-Server/6.0.0'
        }
      });

      console.log(`[Webhook ${logType}] ✅ Sucesso: ${response.status}`, response.data);
      return true;
      
    } catch (error) {
      this.errorCount++;
      
      if (error.response) {
        console.error(`[Webhook ${logType}] ❌ HTTP ${error.response.status}:`, error.response.data);
      } else if (error.request) {
        console.error(`[Webhook ${logType}] ❌ Sem resposta:`, error.message);
      } else {
        console.error(`[Webhook ${logType}] ❌ Erro:`, error.message);
      }
      
      return false;
    }
  }

  // Webhook específicos com throttling
  async notifyQRCode(instanceId, qrCode) {
    const data = {
      event: 'qr_update',
      instanceId,
      instanceName: instanceId,
      qrCode,
      timestamp: new Date().toISOString()
    };
    
    return await this.sendWebhook('QR_RECEIVER', data, 'QR');
  }

  async notifyConnection(instanceId, phone, profileName, status = 'connected') {
    const data = {
      instanceId,
      status: status === 'connected' ? 'connected' : 'disconnected',
      event: status === 'connected' ? 'ready' : 'close',
      phone,
      profile_name: profileName,
      timestamp: new Date().toISOString()
    };
    
    console.log(`[Webhook Connection] 📡 Enviando status: ${status} para auto_whatsapp_sync`);
    return await this.sendWebhook('CONNECTION_SYNC', data, 'Connection');
  }

  async notifyMessage(instanceId, messageData, createdByUserId = null) {
    const data = {
      event: 'message_received',
      instanceId,
      instanceName: instanceId,
      from: messageData.from,
      fromMe: messageData.fromMe || false,
      messageType: messageData.messageType || 'text',
      message: {
        text: messageData.body
      },
      timestamp: messageData.timestamp ? new Date(messageData.timestamp * 1000).toISOString() : new Date().toISOString(),
      createdByUserId,
      data: messageData
    };
    
    // Enviar para ambos os webhooks simultaneamente
    const backendPromise = this.sendWebhook('BACKEND_MESSAGES', data, 'Backend');
    const n8nPromise = this.sendWebhook('N8N_MESSAGES', data, 'N8N');
    
    const [backendResult, n8nResult] = await Promise.all([backendPromise, n8nPromise]);
    
    console.log(`[Webhook Message] 📤 Backend: ${backendResult ? '✅' : '❌'} | N8N: ${n8nResult ? '✅' : '❌'} | Type: ${messageData.messageType} | FromMe: ${messageData.fromMe}`);
    
    return backendResult || n8nResult; // Retorna true se pelo menos um webhook funcionou
  }

  // Obter estatísticas dos webhooks
  getStats() {
    return {
      totalRequests: this.requestCount,
      totalErrors: this.errorCount,
      successRate: this.requestCount > 0 ? ((this.requestCount - this.errorCount) / this.requestCount * 100).toFixed(2) + '%' : '0%',
      configuredWebhooks: Object.keys(this.webhookUrls).length,
      authenticated: !!this.serviceKey,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = WebhookManager;
