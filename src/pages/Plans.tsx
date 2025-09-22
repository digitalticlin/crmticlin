
import {
  BillingErrorBoundary,
  HeroStatus,
  QuickStatus,
  SimplePlansGrid,
  BillingHistory
} from "@/modules/billing";

export default function Plans() {
  return (
    <BillingErrorBoundary>
      <div className="w-full space-y-8 relative z-40">
        {/* Header com status hero */}
        <BillingErrorBoundary>
          <HeroStatus />
        </BillingErrorBoundary>

        {/* Quick Status Cards */}
        <BillingErrorBoundary>
          <QuickStatus />
        </BillingErrorBoundary>

        {/* Planos Simplificados */}
        <BillingErrorBoundary>
          <SimplePlansGrid />
        </BillingErrorBoundary>

        {/* Histórico e Faturamento Unificado */}
        <div id="billing-section">
          <BillingErrorBoundary>
            <BillingHistory />
          </BillingErrorBoundary>
        </div>
      </div>
    </BillingErrorBoundary>
  );
}
