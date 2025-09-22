
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, Lightbulb, ArrowRight, Clock, Zap, Crown } from 'lucide-react';
import { useMessageUsage } from '../hooks/useMessageUsage';
import { useMercadoPagoCheckout } from '../hooks/useMercadoPagoCheckout';
import { messagePlans, getPlanByType } from '../data/messagePlans';

export const UpgradeRecommendation = () => {
  const { usage, limitCheck, loading } = useMessageUsage();
  const { createCheckoutSession, loading: checkoutLoading } = useMercadoPagoCheckout();

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
        title: '🚨 Upgrade Urgente Recomendado',
        message: `Você já usou ${usagePercentage.toFixed(1)}% do limite! Evite bloqueios fazendo upgrade agora.`,
        plan: nextPlan,
        reason: '⚠️ Limite quase esgotado',
        savings: `Economia de R$${((currentPlan.price / currentPlan.message_limit) - (nextPlan.price / nextPlan.message_limit)).toFixed(3)} por mensagem`
      };
    }

    // Se está usando mais de 60% consistentemente
    if (usagePercentage >= 60 && currentPlanIndex < messagePlans.length - 1) {
      const nextPlan = messagePlans[currentPlanIndex + 1];
      return {
        type: 'suggestion',
        title: '💡 Sugestão Inteligente de Upgrade',
        message: `Com seu crescimento atual, o ${nextPlan.name} ofereceria mais tranquilidade e melhor custo-benefício.`,
        plan: nextPlan,
        reason: '📈 Baseado no seu padrão de crescimento',
        savings: `Custo por mensagem: R$${(nextPlan.price / nextPlan.message_limit).toFixed(3)}`
      };
    }

    return null;
  };

  const recommendation = getRecommendation();

  if (!recommendation) {
    return (
      <Card className="glass-card border-0 bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-green-500" />
            ✅ Perfeito! Tudo em Ordem
          </CardTitle>
          <CardDescription>
            Seu plano está ideal para o uso atual. Continue aproveitando ao máximo! 🚀
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-green-600 mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-lg font-bold">{limitCheck.percentage_used.toFixed(1)}%</span>
                </div>
                <p className="text-xs text-muted-foreground">Uso Eficiente</p>
              </div>
              
              <div className="bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-blue-600 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-lg font-bold">{limitCheck.remaining.toLocaleString()}</span>
                </div>
                <p className="text-xs text-muted-foreground">Mensagens Restantes</p>
              </div>
            </div>
            
            <div className="text-center p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                🎯 Plano otimizado para suas necessidades atuais
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleUpgrade = () => {
    createCheckoutSession(recommendation.plan);
  };

  const getPlanIcon = (planId: string) => {
    if (planId === 'messages_15k') return <Crown className="h-5 w-5 text-yellow-500" />;
    if (planId === 'messages_5k') return <Zap className="h-5 w-5 text-purple-500" />;
    return <TrendingUp className="h-5 w-5 text-blue-500" />;
  };

  return (
    <Card className={`glass-card border-2 overflow-hidden ${
      recommendation.type === 'urgent' 
        ? 'border-orange-400 bg-gradient-to-br from-orange-50/80 to-red-50/80 dark:from-orange-900/20 dark:to-red-900/20' 
        : 'border-blue-400 bg-gradient-to-br from-blue-50/80 to-purple-50/80 dark:from-blue-900/20 dark:to-purple-900/20'
    }`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {recommendation.type === 'urgent' ? 
            <Zap className="h-5 w-5 text-orange-500" /> : 
            <Lightbulb className="h-5 w-5 text-blue-500" />
          }
          {recommendation.title}
        </CardTitle>
        <CardDescription className="text-sm font-medium">
          {recommendation.reason}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert className={`border-2 ${
          recommendation.type === 'urgent' 
            ? 'border-orange-200 bg-orange-50/80 dark:bg-orange-900/20' 
            : 'border-blue-200 bg-blue-50/80 dark:bg-blue-900/20'
        }`}>
          <AlertDescription className="text-sm font-medium">
            {recommendation.message}
          </AlertDescription>
        </Alert>

        {/* Comparação Visual */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50/80 dark:bg-gray-900/80 rounded-lg">
          <div className="text-center">
            <div className="text-xs font-medium text-muted-foreground mb-1">ATUAL</div>
            <div className="text-lg font-bold">{currentPlan.name}</div>
            <div className="text-sm text-muted-foreground">
              {(currentPlan.message_limit / 1000).toFixed(0)}k mensagens
            </div>
            <div className="text-xs text-green-600 font-semibold">
              R${currentPlan.price}/mês
            </div>
          </div>
          
          <div className="text-center border-l border-gray-200 dark:border-gray-700">
            <div className="text-xs font-medium text-muted-foreground mb-1">RECOMENDADO</div>
            <div className="flex items-center justify-center gap-1">
              {getPlanIcon(recommendation.plan.id)}
              <span className="text-lg font-bold text-ticlin">{recommendation.plan.name}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {(recommendation.plan.message_limit / 1000).toFixed(0)}k mensagens
            </div>
            <div className="text-xs text-ticlin font-bold">
              R${recommendation.plan.price}/mês
            </div>
          </div>
        </div>

        {/* Benefícios do Upgrade */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">🚀 Benefícios do Upgrade:</h4>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <ArrowRight className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">
                +{(recommendation.plan.message_limit - currentPlan.message_limit).toLocaleString()} mensagens extras
              </span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <ArrowRight className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">{recommendation.savings}</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <ArrowRight className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Recursos avançados inclusos</span>
            </div>
          </div>
        </div>

        {/* CTA de Upgrade */}
        <div className="bg-gradient-to-r from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">Diferença mensal:</span>
            <span className="text-xl font-bold text-ticlin">
              +R${(recommendation.plan.price - currentPlan.price).toFixed(2)}
            </span>
          </div>

          <Button 
            className={`w-full h-12 font-bold text-base transition-all duration-300 ${
              recommendation.type === 'urgent'
                ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
            }`}
            onClick={handleUpgrade}
            disabled={checkoutLoading}
          >
            {checkoutLoading ? (
              "Processando..."
            ) : (
              <>
                🚀 Fazer Upgrade para {recommendation.plan.name}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
