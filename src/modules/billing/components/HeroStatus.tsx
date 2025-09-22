import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Clock,
  XCircle,
  CheckCircle,
  AlertTriangle,
  Pause,
  Zap,
  CreditCard,
  MessageSquare,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { useBillingData } from '../hooks/useBillingData';
import { useMercadoPagoCheckout } from '../hooks/useMercadoPagoCheckout';
import { messagePlans } from '../data/messagePlans';

export const HeroStatus = () => {
  const billing = useBillingData();
  const { createCheckoutSession, loading } = useMercadoPagoCheckout();

  // Determinar estado e configuração
  const getHeroConfig = () => {
    const {
      billingStatus,
      hasActiveTrial,
      hasActiveSubscription,
      isBlocked,
      isOverdue,
      currentPlan,
      canActivateTrial,
      usage
    } = billing;

    // Trial ativo
    if (hasActiveTrial && billingStatus === 'trial') {
      const trial = billing.trial;
      const daysLeft = trial ? Math.max(0, Math.ceil((new Date(trial.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

      if (daysLeft <= 3) {
        // Trial expirando
        return {
          icon: Clock,
          iconColor: 'text-orange-500',
          title: '⏰ Seu trial expira em breve',
          description: `Você tem ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'} restantes para aproveitar o trial gratuito. Escolha um plano para continuar usando todas as funcionalidades.`,
          primaryAction: {
            text: 'Escolher Plano',
            icon: ArrowRight,
            variant: 'default' as const,
            onClick: () => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })
          },
          secondaryAction: {
            text: 'Preciso de Ajuda',
            icon: HelpCircle,
            variant: 'ghost' as const
          }
        };
      }

      // Trial normal
      return {
        icon: Zap,
        iconColor: 'text-blue-500',
        title: '🎉 Seu trial está rodando!',
        description: `Você tem ${daysLeft} dias restantes e ${billing.remaining || 0} mensagens disponíveis. Está gostando? Que tal conhecer nossos planos?`,
        primaryAction: {
          text: 'Ver Detalhes',
          icon: MessageSquare,
          variant: 'outline' as const,
          onClick: () => document.getElementById('status-section')?.scrollIntoView({ behavior: 'smooth' })
        },
        secondaryAction: {
          text: 'Fazer Upgrade',
          icon: ArrowRight,
          variant: 'default' as const,
          onClick: () => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })
        }
      };
    }

    // Plano ativo
    if (hasActiveSubscription && !isOverdue && !isBlocked) {
      const planName = currentPlan === 'pro_5k' ? 'Pro' : currentPlan === 'ultra_15k' ? 'Ultra' : 'Ativo';

      return {
        icon: CheckCircle,
        iconColor: 'text-green-500',
        title: '✨ Tudo funcionando perfeitamente!',
        description: `Seu plano ${planName} está ativo e a renovação automática está configurada. Continue aproveitando todos os recursos!`,
        primaryAction: {
          text: 'Ver Detalhes',
          icon: MessageSquare,
          variant: 'outline' as const,
          onClick: () => document.getElementById('status-section')?.scrollIntoView({ behavior: 'smooth' })
        },
        secondaryAction: {
          text: 'Gerenciar',
          icon: CreditCard,
          variant: 'ghost' as const
        }
      };
    }

    // Pagamento atrasado
    if (isOverdue && !isBlocked) {
      return {
        icon: AlertTriangle,
        iconColor: 'text-orange-500',
        title: '💳 Pagamento pendente',
        description: 'Seu plano continua ativo por mais alguns dias. Regularize para não perder o acesso a todas as funcionalidades.',
        primaryAction: {
          text: 'Pagar Agora',
          icon: CreditCard,
          variant: 'default' as const,
          onClick: () => {
            const plan = messagePlans.find(p => p.id === currentPlan);
            if (plan) createCheckoutSession(plan);
          }
        },
        secondaryAction: {
          text: 'Falar Conosco',
          icon: HelpCircle,
          variant: 'outline' as const
        }
      };
    }

    // Conta bloqueada
    if (isBlocked) {
      return {
        icon: Pause,
        iconColor: 'text-red-500',
        title: '⏸️ Conta temporariamente pausada',
        description: 'Reative instantaneamente quitando o pagamento ou entre em contato se precisar de ajuda.',
        primaryAction: {
          text: 'Reativar',
          icon: CreditCard,
          variant: 'default' as const,
          onClick: () => {
            const plan = messagePlans.find(p => p.id === currentPlan);
            if (plan) createCheckoutSession(plan);
          }
        },
        secondaryAction: {
          text: 'Conversar',
          icon: MessageSquare,
          variant: 'outline' as const
        }
      };
    }

    // Trial expirado
    if (!hasActiveTrial && !hasActiveSubscription && !canActivateTrial) {
      return {
        icon: XCircle,
        iconColor: 'text-gray-500',
        title: '😔 Seu trial expirou',
        description: 'Mas não se preocupe! Reative em segundos escolhendo o plano ideal para você.',
        primaryAction: {
          text: 'Reativar Agora',
          icon: Sparkles,
          variant: 'default' as const,
          onClick: () => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })
        },
        secondaryAction: {
          text: 'Ver Preços',
          icon: CreditCard,
          variant: 'outline' as const
        }
      };
    }

    // Usuário novo (pode ativar trial)
    return {
      icon: Sparkles,
      iconColor: 'text-purple-500',
      title: '🌟 Bem-vindo ao CRM Ticlin!',
      description: 'Comece com 200 mensagens grátis por 30 dias. Sem cartão, sem compromisso.',
      primaryAction: {
        text: 'Começar Agora',
        icon: Sparkles,
        variant: 'default' as const,
        onClick: async () => {
          const freePlan = messagePlans.find(p => p.id === 'free_200');
          if (freePlan) await createCheckoutSession(freePlan);
        }
      },
      secondaryAction: {
        text: 'Como Funciona?',
        icon: HelpCircle,
        variant: 'ghost' as const
      }
    };
  };

  const config = getHeroConfig();
  const Icon = config.icon;
  const PrimaryIcon = config.primaryAction.icon;
  const SecondaryIcon = config.secondaryAction.icon;

  return (
    <Card className="rounded-3xl bg-white/35 backdrop-blur-lg border border-white/30 shadow-2xl transition-all duration-500 hover:shadow-3xl hover:scale-[1.01] hover:bg-white/40 animate-fade-in">
      <CardContent className="p-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
          {/* Icon & Content */}
          <div className="flex items-start gap-4 flex-1">
            <div className={`p-3 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 ${config.iconColor}`}>
              <Icon className="h-8 w-8" />
            </div>

            <div className="space-y-2 flex-1">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                {config.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-base lg:text-lg leading-relaxed max-w-2xl">
                {config.description}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto lg:min-w-[280px]">
            <Button
              onClick={config.primaryAction.onClick}
              variant={config.primaryAction.variant}
              size="lg"
              disabled={loading}
              className="flex-1 lg:flex-none transition-all duration-200 hover:scale-105"
            >
              <PrimaryIcon className="h-5 w-5 mr-2" />
              {loading ? 'Processando...' : config.primaryAction.text}
            </Button>

            <Button
              onClick={config.secondaryAction.onClick}
              variant={config.secondaryAction.variant}
              size="lg"
              className="flex-1 lg:flex-none"
            >
              <SecondaryIcon className="h-4 w-4 mr-2" />
              {config.secondaryAction.text}
            </Button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-4 flex items-center gap-2">
          <Badge variant="outline" className={`${config.iconColor} border-current bg-white/30 backdrop-blur-sm`}>
            {billing.billingStatus === 'trial' ? 'Trial Ativo' :
             billing.billingStatus === 'active' ? 'Plano Ativo' :
             billing.billingStatus === 'overdue' ? 'Pagamento Pendente' :
             billing.billingStatus === 'blocked' ? 'Conta Pausada' :
             billing.billingStatus === 'inactive' ? 'Sem Plano' : 'Carregando...'}
          </Badge>

          {billing.currentPlan && (
            <Badge variant="secondary" className="bg-white/30 backdrop-blur-sm">
              {billing.currentPlan === 'free_200' ? 'Trial' :
               billing.currentPlan === 'pro_5k' ? 'Pro' :
               billing.currentPlan === 'ultra_15k' ? 'Ultra' : billing.currentPlan}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};