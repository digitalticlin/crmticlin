
import {
  BillingErrorBoundary,
  HeroStatus,
  QuickStatus,
  PlansActionCards,
  BillingHistory
} from "@/modules/billing";

export default function Plans() {
  return (
    <BillingErrorBoundary>
      <div className="w-full space-y-8 relative z-40">
        {/* Header inteligente com status do usuário */}
        <BillingErrorBoundary>
          <HeroStatus />
        </BillingErrorBoundary>

        {/* Cards de status atual (uso, período, próxima ação) */}
        <BillingErrorBoundary>
          <QuickStatus />
        </BillingErrorBoundary>

        {/* Ações contextuais baseadas no estado do usuário */}
        <BillingErrorBoundary>
          <PlansActionCards />
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
