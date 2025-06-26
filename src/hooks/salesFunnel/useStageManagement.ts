
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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

      // Update lead to remove from kanban
      const { error: leadError } = await supabase
        .from("leads")
        .update({ kanban_stage_id: null })
        .eq("id", leadId);

      if (leadError) throw leadError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-leads"] });
      queryClient.invalidateQueries({ queryKey: ["client-deals"] });
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

    const { error } = await supabase
      .from("leads")
      .update({ kanban_stage_id: stageId })
      .eq("id", leadId);

    if (error) throw error;

    queryClient.invalidateQueries({ queryKey: ["kanban-leads"] });
  };

  const addColumn = async (title: string, color: string, funnelId: string) => {
    if (!user?.id) {
      throw new Error("Usuário não autenticado");
    }

    // Verificar se não é um título reservado para estágios fixos
    const reservedTitles = ['GANHO', 'PERDIDO', 'Entrada de Leads'];
    if (reservedTitles.includes(title)) {
      throw new Error("Este nome é reservado para estágios do sistema");
    }

    // Buscar a próxima posição
    const { data: stages } = await supabase
      .from("kanban_stages")
      .select("order_position")
      .eq("funnel_id", funnelId)
      .order("order_position", { ascending: false })
      .limit(1);

    const nextPosition = stages && stages.length > 0 ? stages[0].order_position + 1 : 1;

    const { error } = await supabase
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
      });

    if (error) throw error;

    // Invalidar queries relacionadas
    queryClient.invalidateQueries({ queryKey: ["stages"] });
    queryClient.invalidateQueries({ queryKey: ["kanban-stages"] });
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

    queryClient.invalidateQueries({ queryKey: ["stages"] });
    queryClient.invalidateQueries({ queryKey: ["kanban-stages"] });
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

    queryClient.invalidateQueries({ queryKey: ["stages"] });
    queryClient.invalidateQueries({ queryKey: ["kanban-stages"] });
  };

  const refreshColumns = async () => {
    queryClient.invalidateQueries({ queryKey: ["stages"] });
    queryClient.invalidateQueries({ queryKey: ["kanban-stages"] });
  };

  return { 
    moveToWonLost, 
    moveLeadToStage,
    addColumn,
    updateColumn,
    deleteColumn,
    refreshColumns
  };
}
