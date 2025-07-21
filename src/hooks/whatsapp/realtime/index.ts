/**
 * 🚀 EXPORTS CENTRALIZADOS - SISTEMA DE REALTIME MODULAR
 * 
 * Este arquivo centraliza todos os exports do sistema de realtime modular,
 * facilitando importações e manutenção.
 */

// 🎯 HOOKS PRINCIPAIS
export { useChatsRealtime } from './useChatsRealtime';
export { useMessagesRealtime } from './useMessagesRealtime';

// 📝 TIPOS
export type {
  ChatsRealtimeConfig,
  MessagesRealtimeConfig,
  SupabaseRealtimePayload,
  RealtimeStats,
  RealtimeConnectionStatus
} from './types'; 