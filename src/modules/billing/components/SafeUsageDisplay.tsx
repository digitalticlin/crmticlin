import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MessageCircle,
  TrendingUp,
  Calendar,
  AlertTriangle,
  Clock,
  RefreshCw,
  Zap,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useBillingData, useBillingPermissions } from '../hooks/useBillingData';
import { BillingErrorBoundary } from './BillingErrorBoundary';

/**
 * Componente de exibição de uso com defensive coding completo
 */
export const SafeUsageDisplay = () => {
  const billingData = useBillingData();
  const permissions = useBillingPermissions();

  // Estados de loading
  if (billingData.isLoading) {
    return <UsageDisplaySkeleton />;
  }

  // Estados de erro com retry
  if (billingData.isError) {
    return <UsageDisplayError onRetry={billingData.retryQueries} />;
  }

  // Dados seguros com fallbacks
  const {
    currentUsage = 0,
    effectiveLimit = 200,
    percentage = 0,
    remaining = 200,
    billingStatus = 'inactive',
    currentPlan = null,
    hasActiveTrial = false,
    hasActiveSubscription = false,
    isBlocked = false,
    isOverdue = false,
    needsUpgrade = false,
    isNearLimit = false,
  } = billingData;

  // Dados de uso detalhado (com fallbacks)
  const usage = billingData.usage || {};
  const messagesSent = usage.messages_sent_count || usage.ai_messages_sent || 0;
  const messagesReceived = usage.messages_received_count || 0;
  const totalMessages = usage.total_messages_count || messagesSent + messagesReceived;

  // Informações do período
  const periodStart = usage.period_start ? new Date(usage.period_start) : new Date();
  const periodEnd = usage.period_end ? new Date(usage.period_end) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const daysLeft = Math.max(0, Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  // Status e cores
  const getStatusConfig = () => {
    if (isBlocked) {
      return {
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200',
        icon: XCircle,
        label: 'Bloqueado',
        description: 'Acesso bloqueado por inadimplência'
      };
    }

    if (isOverdue) {
      return {
        color: 'text-orange-500',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200',
        icon: AlertTriangle,
        label: 'Em Atraso',
        description: 'Pagamento em atraso'
      };
    }

    if (percentage >= 100) {
      return {
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200',
        icon: XCircle,
        label: 'Limite Atingido',
        description: 'Limite de mensagens esgotado'
      };
    }

    if (percentage >= 90) {
      return {
        color: 'text-orange-500',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200',
        icon: AlertTriangle,
        label: 'Quase no Limite',
        description: 'Considere fazer upgrade'
      };
    }

    if (hasActiveTrial) {
      return {
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200',
        icon: Zap,
        label: 'Trial Ativo',
        description: `${daysLeft} dias restantes`
      };
    }

    if (hasActiveSubscription) {
      return {
        color: 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200',
        icon: CheckCircle,
        label: 'Plano Ativo',
        description: 'Renovação automática'
      };
    }

    return {
      color: 'text-gray-500',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20',
      borderColor: 'border-gray-200',
      icon: Clock,
      label: 'Sem Plano',
      description: 'Ative um plano para começar'
    };
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <BillingErrorBoundary>
      <Card className={`glass-card border-2 ${statusConfig.borderColor} ${statusConfig.bgColor}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Uso de Mensagens
              </CardTitle>
              <CardDescription>
                {currentPlan ? `Plano ${getPlanName(currentPlan)}` : 'Nenhum plano ativo'}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
              <Badge variant="outline" className={`${statusConfig.color} border-current`}>
                {statusConfig.label}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Alertas importantes */}
          {(isBlocked || isOverdue || needsUpgrade) && (
            <Alert className={statusConfig.borderColor}>
              <StatusIcon className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">{statusConfig.label}</div>
                <div className="text-sm mt-1">{statusConfig.description}</div>
              </AlertDescription>
            </Alert>
          )}

          {/* Barra de progresso principal */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Mensagens IA Utilizadas</span>
              <span className={`font-bold ${statusConfig.color}`}>
                {percentage.toFixed(1)}%
              </span>
            </div>

            <Progress
              value={Math.min(percentage, 100)}
              className={`h-3 ${percentage >= 90 ? 'bg-red-100' : percentage >= 75 ? 'bg-orange-100' : 'bg-green-100'}`}
            />

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{safeToLocaleString(currentUsage)} de {safeToLocaleString(effectiveLimit)}</span>
              <span>{safeToLocaleString(remaining)} restantes</span>
            </div>
          </div>

          {/* Grid de estatísticas detalhadas */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium text-green-500">Enviadas</span>
              </div>
              <p className="text-lg font-bold">{safeToLocaleString(messagesSent)}</p>
              <p className="text-xs text-muted-foreground">
                {totalMessages > 0 ? `${((messagesSent / totalMessages) * 100).toFixed(0)}%` : '0%'} do total
              </p>
            </div>

            <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <MessageCircle className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium text-blue-500">Recebidas</span>
              </div>
              <p className="text-lg font-bold">{safeToLocaleString(messagesReceived)}</p>
              <p className="text-xs text-muted-foreground">
                {totalMessages > 0 ? `${((messagesReceived / totalMessages) * 100).toFixed(0)}%` : '0%'} do total
              </p>
            </div>

            <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg col-span-2 md:col-span-1">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className="h-4 w-4 text-purple-500" />
                <span className="text-xs font-medium text-purple-500">Período</span>
              </div>
              <p className="text-lg font-bold">{daysLeft}</p>
              <p className="text-xs text-muted-foreground">
                {daysLeft === 1 ? 'dia restante' : 'dias restantes'}
              </p>
            </div>
          </div>

          {/* Informações do período */}
          <div className="text-xs text-muted-foreground bg-white/30 dark:bg-black/10 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span>Período atual:</span>
              <span className="font-medium">
                {periodStart.toLocaleDateString('pt-BR')} - {periodEnd.toLocaleDateString('pt-BR')}
              </span>
            </div>
            {hasActiveTrial && (
              <div className="flex items-center justify-between mt-1">
                <span>Trial expira em:</span>
                <span className="font-medium text-blue-600">
                  {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}
                </span>
              </div>
            )}
          </div>

          {/* Ações baseadas em permissões */}
          {permissions.canChangePlan && needsUpgrade && (
            <Button size="sm" className="w-full">
              <TrendingUp className="h-4 w-4 mr-2" />
              Fazer Upgrade do Plano
            </Button>
          )}
        </CardContent>
      </Card>
    </BillingErrorBoundary>
  );
};

/**
 * Componente de loading com skeleton
 */
const UsageDisplaySkeleton = () => (
  <Card className="glass-card">
    <CardHeader className="pb-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-3 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
            <Skeleton className="h-4 w-16 mx-auto mb-2" />
            <Skeleton className="h-6 w-12 mx-auto mb-1" />
            <Skeleton className="h-3 w-20 mx-auto" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

/**
 * Componente de erro com retry
 */
const UsageDisplayError = ({ onRetry }: { onRetry: () => void }) => (
  <Card className="glass-card border-red-200 bg-red-50/50">
    <CardContent className="p-6 text-center">
      <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Erro ao Carregar Dados de Uso</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Não foi possível carregar as informações de uso. Tente novamente.
      </p>
      <Button onClick={onRetry} variant="outline" size="sm">
        <RefreshCw className="h-4 w-4 mr-2" />
        Tentar Novamente
      </Button>
    </CardContent>
  </Card>
);

/**
 * Utilitários seguros
 */
const safeToLocaleString = (value: number | undefined | null): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0';
  }
  return value.toLocaleString('pt-BR');
};

const getPlanName = (planType: string): string => {
  const planNames: Record<string, string> = {
    'free_200': 'Gratuito',
    'pro_5k': 'Profissional',
    'ultra_15k': 'Ultra',
  };
  return planNames[planType] || planType;
};

// Export com HOC de error boundary
export const UsageDisplay = () => (
  <BillingErrorBoundary
    fallback={
      <Card className="glass-card border-yellow-200 bg-yellow-50/50">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
          <h3 className="font-semibold mb-1">Dados Temporariamente Indisponíveis</h3>
          <p className="text-sm text-muted-foreground">
            Recarregue a página ou tente novamente em alguns minutos.
          </p>
        </CardContent>
      </Card>
    }
  >
    <SafeUsageDisplay />
  </BillingErrorBoundary>
);