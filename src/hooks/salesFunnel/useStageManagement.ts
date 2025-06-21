
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
      .eq("id", leadId)
      .eq("created_by_user_id", user.id);

    if (error) throw error;

    queryClient.invalidateQueries({ queryKey: ["kanban-leads"] });
  };

  const addColumn = async (title: string, color: string, funnelId: string) => {
    if (!user?.id) {
      throw new Error("Usuário não autenticado");
    }

    const { error } = await supabase
      .from("kanban_stages")
      .insert({
        title,
        color,
        funnel_id: funnelId,
        created_by_user_id: user.id,
      });

    if (error) throw error;

    queryClient.invalidateQueries({ queryKey: ["stages"] });
  };

  const updateColumn = async (columnId: string, updates: any) => {
    if (!user?.id) {
      throw new Error("Usuário não autenticado");
    }

    const { error } = await supabase
      .from("kanban_stages")
      .update(updates)
      .eq("id", columnId)
      .eq("created_by_user_id", user.id);

    if (error) throw error;

    queryClient.invalidateQueries({ queryKey: ["stages"] });
  };

  const deleteColumn = async (columnId: string) => {
    if (!user?.id) {
      throw new Error("Usuário não autenticado");
    }

    const { error } = await supabase
      .from("kanban_stages")
      .delete()
      .eq("id", columnId)
      .eq("created_by_user_id", user.id);

    if (error) throw error;

    queryClient.invalidateQueries({ queryKey: ["stages"] });
  };

  return { 
    moveToWonLost, 
    moveLeadToStage,
    addColumn,
    updateColumn,
    deleteColumn
  };
}
