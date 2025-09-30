import React from 'react';
import {
  BillingErrorBoundary,
  SimplePlansGrid,
  PlansFAQ
} from "@/modules/billing";

export default function PlansUpgrade() {
  return (
    <BillingErrorBoundary>
      <div className="w-full space-y-8 relative z-40">
        {/* Grid de planos para contratação */}
        <BillingErrorBoundary>
          <SimplePlansGrid />
        </BillingErrorBoundary>

        {/* FAQ para ajudar na conversão */}
        <BillingErrorBoundary>
          <PlansFAQ />
        </BillingErrorBoundary>
      </div>
    </BillingErrorBoundary>
  );
}