
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useDataFilters } from '@/hooks/useDataFilters';
import { useAccessControl } from '@/hooks/useAccessControl';

export const useAIStageControl = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const dataFilters = useDataFilters();
  const { userFunnels } = useAccessControl();

  const toggleAIMutation = useMutation({
    mutationFn: async ({ stageId, enabled }: { stageId: string; enabled: boolean }) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      if (dataFilters.loading || !dataFilters.role) {
        throw new Error('Carregando permissões do usuário...');
      }

      console.log('[useAIStageControl] 🤖 Alterando status da IA:', {
        stageId,
        enabled,
        userId: user.id,
        timestamp: new Date().toISOString()
      });

      // 🚀 CORREÇÃO: Verificar permissão baseada no role do usuário
      console.log('[useAIStageControl] 🔍 Verificando permissões:', {
        role: dataFilters.role,
        userFunnels: userFunnels,
        stageId
      });

      let stageQuery = supabase
        .from('kanban_stages')
        .select('id, title, ai_enabled, funnel_id, created_by_user_id')
        .eq('id', stageId);

      // Aplicar filtros baseados no role
      if (dataFilters.role === 'admin') {
        stageQuery = stageQuery.eq('created_by_user_id', user.id);
      } else if (dataFilters.role === 'operational') {
        // Operacional: pode alterar etapas dos funis atribuídos
        if (userFunnels.length === 0) {
          throw new Error('Usuário operacional sem funis atribuídos');
        }
        stageQuery = stageQuery.in('funnel_id', userFunnels);
      }

      const { data: existingStage, error: fetchError } = await stageQuery.single();

      if (fetchError) {
        console.error('[useAIStageControl] ❌ Erro ao buscar etapa:', fetchError);
        throw new Error('Etapa não encontrada ou sem permissão');
      }

      console.log('[useAIStageControl] 📋 Etapa encontrada:', {
        stageTitle: existingStage.title,
        currentAIEnabled: existingStage.ai_enabled,
        newAIEnabled: enabled
      });

      // 🚀 CORREÇÃO: Atualizar status da IA com filtros por role
      let updateQuery = supabase
        .from('kanban_stages')
        .update({ 
          ai_enabled: enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', stageId);

      // Aplicar filtros baseados no role
      if (dataFilters.role === 'admin') {
        updateQuery = updateQuery.eq('created_by_user_id', user.id);
      } else if (dataFilters.role === 'operational') {
        // Operacional: pode atualizar etapas dos funis atribuídos
        updateQuery = updateQuery.in('funnel_id', userFunnels);
      }

      const { error } = await updateQuery;

      if (error) {
        console.error('[useAIStageControl] ❌ Erro ao atualizar status da IA:', error);
        throw error;
      }

      console.log('[useAIStageControl] ✅ Status da IA atualizado com sucesso:', {
        stageId,
        stageTitle: existingStage.title,
        enabled
      });
      
      return { 
        stageId, 
        enabled, 
        stageTitle: existingStage.title,
        funnelId: existingStage.funnel_id 
      };
    },
    onSuccess: ({ enabled, stageTitle }) => {
      // Invalidar queries para refrescar dados
      queryClient.invalidateQueries({ queryKey: ['stages'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-stages'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-leads'] });
      queryClient.invalidateQueries({ queryKey: ['sales-funnel'] });
      
      toast.success(
        `IA ${enabled ? 'ativada' : 'desativada'} para "${stageTitle}"!`,
        {
          description: enabled 
            ? '🤖 A IA agora pode responder leads nesta etapa'
            : '🔴 A IA não responderá leads nesta etapa',
          duration: 4000,
        }
      );
    },
    onError: (error: any) => {
      console.error('[useAIStageControl] ❌ Erro na mutação:', error);
      toast.error('Erro ao alterar status da IA', {
        description: error.message || 'Tente novamente em alguns segundos',
        duration: 5000,
      });
    }
  });

  const toggleAI = (stageId: string, currentEnabled: boolean) => {
    console.log('[useAIStageControl] 🔄 Iniciando toggle de IA:', {
      stageId,
      currentEnabled,
      newEnabled: !currentEnabled
    });
    
    toggleAIMutation.mutate({
      stageId,
      enabled: !currentEnabled
    });
  };

  return {
    toggleAI,
    isLoading: toggleAIMutation.isPending,
    canToggleAI: !dataFilters.loading && !!dataFilters.role
  };
};
