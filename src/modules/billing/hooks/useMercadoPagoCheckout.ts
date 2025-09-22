import { useState } from 'react';
import { MercadoPagoService } from '../services/mercadopagoService';
import { MessagePlan } from '../types/billing';
import { toast } from 'sonner';

export const useMercadoPagoCheckout = () => {
  const [loading, setLoading] = useState(false);

  const createCheckoutSession = async (plan: MessagePlan): Promise<boolean> => {
    setLoading(true);

    try {
      // Se for plano gratuito/trial, ativar diretamente no frontend
      if (plan.is_trial || plan.id === 'free_200') {
        console.log('[MercadoPago Checkout] Ativando trial gratuito diretamente...');

        const success = await MercadoPagoService.activateFreeTrial(plan);

        if (success) {
          toast.success('Trial gratuito ativado com sucesso! Você tem 200 mensagens por 30 dias.');
          // Recarregar página para atualizar dados
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          return true;
        } else {
          toast.error('Erro ao ativar trial gratuito. Tente novamente.');
          return false;
        }
      }

      // Para planos pagos, usar a Edge Function
      const result = await MercadoPagoService.createCheckoutSession(plan);

      if (!result) {
        toast.error('Erro ao criar sessão de pagamento');
        return false;
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