
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { salesFunnelStagesQueryKeys, salesFunnelLeadsQueryKeys } from "./queryKeys";

export function useStageManagement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const moveToWonLost = useMutation({
    mutationFn: async ({ 
      leadId, 
      status, 
      value, 
      note 
    }: { 
      leadId: string; 
      status: "won" | "lost"; 
      value: number; 
      note: string; 
    }) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      // Create deal record
      const { error: dealError } = await supabase
        .from("deals")
        .insert({
          lead_id: leadId,
          status,
          value,
          date: new Date().toISOString(),
          note,
          created_by_user_id: user.id,
        });

      if (dealError) throw dealError;

      // Mover lead para estágio GANHO/PERDIDO (não deixar null)
      // Buscar estágio correspondente
      const { data: stageData, error: stageErr } = await supabase
        .from('kanban_stages')
        .select('id')
        .eq(status === 'won' ? 'is_won' : 'is_lost', true)
        .eq('created_by_user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (stageErr) throw stageErr;

      const targetStageId = stageData?.id || null;

      const { error: leadError } = await supabase
        .from("leads")
        .update({ kanban_stage_id: targetStageId })
        .eq("id", leadId);

      if (leadError) throw leadError;
    },
    onSuccess: () => {
      // 🔴 REMOVIDO: Invalidações globais causavam conflito com drag and drop
      // Usar apenas queries específicas e isoladas quando necessário
      // queryClient.invalidateQueries({ queryKey: ["leads"] });
      // queryClient.invalidateQueries({ queryKey: ["kanban-leads"] });
      // queryClient.invalidateQueries({ queryKey: ["client-deals"] });
      toast.success("Lead movido com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao mover lead:", error);
      toast.error("Erro ao processar lead");
    },
  });

  const moveLeadToStage = async (leadId: string, stageId: string) => {
    if (!user?.id) {
      throw new Error("Usuário não autenticado");
    }

    console.log('[useStageManagement] 🔄 Movendo lead:', { leadId, stageId });

    const { error } = await supabase
      .from("leads")
      .update({ kanban_stage_id: stageId })
      .eq("id", leadId);

    if (error) {
      console.error('[useStageManagement] ❌ Erro ao mover lead:', error);
      throw error;
    }

    console.log('[useStageManagement] ✅ Lead movido com sucesso');
    // 🔴 REMOVIDO: Invalidação global causava conflito com drag and drop
    // queryClient.invalidateQueries({ queryKey: ["kanban-leads"] });
  };

  const addColumn = async (title: string, color: string, funnelId: string) => {
    if (!user?.id) {
      throw new Error("Usuário não autenticado");
    }

    console.log('[useStageManagement] Iniciando criação de etapa:', {
      title,
      color,
      funnelId,
      userId: user.id
    });

    // Verificar se não é um título reservado para estágios fixos
    const reservedTitles = ['GANHO', 'PERDIDO', 'Entrada de Leads'];
    if (reservedTitles.includes(title)) {
      throw new Error("Este nome é reservado para estágios do sistema");
    }

    try {
      // Buscar a próxima posição
      const { data: stages, error: stagesError } = await supabase
        .from("kanban_stages")
        .select("order_position")
        .eq("funnel_id", funnelId)
        .order("order_position", { ascending: false })
        .limit(1);

      if (stagesError) {
        console.error('[useStageManagement] Erro ao buscar stages:', stagesError);
        throw stagesError;
      }

      const nextPosition = stages && stages.length > 0 ? stages[0].order_position + 1 : 1;

      console.log('[useStageManagement] Próxima posição calculada:', nextPosition);

      // Inserir novo estágio
      const { data: newStage, error: insertError } = await supabase
        .from("kanban_stages")
        .insert({
          title,
          color,
          funnel_id: funnelId,
          created_by_user_id: user.id,
          is_fixed: false,
          is_won: false,
          is_lost: false,
          order_position: nextPosition
        })
        .select()
        .single();

      if (insertError) {
        console.error('[useStageManagement] Erro ao inserir stage:', insertError);
        throw insertError;
      }

      console.log('[useStageManagement] Stage criado com sucesso:', newStage);

      // Invalidar queries relacionadas para forçar atualização
      // 🔴 REMOVIDO: Invalidações globais causavam conflito com drag and drop  
      // queryClient.invalidateQueries({ queryKey: ["stages"] });
      // queryClient.invalidateQueries({ queryKey: ["kanban-stages"] });
      // 🔴 REMOVIDO: Invalidação global causava conflito com drag and drop
    // queryClient.invalidateQueries({ queryKey: ["kanban-leads"] });

      return newStage;
    } catch (error) {
      console.error('[useStageManagement] Erro geral ao criar etapa:', error);
      throw error;
    }
  };

  const updateColumn = async (columnId: string, updates: any) => {
    if (!user?.id) {
      throw new Error("Usuário não autenticado");
    }

    // Verificar se o estágio é fixo antes de permitir edição
    const { data: stage } = await supabase
      .from("kanban_stages")
      .select("is_fixed, title")
      .eq("id", columnId)
      .single();

    if (stage?.is_fixed) {
      throw new Error("Estágios fixos não podem ser modificados");
    }

    // Verificar se não está tentando usar um título reservado
    if (updates.title) {
      const reservedTitles = ['GANHO', 'PERDIDO', 'Entrada de Leads'];
      if (reservedTitles.includes(updates.title)) {
        throw new Error("Este nome é reservado para estágios do sistema");
      }
    }

    const { error } = await supabase
      .from("kanban_stages")
      .update(updates)
      .eq("id", columnId);

    if (error) throw error;

    // ✅ ISOLAMENTO: Usar query keys específicas do Sales Funnel apenas
    queryClient.invalidateQueries({ queryKey: salesFunnelStagesQueryKeys.base });
    queryClient.invalidateQueries({ queryKey: salesFunnelLeadsQueryKeys.base });
  };

  const deleteColumn = async (columnId: string) => {
    if (!user?.id) {
      throw new Error("Usuário não autenticado");
    }

    // Verificar se o estágio é fixo antes de permitir exclusão
    const { data: stage } = await supabase
      .from("kanban_stages")
      .select("is_fixed, title")
      .eq("id", columnId)
      .single();

    if (stage?.is_fixed) {
      throw new Error("Estágios fixos não podem ser removidos");
    }

    const { error } = await supabase
      .from("kanban_stages")
      .delete()
      .eq("id", columnId);

    if (error) throw error;

    // ✅ ISOLAMENTO: Usar query keys específicas do Sales Funnel apenas
    queryClient.invalidateQueries({ queryKey: salesFunnelStagesQueryKeys.base });
    queryClient.invalidateQueries({ queryKey: salesFunnelLeadsQueryKeys.base });
  };

  const refreshColumns = async () => {
    // ✅ ISOLAMENTO: Usar query keys específicas do Sales Funnel apenas
    queryClient.invalidateQueries({ queryKey: salesFunnelStagesQueryKeys.base });
    queryClient.invalidateQueries({ queryKey: salesFunnelLeadsQueryKeys.base });
  };

  // NOVA FUNÇÃO: Garantir que novos leads sempre tenham uma etapa
  const ensureLeadStage = async (leadId: string, funnelId: string) => {
    if (!user?.id) return;

    try {
      // Verificar se o lead já tem uma etapa
      const { data: leadData } = await supabase
        .from("leads")
        .select("kanban_stage_id")
        .eq("id", leadId)
        .single();

      if (leadData?.kanban_stage_id) {
        console.log('[useStageManagement] ✅ Lead já possui etapa:', leadData.kanban_stage_id);
        return leadData.kanban_stage_id;
      }

      // Buscar a primeira etapa do funil
      const { data: firstStage } = await supabase
        .from("kanban_stages")
        .select("id")
        .eq("funnel_id", funnelId)
        .eq("title", "Entrada de Leads")
        .single();

      let stageId = firstStage?.id;

      // Se não encontrar "Entrada de Leads", usar a primeira etapa por posição
      if (!stageId) {
        const { data: stages } = await supabase
          .from("kanban_stages")
          .select("id")
          .eq("funnel_id", funnelId)
          .order("order_position")
          .limit(1);

        stageId = stages?.[0]?.id;
      }

      if (stageId) {
        console.log('[useStageManagement] 🔧 Atribuindo etapa ao lead:', { leadId, stageId });
        
        const { error: updateError } = await supabase
          .from("leads")
          .update({ kanban_stage_id: stageId })
          .eq("id", leadId);

        if (updateError) {
          console.error('[useStageManagement] ❌ Erro ao atribuir etapa:', updateError);
          throw updateError;
        }

        // 🔴 REMOVIDO: Invalidação global causava conflito com drag and drop
    // queryClient.invalidateQueries({ queryKey: ["kanban-leads"] });
        return stageId;
      }
    } catch (error) {
      console.error('[useStageManagement] ❌ Erro ao garantir etapa do lead:', error);
      throw error;
    }
  };

  return { 
    moveToWonLost, 
    moveLeadToStage,
    addColumn,
    updateColumn,
    deleteColumn,
    refreshColumns,
    ensureLeadStage
  };
}
