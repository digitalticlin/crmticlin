/**
 * 🚀 TIPOS PARA SISTEMA DE REALTIME MODULAR E ISOLADO
 * 
 * Este arquivo define os tipos compartilhados entre os hooks de realtime
 * para chats e mensagens, garantindo consistência e tipagem forte.
 */

import { Contact, Message } from '@/types/chat';

// 👥 TIPOS PARA REALTIME DE CHATS/CONTATOS
export interface ChatsRealtimeConfig {
  userId: string | null;
  activeInstanceId: string | null;
  onContactUpdate?: (contactId: string, messageText?: string) => void;
  onNewContact?: (contact: Contact) => void;
  onContactsRefresh?: () => void;
  // 🚀 NOVAS CALLBACKS GRANULARES
  onMoveContactToTop?: (contactId: string, newMessage?: { text: string; timestamp: string; unreadCount?: number }) => void;
  onUpdateUnreadCount?: (contactId: string, increment?: boolean) => void;
  onAddNewContact?: (newContactData: Partial<Contact>) => void;
}

// 💬 TIPOS PARA REALTIME DE MENSAGENS  
export interface MessagesRealtimeConfig {
  selectedContactId: string | null;
  activeInstanceId: string | null;
  onMessageUpdate?: (message: Message) => void;
  onNewMessage?: (message: Message) => void;
  onMessagesRefresh?: () => void;
  // 🚀 NOVAS CALLBACKS GRANULARES
  onAddNewMessage?: (message: Message) => void;
  onUpdateMessageStatus?: (messageId: string, newStatus: 'sent' | 'delivered' | 'read') => void;
}

// 🔧 TIPOS DE PAYLOADS DO SUPABASE
export interface SupabaseRealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: any;
  old?: any;
  errors?: string[];
}

// 📊 ESTATÍSTICAS DE REALTIME
export interface RealtimeStats {
  chatsChannelActive: boolean;
  messagesChannelActive: boolean;
  lastChatsUpdate: number | null;
  lastMessagesUpdate: number | null;
  totalChatsEvents: number;
  totalMessagesEvents: number;
}

// ⚙️ STATUS DE CONEXÃO
export type RealtimeConnectionStatus = 
  | 'connecting' 
  | 'connected' 
  | 'disconnected' 
  | 'error'
  | 'failed'; 