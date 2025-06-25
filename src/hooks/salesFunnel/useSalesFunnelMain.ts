
import { useUserRole } from "@/hooks/useUserRole";
import { useFunnelManagement } from "@/hooks/salesFunnel/useFunnelManagement";
import { useExtendedSalesFunnel } from "@/hooks/salesFunnel/useExtendedSalesFunnel";

export function useSalesFunnelMain() {
  const { isAdmin, role } = useUserRole();
  
  const {
    funnels,
    selectedFunnel,
    setSelectedFunnel,
    createFunnel,
    loading: funnelLoading
  } = useFunnelManagement();

  // Usar dados reais através do useExtendedSalesFunnel
  const extendedFunnelData = useExtendedSalesFunnel(selectedFunnel?.id);

  console.log('[SalesFunnelMain] 🔍 Estado real do funil:', {
    funnelsCount: funnels?.length || 0,
    selectedFunnel: selectedFunnel ? { 
      id: selectedFunnel.id, 
      name: selectedFunnel.name 
    } : null,
    funnelLoading,
    isAdmin,
    role,
    realLeadsCount: extendedFunnelData.leads?.length || 0,
    realStagesCount: extendedFunnelData.stages?.length || 0,
    realColumnsCount: extendedFunnelData.columns?.length || 0
  });

  // Estado de carregamento inicial ou sem funil selecionado
  if (funnelLoading || !selectedFunnel) {
    return {
      // Basic state
      isAdmin,
      role,
      funnelLoading: funnelLoading || true,
      
      // Funnel data
      funnels: funnels || [],
      selectedFunnel,
      setSelectedFunnel,
      createFunnel,
      
      // Empty state durante carregamento
      columns: [],
      setColumns: () => {},
      selectedLead: null,
      isLeadDetailOpen: false,
      setIsLeadDetailOpen: () => {},
      availableTags: [],
      stages: [],
      leads: [],
      
      // Funções vazias durante carregamento
      deleteColumn: () => {},
      openLeadDetail: () => {},
      toggleTagOnLead: () => {},
      wonStageId: undefined,
      lostStageId: undefined,
      refetchLeads: async () => {},
      refetchStages: async () => {},
      
      // Wrappers vazios
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

  console.log('[SalesFunnelMain] ✅ Retornando dados REAIS:', {
    columnsCount: extendedFunnelData.columns?.length || 0,
    leadsCount: extendedFunnelData.leads?.length || 0,
    stagesCount: extendedFunnelData.stages?.length || 0,
    tagsCount: extendedFunnelData.availableTags?.length || 0
  });

  // Retornar dados reais do ExtendedSalesFunnel
  return {
    // Basic state
    isAdmin,
    role,
    funnelLoading: false,
    
    // Funnel data
    funnels,
    selectedFunnel,
    setSelectedFunnel,
    createFunnel,
    
    // Dados REAIS do Supabase
    columns: extendedFunnelData.columns || [],
    setColumns: extendedFunnelData.setColumns || (() => {}),
    selectedLead: extendedFunnelData.selectedLead,
    isLeadDetailOpen: extendedFunnelData.isLeadDetailOpen || false,
    setIsLeadDetailOpen: extendedFunnelData.setIsLeadDetailOpen || (() => {}),
    availableTags: extendedFunnelData.availableTags || [],
    stages: extendedFunnelData.stages || [],
    leads: extendedFunnelData.leads || [],
    
    // Ações reais
    deleteColumn: extendedFunnelData.deleteColumn || (() => {}),
    openLeadDetail: extendedFunnelData.openLeadDetail || (() => {}),
    toggleTagOnLead: extendedFunnelData.toggleTagOnLead || (() => {}),
    wonStageId: extendedFunnelData.wonStageId,
    lostStageId: extendedFunnelData.lostStageId,
    refetchLeads: extendedFunnelData.refetchLeads || (async () => {}),
    refetchStages: extendedFunnelData.refetchStages || (async () => {}),
    
    // Wrappers para compatibilidade
    wrappedAddColumn: extendedFunnelData.addColumn || (() => {}),
    wrappedUpdateColumn: extendedFunnelData.updateColumn || (() => {}),
    wrappedCreateTag: extendedFunnelData.createTag || (() => {}),
    wrappedMoveLeadToStage: extendedFunnelData.moveLeadToStage || (() => {}),
    handleUpdateLeadNotes: extendedFunnelData.updateLeadNotes || (() => {}),
    handleUpdateLeadPurchaseValue: extendedFunnelData.updateLeadPurchaseValue || (() => {}),
    handleUpdateLeadAssignedUser: extendedFunnelData.updateLeadAssignedUser || (() => {}),
    handleUpdateLeadName: extendedFunnelData.updateLeadName || (() => {})
  };
}
