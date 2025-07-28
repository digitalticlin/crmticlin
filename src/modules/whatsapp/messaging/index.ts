// Módulo WhatsApp Messaging - Export Principal
// Estrutura modular isolada para funcionalidade de envio de mensagens

export { MessagingApi } from './api/messagingApi';
export { useMessaging } from './hooks/useMessaging';
export { MessagingService } from './services/messagingService';
export type { 
  SendMessageParams, 
  SendMessageResult, 
  MessageSendingOptions 
} from './types/messaging'; 