
// Tipos para payload do WhatsApp Web
export interface WhatsAppWebhookPayload {
  event: string;
  instanceId?: string;
  instanceName?: string;
  from: string;
  fromMe: boolean;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'location' | 'contact';
  message?: {
    text?: string;
    caption?: string;
  };
  data?: {
    body?: string;
    messageId?: string;
    timestamp?: number;
    quotedMessage?: any;
    media?: {
      url?: string;
      mimetype?: string;
      filename?: string;
      size?: number;
    };
  };
  contact?: {
    name?: string;
    pushname?: string;
    isMyContact?: boolean;
  };
}

export interface ProcessedMessage {
  instanceId: string;
  phone: string;
  messageText: string;
  fromMe: boolean;
  messageType: string;
  mediaUrl?: string;
  mediaType?: string;
  externalMessageId?: string;
  contactName?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
