
import { PageLayout } from "@/components/layout/PageLayout";
import { useRealSalesFunnel } from "@/hooks/salesFunnel/useRealSalesFunnel";
import { useNewLeadIntegration } from "@/hooks/salesFunnel/useNewLeadIntegration";
import { useFunnelManagement } from "@/hooks/salesFunnel/useFunnelManagement";
import { useUserRole } from "@/hooks/useUserRole";
import { SalesFunnelProvider } from "@/components/sales/funnel/SalesFunnelProvider";
import { FunnelLoadingState } from "@/components/sales/funnel/FunnelLoadingState";
import { FunnelEmptyState } from "@/components/sales/funnel/FunnelEmptyState";
import { SalesFunnelContent } from "@/components/sales/funnel/SalesFunnelContent";

export default function SalesFunnel() {
  const { isAdmin } = useUserRole();
  
  const {
    funnels,
    selectedFunnel,
    setSelectedFunnel,
    createFunnel: originalCreateFunnel,
    loading: funnelLoading
  } = useFunnelManagement();

  const {
    columns,
    setColumns,
    selectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    availableTags,
    stages,
    leads,
    addColumn,
    updateColumn,
    deleteColumn,
    openLeadDetail,
    toggleTagOnLead,
    createTag,
    updateLeadNotes,
    updateLeadPurchaseValue,
    updateLeadAssignedUser,
    updateLeadName,
    moveLeadToStage,
    wonStageId,
    lostStageId,
    refetchLeads: originalRefetchLeads,
    refetchStages: originalRefetchStages
  } = useRealSalesFunnel(selectedFunnel?.id);

  useNewLeadIntegration(selectedFunnel?.id);

  // Debug logs
  console.log('[SalesFunnel] 🔍 Estado atual:', {
    funnelsCount: funnels.length,
    selectedFunnel: selectedFunnel?.name,
    funnelLoading,
    isAdmin
  });

  // Wrapper function to match the expected interface
  const createFunnel = async (name: string, description?: string): Promise<void> => {
    await originalCreateFunnel(name, description);
  };

  // Wrapper functions to convert QueryObserverResult to void
  const refetchLeads = async (): Promise<void> => {
    await originalRefetchLeads();
  };

  const refetchStages = async (): Promise<void> => {
    await originalRefetchStages();
  };

  // Wrapper functions para usar selectedLead.id quando necessário
  const handleUpdateLeadNotes = (notes: string) => {
    if (selectedLead?.id) {
      updateLeadNotes(selectedLead.id, notes);
    }
  };

  const handleUpdateLeadPurchaseValue = (value: number | undefined) => {
    if (selectedLead?.id) {
      updateLeadPurchaseValue(selectedLead.id, value);
    }
  };

  const handleUpdateLeadAssignedUser = (user: string) => {
    if (selectedLead?.id) {
      updateLeadAssignedUser(selectedLead.id, user);
    }
  };

  const handleUpdateLeadName = (name: string) => {
    if (selectedLead?.id) {
      updateLeadName(selectedLead.id, name);
    }
  };

  if (funnelLoading) {
    console.log('[SalesFunnel] ⏳ Carregando funis...');
    return <FunnelLoadingState />;
  }

  // Apenas mostrar empty state se realmente não houver funis depois do carregamento
  if (!selectedFunnel && funnels.length === 0 && !funnelLoading) {
    console.log('[SalesFunnel] ❌ Nenhum funil encontrado, mostrando empty state');
    return (
      <FunnelEmptyState 
        isAdmin={isAdmin}
        onCreateFunnel={createFunnel}
      />
    );
  }

  // Se tem funis mas nenhum selecionado, selecionar o primeiro
  if (funnels.length > 0 && !selectedFunnel) {
    console.log('[SalesFunnel] 🔄 Selecionando primeiro funil disponível...');
    setSelectedFunnel(funnels[0]);
    return <FunnelLoadingState />;
  }

  console.log('[SalesFunnel] ✅ Renderizando conteúdo do funil');

  const contextValue = {
    funnels,
    selectedFunnel,
    setSelectedFunnel,
    createFunnel,
    funnelLoading,
    columns,
    setColumns,
    selectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    availableTags,
    stages,
    leads,
    addColumn,
    updateColumn,
    deleteColumn,
    openLeadDetail,
    toggleTagOnLead,
    createTag,
    updateLeadNotes: handleUpdateLeadNotes,
    updateLeadPurchaseValue: handleUpdateLeadPurchaseValue,
    updateLeadAssignedUser: handleUpdateLeadAssignedUser,
    updateLeadName: handleUpdateLeadName,
    moveLeadToStage,
    isAdmin,
    wonStageId,
    lostStageId,
    refetchLeads,
    refetchStages
  };

  return (
    <PageLayout>
      <SalesFunnelProvider value={contextValue}>
        <SalesFunnelContent />
      </SalesFunnelProvider>
    </PageLayout>
  );
}
