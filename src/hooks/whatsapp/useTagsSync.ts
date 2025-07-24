import { useEffect, useCallback, useRef } from 'react';
import { subscribeToTags, realtimePool } from '@/utils/realtimePool';
import { windowEventManager } from '@/utils/eventManager';
import { realtimeLogger } from '@/utils/logger';

/**
 * Hook para sincronizar tags e detectar mudanças
 * @param userId - ID do usuário para filtrar tags
 * @param onTagsChanged - Callback executado quando tags são alteradas
 */
export const useTagsSync = (userId: string | null, onTagsChanged?: () => void) => {
  const subscriptionIdsRef = useRef<string[]>([]);
  const eventSubscriptionIdsRef = useRef<string[]>([]);

  const handleTagsUpdate = useCallback(() => {
    realtimeLogger.log('📡 Tags atualizadas, executando callback');
    if (onTagsChanged) {
      onTagsChanged();
    }
  }, [onTagsChanged]);

  useEffect(() => {
    if (!userId) {
      realtimeLogger.warn('⚠️ UserId não fornecido, não configurando listeners');
      return;
    }

    realtimeLogger.log('🔄 Configurando listeners de tags para userId:', userId);

    // ✅ USAR POOL DE CONEXÕES PARA OTIMIZAR PERFORMANCE
    const tagsSubscriptionId = subscribeToTags(userId, (payload) => {
      realtimeLogger.log('🏷️ Tag alterada:', payload.eventType);
      handleTagsUpdate();
    });

    // Subscription para lead_tags usando pool
    const leadTagsSubscriptionId = realtimePool.subscribe({
      event: '*',
      schema: 'public',
      table: 'lead_tags',
      filter: `created_by_user_id=eq.${userId}`
    }, (payload) => {
      realtimeLogger.log('🔗 Lead tag alterada:', payload.eventType);
      handleTagsUpdate();
    });

    subscriptionIdsRef.current = [tagsSubscriptionId, leadTagsSubscriptionId];

    // ✅ USAR EVENT MANAGER PARA EVENTOS CUSTOMIZADOS
    const handleCustomTagUpdate = (event: CustomEvent) => {
      realtimeLogger.log('📢 Evento customizado de tag recebido:', event.detail);
      handleTagsUpdate();
    };

    const eventIds = [
      windowEventManager.addEventListener('leadTagsUpdated', handleCustomTagUpdate),
      windowEventManager.addEventListener('tagsUpdated', handleCustomTagUpdate)
    ];

    eventSubscriptionIdsRef.current = eventIds;

    return () => {
      realtimeLogger.log('🧹 Limpando listeners de tags');
      
      // Cleanup realtime subscriptions
      subscriptionIdsRef.current.forEach(id => {
        realtimePool.unsubscribe(id);
      });
      
      // Cleanup event listeners
      eventSubscriptionIdsRef.current.forEach(id => {
        windowEventManager.removeEventListener(id);
      });
      
      subscriptionIdsRef.current = [];
      eventSubscriptionIdsRef.current = [];
    };
  }, [userId, handleTagsUpdate]);

  return {
    // Função para forçar uma atualização manual
    triggerSync: handleTagsUpdate
  };
}; 