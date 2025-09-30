import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Eye,
  TrendingUp,
  Settings,
  Crown,
  Zap,
  ArrowRight,
  MessageSquare,
  Calendar,
  CreditCard
} from 'lucide-react';
import { useBillingData } from '../hooks/useBillingData';
import { useStripeCheckout } from '../hooks/useStripeCheckout';
import { messagePlans } from '../data/messagePlans';
import { useNavigate } from 'react-router-dom';

export const PlansActionCards = () => {
  const billing = useBillingData();
  const { createCheckoutSession, loading } = useStripeCheckout();
  const navigate = useNavigate();

  // Loading state
  if (billing.isLoading) {
    return <PlansActionCardsSkeleton />;
  }

  const {
    hasActiveTrial,
    hasActiveSubscription,
    canActivateTrial,
    currentPlan,
    billingStatus,
    isBlocked,
    isOverdue
  } = billing;

  // Calcular dias restantes do trial
  const getDaysLeft = () => {
    if (!billing.trial) return 0;
    return Math.max(0, Math.ceil((new Date(billing.trial.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  };

  // Ativar trial gratuito
  const handleActivateTrial = async () => {
    const freePlan = messagePlans.find(p => p.id === 'free_200');
    if (freePlan) {
      await createCheckoutSession(freePlan);
    }
  };

  // Navegar para página de upgrade
  const handleViewPlans = () => {
    navigate('/plans/upgrade');
  };

  // Expandir detalhes do billing atual
  const handleExpandBilling = () => {
    document.getElementById('billing-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // 🚨 USUÁRIO BLOQUEADO OU COM PROBLEMAS
  if (isBlocked || isOverdue) {
    return (
      <Card className="rounded-3xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 shadow-2xl animate-fade-in">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto p-3 rounded-2xl bg-red-100 dark:bg-red-900/30 w-fit mb-4">
            <CreditCard className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl text-red-900 dark:text-red-100">
            {isBlocked ? '⏸️ Conta Pausada' : '💳 Pagamento Pendente'}
          </CardTitle>
          <CardDescription className="text-red-700 dark:text-red-300">
            {isBlocked
              ? 'Reative instantaneamente quitando o pagamento pendente'
              : 'Regularize para não perder acesso às funcionalidades'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <Button
            size="lg"
            className="w-full bg-red-600 hover:bg-red-700 text-white"
            onClick={() => {
              const plan = messagePlans.find(p => p.id === currentPlan);
              if (plan) createCheckoutSession(plan);
            }}
            disabled={loading}
          >
            <CreditCard className="h-5 w-5 mr-2" />
            {loading ? 'Processando...' : (isBlocked ? 'Reativar Conta' : 'Pagar Agora')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 👤 USUÁRIO SEM PLANO (Pode ativar trial)
  if (!hasActiveTrial && !hasActiveSubscription && canActivateTrial) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Trial Gratuito */}
        <Card className="rounded-3xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 shadow-2xl transition-all duration-500 hover:shadow-3xl hover:scale-[1.02] animate-fade-in">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto p-3 rounded-2xl bg-green-100 dark:bg-green-900/30 w-fit mb-4">
              <Sparkles className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-xl text-green-900 dark:text-green-100">
              🚀 Começar Gratuito
            </CardTitle>
            <CardDescription className="text-green-700 dark:text-green-300">
              200 mensagens IA por 30 dias, sem cartão necessário
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                <MessageSquare className="h-4 w-4" />
                <span>200 mensagens IA incluídas</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                <Calendar className="h-4 w-4" />
                <span>30 dias de acesso completo</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                <Zap className="h-4 w-4" />
                <span>Todas as funcionalidades</span>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={handleActivateTrial}
              disabled={loading}
            >
              <Sparkles className="h-5 w-5 mr-2" />
              {loading ? 'Ativando...' : 'Começar Agora'}
            </Button>
          </CardContent>
        </Card>

        {/* Card Ver Planos */}
        <Card className="rounded-3xl bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 shadow-2xl transition-all duration-500 hover:shadow-3xl hover:scale-[1.02] animate-fade-in">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto p-3 rounded-2xl bg-purple-100 dark:bg-purple-900/30 w-fit mb-4">
              <Eye className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <CardTitle className="text-xl text-purple-900 dark:text-purple-100">
              👀 Ver Todos os Planos
            </CardTitle>
            <CardDescription className="text-purple-700 dark:text-purple-300">
              Compare opções e escolha o ideal para seu negócio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
                <TrendingUp className="h-4 w-4" />
                <span>Até 15.000 mensagens/mês</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
                <Settings className="h-4 w-4" />
                <span>Recursos avançados</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
                <Crown className="h-4 w-4" />
                <span>Suporte prioritário</span>
              </div>
            </div>

            <Button
              size="lg"
              variant="outline"
              className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-900/30"
              onClick={handleViewPlans}
            >
              <Eye className="h-5 w-5 mr-2" />
              Ver Planos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 🔄 USUÁRIO COM TRIAL ATIVO
  if (hasActiveTrial) {
    const daysLeft = getDaysLeft();
    const isExpiringSoon = daysLeft <= 5;

    return (
      <Card className={`rounded-3xl ${isExpiringSoon
        ? 'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800'
        : 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800'
      } shadow-2xl transition-all duration-500 hover:shadow-3xl hover:scale-[1.01] animate-fade-in`}>
        <CardHeader className="text-center pb-4">
          <div className={`mx-auto p-3 rounded-2xl w-fit mb-4 ${isExpiringSoon
            ? 'bg-orange-100 dark:bg-orange-900/30'
            : 'bg-blue-100 dark:bg-blue-900/30'
          }`}>
            {isExpiringSoon ? (
              <Calendar className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            ) : (
              <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            )}
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <Badge className={isExpiringSoon ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}>
              Trial Ativo
            </Badge>
            <Badge variant="outline" className="bg-white/50">
              {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'} restantes
            </Badge>
          </div>

          <CardTitle className={`text-xl ${isExpiringSoon
            ? 'text-orange-900 dark:text-orange-100'
            : 'text-blue-900 dark:text-blue-100'
          }`}>
            {isExpiringSoon ? '⏰ Trial expira em breve!' : '📈 Pronto para o próximo nível?'}
          </CardTitle>
          <CardDescription className={isExpiringSoon
            ? 'text-orange-700 dark:text-orange-300'
            : 'text-blue-700 dark:text-blue-300'
          }>
            {isExpiringSoon
              ? `Escolha um plano antes que expire em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}`
              : 'Você está aproveitando o trial! Que tal conhecer nossos planos pagos?'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              size="lg"
              className={isExpiringSoon
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              }
              onClick={handleViewPlans}
            >
              <TrendingUp className="h-5 w-5 mr-2" />
              {isExpiringSoon ? 'Escolher Plano' : 'Fazer Upgrade'}
            </Button>

            <Button
              variant="outline"
              size="lg"
              className={`${isExpiringSoon
                ? 'border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300'
                : 'border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300'
              }`}
              onClick={handleExpandBilling}
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Ver Detalhes
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 💎 USUÁRIO COM PLANO PAGO ATIVO
  if (hasActiveSubscription) {
    const planName = currentPlan === 'pro_5k' ? 'Profissional' :
                    currentPlan === 'ultra_15k' ? 'Ultra' : 'Ativo';
    const canUpgrade = currentPlan === 'pro_5k'; // Pro pode upgrade para Ultra

    return (
      <Card className="rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 shadow-2xl transition-all duration-500 hover:shadow-3xl hover:scale-[1.01] animate-fade-in">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 w-fit mb-4">
            <Crown className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <Badge className="bg-emerald-100 text-emerald-800">
              Plano {planName}
            </Badge>
            <Badge variant="outline" className="bg-white/50">
              Ativo
            </Badge>
          </div>

          <CardTitle className="text-xl text-emerald-900 dark:text-emerald-100">
            ⚙️ Gerenciar minha assinatura
          </CardTitle>
          <CardDescription className="text-emerald-700 dark:text-emerald-300">
            {canUpgrade
              ? 'Alterar plano, upgrade para Ultra, ou gerenciar pagamento'
              : 'Gerenciar forma de pagamento e configurações da assinatura'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {canUpgrade && (
              <Button
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                onClick={handleViewPlans}
              >
                <Crown className="h-5 w-5 mr-2" />
                Upgrade Ultra
              </Button>
            )}

            <Button
              variant="outline"
              size="lg"
              className={`border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 ${canUpgrade ? '' : 'col-span-2'}`}
              onClick={handleExpandBilling}
            >
              <Settings className="h-5 w-5 mr-2" />
              Gerenciar Assinatura
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 😔 USUÁRIO SEM PLANO (Trial já usado)
  return (
    <Card className="rounded-3xl bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border border-gray-200 dark:border-gray-800 shadow-2xl transition-all duration-500 hover:shadow-3xl hover:scale-[1.01] animate-fade-in">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto p-3 rounded-2xl bg-gray-100 dark:bg-gray-900/30 w-fit mb-4">
          <MessageSquare className="h-8 w-8 text-gray-600 dark:text-gray-400" />
        </div>
        <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
          🚀 Reative sua conta
        </CardTitle>
        <CardDescription className="text-gray-700 dark:text-gray-300">
          Escolha um dos nossos planos e volte a usar todas as funcionalidades
        </CardDescription>
      </CardHeader>

      <CardContent className="text-center space-y-4">
        <Button
          size="lg"
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          onClick={handleViewPlans}
        >
          <ArrowRight className="h-5 w-5 mr-2" />
          Ver Planos Disponíveis
        </Button>
      </CardContent>
    </Card>
  );
};

/**
 * Skeleton para loading
 */
const PlansActionCardsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {[1, 2].map((i) => (
      <Card key={i} className="rounded-3xl bg-white/35 backdrop-blur-lg border border-white/30 shadow-2xl animate-pulse">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto h-14 w-14 bg-muted rounded-2xl mb-4" />
          <div className="h-6 w-32 bg-muted rounded mx-auto mb-2" />
          <div className="h-4 w-48 bg-muted rounded mx-auto" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-3/4 bg-muted rounded" />
            <div className="h-4 w-5/6 bg-muted rounded" />
          </div>
          <div className="h-12 w-full bg-muted rounded-lg" />
        </CardContent>
      </Card>
    ))}
  </div>
);