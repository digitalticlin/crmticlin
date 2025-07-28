
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KanbanTag } from '@/types/kanban';
import { windowEventManager } from '@/utils/eventManager';
import { useAuth } from '@/contexts/AuthContext';

export const useTagsSync = (leadId: string | null) => {
  const [tags, setTags] = useState<KanbanTag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const fetchTags = useCallback(async () => {
    if (!leadId) {
      setTags([]);
      return;
    }

    setIsLoading(true);
    try {
      // Fix: Use correct table relationship - query tags table directly
      const { data, error } = await supabase
        .from('lead_tags')
        .select(`
          tag_id,
          tags:tag_id (
            id,
            name,
            color
          )
        `)
        .eq('lead_id', leadId);

      if (error) {
        console.error('Erro ao buscar tags:', error);
        return;
      }

      // Fix: Handle the corrected data structure
      const fetchedTags = data
        .filter(item => item.tags) // Filter out null tags
        .map(item => ({
          id: item.tags.id,
          name: item.tags.name,
          color: item.tags.color,
        }));

      setTags(fetchedTags);
    } finally {
      setIsLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (!leadId) return;

    const subscriptionId = windowEventManager.addEventListener(
      'lead-tags-updated',
      (data: { leadId: string; tags: KanbanTag[] }) => {
        if (data.leadId === leadId) {
          setTags(data.tags);
        }
      },
      {}
    );

    const globalSubscriptionId = windowEventManager.addEventListener(
      'tags-global-update',
      fetchTags,
      {}
    );

    return () => {
      windowEventManager.removeEventListener(subscriptionId);
      windowEventManager.removeEventListener(globalSubscriptionId);
    };
  }, [leadId, fetchTags]);

  const updateTags = useCallback(
    async (newTags: KanbanTag[]) => {
      if (!leadId || !user) return;

      setIsLoading(true);
      try {
        // Delete existing tags for this lead
        const { error: deleteError } = await supabase
          .from('lead_tags')
          .delete()
          .eq('lead_id', leadId);

        if (deleteError) {
          console.error('Erro ao deletar tags antigas:', deleteError);
          return;
        }

        // Insert new tags with required fields
        const leadTags = newTags.map((tag) => ({
          lead_id: leadId,
          tag_id: tag.id,
          created_by_user_id: user.id // Fix: Add required field
        }));

        const { error: insertError } = await supabase
          .from('lead_tags')
          .insert(leadTags);

        if (insertError) {
          console.error('Erro ao inserir novas tags:', insertError);
          return;
        }

        // Update local state and notify other components
        setTags(newTags);
        windowEventManager.dispatchEvent('lead-tags-updated', { leadId, tags: newTags });
      } finally {
        setIsLoading(false);
      }
    },
    [leadId, user]
  );

  return { tags, isLoading, updateTags };
};
