
import { PageLayout } from "@/components/layout/PageLayout";
import { SalesFunnelContextProvider } from "@/components/sales/funnel/SalesFunnelContextProvider";
import { SalesFunnelStateHandler } from "@/components/sales/funnel/SalesFunnelStateHandler";
import { SalesFunnelContent } from "@/components/sales/funnel/SalesFunnelContent";
import { useSalesFunnelMain } from "@/hooks/salesFunnel/useSalesFunnelMain";

export default function SalesFunnel() {
  const {
    funnelLoading,
    funnels,
    selectedFunnel,
    setSelectedFunnel,
    createFunnel,
    isAdmin,
    stages
  } = useSalesFunnelMain();

  // Verificar se o funil selecionado tem estágios
  if (selectedFunnel && (!stages || stages.length === 0)) {
    console.log('[SalesFunnel] ⚠️ Funil selecionado sem estágios:', selectedFunnel.name);
  }

  console.log('[SalesFunnel] ✅ Renderizando conteúdo do funil:', {
    funnelName: selectedFunnel?.name,
    stagesCount: stages?.length || 0
  });

  return (
    <PageLayout>
      <SalesFunnelStateHandler
        funnelLoading={funnelLoading}
        funnels={funnels}
        selectedFunnel={selectedFunnel}
        setSelectedFunnel={setSelectedFunnel}
        createFunnel={createFunnel}
        isAdmin={isAdmin}
      >
        <SalesFunnelContextProvider>
          <SalesFunnelContent />
        </SalesFunnelContextProvider>
      </SalesFunnelStateHandler>
    </PageLayout>
  );
}
