
import { PageLayout } from "@/components/layout/PageLayout";
import { SalesFunnelContextProvider } from "@/components/sales/funnel/SalesFunnelContextProvider";
import { SalesFunnelContent } from "@/components/sales/funnel/SalesFunnelContent";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useUserRole } from "@/hooks/useUserRole";

// Import debugger for development
if (process.env.NODE_ENV === 'development') {
  import('@/utils/dragDropDebugger').then(({ runDragDropDiagnostic }) => {
    runDragDropDiagnostic();
  });
}

export default function SalesFunnel() {
  console.log('[SalesFunnel] 🚀 Inicializando página do funil de vendas - Layout Otimizado');

  return (
    <PageLayout className="kanban-page h-screen overflow-hidden">
      <ErrorBoundary>
        <SalesFunnelContextProvider>
          <ErrorBoundary>
            <div className="h-full">
              <SalesFunnelContent />
            </div>
          </ErrorBoundary>
        </SalesFunnelContextProvider>
      </ErrorBoundary>
    </PageLayout>
  );
}
