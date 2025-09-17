
/**
 * Hook isolado para controle de AI Toggle - SEM DEPENDÊNCIAS EXTERNAS
 * 
 * ISOLAMENTO TOTAL:
 * - Zero dependências de outros hooks do sales funnel
 * - Lógica própria de autenticação
 * - Sem conflitos com outras funcionalidades
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';

export const useAIStageControl = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [isLoading, setIsLoading] = useState(false);

  const toggleAI = async (stageId: string, newEnabled: boolean) => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return false;
    }

    setIsLoading(true);

    console.log('[useAIStageControl] 🤖 Alterando status da IA:', {
      stageId,
      newEnabled,
      userId: user.id
    });

    try {
      // 1. Verificar se o estágio existe e pertence ao usuário
      const { data: existingStage, error: fetchError } = await supabase
        .from('kanban_stages')
        .select('id, title, ai_enabled, funnel_id, created_by_user_id')
        .eq('id', stageId)
        .eq('created_by_user_id', user.id)
        .single();

      if (fetchError || !existingStage) {
        console.error('[useAIStageControl] ❌ Erro ao buscar estágio:', fetchError);
        toast.error('Estágio não encontrado ou sem permissão');
        return false;
      }

      // 2. Atualizar o status da IA
      const { error: updateError } = await supabase
        .from('kanban_stages')
        .update({ 
          ai_enabled: newEnabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', stageId)
        .eq('created_by_user_id', user.id);

      if (updateError) {
        console.error('[useAIStageControl] ❌ Erro ao atualizar status da IA:', updateError);
        toast.error('Erro ao alterar status da IA');
        return false;
      }

      console.log('[useAIStageControl] ✅ Status da IA atualizado:', {
        stageId,
        stageTitle: existingStage.title,
        newEnabled
      });

      toast.success(
        `IA ${newEnabled ? 'ativada' : 'desativada'} para "${existingStage.title}"!`,
        {
          description: newEnabled 
            ? '🤖 A IA agora pode responder leads nesta etapa'
            : '🔴 A IA não responderá leads nesta etapa',
          duration: 3000,
        }
      );

      return true;

    } catch (error) {
      console.error('[useAIStageControl] ❌ Erro crítico:', error);
      toast.error('Erro inesperado ao alterar status da IA');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    toggleAI,
    isLoading,
    canToggleAI: !!user?.id && isAdmin
  };
};
