
import { MessagePlan } from '../types/billing';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight } from 'lucide-react';
import { useStripeCheckout } from '../hooks/useStripeCheckout';

interface MessagePlanCardProps {
  plan: MessagePlan;
  currentPlan?: string;
  isPopular?: boolean;
}

export const MessagePlanCard = ({ plan, currentPlan, isPopular }: MessagePlanCardProps) => {
  const { loading, createCheckoutSession } = useStripeCheckout();
  const isCurrentPlan = currentPlan === plan.id;

  const handleSelectPlan = () => {
    if (!isCurrentPlan) {
      createCheckoutSession(plan);
    }
  };

  const formatLimit = (limit: number): string => {
    return limit >= 1000 ? `${limit / 1000}k` : limit.toString();
  };

  return (
    <Card className={`relative glass-card border overflow-hidden ${
      isCurrentPlan 
        ? "border-ticlin ring-2 ring-ticlin" 
        : isPopular
        ? "border-orange-400 ring-2 ring-orange-400"
        : "border-gray-200 dark:border-gray-700"
    }`}>
      {isPopular && (
        <div className="absolute top-0 right-0 bg-orange-400 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
          Mais Popular
        </div>
      )}
      
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
          <span className="text-3xl font-bold">R${plan.price.toFixed(2)}</span>
          <span className="ml-1 text-muted-foreground">/mês</span>
        </CardDescription>
        <div className="text-sm text-muted-foreground">
          {formatLimit(plan.message_limit)} mensagens por mês
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="mb-4 text-sm">{plan.description}</p>
        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start text-sm">
              <Check className="h-4 w-4 text-ticlin mr-2 shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleSelectPlan}
          disabled={loading || isCurrentPlan}
          variant={isCurrentPlan ? "outline" : "default"}
        >
          {isCurrentPlan ? (
            "Plano Atual"
          ) : (
            <>
              Selecionar Plano
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
