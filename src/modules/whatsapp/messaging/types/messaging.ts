// Tipos para o módulo WhatsApp Messaging

export interface SendMessageParams {
  instanceId: string;
  phone: string;
  message: string;
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