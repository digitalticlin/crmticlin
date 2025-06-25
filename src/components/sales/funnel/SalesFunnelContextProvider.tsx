
import { ReactNode, useEffect, useState } from "react";
import { SalesFunnelProvider } from "./SalesFunnelProvider";
import { useSalesFunnelMain } from "@/hooks/salesFunnel/useSalesFunnelMain";

interface SalesFunnelContextProviderProps {
  children: ReactNode;
}

export const SalesFunnelContextProvider = ({ children }: SalesFunnelContextProviderProps) => {
  const salesFunnelData = useSalesFunnelMain();
  const [isInitialized, setIsInitialized] = useState(false);

  console.log('[SalesFunnelContextProvider] 📊 Estado atual:', {
    funnelLoading: salesFunnelData.funnelLoading,
    funnelsCount: salesFunnelData.funnels?.length || 0,
    selectedFunnel: salesFunnelData.selectedFunnel?.name || 'None',
    stagesCount: salesFunnelData.stages?.length || 0,
    leadsCount: salesFunnelData.leads?.length || 0,
    columnsCount: salesFunnelData.columns?.length || 0,
    isInitialized
  });

  // Auto-selecionar primeiro funil se necessário - sem quebrar o contexto
  useEffect(() => {
    if (!salesFunnelData.funnelLoading && 
        !salesFunnelData.selectedFunnel && 
        salesFunnelData.funnels && 
        salesFunnelData.funnels.length > 0) {
      console.log('[SalesFunnelContextProvider] 🔄 Auto-selecionando primeiro funil');
      salesFunnelData.setSelectedFunnel(salesFunnelData.funnels[0]);
    }
    
    // Marcar como inicializado após primeiro load
    if (!salesFunnelData.funnelLoading && !isInitialized) {
      setIsInitialized(true);
    }
  }, [
    salesFunnelData.funnelLoading,
    salesFunnelData.selectedFunnel,
    salesFunnelData.funnels,
    salesFunnelData.setSelectedFunnel,
    isInitialized
  ]);

  // Wrapper para createFunnel retornar Promise<void>
  const createFunnelWrapper = async (name: string, description?: string): Promise<void> => {
    await salesFunnelData.createFunnel(name, description);
  };

  // Wrapper functions to match the expected interface signatures
  const addColumnWrapper = (title: string) => {
    if (salesFunnelData.wrappedAddColumn && salesFunnelData.selectedFunnel?.id) {
      salesFunnelData.wrappedAddColumn(title, '#e0e0e0', salesFunnelData.selectedFunnel.id);
    }
  };

  const updateColumnWrapper = (column: any) => {
    if (salesFunnelData.wrappedUpdateColumn) {
      salesFunnelData.wrappedUpdateColumn(column.id, { title: column.title, color: column.color });
    }
  };

  const createTagWrapper = (name: string, color: string) => {
    if (salesFunnelData.wrappedCreateTag) {
      salesFunnelData.wrappedCreateTag({ name, color });
    }
  };

  const moveLeadToStageWrapper = (lead: any, columnId: string) => {
    if (salesFunnelData.wrappedMoveLeadToStage) {
      salesFunnelData.wrappedMoveLeadToStage(lead, columnId);
    }
  };

  // SEMPRE fornecer um contexto válido - nunca retornar early
  const contextValue = {
    // Funnel data - sempre disponível com fallbacks
    funnels: salesFunnelData.funnels || [],
    selectedFunnel: salesFunnelData.selectedFunnel || null,
    setSelectedFunnel: salesFunnelData.setSelectedFunnel,
    createFunnel: createFunnelWrapper,
    funnelLoading: salesFunnelData.funnelLoading || false,
    
    // Dados com fallbacks seguros
    columns: salesFunnelData.columns || [],
    setColumns: salesFunnelData.setColumns || (() => {}),
    selectedLead: salesFunnelData.selectedLead || null,
    isLeadDetailOpen: salesFunnelData.isLeadDetailOpen || false,
    setIsLeadDetailOpen: salesFunnelData.setIsLeadDetailOpen || (() => {}),
    availableTags: salesFunnelData.availableTags || [],
    stages: salesFunnelData.stages || [],
    leads: salesFunnelData.leads || [],
    
    // Ações sempre disponíveis
    addColumn: addColumnWrapper,
    updateColumn: updateColumnWrapper,
    deleteColumn: salesFunnelData.deleteColumn || (() => {}),
    openLeadDetail: salesFunnelData.openLeadDetail || (() => {}),
    toggleTagOnLead: salesFunnelData.toggleTagOnLead || (() => {}),
    createTag: createTagWrapper,
    updateLeadNotes: salesFunnelData.handleUpdateLeadNotes || (() => {}),
    updateLeadPurchaseValue: salesFunnelData.handleUpdateLeadPurchaseValue || (() => {}),
    updateLeadAssignedUser: salesFunnelData.handleUpdateLeadAssignedUser || (() => {}),
    updateLeadName: salesFunnelData.handleUpdateLeadName || (() => {}),
    moveLeadToStage: moveLeadToStageWrapper,
    isAdmin: salesFunnelData.isAdmin || false,
    wonStageId: salesFunnelData.wonStageId,
    lostStageId: salesFunnelData.lostStageId,
    refetchLeads: salesFunnelData.refetchLeads || (async () => {}),
    refetchStages: salesFunnelData.refetchStages || (async () => {})
  };

  console.log('[SalesFunnelContextProvider] ✅ Fornecendo contexto estável');

  return (
    <SalesFunnelProvider value={contextValue}>
      {children}
    </SalesFunnelProvider>
  );
};
