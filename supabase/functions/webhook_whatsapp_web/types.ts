
export interface WhatsAppWebhookPayload {
  event: string;
  instanceId?: string;
  instanceName?: string;
  instance?: string;
  from: string;
  fromMe?: boolean;
  messageType?: string;
  message?: {
    text?: string;
    caption?: string;
  };
  data?: {
    body?: string;
    messageId?: string;
    media?: {
      url?: string;
      size?: number;
      filename?: string;
    };
  };
  contact?: {
    name?: string;
    pushname?: string;
  };
  messageId?: string;
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
