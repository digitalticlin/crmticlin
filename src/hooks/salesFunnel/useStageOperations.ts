
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useStageOperations = () => {
  const { user } = useAuth();

  // 🚀 IMPLEMENTAÇÃO REAL: Adicionar nova etapa no banco de dados
  const addColumnWrapper = useCallback(async (title: string, color: string = "#3b82f6", selectedFunnelId?: string): Promise<void> => {
    console.log('[useStageOperations] ➕ Criando nova etapa:', { title, color });
    
    if (!user?.id || !selectedFunnelId) {
      toast.error("Usuário ou funil não selecionado");
      return;
    }

    try {
      // Calcular próxima posição (maior posição + 1)
      const { data: stages } = await supabase
        .from('kanban_stages')
        .select('order_position')
        .eq('funnel_id', selectedFunnelId);

      const maxPosition = Math.max(
        ...(stages?.map(s => s.order_position || 0) || [0])
      );
      const nextPosition = maxPosition + 1;

      // Inserir nova etapa no banco COM IA DESABILITADA POR PADRÃO
      const { data: newStage, error } = await supabase
        .from('kanban_stages')
        .insert([{
          title: title.trim(),
          color: color,
          order_position: nextPosition,
          funnel_id: selectedFunnelId,
          created_by_user_id: user.id,
          is_fixed: false,
          is_won: false,
          is_lost: false,
          ai_enabled: false // PADRÃO OFF
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('[useStageOperations] ✅ Etapa criada:', newStage);
      
      toast.success(`Etapa "${title}" criada com sucesso!`, {
        description: "A nova etapa já está disponível no funil (IA desabilitada por padrão)"
      });

    } catch (error: any) {
      console.error('[useStageOperations] ❌ Erro ao criar etapa:', error);
      toast.error("Erro ao criar etapa", {
        description: error.message || "Tente novamente"
      });
      throw error;
    }
  }, [user?.id]);

  // 🚀 IMPLEMENTAÇÃO REAL: Atualizar etapa existente no banco de dados
  const updateColumnWrapper = useCallback(async (column: any): Promise<void> => {
    console.log('[useStageOperations] ✏️ Atualizando etapa:', { 
      id: column.id,
      title: column.title, 
      color: column.color 
    });
    
    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    try {
      // Atualizar etapa no banco
      const { error } = await supabase
        .from('kanban_stages')
        .update({
          title: column.title.trim(),
          color: column.color,
          updated_at: new Date().toISOString()
        })
        .eq('id', column.id)
        .eq('created_by_user_id', user.id); // Segurança adicional

      if (error) throw error;

      console.log('[useStageOperations] ✅ Etapa atualizada:', column.title);
      
      toast.success(`Etapa "${column.title}" atualizada com sucesso!`, {
        description: "As alterações foram salvas"
      });

    } catch (error: any) {
      console.error('[useStageOperations] ❌ Erro ao atualizar etapa:', error);
      toast.error("Erro ao atualizar etapa", {
        description: error.message || "Tente novamente"
      });
      throw error;
    }
  }, [user?.id]);

  // 🚀 IMPLEMENTAÇÃO REAL: Excluir etapa do banco de dados
  const deleteColumnWrapper = useCallback(async (columnId: string): Promise<void> => {
    console.log('[useStageOperations] 🗑️ Excluindo etapa:', columnId);
    
    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    try {
      // Verificar se a etapa tem leads associados
      const { data: leadsCount, error: countError } = await supabase
        .from('leads')
        .select('id', { count: 'exact' })
        .eq('kanban_stage_id', columnId);

      if (countError) throw countError;

      if (leadsCount && leadsCount.length > 0) {
        toast.error("Não é possível excluir etapa com leads", {
          description: `Esta etapa possui ${leadsCount.length} lead(s). Mova-os primeiro.`
        });
        return;
      }

      // Excluir etapa do banco
      const { error } = await supabase
        .from('kanban_stages')
        .delete()
        .eq('id', columnId)
        .eq('created_by_user_id', user.id); // Segurança adicional

      if (error) throw error;

      console.log('[useStageOperations] ✅ Etapa excluída:', columnId);
      
      toast.success("Etapa excluída com sucesso!", {
        description: "A etapa foi removida do funil"
      });

    } catch (error: any) {
      console.error('[useStageOperations] ❌ Erro ao excluir etapa:', error);
      toast.error("Erro ao excluir etapa", {
        description: error.message || "Tente novamente"
      });
      throw error;
    }
  }, [user?.id]);

  return {
    addColumnWrapper,
    updateColumnWrapper,
    deleteColumnWrapper
  };
};
