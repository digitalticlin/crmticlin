import React from 'react';
import {
  BillingErrorBoundary,
  PlansUpgradeHero,
  SimplePlansGrid,
  PlansFAQ
} from "@/modules/billing";

export default function PlansUpgrade() {
  return (
    <BillingErrorBoundary>
      <div className="w-full space-y-8 relative z-40">
        {/* Hero focado em conversão */}
        <BillingErrorBoundary>
          <PlansUpgradeHero />
        </BillingErrorBoundary>

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