
import { PageLayout } from "@/components/layout/PageLayout";
import { useExtendedSalesFunnel } from "@/hooks/salesFunnel/useExtendedSalesFunnel";
import { useNewLeadIntegration } from "@/hooks/salesFunnel/useNewLeadIntegration";
import { useFunnelManagement } from "@/hooks/salesFunnel/useFunnelManagement";
import { useUserRole } from "@/hooks/useUserRole";
import { SalesFunnelProvider } from "@/components/sales/funnel/SalesFunnelProvider";
import { FunnelLoadingState } from "@/components/sales/funnel/FunnelLoadingState";
import { FunnelEmptyState } from "@/components/sales/funnel/FunnelEmptyState";
import { SalesFunnelContent } from "@/components/sales/funnel/SalesFunnelContent";

export default function SalesFunnel() {
  const { isAdmin, role } = useUserRole();
  
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
    refetchLeads,
    refetchStages
  } = useExtendedSalesFunnel(selectedFunnel?.id);

  useNewLeadIntegration(selectedFunnel?.id);

  // Debug logs mais detalhados
  console.log('[SalesFunnel] 🔍 Estado atual:', {
    funnelsCount: funnels.length,
    selectedFunnel: selectedFunnel ? { id: selectedFunnel.id, name: selectedFunnel.name } : null,
    funnelLoading,
    isAdmin,
    role,
    stagesCount: stages?.length || 0,
    leadsCount: leads?.length || 0,
    hasPermissionErrors: false // Agora as políticas RLS foram corrigidas
  });

  // Wrapper function to match the expected interface
  const createFunnel = async (name: string, description?: string): Promise<void> => {
    try {
      console.log('[SalesFunnel] 📝 Criando funil:', { name, description, isAdmin, role });
      await originalCreateFunnel(name, description);
    } catch (error) {
      console.error('[SalesFunnel] ❌ Erro ao criar funil:', error);
      throw error;
    }
  };

  // Wrapper functions para usar selectedLead.id quando necessário
  const handleUpdateLeadNotes = (notes: string) => {
    if (selectedLead?.id) {
      console.log('[SalesFunnel] 📝 Atualizando notas do lead:', selectedLead.id);
      updateLeadNotes(notes);
    }
  };

  const handleUpdateLeadPurchaseValue = (value: number | undefined) => {
    if (selectedLead?.id) {
      console.log('[SalesFunnel] 💰 Atualizando valor do lead:', selectedLead.id, value);
      updateLeadPurchaseValue(value);
    }
  };

  const handleUpdateLeadAssignedUser = (user: string) => {
    if (selectedLead?.id) {
      console.log('[SalesFunnel] 👤 Atualizando usuário responsável:', selectedLead.id, user);
      updateLeadAssignedUser(user);
    }
  };

  const handleUpdateLeadName = (name: string) => {
    if (selectedLead?.id) {
      console.log('[SalesFunnel] 📛 Atualizando nome do lead:', selectedLead.id, name);
      updateLeadName(name);
    }
  };

  // Estado de carregamento
  if (funnelLoading) {
    console.log('[SalesFunnel] ⏳ Carregando funis...');
    return <FunnelLoadingState />;
  }

  // Empty state - mostrar apenas se realmente não houver funis após o carregamento
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
    console.log('[SalesFunnel] 🔄 Selecionando primeiro funil disponível:', funnels[0]);
    setSelectedFunnel(funnels[0]);
    return <FunnelLoadingState />;
  }

  // Verificar se o funil selecionado tem estágios
  if (selectedFunnel && (!stages || stages.length === 0)) {
    console.log('[SalesFunnel] ⚠️ Funil selecionado sem estágios:', selectedFunnel.name);
  }

  console.log('[SalesFunnel] ✅ Renderizando conteúdo do funil:', {
    funnelName: selectedFunnel?.name,
    stagesCount: stages?.length || 0,
    columnsCount: columns?.length || 0
  });

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
