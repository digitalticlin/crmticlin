
import { PageLayout } from "@/components/layout/PageLayout";
import { useRealSalesFunnel } from "@/hooks/salesFunnel/useRealSalesFunnel";
import { useNewLeadIntegration } from "@/hooks/salesFunnel/useNewLeadIntegration";
import { useFunnelManagement } from "@/hooks/salesFunnel/useFunnelManagement";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useUserRole } from "@/hooks/useUserRole";
import { SalesFunnelProvider } from "@/components/sales/funnel/SalesFunnelProvider";
import { FunnelLoadingState } from "@/components/sales/funnel/FunnelLoadingState";
import { FunnelEmptyState } from "@/components/sales/funnel/FunnelEmptyState";
import { SalesFunnelContent } from "@/components/sales/funnel/SalesFunnelContent";

export default function SalesFunnel() {
  const { companyId } = useCompanyData();
  const { isAdmin } = useUserRole();
  
  const {
    funnels,
    selectedFunnel,
    setSelectedFunnel,
    createFunnel: originalCreateFunnel,
    loading: funnelLoading
  } = useFunnelManagement(companyId);

  const {
    columns,
    selectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    availableTags,
    stages,
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
    lostStageId
  } = useRealSalesFunnel(selectedFunnel?.id);

  useNewLeadIntegration(selectedFunnel?.id);

  // Wrapper function to match the expected interface
  const createFunnel = async (name: string, description?: string): Promise<void> => {
    await originalCreateFunnel(name, description);
  };

  if (funnelLoading) {
    return <FunnelLoadingState />;
  }

  if (!selectedFunnel) {
    return (
      <FunnelEmptyState 
        isAdmin={isAdmin}
        onCreateFunnel={createFunnel}
      />
    );
  }

  const contextValue = {
    funnels,
    selectedFunnel,
    setSelectedFunnel,
    createFunnel,
    funnelLoading,
    columns,
    selectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    availableTags,
    stages,
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
    isAdmin,
    wonStageId,
    lostStageId
  };

  return (
    <PageLayout>
      <SalesFunnelProvider value={contextValue}>
        <SalesFunnelContent />
      </SalesFunnelProvider>
    </PageLayout>
  );
}
