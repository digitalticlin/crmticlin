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
import { useMercadoPagoCheckout } from '../hooks/useMercadoPagoCheckout';
import { messagePlans } from '../data/messagePlans';

export const SimplePlansGrid = () => {
  const billing = useBillingData();
  const { createCheckoutSession, loading } = useMercadoPagoCheckout();

  const {
    currentPlan = null,
    hasActiveTrial = false,
    hasActiveSubscription = false,
    canActivateTrial = true,
    isBlocked = false,
    isOverdue = false
  } = billing;

  const handlePlanSelection = async (plan: typeof messagePlans[0]) => {
    await createCheckoutSession(plan);
  };

  const getPlansToShow = () => {
    return [
      {
        id: 'free_200',
        name: 'Comece Grátis',
        description: 'Perfeito para testar nossa plataforma',
        price: 0,
        priceText: 'Gratuito',
        period: '30 dias',
        messages: 200,
        icon: Zap,
        color: 'from-green-500 to-emerald-600',
        borderColor: 'border-green-200',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        features: [
          '200 mensagens IA',
          'Todas as funcionalidades',
          'Suporte por email',
          'Sem cartão necessário'
        ],
        badge: hasActiveTrial ? 'Ativo' : canActivateTrial ? 'Recomendado' : null,
        badgeColor: hasActiveTrial ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
      },
      {
        id: 'pro_5k',
        name: 'Profissional',
        description: 'Para equipes que querem escalar',
        price: 39900,
        priceText: 'R$ 399',
        period: 'por mês',
        messages: 5000,
        icon: Star,
        color: 'from-purple-500 to-purple-600',
        borderColor: 'border-purple-200',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        features: [
          '5.000 mensagens IA',
          'Suporte prioritário',
          'Analytics avançados',
          'Integração via API'
        ],
        badge: currentPlan === 'pro_5k' ? 'Seu Plano' : 'Popular',
        badgeColor: currentPlan === 'pro_5k' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
      },
      {
        id: 'ultra_15k',
        name: 'Ultra',
        description: 'Para empresas de alto volume',
        price: 79900,
        priceText: 'R$ 799',
        period: 'por mês',
        messages: 15000,
        icon: Crown,
        color: 'from-orange-500 to-red-600',
        borderColor: 'border-orange-200',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        features: [
          '15.000 mensagens IA',
          'Suporte dedicado',
          'Onboarding personalizado',
          'SLA garantido'
        ],
        badge: currentPlan === 'ultra_15k' ? 'Seu Plano' : 'Máximo Poder',
        badgeColor: currentPlan === 'ultra_15k' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
      }
    ];
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

  return (
    <div id="plans-section" className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Escolha seu plano ideal</h2>
        <p className="text-muted-foreground">
          Comece grátis e escale conforme seu negócio cresce
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
                  ? `bg-gradient-to-br ${plan.color.replace('from-', 'from-').replace('to-', 'to-')}/20`
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
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
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