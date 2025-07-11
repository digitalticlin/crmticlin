
import { ReactNode, useEffect, useState } from "react";
import { SalesFunnelProvider } from "./SalesFunnelProvider";
import { useSalesFunnelOptimized } from "@/hooks/salesFunnel/useSalesFunnelOptimized";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { useStageOperations } from "@/hooks/salesFunnel/useStageOperations";
import { transformDatabaseLeadToKanban, createTagWrapper, moveLeadToStageWrapper } from "@/utils/leadTransformers";

interface SalesFunnelContextProviderProps {
  children: ReactNode;
}

export const SalesFunnelContextProvider = ({ children }: SalesFunnelContextProviderProps) => {
  const { user } = useAuth();
  const salesFunnelData = useSalesFunnelOptimized();
  const { isAdmin } = useUserRole();
  const [isInitialized, setIsInitialized] = useState(false);
  const { addColumnWrapper, updateColumnWrapper, deleteColumnWrapper } = useStageOperations();

  console.log('[SalesFunnelContextProvider] 📊 Estado atual (OTIMIZADO):', {
    loading: salesFunnelData.loading,
    funnelsCount: salesFunnelData.funnels?.length || 0,
    selectedFunnel: salesFunnelData.selectedFunnel?.name || 'None',
    stagesCount: salesFunnelData.stages?.length || 0,
    leadsCount: salesFunnelData.leads?.length || 0,
    columnsCount: salesFunnelData.columns?.length || 0,
    isInitialized
  });

  // Auto-selecionar primeiro funil se necessário
  useEffect(() => {
    if (!salesFunnelData.loading && 
        !salesFunnelData.selectedFunnel && 
        salesFunnelData.funnels && 
        salesFunnelData.funnels.length > 0) {
      console.log('[SalesFunnelContextProvider] 🔄 Auto-selecionando primeiro funil');
      salesFunnelData.setSelectedFunnel(salesFunnelData.funnels[0]);
    }
    
    // Marcar como inicializado após primeiro load
    if (!salesFunnelData.loading && !isInitialized) {
      setIsInitialized(true);
    }
  }, [
    salesFunnelData.loading,
    salesFunnelData.selectedFunnel,
    salesFunnelData.funnels,
    salesFunnelData.setSelectedFunnel,
    isInitialized
  ]);

  // Wrapper functions that use the selected funnel
  const addColumn = async (title: string, color: string = "#3b82f6"): Promise<void> => {
    await addColumnWrapper(title, color, salesFunnelData.selectedFunnel?.id);
    // Refrescar dados
    if (salesFunnelData.refetchStages) {
      await salesFunnelData.refetchStages();
    }
  };

  const updateColumn = async (column: any): Promise<void> => {
    await updateColumnWrapper(column);
    // Refreshar dados
    if (salesFunnelData.refetchStages) {
      await salesFunnelData.refetchStages();
    }
  };

  const deleteColumn = async (columnId: string): Promise<void> => {
    await deleteColumnWrapper(columnId);
    // Refrescar dados
    if (salesFunnelData.refetchStages) {
      await salesFunnelData.refetchStages();
    }
  };

  // SEMPRE fornecer um contexto válido - nunca retornar early
  const contextValue = {
    // Estado de carregamento
    loading: salesFunnelData.loading || false,
    error: salesFunnelData.error || null,
    
    // Funnel data - sempre disponível com fallbacks
    funnels: salesFunnelData.funnels || [],
    selectedFunnel: salesFunnelData.selectedFunnel || null,
    setSelectedFunnel: salesFunnelData.setSelectedFunnel,
    createFunnel: salesFunnelData.createFunnel,
    funnelLoading: salesFunnelData.loading || false,
    
    // Dados com fallbacks seguros - Transform raw database leads to KanbanLead format
    columns: (salesFunnelData.columns || []).map(column => ({
      ...column,
      ai_enabled: column.ai_enabled === true // Garantir que ai_enabled é false por padrão
    })),
    setColumns: salesFunnelData.setColumns || (() => {}),
    selectedLead: salesFunnelData.selectedLead || null,
    isLeadDetailOpen: salesFunnelData.isLeadDetailOpen || false,
    setIsLeadDetailOpen: salesFunnelData.setIsLeadDetailOpen || (() => {}),
    availableTags: salesFunnelData.availableTags || [],
    stages: salesFunnelData.stages || [],
    leads: (salesFunnelData.leads || []).map(transformDatabaseLeadToKanban),
    
    // Ações sempre disponíveis (com retorno Promise<void> correto)
    addColumn,
    updateColumn,
    deleteColumn,
    openLeadDetail: salesFunnelData.openLeadDetail || (() => {}),
    toggleTagOnLead: salesFunnelData.toggleTagOnLead || (() => {}),
    createTag: createTagWrapper,
    updateLeadNotes: salesFunnelData.updateLeadNotes || (() => {}),
    updateLeadPurchaseValue: salesFunnelData.updateLeadPurchaseValue || (() => {}),
    updateLeadAssignedUser: salesFunnelData.updateLeadAssignedUser || (() => {}),
    updateLeadName: salesFunnelData.updateLeadName || (() => {}),
    moveLeadToStage: moveLeadToStageWrapper,
    isAdmin: isAdmin || false,
    wonStageId: salesFunnelData.wonStageId,
    lostStageId: salesFunnelData.lostStageId,
    refetchLeads: salesFunnelData.refetchLeads || (async () => {}),
    refetchStages: salesFunnelData.refetchStages || (async () => {})
  };

  console.log('[SalesFunnelContextProvider] ✅ Fornecendo contexto OTIMIZADO estável');

  return (
    <SalesFunnelProvider value={contextValue}>
      {children}
    </SalesFunnelProvider>
  );
};
