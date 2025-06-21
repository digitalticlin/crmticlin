
import { useLeadsDatabase } from "./useLeadsDatabase";
import { useStageManagement } from "./useStageManagement";
import { useLeadCreation } from "./useLeadCreation";
import { useTagDatabase } from "./useTagDatabase";

export function useRealSalesFunnel(funnelId?: string) {
  const { leads, refetchLeads } = useLeadsDatabase(funnelId);
  const { tags } = useTagDatabase();
  
  const createLeadMutation = useLeadCreation();
  
  const { 
    moveToWonLost,
    moveLeadToStage,
    addColumn,
    updateColumn,
    deleteColumn 
  } = useStageManagement();

  const handleCreateLead = async (leadData: any) => {
    try {
      await createLeadMutation.mutateAsync(leadData);
      refetchLeads();
    } catch (error) {
      console.error("Erro ao criar lead:", error);
    }
  };

  const handleMoveToWonLost = async (leadId: string, status: "won" | "lost", value: number, note: string) => {
    try {
      await moveToWonLost.mutateAsync({ leadId, status, value, note });
      refetchLeads();
    } catch (error) {
      console.error("Erro ao mover lead:", error);
    }
  };

  return {
    leads,
    tags,
    createLead: handleCreateLead,
    isCreatingLead: createLeadMutation.isPending,
    moveToWonLost: handleMoveToWonLost,
    moveLeadToStage,
    addColumn,
    updateColumn,
    deleteColumn,
    refetchData: () => {
      refetchLeads();
    }
  };
}
