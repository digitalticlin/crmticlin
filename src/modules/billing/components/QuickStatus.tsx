import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  Zap
} from 'lucide-react';
import { useBillingData } from '../hooks/useBillingData';
import { useMercadoPagoCheckout } from '../hooks/useMercadoPagoCheckout';
import { messagePlans } from '../data/messagePlans';

export const QuickStatus = () => {
  const navigate = useNavigate();
  const billing = useBillingData();
  const { createCheckoutSession, loading } = useMercadoPagoCheckout();

  if (billing.isLoading) {
    return <QuickStatusSkeleton />;
  }

  const {
    currentUsage = 0,
    effectiveLimit = 200,
    remaining = 200,
    percentage = 0,
    billingStatus = 'inactive',
    currentPlan = null,
    hasActiveTrial = false,
    hasActiveSubscription = false,
    isBlocked = false,
    isOverdue = false,
    usage = {}
  } = billing;

  // Calcular próxima ação baseada no estado
  const getNextAction = () => {
    if (isBlocked) {
      return {
        text: 'Reativar Conta',
        icon: CreditCard,
        variant: 'destructive' as const,
        action: () => {
          const plan = messagePlans.find(p => p.id === currentPlan);
          if (plan) createCheckoutSession(plan);
        }
      };
    }

    if (isOverdue) {
      return {
        text: 'Pagar Agora',
        icon: CreditCard,
        variant: 'default' as const,
        action: () => {
          const plan = messagePlans.find(p => p.id === currentPlan);
          if (plan) createCheckoutSession(plan);
        }
      };
    }

    if (percentage >= 90) {
      return {
        text: 'Fazer Upgrade',
        icon: TrendingUp,
        variant: 'default' as const,
        action: () => navigate('/plans/upgrade')
      };
    }

    if (hasActiveTrial) {
      const trial = billing.trial;
      const daysLeft = trial ? Math.max(0, Math.ceil((new Date(trial.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

      if (daysLeft <= 3) {
        return {
          text: 'Escolher Plano',
          icon: TrendingUp,
          variant: 'default' as const,
          action: () => navigate('/plans/upgrade')
        };
      }

      return {
        text: 'Ver Planos',
        icon: MessageSquare,
        variant: 'outline' as const,
        action: () => navigate('/plans/upgrade')
      };
    }

    if (!hasActiveTrial && !hasActiveSubscription) {
      return {
        text: 'Começar Trial',
        icon: Zap,
        variant: 'default' as const,
        action: async () => {
          const freePlan = messagePlans.find(p => p.id === 'free_200');
          if (freePlan) await createCheckoutSession(freePlan);
        }
      };
    }

    // Usuário com plano pago ativo - pode fazer upgrade
    return {
      text: 'Ver Planos',
      icon: TrendingUp,
      variant: 'outline' as const,
      action: () => navigate('/plans/upgrade')
    };
  };

  const nextAction = getNextAction();
  const ActionIcon = nextAction.icon;

  // Calcular informações do período
  const periodStart = usage.period_start ? new Date(usage.period_start) : new Date();
  const periodEnd = usage.period_end ? new Date(usage.period_end) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const daysLeft = Math.max(0, Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  // Status do usuário
  const getStatusInfo = () => {
    if (isBlocked) return { label: 'Conta Pausada', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    if (isOverdue) return { label: 'Pagamento Pendente', color: 'bg-orange-100 text-orange-800', icon: Clock };
    if (hasActiveTrial) return { label: 'Trial Ativo', color: 'bg-blue-100 text-blue-800', icon: Zap };
    if (hasActiveSubscription) return { label: 'Plano Ativo', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    return { label: 'Sem Plano', color: 'bg-gray-100 text-gray-800', icon: MessageSquare };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Status Atual */}
      <Card className="rounded-3xl bg-white/35 backdrop-blur-lg border border-white/30 shadow-2xl transition-all duration-500 hover:shadow-3xl hover:scale-[1.02] hover:bg-white/40 animate-fade-in">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <StatusIcon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Status</span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-2xl font-bold">
              {currentUsage.toLocaleString('pt-BR')}
            </p>
            <p className="text-sm text-muted-foreground">
              de {effectiveLimit.toLocaleString('pt-BR')} mensagens
            </p>

            {/* Barra de progresso mini */}
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  percentage >= 90 ? 'bg-red-500' :
                  percentage >= 75 ? 'bg-orange-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Período */}
      <Card className="rounded-3xl bg-white/35 backdrop-blur-lg border border-white/30 shadow-2xl transition-all duration-500 hover:shadow-3xl hover:scale-[1.02] hover:bg-white/40 animate-fade-in">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Período</span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-2xl font-bold">
              {daysLeft}
            </p>
            <p className="text-sm text-muted-foreground">
              {daysLeft === 1 ? 'dia restante' : 'dias restantes'}
            </p>

            <div className="text-xs text-muted-foreground mt-2">
              Até {periodEnd.toLocaleDateString('pt-BR')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Próxima Ação */}
      <Card className="rounded-3xl bg-white/35 backdrop-blur-lg border border-white/30 shadow-2xl transition-all duration-500 hover:shadow-3xl hover:scale-[1.02] hover:bg-white/40 animate-fade-in">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Upgrade</span>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-2xl font-bold">
              🚀 Faça Upgrade
            </p>
            <p className="text-sm text-muted-foreground">
              Libere mais mensagens e recursos avançados!
            </p>

            <Button
              size="sm"
              onClick={nextAction.action}
              disabled={loading}
              className="w-full"
            >
              <ActionIcon className="h-4 w-4 mr-2" />
              {loading ? 'Carregando...' : 'Ver Planos'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Skeleton para loading
 */
const QuickStatusSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {[1, 2, 3].map((i) => (
      <Card key={i} className="rounded-3xl bg-white/35 backdrop-blur-lg border border-white/30 shadow-2xl animate-pulse">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-muted rounded" />
              <div className="h-4 w-16 bg-muted rounded" />
            </div>
            <div className="h-6 w-20 bg-muted rounded-full" />
          </div>

          <div className="space-y-2">
            <div className="h-8 w-16 bg-muted rounded" />
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-2 w-full bg-muted rounded-full" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);