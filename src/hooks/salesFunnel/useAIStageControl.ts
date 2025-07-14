
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useAIStageControl = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const toggleAIMutation = useMutation({
    mutationFn: async ({ stageId, enabled }: { stageId: string; enabled: boolean }) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      console.log('[useAIStageControl] 🤖 Alterando status da IA:', {
        stageId,
        enabled,
        userId: user.id,
        timestamp: new Date().toISOString()
      });

      // Primeiro, verificar se a etapa existe e pertence ao usuário
      const { data: existingStage, error: fetchError } = await supabase
        .from('kanban_stages')
        .select('id, title, ai_enabled, funnel_id')
        .eq('id', stageId)
        .eq('created_by_user_id', user.id)
        .single();

      if (fetchError) {
        console.error('[useAIStageControl] ❌ Erro ao buscar etapa:', fetchError);
        throw new Error('Etapa não encontrada ou sem permissão');
      }

      console.log('[useAIStageControl] 📋 Etapa encontrada:', {
        stageTitle: existingStage.title,
        currentAIEnabled: existingStage.ai_enabled,
        newAIEnabled: enabled
      });

      // Atualizar o status da IA
      const { error } = await supabase
        .from('kanban_stages')
        .update({ 
          ai_enabled: enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', stageId)
        .eq('created_by_user_id', user.id);

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
    isLoading: toggleAIMutation.isPending
  };
};
