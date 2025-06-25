import { PageLayout } from "@/components/layout/PageLayout";
import { SalesFunnelContextProvider } from "@/components/sales/funnel/SalesFunnelContextProvider";
import { SalesFunnelContent } from "@/components/sales/funnel/SalesFunnelContent";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function SalesFunnel() {
  console.log('[SalesFunnel] 🚀 Inicializando página do funil de vendas');

  return (
    <PageLayout>
      <ErrorBoundary>
        <SalesFunnelContextProvider>
          <ErrorBoundary>
            <SalesFunnelContent />
          </ErrorBoundary>
        </SalesFunnelContextProvider>
      </ErrorBoundary>
    </PageLayout>
  );
}
