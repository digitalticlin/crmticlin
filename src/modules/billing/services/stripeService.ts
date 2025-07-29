
import { supabase } from '@/integrations/supabase/client';
import { MessagePlan } from '../types/billing';

export class StripeService {
  /**
   * Cria sessão de checkout para plano de mensagens
   */
  static async createCheckoutSession(plan: MessagePlan): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-checkout-plans', {
        body: {
          plan_type: plan.id,
          plan_name: plan.name,
          price_amount: Math.round(plan.price * 100), // Converter para centavos
          message_limit: plan.message_limit,
          stripe_price_id: plan.stripe_price_id
        }
      });

      if (error) {
        console.error('[Stripe] Erro ao criar checkout:', error);
        return null;
      }

      return data.url;

    } catch (error) {
      console.error('[Stripe] Erro na sessão de checkout:', error);
      return null;
    }
  }

  /**
   * Cria sessão do portal do cliente
   */
  static async createCustomerPortalSession(): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: {}
      });

      if (error) {
        console.error('[Stripe] Erro ao criar portal:', error);
        return null;
      }

      return data.url;

    } catch (error) {
      console.error('[Stripe] Erro no portal do cliente:', error);
      return null;
    }
  }

  /**
   * Verifica status da assinatura
   */
  static async checkSubscriptionStatus(): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        body: {}
      });

      if (error) {
        console.error('[Stripe] Erro ao verificar assinatura:', error);
        return null;
      }

      return data;

    } catch (error) {
      console.error('[Stripe] Erro ao verificar status:', error);
      return null;
    }
  }
}
