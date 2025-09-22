import { useState } from 'react';
import { MercadoPagoService } from '../services/mercadopagoService';
import { MessagePlan } from '../types/billing';
import { toast } from 'sonner';

export const useMercadoPagoCheckout = () => {
  const [loading, setLoading] = useState(false);

  const createCheckoutSession = async (plan: MessagePlan): Promise<boolean> => {
    setLoading(true);

    try {
      const result = await MercadoPagoService.createCheckoutSession(plan);

      if (!result) {
        toast.error('Erro ao criar sessão de pagamento');
        return false;
      }

      // Se for trial gratuito
      if (result === 'TRIAL_ACTIVATED') {
        toast.success('Trial gratuito ativado com sucesso! Você tem 200 mensagens por 30 dias.');
        // Recarregar página para atualizar dados
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        return true;
      }

      // Redirecionar para checkout do Mercado Pago
      window.location.href = result;
      return true;

    } catch (error) {
      console.error('[MercadoPago Checkout] Erro:', error);
      toast.error('Erro interno. Tente novamente.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      return await MercadoPagoService.checkSubscriptionStatus();
    } catch (error) {
      console.error('[MercadoPago Checkout] Erro ao verificar status:', error);
      return null;
    }
  };

  return {
    createCheckoutSession,
    checkSubscriptionStatus,
    loading
  };
};