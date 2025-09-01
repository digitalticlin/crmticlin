import { SalesFunnelContent } from "@/components/sales/funnel/SalesFunnelContent";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function SalesFunnel() {
  console.log('[SalesFunnel] 🚀 Inicializando Sales Funnel ESCALÁVEL - Hooks Isolados');

  return (
    <div className="h-full w-full">
      <ErrorBoundary>
        <SalesFunnelContent />
      </ErrorBoundary>
    </div>
  );
}
