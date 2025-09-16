/**
 * 🎯 SISTEMA COMPLETAMENTE ISOLADO DE REALTIME - REFATORADO V2
 *
 * NOVA ARQUITETURA: HOOKS SEPARADOS PARA MÁXIMA PERFORMANCE
 *
 * ✅ useContactsRealtime → Real-time ISOLADO apenas para contatos
 * ✅ useMessagesRealtime → Real-time ISOLADO apenas para mensagens
 * ✅ useWhatsAppRealtime → Legacy (manter para compatibilidade)
 *
 * BENEFÍCIOS:
 * - Zero interferência entre contatos e mensagens
 * - Performance otimizada (cada hook só cuida de sua responsabilidade)
 * - Menos travamentos e bugs
 * - Controle granular de pause/resume para cada tipo
 * - Debounce específico para cada contexto
 * - Anti-duplicação avançado
 */

// 🎯 HOOKS ISOLADOS PRINCIPAIS
export { useContactsRealtime } from './useContactsRealtime';
export { useMessagesRealtime } from './useMessagesRealtime';

// 🔄 HOOK LEGACY (para compatibilidade)
export { useWhatsAppRealtime } from './useWhatsAppRealtime';

// 📝 TIPOS
export type {
  ChatsRealtimeConfig,
  MessagesRealtimeConfig,
  SupabaseRealtimePayload,
  RealtimeStats,
  RealtimeConnectionStatus
} from './types'; 