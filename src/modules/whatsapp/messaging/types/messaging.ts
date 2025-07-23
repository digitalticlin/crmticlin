// Tipos para o módulo WhatsApp Messaging

export interface SendMessageParams {
  instanceId: string;
  phone: string;
  message: string;
  mediaType?: 'text' | 'image' | 'video' | 'audio' | 'document'; // ✅ NOVO: TIPO DE MÍDIA
  mediaUrl?: string; // ✅ NOVO: URL DE MÍDIA
  options?: MessageSendingOptions;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp?: string;
}

export interface MessageSendingOptions {
  saveToDatabase?: boolean;
  skipValidation?: boolean;
  priority?: 'low' | 'normal' | 'high';
  timeout?: number;
}

export interface MessagingServiceConfig {
  edgeFunctionName: string;
  timeout: number;
  retries: number;
} 