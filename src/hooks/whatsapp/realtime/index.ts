/**
 * 🎯 SISTEMA ISOLADO E MODULAR DE REALTIME - REFATORADO
 * 
 * AGORA USANDO HOOK ISOLADO UNIFICADO
 * 
 * ✅ useWhatsAppRealtime → Sistema realtime isolado e modular
 * 
 * ISOLAMENTO TOTAL: Hook unificado com responsabilidades específicas
 * para contatos e mensagens separadamente.
 */

// 🎯 HOOK ISOLADO UNIFICADO
export { useWhatsAppRealtime } from './useWhatsAppRealtime';

// 📝 TIPOS
export type {
  ChatsRealtimeConfig,
  MessagesRealtimeConfig,
  SupabaseRealtimePayload,
  RealtimeStats,
  RealtimeConnectionStatus
} from './types'; 