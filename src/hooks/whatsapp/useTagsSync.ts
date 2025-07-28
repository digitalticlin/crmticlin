import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KanbanTag } from '@/types/kanban';
import { windowEventManager } from '@/utils/eventManager';

export const useTagsSync = (leadId: string | null) => {
  const [tags, setTags] = useState<KanbanTag[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTags = useCallback(async () => {
    if (!leadId) {
      setTags([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lead_tags')
        .select('tag_id, kanban_tags(id, name, color)')
        .eq('lead_id', leadId);

      if (error) {
        console.error('Erro ao buscar tags:', error);
        return;
      }

      const fetchedTags = data.map(item => ({
        id: item.kanban_tags.id,
        name: item.kanban_tags.name,
        color: item.kanban_tags.color,
      }));

      setTags(fetchedTags);
    } finally {
      setIsLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (!leadId) return;

    // Fix: Add the required third parameter (options)
    const subscriptionId = windowEventManager.addEventListener(
      'lead-tags-updated',
      (data: { leadId: string; tags: KanbanTag[] }) => {
        if (data.leadId === leadId) {
          setTags(data.tags);
        }
      },
      {} // Options parameter
    );

    const globalSubscriptionId = windowEventManager.addEventListener(
      'tags-global-update',
      fetchTags,
      {} // Options parameter
    );

    return () => {
      windowEventManager.removeEventListener(subscriptionId);
      windowEventManager.removeEventListener(globalSubscriptionId);
    };
  }, [leadId, fetchTags]);

  const updateTags = useCallback(
    async (newTags: KanbanTag[]) => {
      setIsLoading(true);
      try {
        // Deletar todas as tags existentes para este lead
        const { error: deleteError } = await supabase
          .from('lead_tags')
          .delete()
          .eq('lead_id', leadId);

        if (deleteError) {
          console.error('Erro ao deletar tags antigas:', deleteError);
          return;
        }

        // Adicionar as novas tags
        const leadTags = newTags.map((tag) => ({
          lead_id: leadId,
          tag_id: tag.id,
        }));

        const { error: insertError } = await supabase
          .from('lead_tags')
          .insert(leadTags);

        if (insertError) {
          console.error('Erro ao inserir novas tags:', insertError);
          return;
        }

        // Atualizar o estado local e notificar outros componentes
        setTags(newTags);
        windowEventManager.dispatchEvent('lead-tags-updated', { leadId, tags: newTags });
      } finally {
        setIsLoading(false);
      }
    },
    [leadId]
  );

  return { tags, isLoading, updateTags };
};
