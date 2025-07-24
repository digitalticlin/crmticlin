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
      
      if (!leadId || !user?.id) {
        console.log('[useLeadTags] ⚠️ LeadId ou userId não fornecido');
        setLeadTags([]);
        setAvailableTags([]);
        setLoading(false);
        return;
      }

      // ✅ CORREÇÃO: Buscar tags do lead com filtro de usuário
      const { data: leadTagsData, error: leadTagsError } = await supabase
        .from('lead_tags')
        .select(`
          tag_id,
          tags!inner (
            id,
            name,
            color,
            created_by_user_id
          )
        `)
        .eq('lead_id', leadId)
        .eq('tags.created_by_user_id', user.id);

      if (leadTagsError) {
        console.error('[useLeadTags] ❌ Erro ao buscar tags do lead:', leadTagsError);
        // Não fazer throw, apenas logar e continuar
      }

      // ✅ CORREÇÃO: Buscar todas as tags disponíveis para o usuário
      const { data: allTags, error: allTagsError } = await supabase
        .from('tags')
        .select('*')
        .eq('created_by_user_id', user.id)
        .order('name');

      if (allTagsError) {
        console.error('[useLeadTags] ❌ Erro ao buscar tags disponíveis:', allTagsError);
        throw allTagsError;
      }

      // ✅ CORREÇÃO: Extrair tags do lead com verificação de segurança
      const formattedLeadTags = (leadTagsData || [])
        .map(lt => lt.tags)
        .filter(tag => tag !== null && tag !== undefined) as KanbanTag[];
      
      console.log('[useLeadTags] ✅ Tags carregadas:', {
        leadTags: formattedLeadTags.length,
        availableTags: allTags?.length || 0,
        leadId,
        userId: user.id
      });
      
      setLeadTags(formattedLeadTags);
      setAvailableTags(allTags || []);

    } catch (error: any) {
      console.error('[useLeadTags] ❌ Erro ao buscar tags:', error);
      toast.error('Erro ao carregar tags');
      // ✅ CORREÇÃO: Definir arrays vazios em caso de erro
      setLeadTags([]);
      setAvailableTags([]);
    } finally {
      setLoading(false);
    }
  }, [leadId, user?.id]);

  const addTag = useCallback(async (tagId: string) => {
    if (!leadId || !user?.id) {
      toast.error('Dados insuficientes para adicionar tag');
      return;
    }

    try {
      console.log('[useLeadTags] ➕ Adicionando tag:', { tagId, leadId });

      const { error } = await supabase
        .from('lead_tags')
        .insert({
          lead_id: leadId,
          tag_id: tagId,
          created_by_user_id: user.id
        });

      if (error) throw error;

      // ✅ CORREÇÃO: Recarregar tags após adicionar
      await fetchTags();
      
      // ✅ NOVO: Disparar evento para atualizar lista de contatos
      console.log('[useLeadTags] 📡 Disparando evento leadTagsUpdated:', { leadId, action: 'addTag', tagId });
      window.dispatchEvent(new CustomEvent('leadTagsUpdated', {
        detail: { leadId }
      }));
      
      toast.success('Tag adicionada com sucesso!');

    } catch (error: any) {
      console.error('[useLeadTags] ❌ Erro ao adicionar tag:', error);
      toast.error('Erro ao adicionar tag');
    }
  }, [leadId, user?.id, fetchTags]);

  const removeTag = useCallback(async (tagId: string) => {
    if (!leadId || !user?.id) {
      toast.error('Dados insuficientes para remover tag');
      return;
    }

    try {
      console.log('[useLeadTags] ➖ Removendo tag:', { tagId, leadId });

      const { error } = await supabase
        .from('lead_tags')
        .delete()
        .eq('lead_id', leadId)
        .eq('tag_id', tagId)
        .eq('created_by_user_id', user.id);

      if (error) throw error;

      // ✅ CORREÇÃO: Recarregar tags após remover
      await fetchTags();
      
      // ✅ NOVO: Disparar evento para atualizar lista de contatos
      console.log('[useLeadTags] 📡 Disparando evento leadTagsUpdated:', { leadId, action: 'removeTag', tagId });
      window.dispatchEvent(new CustomEvent('leadTagsUpdated', {
        detail: { leadId }
      }));
      
      toast.success('Tag removida com sucesso!');

    } catch (error: any) {
      console.error('[useLeadTags] ❌ Erro ao remover tag:', error);
      toast.error('Erro ao remover tag');
    }
  }, [leadId, user?.id, fetchTags]);

  // ✅ CORREÇÃO: Carregar tags apenas quando leadId e user.id estiverem disponíveis
  useEffect(() => {
    if (leadId && user?.id) {
      fetchTags();
    } else {
      setLoading(false);
      setLeadTags([]);
      setAvailableTags([]);
    }
  }, [leadId, user?.id, fetchTags]);

  return {
    leadTags,
    availableTags,
    loading,
    addTag,
    removeTag,
    fetchTags
  };
}; 