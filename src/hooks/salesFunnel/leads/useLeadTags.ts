/**
 * 🎯 HOOK ISOLADO - GERENCIAR TAGS DOS LEADS
 *
 * RESPONSABILIDADES:
 * ✅ Adicionar tag a um lead
 * ✅ Remover tag de um lead
 * ✅ Adicionar tags em massa (seleção múltipla)
 * ✅ Remover tags em massa
 * ✅ Atualizar cache do useFunnelLeads automaticamente
 * ✅ Buscar tags disponíveis do usuário
 *
 * NÃO FAZ:
 * ❌ Gerenciar leads (isso é no useFunnelLeads)
 * ❌ Real-time (isso é no useLeadsRealtime)
 * ❌ CRUD de tags (isso seria em outro hook)
 */

import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { KanbanLead, KanbanTag } from '@/types/kanban';
import { funnelLeadsQueryKeys } from './useFunnelLeads';
import { toast } from 'sonner';

// Query keys isoladas para tags
export const leadTagsQueryKeys = {
  all: ['salesfunnel-lead-tags'] as const,
  available: (userId: string) =>
    [...leadTagsQueryKeys.all, 'available', userId] as const,
  byLead: (leadId: string) =>
    [...leadTagsQueryKeys.all, 'by-lead', leadId] as const,
};

