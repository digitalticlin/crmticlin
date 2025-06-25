
import { useUserRole } from "@/hooks/useUserRole";
import { useFunnelManagement } from "@/hooks/salesFunnel/useFunnelManagement";
import { useExtendedSalesFunnel } from "@/hooks/salesFunnel/useExtendedSalesFunnel";
import { useState } from "react";

export function useSalesFunnelMain() {
  const { isAdmin, role } = useUserRole();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);
  
  const {
    funnels,
    selectedFunnel,
    setSelectedFunnel,
    createFunnel,
    loading: funnelLoading
  } = useFunnelManagement();

  // Usar dados reais do funil selecionado
  const extendedFunnelData = useExtendedSalesFunnel(selectedFunnel?.id);

  console.log('[SalesFunnelMain] 🔍 Estado real:', {
    funnelsCount: funnels.length,
    selectedFunnel: selectedFunnel ? { 
      id: selectedFunnel.id, 
      name: selectedFunnel.name 
    } : null,
    funnelLoading,
    isAdmin,
    role,
    realLeadsCount: extendedFunnelData.leads?.length || 0,
    realStagesCount: extendedFunnelData.stages?.length || 0
  });

  // Se não há funil selecionado, retornar estado básico
  if (!selectedFunnel || funnelLoading) {
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
      
      // Empty state
      columns: [],
      setColumns: () => {},
      selectedLead: null,
      isLeadDetailOpen: false,
      setIsLeadDetailOpen: () => {},
      availableTags: [],
      stages: [],
      leads: [],
      
      // Mock actions
      deleteColumn: () => {},
      openLeadDetail: () => {},
      toggleTagOnLead: () => {},
      wonStageId: undefined,
      lostStageId: undefined,
      refetchLeads: async () => {},
      refetchStages: async () => {},
      
      // Wrapped functions
      wrappedAddColumn: () => {},
      wrappedUpdateColumn: () => {},
      wrappedCreateTag: () => {},
      wrappedMoveLeadToStage: () => {},
      handleUpdateLeadNotes: () => {},
      handleUpdateLeadPurchaseValue: () => {},
      handleUpdateLeadAssignedUser: () => {},
      handleUpdateLeadName: () => {}
    };
  }

  // Usar dados reais do ExtendedSalesFunnel
  const handleOpenLeadDetail = (lead: any) => {
    setSelectedLead(lead);
    setIsLeadDetailOpen(true);
  };

  // Wrappers para compatibilidade
  const wrappers = {
    wrappedAddColumn: extendedFunnelData.addColumn || (() => {}),
    wrappedUpdateColumn: extendedFunnelData.updateColumn || (() => {}),
    wrappedCreateTag: extendedFunnelData.createTag || (() => {}),
    wrappedMoveLeadToStage: extendedFunnelData.moveLeadToStage || (() => {}),
    handleUpdateLeadNotes: extendedFunnelData.updateLeadNotes,
    handleUpdateLeadPurchaseValue: extendedFunnelData.updateLeadPurchaseValue,
    handleUpdateLeadAssignedUser: extendedFunnelData.updateLeadAssignedUser,
    handleUpdateLeadName: extendedFunnelData.updateLeadName
  };

  console.log('[SalesFunnelMain] ✅ Dados reais carregados:', {
    columnsCount: extendedFunnelData.columns?.length || 0,
    leadsCount: extendedFunnelData.leads?.length || 0,
    stagesCount: extendedFunnelData.stages?.length || 0,
    tagsCount: extendedFunnelData.availableTags?.length || 0
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
    
    // Real data do ExtendedSalesFunnel
    columns: extendedFunnelData.columns || [],
    setColumns: extendedFunnelData.setColumns,
    selectedLead: selectedLead || extendedFunnelData.selectedLead,
    isLeadDetailOpen: isLeadDetailOpen || extendedFunnelData.isLeadDetailOpen,
    setIsLeadDetailOpen: (open: boolean) => {
      setIsLeadDetailOpen(open);
      if (extendedFunnelData.setIsLeadDetailOpen) {
        extendedFunnelData.setIsLeadDetailOpen(open);
      }
    },
    availableTags: extendedFunnelData.availableTags || [],
    stages: extendedFunnelData.stages || [],
    leads: extendedFunnelData.leads || [],
    
    // Real Actions
    deleteColumn: extendedFunnelData.deleteColumn || (() => {}),
    openLeadDetail: handleOpenLeadDetail,
    toggleTagOnLead: extendedFunnelData.toggleTagOnLead,
    wonStageId: extendedFunnelData.wonStageId,
    lostStageId: extendedFunnelData.lostStageId,
    refetchLeads: extendedFunnelData.refetchLeads,
    refetchStages: extendedFunnelData.refetchStages,
    
    // Wrapped functions para compatibilidade
    ...wrappers
  };
}
