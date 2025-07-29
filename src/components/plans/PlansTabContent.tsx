
import { MessagePlanCard } from "@/modules/billing/components/MessagePlanCard";
import { UsageDisplay } from "@/modules/billing/components/UsageDisplay";
import { messagePlans } from "@/modules/billing/data/messagePlans";
import { useMessageUsage } from "@/modules/billing/hooks/useMessageUsage";

interface PlansTabContentProps {
  currentPlan?: string;
}

const PlansTabContent = ({ currentPlan }: PlansTabContentProps) => {
  const { usage } = useMessageUsage();
  
  // Determinar plano atual baseado no usage tracking
  const currentPlanType = usage?.plan_subscription_id || currentPlan;

  return (
    <div className="space-y-6">
      {/* Planos de Mensagens */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Planos de Mensagens</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {messagePlans.map((plan, index) => (
            <MessagePlanCard
              key={plan.id}
              plan={plan}
              currentPlan={currentPlanType}
              isPopular={index === 1} // Plano do meio como popular
            />
          ))}
        </div>
      </div>
      
      {/* Uso Atual */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Uso Atual</h2>
        <UsageDisplay />
      </div>
    </div>
  );
};

export default PlansTabContent;