export function useLeadTags(funnelId?: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar tags disponíveis do usuário
  const { data: availableTags = [], isLoading: tagsLoading } = useQuery({
    queryKey: leadTagsQueryKeys.available(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) return [];

      console.log('[useLeadTags] 🔍 Buscando tags disponíveis para usuário:', user.id);

      const { data, error } = await supabase
        .from('tags')
        .select('id, name, color')
        .eq('created_by_user_id', user.id)
        .order('name');

      if (error) {
        console.error('[useLeadTags] ❌ Erro ao buscar tags:', error);
        return [];
      }

      console.log('[useLeadTags] ✅ Tags encontradas:', data?.length || 0);
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000 // 10 minutos
  });

  // Função para atualizar tags do lead no cache
  const updateLeadTagsInCache = useCallback((leadId: string, newTags: KanbanTag[]) => {
    if (!funnelId || !user?.id) return;

    queryClient.setQueryData(
      funnelLeadsQueryKeys.byFunnel(funnelId, user.id),
      (oldData: KanbanLead[] | undefined) => {
        if (!oldData) return oldData;

        return oldData.map(lead =>
          lead.id === leadId
            ? { ...lead, tags: newTags }
            : lead
        );
      }
    );
  }, [funnelId, user?.id, queryClient]);

  // Mutation para adicionar tag a um lead
  const addTagMutation = useMutation({
    mutationFn: async ({ leadId, tagId }: { leadId: string; tagId: string }) => {
      console.log('[useLeadTags] ➕ Adicionando tag:', { leadId, tagId });

      const { error } = await supabase
        .from('lead_tags')
        .insert({
          lead_id: leadId,
          tag_id: tagId,
          created_by_user_id: user?.id
        });

      if (error) {
        if (error.code === '23505') {
          // Duplicata - tag já existe no lead
          console.log('[useLeadTags] ℹ️ Tag já existe no lead');
          return;
        }
        throw error;
      }

      // Buscar a tag completa para atualizar o cache
      const { data: tag } = await supabase
        .from('tags')
        .select('id, name, color')
        .eq('id', tagId)
        .single();

      return { leadId, tag };
    },
    onSuccess: (result) => {
      if (!result) return;

      const { leadId, tag } = result;

      // Atualizar cache do lead
      queryClient.setQueryData(
        funnelLeadsQueryKeys.byFunnel(funnelId || '', user?.id || ''),
        (oldData: KanbanLead[] | undefined) => {
          if (!oldData) return oldData;

          return oldData.map(lead => {
            if (lead.id === leadId) {
              const currentTags = lead.tags || [];
              const tagExists = currentTags.some(t => t.id === tag.id);

              if (!tagExists) {
                return {
                  ...lead,
                  tags: [...currentTags, tag]
                };
              }
            }
            return lead;
          });
        }
      );

      console.log('[useLeadTags] ✅ Tag adicionada com sucesso');
    },
    onError: (error) => {
      console.error('[useLeadTags] ❌ Erro ao adicionar tag:', error);
      toast.error('Erro ao adicionar tag');
    }
  });

  // Mutation para remover tag de um lead
  const removeTagMutation = useMutation({
    mutationFn: async ({ leadId, tagId }: { leadId: string; tagId: string }) => {
      console.log('[useLeadTags] ➖ Removendo tag:', { leadId, tagId });

      const { error } = await supabase
        .from('lead_tags')
        .delete()
        .eq('lead_id', leadId)
        .eq('tag_id', tagId);

      if (error) throw error;

      return { leadId, tagId };
    },
    onSuccess: ({ leadId, tagId }) => {
      // Atualizar cache do lead
      queryClient.setQueryData(
        funnelLeadsQueryKeys.byFunnel(funnelId || '', user?.id || ''),
        (oldData: KanbanLead[] | undefined) => {
          if (!oldData) return oldData;

          return oldData.map(lead => {
            if (lead.id === leadId) {
              const currentTags = lead.tags || [];
              return {
                ...lead,
                tags: currentTags.filter(t => t.id !== tagId)
              };
            }
            return lead;
          });
        }
      );

      console.log('[useLeadTags] ✅ Tag removida com sucesso');
    },
    onError: (error) => {
      console.error('[useLeadTags] ❌ Erro ao remover tag:', error);
      toast.error('Erro ao remover tag');
    }
  });

  // Mutation para adicionar tags em massa
  const addTagsInBatchMutation = useMutation({
    mutationFn: async ({ leadIds, tagId }: { leadIds: string[]; tagId: string }) => {
      console.log('[useLeadTags] 📦 Adicionando tag em massa:', { leadIds, tagId });

      // Criar inserções em lote
      const insertions = leadIds.map(leadId => ({
        lead_id: leadId,
        tag_id: tagId,
        created_by_user_id: user?.id
      }));

      const { error } = await supabase
        .from('lead_tags')
        .upsert(insertions, { onConflict: 'lead_id,tag_id' });

      if (error) throw error;

      // Buscar a tag completa
      const { data: tag } = await supabase
        .from('tags')
        .select('id, name, color')
        .eq('id', tagId)
        .single();

      return { leadIds, tag };
    },
    onSuccess: ({ leadIds, tag }) => {
      // Atualizar cache de todos os leads afetados
      queryClient.setQueryData(
        funnelLeadsQueryKeys.byFunnel(funnelId || '', user?.id || ''),
        (oldData: KanbanLead[] | undefined) => {
          if (!oldData) return oldData;

          return oldData.map(lead => {
            if (leadIds.includes(lead.id)) {
              const currentTags = lead.tags || [];
              const tagExists = currentTags.some(t => t.id === tag.id);

              if (!tagExists) {
                return {
                  ...lead,
                  tags: [...currentTags, tag]
                };
              }
            }
            return lead;
          });
        }
      );

      toast.success(`Tag adicionada a ${leadIds.length} leads`);
      console.log('[useLeadTags] ✅ Tags adicionadas em massa');
    },
    onError: (error) => {
      console.error('[useLeadTags] ❌ Erro ao adicionar tags em massa:', error);
      toast.error('Erro ao adicionar tags em massa');
    }
  });

  // Mutation para remover tags em massa
  const removeTagsInBatchMutation = useMutation({
    mutationFn: async ({ leadIds, tagId }: { leadIds: string[]; tagId: string }) => {
      console.log('[useLeadTags] 📦 Removendo tag em massa:', { leadIds, tagId });

      const { error } = await supabase
        .from('lead_tags')
        .delete()
        .in('lead_id', leadIds)
        .eq('tag_id', tagId);

      if (error) throw error;

      return { leadIds, tagId };
    },
    onSuccess: ({ leadIds, tagId }) => {
      // Atualizar cache de todos os leads afetados
      queryClient.setQueryData(
        funnelLeadsQueryKeys.byFunnel(funnelId || '', user?.id || ''),
        (oldData: KanbanLead[] | undefined) => {
          if (!oldData) return oldData;

          return oldData.map(lead => {
            if (leadIds.includes(lead.id)) {
              const currentTags = lead.tags || [];
              return {
                ...lead,
                tags: currentTags.filter(t => t.id !== tagId)
              };
            }
            return lead;
          });
        }
      );

      toast.success(`Tag removida de ${leadIds.length} leads`);
      console.log('[useLeadTags] ✅ Tags removidas em massa');
    },
    onError: (error) => {
      console.error('[useLeadTags] ❌ Erro ao remover tags em massa:', error);
      toast.error('Erro ao remover tags em massa');
    }
  });

  // Funções públicas
  const addTag = useCallback(
    (leadId: string, tagId: string) => {
      addTagMutation.mutate({ leadId, tagId });
    },
    [addTagMutation]
  );

  const removeTag = useCallback(
    (leadId: string, tagId: string) => {
      removeTagMutation.mutate({ leadId, tagId });
    },
    [removeTagMutation]
  );

  const addTagsInBatch = useCallback(
    (leadIds: string[], tagId: string) => {
      if (leadIds.length === 0) {
        toast.error('Nenhum lead selecionado');
        return;
      }
      addTagsInBatchMutation.mutate({ leadIds, tagId });
    },
    [addTagsInBatchMutation]
  );

  const removeTagsInBatch = useCallback(
    (leadIds: string[], tagId: string) => {
      if (leadIds.length === 0) {
        toast.error('Nenhum lead selecionado');
        return;
      }
      removeTagsInBatchMutation.mutate({ leadIds, tagId });
    },
    [removeTagsInBatchMutation]
  );

  return {
    // Dados
    availableTags,
    tagsLoading,

    // Ações
    addTag,
    removeTag,
    addTagsInBatch,
    removeTagsInBatch,

    // Estados
    isAddingTag: addTagMutation.isPending,
    isRemovingTag: removeTagMutation.isPending,
    isAddingBatch: addTagsInBatchMutation.isPending,
    isRemovingBatch: removeTagsInBatchMutation.isPending,

    // Utilidades
    updateLeadTagsInCache
  };
}