
/**
 * 🚀 TIPOS PARA SISTEMA DE REALTIME MODULAR
 * 
 * Define interfaces para os hooks de realtime isolados
 */

export type RealtimeConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface ChatsRealtimeConfig {
  userId: string | null;
  activeInstanceId: string | null;
  onContactUpdate: (contactId: string, messageText?: string) => void;
  onNewContact: (contact: any) => void;
  onContactsRefresh: () => void;
}

export interface MessagesRealtimeConfig {
  selectedContactId: string | null;
  activeInstanceId: string | null;
  onMessageUpdate: (message: any) => void;
  onNewMessage: (message: any) => void;
  onMessagesRefresh: () => void;
}

export interface RealtimeStats {
  isConnected: boolean;
  connectionStatus: RealtimeConnectionStatus;
  totalEvents: number;
  lastUpdate: number | null;
  forceDisconnect: () => void;
}
