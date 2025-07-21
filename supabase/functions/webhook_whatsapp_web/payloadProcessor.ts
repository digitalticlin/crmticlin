
import { WhatsAppWebhookPayload, ProcessedMessage, ValidationResult } from './types.ts';

export class PayloadProcessor {
  private static messageCache = new Map<string, boolean>();

  // Validação avançada do payload
  static validatePayload(payload: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Validações obrigatórias
    if (!payload.event) {
      result.errors.push('Campo event é obrigatório');
      result.isValid = false;
    }

    if (!payload.from) {
      result.errors.push('Campo from é obrigatório');
      result.isValid = false;
    }

    const instanceId = payload.instanceId || payload.instanceName || payload.instance;
    if (!instanceId) {
      result.errors.push('instanceId não encontrado');
      result.isValid = false;
    }

    // Validações de warning
    if (payload.fromMe === undefined) {
      result.warnings.push('Campo fromMe não definido, assumindo false');
    }

    if (!payload.messageType) {
      result.warnings.push('messageType não definido, assumindo text');
    }

    return result;
  }

  // Validação otimizada de telefone WhatsApp (internacional)
  static validateWhatsAppPhone(phone: string): { cleanPhone: string; isValid: boolean; type: string; reason?: string } {
    if (!phone) return { cleanPhone: '', isValid: false, type: 'invalid', reason: 'Telefone vazio' };

    const originalPhone = phone;
    let cleanPhone = phone;
    
    console.log(`[PayloadProcessor] 📱 Analisando telefone: ${originalPhone}`);

    // Detectar e processar sufixos WhatsApp
    let suffix = '';
    let messageType = 'unknown';
    
    if (cleanPhone.includes('@s.whatsapp.net')) {
      suffix = '@s.whatsapp.net';
      messageType = 'direct_message';
      cleanPhone = cleanPhone.replace('@s.whatsapp.net', '');
    } else if (cleanPhone.includes('@c.us')) {
      suffix = '@c.us';
      messageType = 'contact_direct';
      cleanPhone = cleanPhone.replace('@c.us', '');
    } else if (cleanPhone.includes('@g.us')) {
      suffix = '@g.us';
      messageType = 'group';
      cleanPhone = cleanPhone.replace('@g.us', '');
    } else if (cleanPhone.includes('@broadcast')) {
      suffix = '@broadcast';
      messageType = 'broadcast';
      cleanPhone = cleanPhone.replace('@broadcast', '');
    } else if (cleanPhone.includes('@newsletter')) {
      suffix = '@newsletter';
      messageType = 'newsletter';
      cleanPhone = cleanPhone.replace('@newsletter', '');
    }

    console.log(`[PayloadProcessor] 🔍 Sufixo detectado: ${suffix} | Tipo: ${messageType}`);

    // Remover todos os caracteres não numéricos (manter apenas dígitos)
    cleanPhone = cleanPhone.replace(/[^0-9]/g, '');
    
    console.log(`[PayloadProcessor] 🧹 Telefone limpo: ${cleanPhone} (${cleanPhone.length} dígitos)`);

    // Validar por tipo de mensagem (baseado no sufixo)
    switch (messageType) {
      case 'direct_message':
      case 'contact_direct':
        // Mensagens diretas são sempre válidas
        console.log(`[PayloadProcessor] ✅ Mensagem direta aceita: ${cleanPhone}`);
        return { 
          cleanPhone, 
          isValid: true, 
          type: messageType,
          reason: `Mensagem direta válida (${suffix})`
        };
      
      case 'group':
        console.log(`[PayloadProcessor] ❌ Mensagem de grupo rejeitada: ${cleanPhone}`);
        return { 
          cleanPhone, 
          isValid: false, 
          type: 'group',
          reason: 'Mensagem de grupo rejeitada (@g.us)'
        };
      
      case 'broadcast':
        console.log(`[PayloadProcessor] ❌ Mensagem de broadcast rejeitada: ${cleanPhone}`);
        return { 
          cleanPhone, 
          isValid: false, 
          type: 'broadcast',
          reason: 'Mensagem de broadcast rejeitada (@broadcast)'
        };
      
      case 'newsletter':
        console.log(`[PayloadProcessor] ❌ Mensagem de newsletter rejeitada: ${cleanPhone}`);
        return { 
          cleanPhone, 
          isValid: false, 
          type: 'newsletter',
          reason: 'Mensagem de newsletter rejeitada (@newsletter)'
        };
      
      default:
        // Sem sufixo WhatsApp - assumir válido se tem dígitos razoáveis
        if (cleanPhone.length >= 8 && cleanPhone.length <= 15) {
          console.log(`[PayloadProcessor] ⚠️ Telefone sem sufixo WhatsApp, mas aceito: ${cleanPhone}`);
          return { 
            cleanPhone, 
            isValid: true, 
            type: 'no_suffix',
            reason: 'Telefone sem sufixo WhatsApp, mas com formato válido'
          };
        } else {
          console.log(`[PayloadProcessor] ❌ Telefone inválido (formato): ${cleanPhone}`);
          return { 
            cleanPhone, 
            isValid: false, 
            type: 'invalid_format',
            reason: `Formato inválido: ${cleanPhone.length} dígitos`
          };
        }
    }
  }

