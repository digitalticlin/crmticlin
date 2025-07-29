
import { MessagePlan } from '../types/billing';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowRight, Crown, Zap, Star } from 'lucide-react';
import { useStripeCheckout } from '../hooks/useStripeCheckout';

interface MessagePlanCardProps {
  plan: MessagePlan;
  currentPlan?: string;
  isPopular?: boolean;
}

export const MessagePlanCard = ({ plan, currentPlan, isPopular }: MessagePlanCardProps) => {
  const { loading, createCheckoutSession } = useStripeCheckout();
  const isCurrentPlan = currentPlan === plan.id;
  const isUltra = plan.id === 'messages_15k';
  const isProfessional = plan.id === 'messages_5k';

  const handleSelectPlan = () => {
    if (!isCurrentPlan) {
      createCheckoutSession(plan);
    }
  };

  const formatLimit = (limit: number): string => {
    return limit >= 1000 ? `${limit / 1000}k` : limit.toString();
  };

  const getPlanIcon = () => {
    if (isUltra) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (isProfessional) return <Star className="h-5 w-5 text-purple-500" />;
    return <Zap className="h-5 w-5 text-blue-500" />;
  };

  const getPlanBadge = () => {
    if (isUltra) return { text: "MAIS VENDIDO", color: "bg-gradient-to-r from-yellow-400 to-yellow-600" };
    if (isProfessional) return { text: "RECOMENDADO", color: "bg-gradient-to-r from-purple-500 to-purple-700" };
    return { text: "STARTER", color: "bg-gradient-to-r from-blue-500 to-blue-700" };
  };

  const badge = getPlanBadge();

  return (
    <Card className={`relative glass-card border-2 overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
      isCurrentPlan 
        ? "border-ticlin ring-4 ring-ticlin/20 bg-gradient-to-br from-ticlin/5 to-ticlin/10" 
        : isUltra
        ? "border-yellow-400/50 ring-2 ring-yellow-400/20 bg-gradient-to-br from-yellow-50/50 to-orange-50/50 dark:from-yellow-900/10 dark:to-orange-900/10"
        : isProfessional
        ? "border-purple-400/50 ring-2 ring-purple-400/20 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10"
        : "border-blue-400/50 ring-2 ring-blue-400/20 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-900/10 dark:to-cyan-900/10"
    }`}>
      {/* Badge superior */}
      <div className={`absolute top-0 right-0 text-white px-4 py-1.5 text-xs font-bold rounded-bl-xl ${badge.color}`}>
        {badge.text}
      </div>
      
      <CardHeader className="text-center pt-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          {getPlanIcon()}
          <CardTitle className="text-xl">{plan.name}</CardTitle>
          {isCurrentPlan && (
            <Badge variant="outline" className="text-xs bg-ticlin/10 text-ticlin border-ticlin/30">
              SEU PLANO
            </Badge>
          )}
        </div>
        
        <CardDescription className="text-sm text-muted-foreground mb-4">
          {plan.description}
        </CardDescription>
        
        <div className="space-y-1">
          <div className="flex items-center justify-center">
            <span className="text-sm text-muted-foreground line-through mr-2">
              R${(plan.price * 1.5).toFixed(0)}
            </span>
            <span className="text-4xl font-bold text-foreground">R${plan.price.toFixed(0)}</span>
          </div>
          <div className="text-sm text-muted-foreground">/mês</div>
          <div className="text-sm font-medium text-ticlin">
            💡 {formatLimit(plan.message_limit)} mensagens IA
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start text-sm">
              <Check className="h-4 w-4 text-green-500 mr-3 shrink-0 mt-0.5" />
              <span className="font-medium">{feature}</span>
            </li>
          ))}
        </ul>
        
        {/* Valor por mensagem */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-3 rounded-lg border border-green-200/50">
          <div className="text-center">
            <div className="text-xs text-green-700 dark:text-green-300 font-medium">CUSTO POR MENSAGEM</div>
            <div className="text-lg font-bold text-green-800 dark:text-green-200">
              R${(plan.price / plan.message_limit).toFixed(3)}
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2">
        <Button 
          className={`w-full h-12 text-base font-bold transition-all duration-300 ${
            isCurrentPlan 
              ? "bg-gray-100 text-gray-500 cursor-not-allowed" 
              : isUltra
              ? "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-lg hover:shadow-xl"
              : isProfessional
              ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl"
              : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl"
          }`}
          onClick={handleSelectPlan}
          disabled={loading || isCurrentPlan}
        >
          {isCurrentPlan ? (
            "✅ Plano Ativo"
          ) : (
            <>
              🚀 Começar Agora
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
