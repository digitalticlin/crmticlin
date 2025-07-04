import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useTagsSync = (userId: string | null, onTagsChange: () => void) => {
  useEffect(() => {
    if (!userId) return;

    // Criar canal de subscription para mudanças nas tags
    const channel = supabase
      .channel('lead-tags-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Ouvir todos os eventos (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'lead_tags',
          filter: `created_by_user_id=eq.${userId}`
        },
        () => {
          // Chamar callback quando houver mudança nas tags
          onTagsChange();
        }
      )
      .subscribe();

    // Cleanup: remover subscription quando o componente for desmontado
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onTagsChange]);
}; 