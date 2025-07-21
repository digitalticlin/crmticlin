
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

  // Limpeza avançada do telefone brasileiro
  static cleanBrazilianPhone(phone: string): { cleanPhone: string; isValid: boolean; type: string } {
    if (!phone) return { cleanPhone: '', isValid: false, type: 'invalid' };

    let cleanPhone = phone;
    
    // Remover sufixos WhatsApp
    cleanPhone = cleanPhone
      .replace(/@c\.us$/, '')
      .replace(/@s\.whatsapp\.net$/, '')
      .replace(/@g\.us$/, '')
      .replace(/@newsletter$/, '');
    
    // Remover todos os caracteres não numéricos
    cleanPhone = cleanPhone.replace(/[^0-9]/g, '');
    
    // Detectar tipo de número
    if (cleanPhone.length > 15) {
      return { cleanPhone, isValid: false, type: 'newsletter' };
    }
    
    if (cleanPhone.length < 10) {
      return { cleanPhone, isValid: false, type: 'too_short' };
    }

    // Normalizar para formato brasileiro
    if (cleanPhone.startsWith('55') && cleanPhone.length === 13) {
      // Remover código do país
      cleanPhone = cleanPhone.substring(2);
    }

    // Adicionar 9 para celulares sem o dígito
    if (cleanPhone.length === 10 && !cleanPhone.startsWith('11')) {
      cleanPhone = cleanPhone.substring(0, 2) + '9' + cleanPhone.substring(2);
    }

    // Validar formato final
    const isValid = cleanPhone.length === 11 || cleanPhone.length === 10;
    const type = cleanPhone.length === 11 ? 'mobile' : 'landline';

    return { cleanPhone, isValid, type };
  }

  // Formatar telefone para exibição
  static formatPhoneDisplay(cleanPhone: string): string {
    if (cleanPhone.length === 11) {
      return `+55 (${cleanPhone.substring(0, 2)}) ${cleanPhone.substring(2, 7)}-${cleanPhone.substring(7)}`;
    }
    if (cleanPhone.length === 10) {
      return `+55 (${cleanPhone.substring(0, 2)}) ${cleanPhone.substring(2, 6)}-${cleanPhone.substring(6)}`;
    }
    return `+55 ${cleanPhone}`;
  }

  // Extrair texto da mensagem
  static extractMessageText(payload: WhatsAppWebhookPayload): string {
    // Prioridade: message.text > data.body > message.caption > texto padrão
    if (payload.message?.text) {
      return payload.message.text;
    }
    
    if (payload.data?.body) {
      return payload.data.body;
    }
    
    if (payload.message?.caption) {
      return payload.message.caption;
    }

    // Para tipos de mídia sem texto
    const mediaTypes = {
      'image': '📷 Imagem',
      'video': '🎥 Vídeo',
      'audio': '🎵 Áudio',
      'document': '📄 Documento',
      'sticker': '🎭 Sticker',
      'location': '📍 Localização',
      'contact': '👤 Contato'
    };

    return mediaTypes[payload.messageType as keyof typeof mediaTypes] || 'Mensagem sem texto';
  }

  // Extrair informações de mídia
  static extractMediaInfo(payload: WhatsAppWebhookPayload): { mediaUrl?: string; mediaType?: string } {
    if (!payload.data?.media) {
      return {};
    }

    return {
      mediaUrl: payload.data.media.url,
      mediaType: payload.messageType
    };
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
    const validation = this.validatePayload(payload);
    
    if (!validation.isValid) {
      console.error('[PayloadProcessor] Payload inválido:', validation.errors);
      return null;
    }

    // Log warnings
    if (validation.warnings.length > 0) {
      console.warn('[PayloadProcessor] Warnings:', validation.warnings);
    }

    const instanceId = payload.instanceId || payload.instanceName || payload.instance;
    const phoneInfo = this.cleanBrazilianPhone(payload.from);
    
    if (!phoneInfo.isValid) {
      console.warn('[PayloadProcessor] Telefone inválido:', {
        original: payload.from,
        cleaned: phoneInfo.cleanPhone,
        type: phoneInfo.type
      });
      return null;
    }

    const messageText = this.extractMessageText(payload);
    const mediaInfo = this.extractMediaInfo(payload);
    const contactName = this.extractContactName(payload);
    const externalMessageId = payload.data?.messageId || payload.messageId;

    // Verificar duplicação
    if (externalMessageId && this.isDuplicateMessage(externalMessageId)) {
      console.warn('[PayloadProcessor] Mensagem duplicada ignorada:', externalMessageId);
      return null;
    }

    return {
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
  }
}
