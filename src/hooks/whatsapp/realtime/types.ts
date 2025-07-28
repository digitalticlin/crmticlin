
/**
 * 🚀 TIPOS PARA SISTEMA DE REALTIME MODULAR E ISOLADO - OTIMIZADO FASE 1
 * 
 * OTIMIZAÇÕES FASE 1:
 * ✅ Tipos para comunicação granular entre hooks
 * ✅ Interface para evento global de mensagens
 * ✅ Melhor tipagem para callbacks
 */

import { Contact, Message } from '@/types/chat';

// 👥 TIPOS PARA REALTIME DE CHATS/CONTATOS
export interface ChatsRealtimeConfig {
  userId: string | null;
  activeInstanceId: string | null;
  onContactUpdate?: (contactId: string, messageText?: string) => void;
  onNewContact?: (contact: Contact) => void;
  onContactsRefresh?: () => void;
  // 🚀 FASE 1: CALLBACKS GRANULARES OTIMIZADAS
  onMoveContactToTop?: (contactId: string, messageInfo: { text: string; timestamp: string; unreadCount?: number }) => void;
  onUpdateUnreadCount?: (contactId: string, increment?: boolean) => void;
  onAddNewContact?: (newContactData: Partial<Contact>) => void;
}

// 💬 TIPOS PARA REALTIME DE MENSAGENS - OTIMIZADO FASE 1
export interface MessagesRealtimeConfig {
  selectedContactId: string | null;
  activeInstanceId: string | null;
  onMessageUpdate?: (message: Message) => void;
  onNewMessage?: (message: Message) => void;
  onMessagesRefresh?: () => void;
  // 🚀 FASE 1: CALLBACKS GRANULARES OTIMIZADAS
  onAddNewMessage?: (message: Message) => void;
  onUpdateMessageStatus?: (messageId: string, newStatus: 'sent' | 'delivered' | 'read') => void;
  onMoveContactToTop?: (contactId: string, messageInfo: { text: string; timestamp: string; unreadCount?: number }) => void;
}

// 🔧 TIPOS DE PAYLOADS DO SUPABASE
export interface SupabaseRealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: any;
  old?: any;
  errors?: string[];
}

// 🚀 FASE 1: Tipo para eventos globais de mensagens
export interface WhatsAppContactUpdateEvent {
  contactId: string;
  messageText: string;
  timestamp: string;
  isFromMe: boolean;
  unreadCount?: number;
}

// 📊 ESTATÍSTICAS DE REALTIME
export interface RealtimeStats {
  chatsChannelActive: boolean;
  messagesChannelActive: boolean;
  lastChatsUpdate: number | null;
  lastMessagesUpdate: number | null;
  totalChatsEvents: number;
  totalMessagesEvents: number;
  // 🚀 FASE 1: Nova estatística para eventos globais
  globalEventsCount: number;
}

// ⚙️ STATUS DE CONEXÃO
export type RealtimeConnectionStatus = 
  | 'connecting' 
  | 'connected' 
  | 'disconnected' 
  | 'error'
  | 'failed';

// 🚀 FASE 1: Interface para comunicação entre hooks
export interface RealtimeHookCommunication {
  moveContactToTop: (contactId: string, messageInfo: { text: string; timestamp: string; unreadCount?: number }) => void;
  updateUnreadCount: (contactId: string, increment?: boolean) => void;
  addNewContact: (contactData: Partial<Contact>) => void;
  notifyNewMessage: (contactId: string, messageText: string, timestamp: string) => void;
}
