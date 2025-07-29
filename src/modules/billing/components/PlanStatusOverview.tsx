
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { useMessageUsage } from '../hooks/useMessageUsage';
import { useStripeCheckout } from '../hooks/useStripeCheckout';
import { getPlanByType } from '../data/messagePlans';

export const PlanStatusOverview = () => {
  const { usage, limitCheck, loading } = useMessageUsage();
  const { openCustomerPortal, loading: checkoutLoading } = useStripeCheckout();

  if (loading) {
    return (
      <Card className="glass-card border-0">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const plan = usage ? getPlanByType(usage.plan_subscription_id) : null;

  if (!plan || !usage) {
    return (
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Nenhum Plano Ativo
          </CardTitle>
          <CardDescription>
            Você ainda não possui um plano ativo. Escolha um plano para começar.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getStatusColor = () => {
    if (!limitCheck) return "gray";
    switch (limitCheck.status) {
      case 'active': return "green";
      case 'warning': return "yellow";
      case 'exceeded': return "orange";
      case 'blocked': return "red";
      default: return "gray";
    }
  };

  const getStatusText = () => {
    if (!limitCheck) return "Carregando...";
    switch (limitCheck.status) {
      case 'active': return "Ativo";
      case 'warning': return "Atenção";
      case 'exceeded': return "Limite Excedido";
      case 'blocked': return "Bloqueado";
      default: return "Desconhecido";
    }
  };

  return (
    <Card className="glass-card border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              {plan.name}
            </CardTitle>
            <CardDescription>
              Plano atual - R${plan.price.toFixed(2)}/mês
            </CardDescription>
          </div>
          <Badge 
            variant="outline" 
            className={`border-${getStatusColor()}-200 text-${getStatusColor()}-600 bg-${getStatusColor()}-50`}
          >
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Uso Principal */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Mensagens Utilizadas</span>
            <span className="text-muted-foreground">
              {limitCheck?.current_usage?.toLocaleString() || 0} de {plan.message_limit.toLocaleString()}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                limitCheck?.percentage_used >= 90 ? 'bg-red-500' : 
                limitCheck?.percentage_used >= 75 ? 'bg-orange-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(limitCheck?.percentage_used || 0, 100)}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{limitCheck?.percentage_used?.toFixed(1) || 0}% utilizado</span>
            <span>{limitCheck?.remaining?.toLocaleString() || 0} restantes</span>
          </div>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span className="text-lg font-bold">{usage.messages_sent_count}</span>
            </div>
            <p className="text-xs text-muted-foreground">Enviadas</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-blue-600">
              <Calendar className="h-4 w-4" />
              <span className="text-lg font-bold">{usage.messages_received_count}</span>
            </div>
            <p className="text-xs text-muted-foreground">Recebidas</p>
          </div>
        </div>

        {/* Ação de Gerenciamento */}
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={openCustomerPortal}
            disabled={checkoutLoading}
          >
            Gerenciar Assinatura
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
