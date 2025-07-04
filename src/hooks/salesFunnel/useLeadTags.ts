import { useState, useCallback } from 'react';
import { KanbanTag } from '@/types/kanban';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export const useLeadTags = (leadId: string) => {
  const { user } = useAuth();
  const [leadTags, setLeadTags] = useState<KanbanTag[]>([]);
  const [availableTags, setAvailableTags] = useState<KanbanTag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      
      // Buscar tags do lead
      const { data: leadTagsData, error: leadTagsError } = await supabase
        .from('lead_tags')
        .select('tag_id, tags:tag_id(*)')
        .eq('lead_id', leadId);

      if (leadTagsError) throw leadTagsError;

      // Buscar todas as tags disponíveis
      const { data: allTags, error: allTagsError } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (allTagsError) throw allTagsError;

      // Formatar tags do lead
      const formattedLeadTags = leadTagsData.map(lt => lt.tags) as KanbanTag[];
      setLeadTags(formattedLeadTags);
      setAvailableTags(allTags);

    } catch (error: any) {
      console.error('Erro ao buscar tags:', error);
      toast.error('Erro ao carregar tags');
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  const addTag = useCallback(async (tagId: string) => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      const { error } = await supabase
        .from('lead_tags')
        .insert([{ 
          lead_id: leadId, 
          tag_id: tagId,
          created_by_user_id: user.id,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      await fetchTags();
      toast.success('Tag adicionada com sucesso');
    } catch (error: any) {
      console.error('Erro ao adicionar tag:', error);
      toast.error('Erro ao adicionar tag');
    }
  }, [leadId, fetchTags, user?.id]);

  const removeTag = useCallback(async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('lead_tags')
        .delete()
        .eq('lead_id', leadId)
        .eq('tag_id', tagId);

      if (error) throw error;

      await fetchTags();
      toast.success('Tag removida com sucesso');
    } catch (error: any) {
      console.error('Erro ao remover tag:', error);
      toast.error('Erro ao remover tag');
    }
  }, [leadId, fetchTags]);

  return {
    leadTags,
    availableTags,
    loading,
    fetchTags,
    addTag,
    removeTag
  };
}; 