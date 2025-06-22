import { ReactNode } from "react";
import { SalesFunnelProvider } from "./SalesFunnelProvider";
import { useSalesFunnelMain } from "@/hooks/salesFunnel/useSalesFunnelMain";

interface SalesFunnelContextProviderProps {
  children: ReactNode;
}

export const SalesFunnelContextProvider = ({ children }: SalesFunnelContextProviderProps) => {
  const salesFunnelData = useSalesFunnelMain();

  // Verificar se os dados básicos estão carregados antes de renderizar
  if (!salesFunnelData.selectedFunnel) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Carregando funil...
          </h3>
        </div>
      </div>
    );
  }

  // Garantir que todas as propriedades necessárias estejam definidas
  const contextValue = {
    funnels: salesFunnelData.funnels || [],
    selectedFunnel: salesFunnelData.selectedFunnel,
    setSelectedFunnel: salesFunnelData.setSelectedFunnel,
    createFunnel: salesFunnelData.createFunnel,
    funnelLoading: salesFunnelData.funnelLoading || false,
    columns: salesFunnelData.columns || [],
    setColumns: salesFunnelData.setColumns,
    selectedLead: salesFunnelData.selectedLead,
    isLeadDetailOpen: salesFunnelData.isLeadDetailOpen || false,
    setIsLeadDetailOpen: salesFunnelData.setIsLeadDetailOpen,
    availableTags: salesFunnelData.availableTags || [],
    stages: salesFunnelData.stages || [],
    leads: salesFunnelData.leads || [],
    addColumn: salesFunnelData.wrappedAddColumn || (() => {}),
    updateColumn: salesFunnelData.wrappedUpdateColumn || (() => {}),
    deleteColumn: salesFunnelData.deleteColumn || (() => {}),
    openLeadDetail: salesFunnelData.openLeadDetail || (() => {}),
    toggleTagOnLead: salesFunnelData.toggleTagOnLead || (() => {}),
    createTag: salesFunnelData.wrappedCreateTag || (() => {}),
    updateLeadNotes: salesFunnelData.handleUpdateLeadNotes || (() => {}),
    updateLeadPurchaseValue: salesFunnelData.handleUpdateLeadPurchaseValue || (() => {}),
    updateLeadAssignedUser: salesFunnelData.handleUpdateLeadAssignedUser || (() => {}),
    updateLeadName: salesFunnelData.handleUpdateLeadName || (() => {}),
    moveLeadToStage: salesFunnelData.wrappedMoveLeadToStage || (() => {}),
    isAdmin: salesFunnelData.isAdmin || false,
    wonStageId: salesFunnelData.wonStageId,
    lostStageId: salesFunnelData.lostStageId,
    refetchLeads: salesFunnelData.refetchLeads || (async () => {}),
    refetchStages: salesFunnelData.refetchStages || (async () => {})
  };

  console.log('[SalesFunnelContextProvider] ✅ Provendo contexto com valores:', {
    funnelName: contextValue.selectedFunnel?.name,
    stagesCount: contextValue.stages?.length || 0,
    leadsCount: contextValue.leads?.length || 0
  });

  return (
    <SalesFunnelProvider value={contextValue}>
      {children}
    </SalesFunnelProvider>
  );
};
