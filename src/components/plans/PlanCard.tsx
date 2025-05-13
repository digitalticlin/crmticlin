
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";

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

interface PlanCardProps {
  plan: Plan;
  currentPlan: string;
}

const PlanCard = ({ plan, currentPlan }: PlanCardProps) => {
  const isCurrentPlan = currentPlan === plan.id;
  const isUpgrade = currentPlan && 
    plan.id !== currentPlan && 
    plan.price > (plan.id === "starter" ? 99 : plan.id === "pro" ? 199 : 399);

  return (
    <Card 
      className={`glass-card border overflow-hidden ${
        isCurrentPlan 
          ? "border-ticlin ring-2 ring-ticlin" 
          : "border-gray-200 dark:border-gray-700"
      }`}
    >
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{plan.name}</span>
          {isCurrentPlan && (
            <span className="text-xs bg-ticlin text-black px-2 py-1 rounded-full">
              Atual
            </span>
          )}
        </CardTitle>
        <CardDescription className="flex items-baseline">
          <span className="text-3xl font-bold">R${plan.price}</span>
          <span className="ml-1 text-muted-foreground">/mês</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4">{plan.description}</p>
        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-5 w-5 text-ticlin mr-2 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        {isCurrentPlan ? (
          <Button className="w-full" variant="outline">
            Plano Atual
          </Button>
        ) : (
          <Button className={`w-full ${
            currentPlan && isUpgrade
              ? "bg-ticlin hover:bg-ticlin/90 text-black" 
              : "bg-gray-800 hover:bg-gray-700"
          }`}>
            {currentPlan && isUpgrade ? (
              <>Fazer Upgrade <ArrowRight className="ml-2 h-4 w-4" /></>
            ) : (
              <>Fazer Downgrade <ArrowRight className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default PlanCard;
