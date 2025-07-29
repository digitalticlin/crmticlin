
/**
 * 🚀 TIPOS CORRIGIDOS PARA SISTEMA DE REALTIME MULTITENANCY
 * 
 * CORREÇÕES APLICADAS:
 * ✅ Remoção de userId dos props (obtido diretamente do useAuth)
 * ✅ Adição de campos de monitoramento de reconnection
 * ✅ Tipagem mais rigorosa para callbacks
 */

import { Contact, Message } from '@/types/chat';

// 👥 TIPOS PARA REALTIME DE CHATS/CONTATOS
export interface ChatsRealtimeConfig {
  activeInstanceId: string | null;
  onContactUpdate?: (contactId: string, messageText?: string) => void;
  onNewContact?: (contact: Contact) => void;
  onContactsRefresh?: () => void;
  // 🚀 CORREÇÃO: Callbacks granulares com tipagem rigorosa
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
  // 🚀 CORREÇÃO: Callbacks granulares com tipagem rigorosa
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
  // 🚀 CORREÇÃO: Adicionar estatísticas de reconnection
  chatsReconnectAttempts: number;
  messagesReconnectAttempts: number;
  queuedMessages: number;
}

// ⚙️ STATUS DE CONEXÃO
export type RealtimeConnectionStatus = 
  | 'connecting' 
  | 'connected' 
  | 'disconnected' 
  | 'error'
  | 'failed'
  | 'reconnecting'; // 🚀 CORREÇÃO: Adicionar status de reconnection
