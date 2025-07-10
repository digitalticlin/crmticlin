
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
        userId: user.id
      });

      const { error } = await supabase
        .from('kanban_stages')
        .update({ 
          ai_enabled: enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', stageId)
        .eq('created_by_user_id', user.id); // Segurança adicional

      if (error) {
        console.error('[useAIStageControl] ❌ Erro ao atualizar status da IA:', error);
        throw error;
      }

      console.log('[useAIStageControl] ✅ Status da IA atualizado com sucesso');
      return { stageId, enabled };
    },
    onSuccess: ({ enabled }) => {
      // Invalidar queries para refrescar dados
      queryClient.invalidateQueries({ queryKey: ['stages'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-stages'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-leads'] });
      
      toast.success(
        `IA ${enabled ? 'ativada' : 'desativada'} para esta etapa!`,
        {
          description: enabled 
            ? 'A IA agora pode responder leads nesta etapa'
            : 'A IA não responderá leads nesta etapa'
        }
      );
    },
    onError: (error: any) => {
      console.error('[useAIStageControl] ❌ Erro na mutação:', error);
      toast.error('Erro ao alterar status da IA', {
        description: error.message || 'Tente novamente'
      });
    }
  });

  const toggleAI = (stageId: string, currentEnabled: boolean) => {
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
