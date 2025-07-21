
/**
 * 🚀 EXPORT BARREL PARA HOOKS DE REALTIME
 * 
 * Centraliza exports dos hooks de realtime isolados
 */

export { useChatsRealtime } from './useChatsRealtime';
export { useMessagesRealtime } from './useMessagesRealtime';
export type { 
  ChatsRealtimeConfig, 
  MessagesRealtimeConfig, 
  RealtimeStats, 
  RealtimeConnectionStatus 
} from './types';
