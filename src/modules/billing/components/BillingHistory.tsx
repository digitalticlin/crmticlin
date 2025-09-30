import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  Receipt,
  Download,
  Eye,
  AlertTriangle,
  Settings
} from 'lucide-react';
import { useBillingData } from '../hooks/useBillingData';
import { usePaymentHistory } from '../hooks/usePaymentHistory';

export const BillingHistory = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const billing = useBillingData();
  const { history, isLoading: historyLoading } = usePaymentHistory();

  // Mostrar loading se qualquer um dos hooks estiver carregando
  if (billing.isLoading || historyLoading) {
    return <BillingHistorySkeleton />;
  }

  const getStatusConfig = (status: string, type: string) => {
    if (status === 'completed') {
      return {
        label: type === 'trial' ? 'Ativado' : 'Pago',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle
      };
    }

    if (status === 'pending') {
      return {
        label: 'Pendente',
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock
      };
    }

    if (status === 'failed') {
      return {
        label: 'Falhou',
        color: 'bg-red-100 text-red-800',
        icon: XCircle
      };
    }

    return {
      label: 'Processando',
      color: 'bg-blue-100 text-blue-800',
      icon: Clock
    };
  };

  const getPlanName = (planId: string) => {
    const names: Record<string, string> = {
      'free_200': 'Trial Gratuito',
      'pro_5k': 'Plano Profissional',
      'ultra_15k': 'Plano Ultra'
    };
    return names[planId] || planId;
  };

  const formatAmount = (amount: number) => {
    if (amount === 0) return 'Gratuito';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount / 100);
  };

  const visibleHistory = isExpanded ? history : history.slice(0, 3);

  return (
    <Card className="rounded-3xl bg-white/35 backdrop-blur-lg border border-white/30 shadow-2xl transition-all duration-500 hover:shadow-3xl hover:bg-white/40 animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Faturamento e Histórico
            </CardTitle>
            <CardDescription>
              Gerencie sua assinatura, pagamentos e histórico de faturas
            </CardDescription>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Menos
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Ver Tudo
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Seção de Gerenciamento da Assinatura */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Assinatura Atual
          </h3>

          <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">
                  {billing.currentPlan === 'free_200' ? 'Trial Gratuito' :
                   billing.currentPlan === 'pro_5k' ? 'Plano Profissional' :
                   billing.currentPlan === 'ultra_15k' ? 'Plano Ultra' : 'Sem Plano'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {billing.hasActiveSubscription ? 'Renovação automática ativa' :
                   billing.hasActiveTrial ? 'Trial ativo' : 'Nenhuma assinatura ativa'}
                </p>
              </div>
              <Badge variant="outline" className="bg-white/30 backdrop-blur-sm">
                {billing.currentPlan === 'pro_5k' ? 'R$ 399/mês' :
                 billing.currentPlan === 'ultra_15k' ? 'R$ 799/mês' : 'Gratuito'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-white/20"></div>

        {/* Histórico */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Histórico de Pagamentos</h3>

        {history.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="font-semibold mb-2">Nenhum histórico ainda</h3>
            <p className="text-sm text-muted-foreground">
              Quando você ativar um plano, o histórico aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleHistory.map((item) => {
              const statusConfig = getStatusConfig(item.status, item.type);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/20 transition-all duration-300 hover:bg-white/30"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-xl">
                      {item.type === 'trial' ? (
                        <Calendar className="h-5 w-5 text-primary" />
                      ) : (
                        <CreditCard className="h-5 w-5 text-primary" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{item.description}</h4>
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {item.date.toLocaleDateString('pt-BR')}
                        </span>

                        {item.paymentMethod !== 'N/A' && (
                          <span>{item.paymentMethod}</span>
                        )}

                        <span className="font-medium">
                          {formatAmount(item.amount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.invoiceUrl && (
                      <>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}

                    {item.status === 'failed' && (
                      <Button variant="outline" size="sm">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Tentar Novamente
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isExpanded && history.length > 3 && (
          <div className="text-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="text-primary"
            >
              Ver mais {history.length - 3} itens
            </Button>
          </div>
        )}

        {isExpanded && history.length > 3 && (
          <div className="text-center pt-2 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              Mostrando todos os {history.length} itens
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
            >
              <ChevronUp className="h-4 w-4 mr-2" />
              Mostrar Menos
            </Button>
          </div>
        )}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Skeleton para loading
 */
const BillingHistorySkeleton = () => (
  <Card className="rounded-3xl bg-white/35 backdrop-blur-lg border border-white/30 shadow-2xl animate-pulse">
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
    </CardHeader>

    <CardContent className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/20"
        >
          <div className="flex items-center gap-4 flex-1">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);