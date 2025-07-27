/**
 * 🎯 SISTEMA ISOLADO E MODULAR DE REALTIME
 * 
 * APENAS 2 HOOKS ISOLADOS - SEM CONFLITOS OU DUPLICIDADES
 * 
 * ✅ useChatsRealtime    → Cards de contatos (lista lateral)
 * ✅ useMessagesRealtime → Área de mensagens (conversa ativa)
 * 
 * ISOLAMENTO TOTAL: Cada hook tem responsabilidade específica
 * e NÃO interfere com o outro.
 */

// 🎯 HOOKS ISOLADOS
export { useChatsRealtime } from './useChatsRealtime';      // Cards de contatos
export { useMessagesRealtime } from './useMessagesRealtime'; // Área de mensagens

// 📝 TIPOS
export type {
  ChatsRealtimeConfig,
  MessagesRealtimeConfig,
  SupabaseRealtimePayload,
  RealtimeStats,
  RealtimeConnectionStatus
} from './types'; 