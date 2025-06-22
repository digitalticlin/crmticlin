import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useDragAndDropDatabase = () => {
  const moveLeadToDatabase = async (leadId: string, newStageId: string) => {
    try {
      console.log(`[useDragAndDropDatabase] 🔄 Atualizando lead ${leadId} para estágio ${newStageId} no banco`);
      
      if (!leadId || !newStageId) {
        console.error('[useDragAndDropDatabase] ❌ ID do lead ou estágio inválido:', { leadId, newStageId });
        throw new Error('ID do lead ou estágio inválido');
      }
      
      const { error } = await supabase
        .from("leads")
        .update({ kanban_stage_id: newStageId })
        .eq("id", leadId);

      if (error) throw error;
      console.log(`[useDragAndDropDatabase] ✅ Lead ${leadId} movido para estágio ${newStageId} no banco com sucesso`);
    } catch (error) {
      console.error("[useDragAndDropDatabase] ❌ Erro ao mover lead no banco:", error);
      throw error;
    }
  };

  const updateLeadPositionsInDatabase = async (stageId: string, leadIds: string[]) => {
    try {
      console.log(`[useDragAndDropDatabase] 🔄 Atualizando posições dos leads no estágio ${stageId}`);
      
      if (!stageId || !leadIds || leadIds.length === 0) {
        console.error('[useDragAndDropDatabase] ❌ ID do estágio ou leads inválidos:', { stageId, leadIdsCount: leadIds?.length });
        return; // Não lançar erro para não quebrar a UI
      }
      
      const updates = leadIds.map((leadId, index) => ({
        id: leadId,
        order_position: index
      }));

      for (const update of updates) {
        if (!update.id) continue; // Pular leads sem ID
        
        const { error } = await supabase
          .from("leads")
          .update({ order_position: update.order_position })
          .eq("id", update.id);

        if (error) {
          console.error(`[useDragAndDropDatabase] ❌ Erro ao atualizar posição do lead ${update.id}:`, error);
          // Continuar tentando atualizar os outros leads
        }
      }

      console.log(`[useDragAndDropDatabase] ✅ Posições atualizadas com sucesso no estágio ${stageId}`);
    } catch (error) {
      console.error("[useDragAndDropDatabase] ❌ Erro ao atualizar posições:", error);
      // Não propagar o erro para evitar quebrar a UI
    }
  };

  return {
    moveLeadToDatabase,
    updateLeadPositionsInDatabase
  };
};
