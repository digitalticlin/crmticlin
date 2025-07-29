
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, MessageCircle, CreditCard } from 'lucide-react';
import { useMessageUsage } from '../hooks/useMessageUsage';
import { useStripeCheckout } from '../hooks/useStripeCheckout';

export const AlertBanner = () => {
  const { limitCheck, loading } = useMessageUsage();
  const { openCustomerPortal, loading: checkoutLoading } = useStripeCheckout();

  if (loading || !limitCheck) return null;

  // Não mostrar banner se tudo está ok
  if (limitCheck.status === 'active') return null;

  const getAlertConfig = () => {
    switch (limitCheck.status) {
      case 'blocked':
        return {
          variant: 'destructive' as const,
          icon: <AlertTriangle className="h-4 w-4" />,
          title: 'Limite de Mensagens Esgotado',
          description: 'Suas mensagens foram bloqueadas. Faça upgrade do seu plano para continuar.',
          action: 'Fazer Upgrade',
          urgent: true
        };
      case 'exceeded':
        return {
          variant: 'destructive' as const,
          icon: <MessageCircle className="h-4 w-4" />,
          title: 'Limite Quase Esgotado',
          description: `Restam apenas ${limitCheck.remaining} mensagens (${(100 - limitCheck.percentage_used).toFixed(1)}%).`,
          action: 'Gerenciar Plano',
          urgent: true
        };
      case 'warning':
        return {
          variant: 'default' as const,
          icon: <MessageCircle className="h-4 w-4" />,
          title: 'Atenção ao Limite',
          description: `Você já utilizou ${limitCheck.percentage_used.toFixed(1)}% do seu plano de mensagens.`,
          action: 'Ver Planos',
          urgent: false
        };
      default:
        return null;
    }
  };

  const config = getAlertConfig();
  if (!config) return null;

  const handleAction = () => {
    if (config.urgent) {
      // Para casos urgentes, abrir portal do cliente
      openCustomerPortal();
    } else {
      // Para avisos, redirecionar para página de planos
      window.location.href = '/plans';
    }
  };

  return (
    <Alert variant={config.variant} className="mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3 flex-1">
          {config.icon}
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{config.title}</h4>
            <AlertDescription className="text-xs mt-1">
              {config.description}
            </AlertDescription>
          </div>
        </div>
        <Button
          size="sm"
          variant={config.urgent ? "default" : "outline"}
          onClick={handleAction}
          disabled={checkoutLoading}
          className="ml-4"
        >
          <CreditCard className="h-3 w-3 mr-1" />
          {config.action}
        </Button>
      </div>
    </Alert>
  );
};