  // Extrair texto da mensagem com suporte aprimorado a mídia
  static extractMessageText(payload: WhatsAppWebhookPayload): string {
    // Prioridade: message.text > data.body > message.caption > texto padrão baseado no tipo
    if (payload.message?.text) {
      return payload.message.text;
    }
    
    if (payload.data?.body) {
      return payload.data.body;
    }
    
    if (payload.message?.caption) {
      return payload.message.caption;
    }

    // Para tipos de mídia sem texto - texto descritivo aprimorado
    const mediaTypes = {
      'image': '📷 Imagem',
      'video': '🎥 Vídeo', 
      'audio': '🎵 Áudio',
      'document': '📄 Documento',
      'sticker': '🎭 Sticker',
      'location': '📍 Localização',
      'contact': '👤 Contato',
      'voice': '🎙️ Áudio de voz',
      'ptt': '🎙️ Push-to-talk'
    };

    const messageType = payload.messageType as keyof typeof mediaTypes;
    return mediaTypes[messageType] || 'Mensagem sem texto';
  }

  // Extrair informações de mídia aprimoradas
  static extractMediaInfo(payload: WhatsAppWebhookPayload): { mediaUrl?: string; mediaType?: string; mediaSize?: number; fileName?: string } {
    console.log(`[PayloadProcessor] 📎 Extraindo info de mídia para tipo: ${payload.messageType}`);
    
    if (!payload.data?.media) {
      console.log(`[PayloadProcessor] ⚠️ Nenhuma mídia encontrada no payload`);
      return {};
    }

    const mediaInfo = {
      mediaUrl: payload.data.media.url,
      mediaType: payload.messageType,
      mediaSize: payload.data.media.size,
      fileName: payload.data.media.filename
    };

    console.log(`[PayloadProcessor] 📎 Mídia extraída:`, {
      type: mediaInfo.mediaType,
      hasUrl: !!mediaInfo.mediaUrl,
      size: mediaInfo.mediaSize,
      filename: mediaInfo.fileName
    });

    return mediaInfo;
  }

  // Extrair nome do contato
  static extractContactName(payload: WhatsAppWebhookPayload): string | undefined {
    if (payload.contact?.name) {
      return payload.contact.name;
    }
    
    if (payload.contact?.pushname) {
      return payload.contact.pushname;
    }

    return undefined;
  }

  // Verificar se mensagem já foi processada (cache)
  static isDuplicateMessage(messageId: string): boolean {
    if (!messageId) return false;

    if (this.messageCache.has(messageId)) {
      console.log(`[PayloadProcessor] 🔄 Mensagem duplicada detectada: ${messageId}`);
      return true;
    }

    // Adicionar ao cache (limitar tamanho)
    if (this.messageCache.size > 1000) {
      const firstKey = this.messageCache.keys().next().value;
      this.messageCache.delete(firstKey);
    }

    this.messageCache.set(messageId, true);
    return false;
  }

  // Processar payload completo
  static processPayload(payload: any): ProcessedMessage | null {
    console.log('[PayloadProcessor] 🚀 Iniciando processamento do payload');
    
    const validation = this.validatePayload(payload);
    
    if (!validation.isValid) {
      console.error('[PayloadProcessor] ❌ Payload inválido:', validation.errors);
      return null;
    }

    // Log warnings
    if (validation.warnings.length > 0) {
      console.warn('[PayloadProcessor] ⚠️ Warnings:', validation.warnings);
    }

    const instanceId = payload.instanceId || payload.instanceName || payload.instance;
    
    console.log('[PayloadProcessor] 📱 Validando telefone WhatsApp...');
    const phoneInfo = this.validateWhatsAppPhone(payload.from);
    
    if (!phoneInfo.isValid) {
      console.warn('[PayloadProcessor] ❌ Telefone rejeitado:', {
        original: payload.from,
        cleaned: phoneInfo.cleanPhone,
        type: phoneInfo.type,
        reason: phoneInfo.reason
      });
      return null;
    }

    console.log('[PayloadProcessor] ✅ Telefone aceito:', {
      original: payload.from,
      cleaned: phoneInfo.cleanPhone,
      type: phoneInfo.type,
      reason: phoneInfo.reason
    });

    const messageText = this.extractMessageText(payload);
    const mediaInfo = this.extractMediaInfo(payload);
    const contactName = this.extractContactName(payload);
    const externalMessageId = payload.data?.messageId || payload.messageId;

    // Verificar duplicação
    if (externalMessageId && this.isDuplicateMessage(externalMessageId)) {
      console.warn('[PayloadProcessor] ⚠️ Mensagem duplicada ignorada:', externalMessageId);
      return null;
    }

    const processedMessage = {
      instanceId,
      phone: phoneInfo.cleanPhone,
      messageText,
      fromMe: payload.fromMe || false,
      messageType: payload.messageType || 'text',
      mediaUrl: mediaInfo.mediaUrl,
      mediaType: mediaInfo.mediaType,
      externalMessageId,
      contactName
    };

    console.log('[PayloadProcessor] ✅ Mensagem processada com sucesso:', {
      instanceId,
      phone: phoneInfo.cleanPhone.substring(0, 4) + '****',
      messageType: processedMessage.messageType,
      fromMe: processedMessage.fromMe,
      hasMedia: !!processedMessage.mediaUrl,
      contactName: processedMessage.contactName
    });

    return processedMessage;
  }
}
