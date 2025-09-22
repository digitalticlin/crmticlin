
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, Clock, XCircle } from 'lucide-react';
import { useMessageUsage } from '../hooks/useMessageUsage';
import { useMercadoPagoCheckout } from '../hooks/useMercadoPagoCheckout';
import { messagePlans, getPlanByType } from '../data/messagePlans';

export const AlertBanner = () => {
  const { usage, limitCheck, loading } = useMessageUsage();
  const { createCheckoutSession } = useMercadoPagoCheckout();

  // Se ainda está carregando ou não há dados, não mostrar nada
  if (loading || !usage || !limitCheck) {
    return null;
  }

  const currentPlan = getPlanByType(usage.plan_subscription_id);
  
  // Função para determinar o próximo plano recomendado
  const getRecommendedPlan = () => {
    const currentIndex = messagePlans.findIndex(p => p.id === usage.plan_subscription_id);
    return currentIndex < messagePlans.length - 1 ? messagePlans[currentIndex + 1] : null;
  };

  const recommendedPlan = getRecommendedPlan();

  // Determinar qual alerta mostrar baseado no status
  const getAlert = () => {
    switch (limitCheck.status) {
      case 'blocked':
        return {
          icon: XCircle,
          variant: 'destructive' as const,
          title: 'Limite de Mensagens Atingido',
          description: 'Suas mensagens foram bloqueadas. Faça upgrade do seu plano para continuar enviando.',
          actionText: 'Fazer Upgrade Agora',
          urgent: true
        };
      
      case 'exceeded':
        return {
          icon: AlertTriangle,
          variant: 'default' as const,
          title: 'Limite Quase Esgotado',
          description: `Você usou ${limitCheck.percentage_used.toFixed(1)}% do seu plano. Restam apenas ${limitCheck.remaining} mensagens.`,
          actionText: 'Considerar Upgrade',
          urgent: true
        };
      
      case 'warning':
        return {
          icon: Clock,
          variant: 'default' as const,
          title: 'Atenção ao Uso',
          description: `Você já utilizou ${limitCheck.percentage_used.toFixed(1)}% do seu plano atual.`,
          actionText: 'Ver Planos',
          urgent: false
        };
      
      default:
        return null;
    }
  };

  const alert = getAlert();

  if (!alert) {
    return null;
  }

  const handleActionClick = () => {
    if (recommendedPlan && alert.urgent) {
      createCheckoutSession(recommendedPlan);
    }
  };

  const Icon = alert.icon;

  return (
    <Alert variant={alert.variant} className={`border-l-4 ${
      alert.urgent 
        ? 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20' 
        : 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20'
    }`}>
      <Icon className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <div className="font-medium">{alert.title}</div>
          <div className="text-sm text-muted-foreground mt-1">{alert.description}</div>
        </div>
        
        {(alert.urgent && recommendedPlan) ? (
          <Button 
            size="sm" 
            onClick={handleActionClick}
            className="ml-4 whitespace-nowrap"
          >
            {alert.actionText}
          </Button>
        ) : (
          <Button 
            variant="outline" 
            size="sm"
            className="ml-4 whitespace-nowrap"
          >
            {alert.actionText}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};
