
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UseStabilizedInstanceSyncProps {
  onInstanceUpdate?: (instance: any) => void;
}

export const useStabilizedInstanceSync = ({
  onInstanceUpdate
}: UseStabilizedInstanceSyncProps = {}) => {
  const { user } = useAuth();

  const handleInstanceUpdate = useCallback((payload: any) => {
    console.log('[Stabilized Instance Sync] 🔄 Instância atualizada:', payload);
    
    if (onInstanceUpdate) {
      onInstanceUpdate(payload.new);
    }
  }, [onInstanceUpdate]);

  useEffect(() => {
    if (!user?.id) return;

    console.log('[Stabilized Instance Sync] 🔌 Configurando sincronização de instâncias');

    const channel = supabase
      .channel(`instance-sync-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: `created_by_user_id=eq.${user.id}`
        },
        handleInstanceUpdate
      )
      .subscribe();

    return () => {
      console.log('[Stabilized Instance Sync] 🧹 Limpando sincronização de instâncias');
      supabase.removeChannel(channel);
    };
  }, [user?.id, handleInstanceUpdate]);

  return {
    // Pode retornar status ou métodos se necessário
  };
};
