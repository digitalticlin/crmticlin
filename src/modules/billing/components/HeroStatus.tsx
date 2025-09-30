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

export const HeroStatus = () => {
  const billing = useBillingData();

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
          title: '⏰ Plano Gratuito',
          description: `Seu período de teste expira em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}. Faça upgrade para continuar aproveitando todas as funcionalidades sem interrupções.`
        };
      }

      // Trial normal
      return {
        icon: Zap,
        iconColor: 'text-green-500',
        title: '🎉 Plano Gratuito Ativo',
        description: `Você tem ${daysLeft} dias restantes e ${billing.remaining || 0} mensagens disponíveis no seu plano de teste. Aproveite para explorar todas as funcionalidades!`
      };
    }

    // Plano ativo
    if (hasActiveSubscription && !isOverdue && !isBlocked) {
      const planName = currentPlan === 'pro_5k' ? 'Profissional' : currentPlan === 'ultra_15k' ? 'Ultra' : 'Ativo';

      return {
        icon: CheckCircle,
        iconColor: 'text-green-500',
        title: `✨ Plano ${planName}`,
        description: `Seu plano está ativo e a renovação automática está configurada. Você tem acesso completo a todas as funcionalidades premium.`
      };
    }

    // Pagamento atrasado
    if (isOverdue && !isBlocked) {
      const planName = currentPlan === 'pro_5k' ? 'Profissional' : currentPlan === 'ultra_15k' ? 'Ultra' : 'seu plano';
      return {
        icon: AlertTriangle,
        iconColor: 'text-orange-500',
        title: `💳 Plano ${planName === 'seu plano' ? planName : planName} - Pagamento Pendente`,
        description: 'Regularize seu pagamento para continuar aproveitando todas as funcionalidades sem interrupções.'
      };
    }

    // Conta bloqueada
    if (isBlocked) {
      const planName = currentPlan === 'pro_5k' ? 'Profissional' : currentPlan === 'ultra_15k' ? 'Ultra' : 'seu plano';
      return {
        icon: Pause,
        iconColor: 'text-red-500',
        title: `⏸️ Plano ${planName === 'seu plano' ? planName : planName} - Pausado`,
        description: 'Sua conta está temporariamente pausada. Regularize o pagamento para reativar o acesso imediatamente.'
      };
    }

    // Trial expirado
    if (!hasActiveTrial && !hasActiveSubscription && !canActivateTrial) {
      return {
        icon: XCircle,
        iconColor: 'text-gray-500',
        title: '⏰ Plano Gratuito Expirado',
        description: 'Seu período de teste terminou. Escolha um plano para continuar usando o CRM Ticlin sem limitações.'
      };
    }

    // Usuário novo (pode ativar trial)
    return {
      icon: Sparkles,
      iconColor: 'text-purple-500',
      title: '🌟 Bem-vindo ao CRM Ticlin!',
      description: 'Ative seu Plano Gratuito agora: 200 mensagens por 30 dias. Sem cartão, sem compromisso, sem complicação.'
    };
  };

  const config = getHeroConfig();
  const Icon = config.icon;

  return (
    <Card className="rounded-3xl bg-white/35 backdrop-blur-lg border border-white/30 shadow-2xl transition-all duration-500 hover:shadow-3xl hover:scale-[1.01] hover:bg-white/40 animate-fade-in">
      <CardContent className="p-8">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 ${config.iconColor}`}>
            <Icon className="h-8 w-8" />
          </div>

          <div className="space-y-2 flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
              {config.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-base lg:text-lg leading-relaxed">
              {config.description}
            </p>
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