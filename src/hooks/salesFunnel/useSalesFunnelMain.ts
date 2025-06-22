
import { useUserRole } from "@/hooks/useUserRole";
import { useExtendedSalesFunnel } from "@/hooks/salesFunnel/useExtendedSalesFunnel";
import { useNewLeadIntegration } from "@/hooks/salesFunnel/useNewLeadIntegration";
import { useFunnelManagement } from "@/hooks/salesFunnel/useFunnelManagement";
import { useSalesFunnelWrappers } from "./useSalesFunnelWrappers";

export function useSalesFunnelMain() {
  const { isAdmin, role } = useUserRole();
  
  const {
    funnels,
    selectedFunnel,
    setSelectedFunnel,
    createFunnel: originalCreateFunnel,
    loading: funnelLoading
  } = useFunnelManagement();

  const {
    selectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    availableTags,
    stages,
    leads,
    columns,
    setColumns,
    addColumn,
    updateColumn,
    deleteColumn,
    openLeadDetail,
    toggleTagOnLead,
    createTag: createTagMutation,
    updateLeadNotes,
    updateLeadPurchaseValue,
    updateLeadAssignedUser,
    updateLeadName,
    moveLeadToStage: originalMoveLeadToStage,
    wonStageId,
    lostStageId,
    refetchLeads,
    refetchStages
  } = useExtendedSalesFunnel(selectedFunnel?.id);

  useNewLeadIntegration(selectedFunnel?.id);

  console.log('[SalesFunnelMain] 🔍 Estado completo:', {
    funnelsCount: funnels.length,
    selectedFunnel: selectedFunnel ? { 
      id: selectedFunnel.id, 
      name: selectedFunnel.name 
    } : null,
    funnelLoading,
    isAdmin,
    role,
    stagesCount: stages?.length || 0,
    stagesDetails: stages?.map(s => ({ 
      id: s.id, 
      title: s.title, 
      order: s.order_position,
      isWon: s.is_won,
      isLost: s.is_lost,
      isFixed: s.is_fixed
    })),
    leadsCount: leads?.length || 0,
    leadsDetails: leads?.map(l => ({
      id: l.id,
      name: l.name,
      columnId: l.columnId
    })),
    columnsCount: columns.length,
    columnsDetails: columns.map(c => ({
      id: c.id,
      title: c.title,
      leadsCount: c.leads.length
    }))
  });

  // Wrapper function to match the expected interface
  const createFunnel = async (name: string, description?: string): Promise<void> => {
    try {
      console.log('[SalesFunnelMain] 📝 Criando funil:', { name, description, isAdmin, role });
      await originalCreateFunnel(name, description);
    } catch (error) {
      console.error('[SalesFunnelMain] ❌ Erro ao criar funil:', error);
      throw error;
    }
  };

  const wrappers = useSalesFunnelWrappers({
    selectedFunnel,
    selectedLead,
    addColumn,
    updateColumn,
    createTagMutation,
    originalMoveLeadToStage,
    updateLeadNotes,
    updateLeadPurchaseValue,
    updateLeadAssignedUser,
    updateLeadName
  });

  return {
    // Basic state
    isAdmin,
    role,
    funnelLoading,
    
    // Funnel data
    funnels,
    selectedFunnel,
    setSelectedFunnel,
    createFunnel,
    
    // Kanban data
    columns,
    setColumns,
    selectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    availableTags,
    stages,
    leads,
    
    // Actions
    deleteColumn,
    openLeadDetail,
    toggleTagOnLead,
    wonStageId,
    lostStageId,
    refetchLeads,
    refetchStages,
    
    // Wrapped functions
    ...wrappers
  };
}
