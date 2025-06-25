
import { ReactNode } from "react";
import { SalesFunnelProvider } from "./SalesFunnelProvider";
import { useSalesFunnelMain } from "@/hooks/salesFunnel/useSalesFunnelMain";

interface SalesFunnelContextProviderProps {
  children: ReactNode;
}

export const SalesFunnelContextProvider = ({ children }: SalesFunnelContextProviderProps) => {
  const salesFunnelData = useSalesFunnelMain();

  console.log('[SalesFunnelContextProvider] 📊 Estado REAL atual:', {
    funnelLoading: salesFunnelData.funnelLoading,
    funnelsCount: salesFunnelData.funnels?.length || 0,
    selectedFunnel: salesFunnelData.selectedFunnel?.name || 'None',
    stagesCount: salesFunnelData.stages?.length || 0,
    leadsCount: salesFunnelData.leads?.length || 0,
    columnsCount: salesFunnelData.columns?.length || 0,
    tagsCount: salesFunnelData.availableTags?.length || 0
  });

  // Estado de carregamento
  if (salesFunnelData.funnelLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900">
            Carregando funil de vendas...
          </h3>
        </div>
      </div>
    );
  }

  // Estado vazio - sem funis
  if (!salesFunnelData.funnels || salesFunnelData.funnels.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum funil encontrado
          </h3>
          <p className="text-gray-600 mb-4">
            Criando funil padrão automaticamente...
          </p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Auto-selecionar primeiro funil se necessário
  if (!salesFunnelData.selectedFunnel && salesFunnelData.funnels.length > 0) {
    console.log('[SalesFunnelContextProvider] 🔄 Auto-selecionando primeiro funil');
    salesFunnelData.setSelectedFunnel(salesFunnelData.funnels[0]);
    
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900">
            Carregando dados do funil...
          </h3>
        </div>
      </div>
    );
  }

  // Wrapper para createFunnel retornar Promise<void>
  const createFunnelWrapper = async (name: string, description?: string): Promise<void> => {
    await salesFunnelData.createFunnel(name, description);
  };

  // Contexto com dados REAIS
  const contextValue = {
    funnels: salesFunnelData.funnels || [],
    selectedFunnel: salesFunnelData.selectedFunnel,
    setSelectedFunnel: salesFunnelData.setSelectedFunnel,
    createFunnel: createFunnelWrapper,
    funnelLoading: salesFunnelData.funnelLoading || false,
    columns: salesFunnelData.columns || [],
    setColumns: salesFunnelData.setColumns,
    selectedLead: salesFunnelData.selectedLead,
    isLeadDetailOpen: salesFunnelData.isLeadDetailOpen || false,
    setIsLeadDetailOpen: salesFunnelData.setIsLeadDetailOpen,
    availableTags: salesFunnelData.availableTags || [],
    stages: salesFunnelData.stages || [],
    leads: salesFunnelData.leads || [],
    addColumn: salesFunnelData.addColumn || (() => {}),
    updateColumn: salesFunnelData.updateColumn || (() => {}),
    deleteColumn: salesFunnelData.deleteColumn || (() => {}),
    openLeadDetail: salesFunnelData.openLeadDetail || (() => {}),
    toggleTagOnLead: salesFunnelData.toggleTagOnLead || (() => {}),
    createTag: salesFunnelData.createTag || (() => {}),
    updateLeadNotes: salesFunnelData.updateLeadNotes || (() => {}),
    updateLeadPurchaseValue: salesFunnelData.updateLeadPurchaseValue || (() => {}),
    updateLeadAssignedUser: salesFunnelData.updateLeadAssignedUser || (() => {}),
    updateLeadName: salesFunnelData.updateLeadName || (() => {}),
    moveLeadToStage: salesFunnelData.moveLeadToStage || (() => {}),
    isAdmin: salesFunnelData.isAdmin || false,
    wonStageId: salesFunnelData.wonStageId,
    lostStageId: salesFunnelData.lostStageId,
    refetchLeads: salesFunnelData.refetchLeads || (async () => {}),
    refetchStages: salesFunnelData.refetchStages || (async () => {})
  };

  console.log('[SalesFunnelContextProvider] ✅ Provendo contexto com dados REAIS do Supabase');

  return (
    <SalesFunnelProvider value={contextValue}>
      {children}
    </SalesFunnelProvider>
  );
};
