
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, Lightbulb, ArrowRight, Clock } from 'lucide-react';
import { useMessageUsage } from '../hooks/useMessageUsage';
import { useStripeCheckout } from '../hooks/useStripeCheckout';
import { messagePlans, getPlanByType } from '../data/messagePlans';

export const UpgradeRecommendation = () => {
  const { usage, limitCheck, loading } = useMessageUsage();
  const { createCheckoutSession, loading: checkoutLoading } = useStripeCheckout();

  if (loading || !usage || !limitCheck) {
    return null;
  }

  const currentPlan = getPlanByType(usage.plan_subscription_id);
  if (!currentPlan) return null;

  // Calcular recomendação baseada no uso
  const getRecommendation = () => {
    const usagePercentage = limitCheck.percentage_used;
    const currentPlanIndex = messagePlans.findIndex(p => p.id === currentPlan.id);
    
    // Se está usando mais de 80% e não é o plano mais alto
    if (usagePercentage >= 80 && currentPlanIndex < messagePlans.length - 1) {
      const nextPlan = messagePlans[currentPlanIndex + 1];
      return {
        type: 'urgent',
        title: 'Upgrade Recomendado',
        message: `Você está usando ${usagePercentage.toFixed(1)}% do seu plano. Considere fazer upgrade para evitar bloqueios.`,
        plan: nextPlan,
        reason: 'Você está próximo do limite'
      };
    }

    // Se está usando mais de 60% consistentemente (simular baseado no uso atual)
    if (usagePercentage >= 60 && currentPlanIndex < messagePlans.length - 1) {
      const nextPlan = messagePlans[currentPlanIndex + 1];
      return {
        type: 'suggestion',
        title: 'Sugestão de Upgrade',
        message: `Com seu crescimento atual, o ${nextPlan.name} ofereceria mais tranquilidade.`,
        plan: nextPlan,
        reason: 'Baseado no seu padrão de uso'
      };
    }

    return null;
  };

  const recommendation = getRecommendation();

  if (!recommendation) {
    return (
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-green-500" />
            Tudo em Ordem!
          </CardTitle>
          <CardDescription>
            Seu plano atual está adequado para o seu uso. Continue aproveitando!
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Uso eficiente: {limitCheck.percentage_used.toFixed(1)}% do plano</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Mensagens restantes: {limitCheck.remaining.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleUpgrade = () => {
    createCheckoutSession(recommendation.plan);
  };

  return (
    <Card className="glass-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-orange-500" />
          {recommendation.title}
        </CardTitle>
        <CardDescription>
          {recommendation.reason}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert className={recommendation.type === 'urgent' ? 'border-orange-200 bg-orange-50' : 'border-blue-200 bg-blue-50'}>
          <AlertDescription>
            {recommendation.message}
          </AlertDescription>
        </Alert>

        {/* Comparação Atual vs Recomendado */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="text-center">
            <div className="text-sm font-medium text-muted-foreground">Atual</div>
            <div className="text-lg font-bold">{currentPlan.name}</div>
            <div className="text-sm text-muted-foreground">
              {(currentPlan.message_limit / 1000).toFixed(0)}k mensagens
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm font-medium text-muted-foreground">Recomendado</div>
            <div className="text-lg font-bold text-ticlin">{recommendation.plan.name}</div>
            <div className="text-sm text-muted-foreground">
              {(recommendation.plan.message_limit / 1000).toFixed(0)}k mensagens
            </div>
          </div>
        </div>

        {/* Benefícios do Upgrade */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Benefícios do upgrade:</div>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• +{(recommendation.plan.message_limit - currentPlan.message_limit).toLocaleString()} mensagens/mês</li>
            <li>• Maior tranquilidade para crescer</li>
            <li>• Recursos avançados inclusos</li>
          </ul>
        </div>

        {/* Diferença de Preço */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <span className="text-sm font-medium">Diferença:</span>
          <span className="text-lg font-bold text-ticlin">
            +R${(recommendation.plan.price - currentPlan.price).toFixed(2)}/mês
          </span>
        </div>

        <Button 
          className="w-full"
          onClick={handleUpgrade}
          disabled={checkoutLoading}
        >
          Fazer Upgrade para {recommendation.plan.name}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
