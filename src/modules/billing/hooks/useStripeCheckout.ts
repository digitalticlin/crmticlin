
import { useState } from 'react';
import { toast } from 'sonner';
import { StripeService } from '../services/stripeService';
import { MessagePlan } from '../types/billing';

export const useStripeCheckout = () => {
  const [loading, setLoading] = useState(false);

  const createCheckoutSession = async (plan: MessagePlan) => {
    setLoading(true);
    try {
      const checkoutUrl = await StripeService.createCheckoutSession(plan);
      
      if (checkoutUrl) {
        // Abrir Stripe checkout em nova aba
        window.open(checkoutUrl, '_blank');
        toast.success('Redirecionando para o checkout...');
        return true;
      } else {
        toast.error('Erro ao iniciar checkout');
        return false;
      }
      
    } catch (error) {
      console.error('[useStripeCheckout] Erro:', error);
      toast.error('Erro ao processar pagamento');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    setLoading(true);
    try {
      const portalUrl = await StripeService.createCustomerPortalSession();
      
      if (portalUrl) {
        window.open(portalUrl, '_blank');
        toast.success('Abrindo gerenciamento de assinatura...');
        return true;
      } else {
        toast.error('Erro ao abrir portal do cliente');
        return false;
      }
      
    } catch (error) {
      console.error('[useStripeCheckout] Erro no portal:', error);
      toast.error('Erro ao acessar portal');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createCheckoutSession,
    openCustomerPortal
  };
};
