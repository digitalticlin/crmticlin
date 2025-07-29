
import { supabase } from '@/integrations/supabase/client';
import { MessageUsageTracking, UsageLimitCheck } from '../types/billing';

export class UsageTrackingService {
  /**
   * Busca o uso atual do usuário
   */
  static async getCurrentUsage(userId: string): Promise<MessageUsageTracking | null> {
    try {
      const { data, error } = await supabase
        .from('message_usage_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('period_end', new Date().toISOString())
        .single();

      if (error) {
        console.error('[UsageTracking] Erro ao buscar uso atual:', error);
        return null;
      }

      // Cast explícito do status para o tipo correto
      return {
        ...data,
        status: data.status as 'active' | 'warning' | 'exceeded' | 'blocked'
      };

    } catch (error) {
      console.error('[UsageTracking] Erro no getCurrentUsage:', error);
      return null;
    }
  }

  /**
   * Verifica o limite de mensagens
   */
  static async checkMessageLimit(userId: string): Promise<UsageLimitCheck> {
    try {
      const { data, error } = await supabase.functions.invoke('plan-limit-checker', {
        body: { user_id: userId }
      });

      if (error) {
        console.error('[UsageTracking] Erro ao verificar limite:', error);
        return {
          allowed: false,
          remaining: 0,
          current_usage: 0,
          plan_limit: 0,
          percentage_used: 100,
          status: 'blocked'
        };
      }

      return data;

    } catch (error) {
      console.error('[UsageTracking] Erro no checkMessageLimit:', error);
      return {
        allowed: false,
        remaining: 0,
        current_usage: 0,
        plan_limit: 0,
        percentage_used: 100,
        status: 'blocked'
      };
    }
  }

  /**
   * Incrementa contador de mensagens
   */
  static async incrementMessageCount(userId: string, type: 'sent' | 'received' = 'sent'): Promise<boolean> {
    try {
      const { error } = await supabase.functions.invoke('increment-message-count', {
        body: { 
          user_id: userId,
          message_type: type
        }
      });

      if (error) {
        console.error('[UsageTracking] Erro ao incrementar contador:', error);
        return false;
      }

      return true;

    } catch (error) {
      console.error('[UsageTracking] Erro no incrementMessageCount:', error);
      return false;
    }
  }

  /**
   * Cria nova sessão de uso (para novos planos)
   */
  static async createUsageSession(userId: string, planType: string, messageLimit: number): Promise<boolean> {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // Próximo mês

      const { error } = await supabase
        .from('message_usage_tracking')
        .insert({
          user_id: userId,
          plan_subscription_id: planType,
          plan_limit: messageLimit,
          period_start: startDate.toISOString(),
          period_end: endDate.toISOString(),
          status: 'active',
          messages_sent_count: 0,
          messages_received_count: 0,
          total_messages_count: 0
        });

      if (error) {
        console.error('[UsageTracking] Erro ao criar sessão de uso:', error);
        return false;
      }

      return true;

    } catch (error) {
      console.error('[UsageTracking] Erro no createUsageSession:', error);
      return false;
    }
  }

  /**
   * Atualiza o tipo de plano do usuário
   */
  static async updateUserPlan(userId: string, newPlanType: string, newMessageLimit: number): Promise<boolean> {
    try {
      // Finalizar sessão atual
      await supabase
        .from('message_usage_tracking')
        .update({ status: 'completed' })
        .eq('user_id', userId)
        .eq('status', 'active');

      // Criar nova sessão
      return await this.createUsageSession(userId, newPlanType, newMessageLimit);

    } catch (error) {
      console.error('[UsageTracking] Erro no updateUserPlan:', error);
      return false;
    }
  }
}
