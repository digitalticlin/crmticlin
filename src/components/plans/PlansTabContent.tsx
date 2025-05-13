
import PlanCard from "./PlanCard";
import PlanUsageStats from "./PlanUsageStats";

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  limits: {
    whatsappNumbers: number;
    teamMembers: number;
    aiAgents: number;
  };
}

interface PlansTabContentProps {
  currentPlan: string;
  plans: Plan[];
}

const PlansTabContent = ({ currentPlan, plans }: PlansTabContentProps) => {
  return (
    <div className="space-y-6">
      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <PlanCard 
            key={plan.id}
            plan={plan}
            currentPlan={currentPlan}
          />
        ))}
      </div>
      
      <div className="mt-8">
        <PlanUsageStats 
          currentPlan={currentPlan}
          plans={plans}
        />
      </div>
    </div>
  );
};

export default PlansTabContent;
