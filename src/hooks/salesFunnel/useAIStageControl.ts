/**
 * 🎯 HOOK DE MUTAÇÃO - CONTROLE DE AI TOGGLE
 *
 * ARQUITETURA REFATORADA:
 * ✅ Usa useMutation do React Query
 * ✅ Optimistic updates no cache compartilhado
 * ✅ Rollback automático em caso de erro
 * ✅ Invalidação de cache após sucesso
 *
 * RESPONSABILIDADES:
 * ✅ Toggle AI enabled/disabled de stages
 * ✅ Atualizar cache otimisticamente (UI instantânea)
 * ✅ Sincronizar com servidor
 * ✅ Reverter mudanças em caso de erro
 *
 * NÃO FAZ:
 * ❌ Query de leitura (useFunnelStages faz isso)
 * ❌ Manipular realtime (useFunnelData faz isso)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import { funnelDataQueryKeys } from './core/useFunnelData';

interface ToggleAIMutationParams {
  stageId: string;
  currentEnabled: boolean;
  funnelId: string;
}

export const useAIStageControl = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const queryClient = useQueryClient();

  // ✅ MUTATION com optimistic updates
  const mutation = useMutation({
    mutationFn: async ({ stageId, currentEnabled }: ToggleAIMutationParams) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const newEnabled = !currentEnabled;

      console.log('[useAIStageControl] 🤖 Executando mutação no servidor:', {
        stageId,
        currentEnabled,
        newEnabled,
        userId: user.id
      });

      // Atualizar servidor
      const { data, error } = await supabase
        .from('kanban_stages')
        .update({
          ai_enabled: newEnabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', stageId)
        .eq('created_by_user_id', user.id)
        .select('id, title, ai_enabled')
        .single();

      if (error) throw error;

      return { stage: data, newEnabled };
    },

    // ✅ OPTIMISTIC UPDATE - Atualiza UI ANTES do servidor responder
    onMutate: async ({ stageId, currentEnabled, funnelId }) => {
      const newEnabled = !currentEnabled;

      console.log('[useAIStageControl] ⚡ Optimistic update INICIADO:', {
        stageId,
        currentEnabled,
        newEnabled
      });

      // Cancelar queries em andamento para evitar conflitos
      const queryKey = funnelDataQueryKeys.byId(funnelId);
      await queryClient.cancelQueries({ queryKey });

      // Snapshot do cache anterior (para rollback)
      const previousData = queryClient.getQueryData(queryKey);

      // ✅ UPDATE OTIMISTA no cache compartilhado
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;

        return {
          ...old,
          stages: old.stages.map((stage: any) =>
            stage.id === stageId
              ? { ...stage, ai_enabled: newEnabled }
              : stage
          )
        };
      });

      console.log('[useAIStageControl] ✅ Cache atualizado otimisticamente');

      // Retornar contexto para rollback
      return { previousData, queryKey };
    },

    // ✅ ERRO - Reverter cache para estado anterior
    onError: (error: any, variables, context) => {
      console.error('[useAIStageControl] ❌ Erro na mutação - fazendo ROLLBACK:', error);

      if (context?.previousData && context?.queryKey) {
        // Reverter cache
        queryClient.setQueryData(context.queryKey, context.previousData);
        console.log('[useAIStageControl] ⏪ Rollback executado');
      }

      toast.error('Erro ao alterar status da IA', {
        description: error.message || 'Tente novamente'
      });
    },

    // ✅ SUCESSO - Invalidar cache para resincronizar
    onSuccess: (data, variables, context) => {
      console.log('[useAIStageControl] ✅ Mutação bem-sucedida no servidor:', data);

      // Invalidar cache para refetch e garantir sincronização
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }

      toast.success(
        `IA ${data.newEnabled ? 'ativada' : 'desativada'} para "${data.stage.title}"!`,
        {
          description: data.newEnabled
            ? '🤖 A IA agora pode responder leads nesta etapa'
            : '🔴 A IA não responderá leads nesta etapa',
          duration: 3000,
        }
      );
    }
  });

  // Interface compatível com código existente
  const toggleAI = async (stageId: string, currentEnabled: boolean) => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return false;
    }

    // Buscar funnelId do stage
    const { data: stage } = await supabase
      .from('kanban_stages')
      .select('funnel_id')
      .eq('id', stageId)
      .single();

    if (!stage?.funnel_id) {
      toast.error('Etapa não encontrada');
      return false;
    }

    try {
      await mutation.mutateAsync({
        stageId,
        currentEnabled,
        funnelId: stage.funnel_id
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  return {
    toggleAI,
    isLoading: mutation.isPending,
    canToggleAI: !!user?.id && isAdmin
  };
};
