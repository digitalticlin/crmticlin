
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useDragAndDropDatabase = () => {
  const moveLeadToDatabase = async (leadId: string, newStageId: string) => {
    try {
      console.log(`Atualizando lead ${leadId} para estágio ${newStageId} no banco`);
      
      const { error } = await supabase
        .from("leads")
        .update({ kanban_stage_id: newStageId })
        .eq("id", leadId);

      if (error) throw error;
      console.log(`Lead ${leadId} movido para estágio ${newStageId} no banco com sucesso`);
    } catch (error) {
      console.error("Erro ao mover lead no banco:", error);
      throw error;
    }
  };

  const updateLeadPositionsInDatabase = async (stageId: string, leadIds: string[]) => {
    try {
      console.log(`Atualizando posições dos leads no estágio ${stageId}`);
      
      const updates = leadIds.map((leadId, index) => ({
        id: leadId,
        order_position: index
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("leads")
          .update({ order_position: update.order_position })
          .eq("id", update.id);

        if (error) throw error;
      }

      console.log(`Posições atualizadas com sucesso no estágio ${stageId}`);
    } catch (error) {
      console.error("Erro ao atualizar posições:", error);
      throw error;
    }
  };

  return {
    moveLeadToDatabase,
    updateLeadPositionsInDatabase
  };
};
