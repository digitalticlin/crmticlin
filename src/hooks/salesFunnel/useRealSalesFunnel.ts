
import { useCompanyData } from "../useCompanyData";
import { useStageDatabase } from "./useStageDatabase";
import { useLeadsDatabase } from "./useLeadsDatabase";
import { useTagDatabase } from "./useTagDatabase";
import { useKanbanColumns } from "./useKanbanColumns";
import { useLeadActions } from "./useLeadActions";
import { useStageManagement } from "./useStageManagement";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useRealSalesFunnel = (funnelId?: string) => {
  const { companyId } = useCompanyData();
  const { stages, refetchStages } = useStageDatabase(funnelId);
  const { leads, refetchLeads } = useLeadsDatabase(funnelId);
  const { tags, createTag } = useTagDatabase(companyId);

  const { columns, setColumns } = useKanbanColumns(stages, leads, funnelId);
  
  const {
    selectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    openLeadDetail,
    updateLeadNotes,
    updateLeadPurchaseValue,
    updateLeadAssignedUser,
    updateLeadName,
    toggleTagOnLead
  } = useLeadActions(funnelId);

  const {
    moveLeadToStage,
    addColumn,
    updateColumn,
    deleteColumn
  } = useStageManagement(funnelId, stages, setColumns, refetchStages, refetchLeads);

  // Encontrar IDs dos estágios de ganho e perdido
  const wonStageId = stages.find(s => s.is_won)?.id;
  const lostStageId = stages.find(s => s.is_lost)?.id;

  // Função para receber novo lead (usado quando vem do chat)
  const receiveNewLead = async (leadData: any) => {
    if (!funnelId) return;

    const entryStage = stages.find(s => s.title === "ENTRADA DE LEAD");
    if (!entryStage) return;

    try {
      const { error } = await supabase
        .from("leads")
        .update({
          kanban_stage_id: entryStage.id,
          funnel_id: funnelId
        })
        .eq("id", leadData.id);

      if (error) throw error;

      await refetchLeads();
      toast.success("Novo lead adicionado ao funil");
    } catch (error) {
      console.error("Erro ao adicionar lead ao funil:", error);
    }
  };

  return {
    // Estado
    columns,
    setColumns,
    selectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    
    // Dados do funil
    stages,
    leads, // Retornando leads totais
    availableTags: tags,
    wonStageId,
    lostStageId,
    
    // Ações do funil
    addColumn,
    updateColumn,
    deleteColumn,
    moveLeadToStage,
    
    // Ações do lead
    openLeadDetail,
    toggleTagOnLead: (leadId: string, tagId: string) => toggleTagOnLead(leadId, tagId, tags),
    updateLeadNotes,
    updateLeadPurchaseValue,
    updateLeadAssignedUser,
    updateLeadName,
    receiveNewLead,
    
    // Ações de tag
    createTag,
    
    // Funções de refresh
    refetchStages,
    refetchLeads
  };
};
