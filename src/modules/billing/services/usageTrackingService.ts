
import { supabase } from '@/integrations/supabase/client';
import { MessageUsageTracking, UsageLimitCheck } from '../types/billing';

export class UsageTrackingService {
  /**
   * Verifica se o usuário pode enviar mensagens
   */
  static async checkMessageLimit(userId: string): Promise<UsageLimitCheck> {
    try {
      // Buscar uso atual do período
      const { data: usage, error } = await supabase
        .from('message_usage_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('period_end', new Date().toISOString())
        .single();

      if (error || !usage) {
        // Se não há tracking ativo, usuário pode estar sem plano
        return {
          allowed: false,
          remaining: 0,
          current_usage: 0,
          plan_limit: 0,
          percentage_used: 100,
          status: 'blocked'
        };
      }

      const remaining = Math.max(0, usage.plan_limit - usage.total_messages_count);
      const percentage_used = (usage.total_messages_count / usage.plan_limit) * 100;

      let status: 'active' | 'warning' | 'exceeded' | 'blocked' = 'active';
      if (percentage_used >= 100) status = 'blocked';
      else if (percentage_used >= 90) status = 'exceeded';
      else if (percentage_used >= 75) status = 'warning';

      return {
        allowed: remaining > 0,
        remaining,
        current_usage: usage.total_messages_count,
        plan_limit: usage.plan_limit,
        percentage_used: Math.round(percentage_used * 100) / 100,
        status
      };

    } catch (error) {
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
  }

  /**
   * Incrementa contador de mensagens
   */
  static async incrementMessageCount(
    userId: string, 
    messageType: 'sent' | 'received' = 'sent'
  ): Promise<boolean> {
    try {
      const { error } = await supabase.functions.invoke('message-usage-tracker', {
        body: {
          user_id: userId,
          message_type: messageType,
          increment: 1
        }
      });

      if (error) {
        console.error('[UsageTracking] Erro ao incrementar:', error);
        return false;
      }

      return true;

    } catch (error) {
      console.error('[UsageTracking] Erro ao incrementar mensagem:', error);
      return false;
    }
  }

  /**
   * Busca uso atual do usuário
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
        console.error('[UsageTracking] Erro ao buscar uso:', error);
        return null;
      }

      // Fazer cast correto do status para o tipo esperado
      const typedUsage: MessageUsageTracking = {
        ...data,
        status: data.status as 'active' | 'warning' | 'exceeded' | 'blocked'
      };

      return typedUsage;

    } catch (error) {
      console.error('[UsageTracking] Erro ao buscar uso atual:', error);
      return null;
    }
  }
}
