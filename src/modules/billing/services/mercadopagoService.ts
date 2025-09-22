import { supabase } from '@/integrations/supabase/client';
import { MessagePlan } from '../types/billing';

export class MercadoPagoService {
  /**
   * Ativa trial gratuito diretamente no banco de dados
   */
  static async activateFreeTrial(plan: MessagePlan): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        console.error('[MercadoPago] Usuário não autenticado');
        return false;
      }

      console.log('[MercadoPago] Ativando trial gratuito para usuário:', user.user.id);

      // Inserir nova assinatura de trial
      const { data, error } = await supabase
        .from('plan_subscriptions')
        .insert({
          user_id: user.user.id,
          plan_type: plan.id,
          plan_name: plan.name,
          status: 'active',
          message_limit: plan.message_limit,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
          is_trial: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('[MercadoPago] Erro ao ativar trial:', error);
        return false;
      }

      console.log('[MercadoPago] Trial ativado com sucesso:', data);
      return true;

    } catch (error) {
      console.error('[MercadoPago] Erro ao ativar trial gratuito:', error);
      return false;
    }
  }

  /**
   * Cria sessão de checkout para plano de mensagens
   */
  static async createCheckoutSession(plan: MessagePlan): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-checkout-plans', {
        body: {
          plan_type: plan.id,
          plan_name: plan.name,
          price_amount: plan.price, // Mercado Pago usa valor em reais, não centavos
          message_limit: plan.message_limit,
          mercadopago_price_id: plan.stripe_price_id // Reutilizar campo existente
        }
      });

      if (error) {
        console.error('[MercadoPago] Erro ao criar checkout:', error);
        return null;
      }

      // Se for trial gratuito, não retorna URL
      if (data.is_trial) {
        console.log('[MercadoPago] Trial gratuito ativado:', data);
        return 'TRIAL_ACTIVATED';
      }

      return data.init_point;

    } catch (error) {
      console.error('[MercadoPago] Erro na sessão de checkout:', error);
      return null;
    }
  }

  /**
   * Verifica status da assinatura atual
   */
  static async checkSubscriptionStatus(): Promise<any> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      // Buscar assinatura ativa
      const { data: subscription, error } = await supabase
        .from('plan_subscriptions')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Use maybeSingle() para não falhar se não houver registros

      if (error) {
        console.error('[MercadoPago] Erro ao verificar assinatura:', error);

        // Se for erro de permissão (406), retornar estado padrão
        if (error.message?.includes('406') || error.message?.includes('Not Acceptable')) {
          console.warn('[MercadoPago] Erro de permissão 406 - assumindo usuário sem plano');
          return {
            subscription: null,
            usage: null,
            is_active: false,
            is_blocked: false,
            is_overdue: false
          };
        }

        return null;
      }

      // Buscar uso atual
      const { data: usage } = await supabase.rpc('check_and_increment_ai_usage', {
        p_user_id: user.user.id,
        p_increment: false
      });

      return {
        subscription: subscription,
        usage: usage,
        is_active: subscription?.status === 'active',
        is_blocked: subscription?.platform_blocked_at !== null,
        is_overdue: subscription?.payment_overdue_since !== null
      };

    } catch (error) {
      console.error('[MercadoPago] Erro ao verificar status:', error);
      return null;
    }
  }

  /**
   * Obtém estatísticas de uso atual
   */
  static async getCurrentUsage(): Promise<any> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data, error } = await supabase.rpc('check_and_increment_ai_usage', {
        p_user_id: user.user.id,
        p_increment: false
      });

      if (error) {
        console.error('[MercadoPago] Erro ao obter uso:', error);
        return null;
      }

      return data;

    } catch (error) {
      console.error('[MercadoPago] Erro no getCurrentUsage:', error);
      return null;
    }
  }

  /**
   * Verifica se pode adicionar membro operacional
   */
  static async canAddOperationalMember(): Promise<any> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data, error } = await supabase.rpc('can_add_operational_member', {
        p_admin_id: user.user.id
      });

      if (error) {
        console.error('[MercadoPago] Erro ao verificar limite de membros:', error);
        return null;
      }

      return data;

    } catch (error) {
      console.error('[MercadoPago] Erro no canAddOperationalMember:', error);
      return null;
    }
  }

  /**
   * Reseta uso mensal para um usuário (admin only)
   */
  static async resetMonthlyUsage(userId?: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('reset_monthly_usage', {
        p_user_id: userId || null
      });

      if (error) {
        console.error('[MercadoPago] Erro ao resetar uso:', error);
        return false;
      }

      console.log('[MercadoPago] Uso resetado:', data);
      return true;

    } catch (error) {
      console.error('[MercadoPago] Erro no resetMonthlyUsage:', error);
      return false;
    }
  }

  /**
   * Aplica limite customizado a um usuário
   */
  static async applyCustomLimit(
    userId: string,
    customLimit: number,
    reason: string,
    expiresAt?: Date
  ): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false;

      const { error } = await supabase
        .from('message_usage_tracking')
        .update({
          custom_limit: customLimit,
          custom_limit_reason: reason,
          custom_limit_expires_at: expiresAt?.toISOString() || null,
          granted_by_admin_id: user.user.id,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('[MercadoPago] Erro ao aplicar limite customizado:', error);
        return false;
      }

      return true;

    } catch (error) {
      console.error('[MercadoPago] Erro no applyCustomLimit:', error);
      return false;
    }
  }

  /**
   * Obtém histórico de pagamentos
   */
  static async getPaymentHistory(): Promise<any[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from('payment_history')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[MercadoPago] Erro ao obter histórico:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('[MercadoPago] Erro no getPaymentHistory:', error);
      return [];
    }
  }
}