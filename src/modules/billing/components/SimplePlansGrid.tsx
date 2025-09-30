import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  Star,
  Crown,
  MessageSquare,
  Calendar,
  CheckCircle,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { useBillingData } from '../hooks/useBillingData';
import { useStripeCheckout } from '../hooks/useStripeCheckout';
import { messagePlans } from '../data/messagePlans';

export const SimplePlansGrid = () => {
  const billing = useBillingData();
  const { createCheckoutSession, loading } = useStripeCheckout();

  const {
    currentPlan = null,
    hasActiveTrial = false,
    hasActiveSubscription = false,
    canActivateTrial = true,
    isBlocked = false,
    isOverdue = false
  } = billing;

  const handlePlanSelection = async (plan: typeof messagePlans[0]) => {
    // Passar contexto 'plans' para redirecionar de volta para /plans após checkout
    await createCheckoutSession(plan, 'plans');
  };

  const getPlansToShow = () => {
    // Buscar dados reais dos planos
    const freePlan = messagePlans.find(p => p.id === 'free_200');
    const proPlan = messagePlans.find(p => p.id === 'pro_5k');
    const ultraPlan = messagePlans.find(p => p.id === 'ultra_15k');

    const allPlans = [
      // 🔒 Plano gratuito: só mostrar se o usuário PODE ativar trial OU já tem trial ativo
      ...(canActivateTrial || hasActiveTrial ? [{
        id: 'free_200',
        name: freePlan?.name || 'Gratuito',
        description: freePlan?.description || 'Apenas uma vez por usuário',
        price: 0,
        priceText: 'Gratuito',
        period: '30 dias',
        messages: freePlan?.message_limit || 200,
        icon: Zap,
        color: 'from-green-500 to-emerald-600',
        borderColor: 'border-green-200',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        features: freePlan?.features || [
          '200 mensagens de IA',
          '1 usuário',
          '1 WhatsApp conectado',
          'Leads ilimitados',
          'Acesso ilimitado ao CRM'
        ],
        badge: hasActiveTrial ? 'Ativo' : canActivateTrial ? 'Teste Grátis' : null,
        badgeColor: hasActiveTrial ? 'bg-green-100 text-green-800' : 'bg-green-100 text-green-700'
      }] : []),
      {
        id: 'pro_5k',
        name: proPlan?.name || 'Profissional',
        description: proPlan?.description || 'Ideal para empresas em crescimento',
        price: Math.round((proPlan?.price || 399) * 100),
        priceText: `R$ ${(proPlan?.price || 399).toFixed(2)}`,
        period: 'por mês',
        messages: proPlan?.message_limit || 5000,
        icon: Star,
        color: 'from-purple-500 to-purple-600',
        borderColor: 'border-purple-200',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        features: proPlan?.features || [
          '**5.000 mensagens de IA/mês**',
          '3 Agentes de IA',
          '3 membros operacionais',
          '3 WhatsApps conectados',
          'Acesso ilimitado ao CRM',
          'Leads ilimitados'
        ],
        badge: currentPlan === 'pro_5k' ? 'Seu Plano' : 'Mais Vendido',
        badgeColor: currentPlan === 'pro_5k' ? 'bg-green-100 text-green-800' : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
      },
      {
        id: 'ultra_15k',
        name: ultraPlan?.name || 'Ultra',
        description: ultraPlan?.description || 'Para operações de alto volume',
        price: Math.round((ultraPlan?.price || 799) * 100),
        priceText: `R$ ${(ultraPlan?.price || 799).toFixed(2)}`,
        period: 'por mês',
        messages: ultraPlan?.message_limit || 15000,
        icon: Crown,
        color: 'from-yellow-500 to-amber-600',
        borderColor: 'border-yellow-200',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        features: ultraPlan?.features || [
          '**15.000 mensagens de IA/mês**',
          'Agentes de IA ilimitados',
          'Membros operacionais ilimitados',
          'WhatsApps ilimitados',
          'Acesso ilimitado ao CRM',
          'Leads ilimitados'
        ],
        badge: currentPlan === 'ultra_15k' ? 'Seu Plano' : null,
        badgeColor: currentPlan === 'ultra_15k' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
      }
    ];

    return allPlans;
  };

  const plans = getPlansToShow();

  const isPlanActive = (planId: string) => {
    return currentPlan === planId && (hasActiveTrial || hasActiveSubscription) && !isBlocked && !isOverdue;
  };

  const canSelectPlan = (planId: string) => {
    // Se já tem este plano ativo, não pode selecionar novamente
    if (isPlanActive(planId)) return false;

    // Se é o trial gratuito, só pode ativar se ainda pode usar trial
    if (planId === 'free_200') return canActivateTrial;

    // Planos pagos sempre podem ser selecionados
    return true;
  };

  const getButtonText = (planId: string) => {
    if (isPlanActive(planId)) {
      return 'Plano Atual';
    }

    if (isBlocked || isOverdue) {
      return 'Reativar';
    }

    if (planId === 'free_200') {
      return canActivateTrial ? 'Começar Agora' : 'Trial Usado';
    }

    if (currentPlan === 'free_200' && hasActiveTrial) {
      return 'Fazer Upgrade';
    }

    return 'Escolher Plano';
  };

  const getButtonVariant = (planId: string) => {
    if (isPlanActive(planId)) return 'outline' as const;
    if (!canSelectPlan(planId)) return 'ghost' as const;
    return 'default' as const;
  };

  // Determinar contexto do usuário (título e subtítulo dinâmicos)
  const getUserContext = () => {
    if (hasActiveTrial) {
      return {
        title: '📈 Hora do upgrade!',
        subtitle: 'Você está aproveitando o trial. Escolha o plano ideal e continue crescendo.'
      };
    }

    if (hasActiveSubscription) {
      const planName = currentPlan === 'pro_5k' ? 'Profissional' : 'Ultra';
      return {
        title: '⚡ Evoluir para mais poder?',
        subtitle: `Você tem o plano ${planName}. Que tal conhecer o que está disponível?`
      };
    }

    // Usuário sem plano
    return {
      title: '🚀 Escolha o plano ideal para você',
      subtitle: 'Compare todas as opções e encontre a solução perfeita para seu negócio.'
    };
  };

  const context = getUserContext();

  return (
    <div id="plans-section" className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl sm:text-4xl font-bold">{context.title}</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {context.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isActive = isPlanActive(plan.id);
          const canSelect = canSelectPlan(plan.id);

          return (
            <Card
              key={plan.id}
              className={`rounded-3xl bg-white/35 backdrop-blur-lg border border-white/30 shadow-2xl transition-all duration-500 hover:shadow-3xl hover:scale-[1.02] hover:bg-white/40 animate-fade-in ${
                isActive
                  ? 'bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-green-300'
                  : ''
              }`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 bg-gradient-to-r ${plan.color} text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>

                  {plan.badge && (
                    <Badge className={plan.badgeColor}>
                      {plan.badge}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{plan.priceText}</span>
                    <span className="text-sm text-muted-foreground">/{plan.period}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span>{plan.messages.toLocaleString('pt-BR')} mensagens IA</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => {
                    // Suportar formato **texto** para negrito (igual ao register)
                    const isBold = feature.startsWith('**') && feature.endsWith('**');
                    const text = isBold ? feature.slice(2, -2) : feature;

                    return (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className={isBold ? 'font-bold' : ''}>{text}</span>
                      </li>
                    );
                  })}
                </ul>

                <Button
                  size="lg"
                  variant={getButtonVariant(plan.id)}
                  disabled={!canSelect || loading}
                  onClick={() => {
                    if (canSelect) {
                      const planData = messagePlans.find(p => p.id === plan.id);
                      if (planData) handlePlanSelection(planData);
                    }
                  }}
                  className="w-full transition-all duration-200 hover:scale-105"
                >
                  {isActive ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {getButtonText(plan.id)}
                    </>
                  ) : plan.id === 'free_200' ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      {loading ? 'Ativando...' : getButtonText(plan.id)}
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      {loading ? 'Processando...' : getButtonText(plan.id)}
                    </>
                  )}
                </Button>

                {plan.id === 'free_200' && !canActivateTrial && (
                  <p className="text-xs text-center text-muted-foreground">
                    Trial já utilizado anteriormente
                  </p>
                )}

                {isActive && (
                  <div className="text-center">
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Ativo agora
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Informação adicional */}
      <div className="text-center">
        <Card className="rounded-3xl bg-white/20 backdrop-blur-sm border border-dashed border-white/40 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Cancele a qualquer momento • Sem taxas ocultas • Suporte em português</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};