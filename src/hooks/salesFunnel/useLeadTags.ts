import { useState, useCallback, useEffect } from 'react';
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
      console.log('[useLeadTags] 🔄 Buscando tags para lead:', leadId);
      
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
      
      console.log('[useLeadTags] ✅ Tags carregadas:', {
        leadTags: formattedLeadTags.length,
        availableTags: allTags.length,
        leadId
      });
      
      setLeadTags(formattedLeadTags);
      setAvailableTags(allTags);

    } catch (error: any) {
      console.error('[useLeadTags] ❌ Erro ao buscar tags:', error);
      toast.error('Erro ao carregar tags');
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  // 🚀 LISTENER PARA EVENTOS DE REFRESH
  useEffect(() => {
    const handleRefreshTags = () => {
      console.log('[useLeadTags] 🔄 Evento de refresh recebido - atualizando tags...');
      fetchTags();
    };

    window.addEventListener('refreshLeadTags', handleRefreshTags);

    return () => {
      window.removeEventListener('refreshLeadTags', handleRefreshTags);
    };
  }, [fetchTags]);

  const addTag = useCallback(async (tagId: string) => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      console.log('[useLeadTags] ➕ Adicionando tag:', { leadId, tagId });
      
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
      
      // 🚀 CORREÇÃO: Tags não afetam ordem da lista de contatos - não resetar
      console.log('[useLeadTags] ℹ️ Tag adicionada - não é necessário resetar lista de contatos');
      
      // ✅ DISPARAR EVENTO PARA REFRESH DE TAGS NOS CONTATOS
      window.dispatchEvent(new CustomEvent('refreshLeadTags'));
      
      toast.success('Tag adicionada com sucesso');
      
      console.log('[useLeadTags] ✅ Tag adicionada e interface sincronizada');
    } catch (error: any) {
      console.error('[useLeadTags] ❌ Erro ao adicionar tag:', error);
      toast.error('Erro ao adicionar tag');
    }
  }, [leadId, fetchTags, user?.id]);

  const removeTag = useCallback(async (tagId: string) => {
    try {
      console.log('[useLeadTags] 🗑️ Removendo tag:', { leadId, tagId });
      
      const { error } = await supabase
        .from('lead_tags')
        .delete()
        .eq('lead_id', leadId)
        .eq('tag_id', tagId);

      if (error) throw error;

      await fetchTags();
      
      // 🚀 CORREÇÃO: Tags não afetam ordem da lista de contatos - não resetar
      console.log('[useLeadTags] ℹ️ Tag removida - não é necessário resetar lista de contatos');
      
      // ✅ DISPARAR EVENTO PARA REFRESH DE TAGS NOS CONTATOS
      window.dispatchEvent(new CustomEvent('refreshLeadTags'));
      
      toast.success('Tag removida com sucesso');
      
      console.log('[useLeadTags] ✅ Tag removida e interface sincronizada');
    } catch (error: any) {
      console.error('[useLeadTags] ❌ Erro ao remover tag:', error);
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