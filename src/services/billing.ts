import { supabase } from '@/integrations/supabase/client';

/**
 * Ativa trial gratuito para um usuário
 */
export async function activateFreeTrial(userId?: string): Promise<boolean> {
  try {
    console.log('[Billing] Ativando trial gratuito para usuário:', userId);

    const { data, error } = await supabase.functions.invoke(
      'mercadopago-checkout-plans',
      {
        body: {
          plan_type: 'free_200',
          plan_name: 'Trial Gratuito',
          price_amount: 0,
          message_limit: 200
        }
      }
    );

    if (error) {
      console.error('[Billing] Erro ao ativar trial:', error);
      return false;
    }

    if (data?.is_trial) {
      console.log('[Billing] Trial ativado com sucesso:', data);
      return true;
    }

    console.warn('[Billing] Resposta inesperada ao ativar trial:', data);
    return false;

  } catch (error) {
    console.error('[Billing] Erro interno ao ativar trial:', error);
    return false;
  }
}

/**
 * Verifica se usuário pode usar o trial gratuito
 */
export async function canUseFreeTrial(): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return false;

    const { data, error } = await supabase.rpc('can_use_free_trial', {
      p_user_id: user.user.id
    });

    if (error) {
      console.error('[Billing] Erro ao verificar elegibilidade para trial:', error);
      return false;
    }

    return data === true;

  } catch (error) {
    console.error('[Billing] Erro interno ao verificar trial:', error);
    return false;
  }
}

/**
 * Verifica status atual do plano do usuário
 */
export async function getCurrentPlanStatus(): Promise<any> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;

    // Verificar assinatura ativa
    const { data: subscription, error: subError } = await supabase
      .from('plan_subscriptions')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subError && subError.code !== 'PGRST116') {
      console.error('[Billing] Erro ao verificar assinatura:', subError);
    }

    // Verificar uso atual
    const { data: usage, error: usageError } = await supabase.rpc('check_and_increment_ai_usage', {
      p_user_id: user.user.id,
      p_increment: false
    });

    if (usageError) {
      console.error('[Billing] Erro ao verificar uso:', usageError);
    }

    // Trial agora é identificado por plan_type = 'free_200' em subscription
    const hasActiveTrial = subscription?.plan_type === 'free_200' &&
                          subscription?.status === 'active' &&
                          new Date(subscription.current_period_end) > new Date();

    return {
      subscription: subscription || null,
      trial: null, // Removido: agora usa subscription.plan_type
      usage: usage || null,
      hasActivePlan: subscription?.status === 'active',
      hasActiveTrial,
      isBlocked: subscription?.platform_blocked_at !== null
    };

  } catch (error) {
    console.error('[Billing] Erro ao verificar status do plano:', error);
    return null;
  }
}

/**
 * Obter histórico de pagamentos do usuário
 */
export async function getPaymentHistory(): Promise<any[]> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];

    const { data, error } = await supabase
      .from('payment_history')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Billing] Erro ao obter histórico:', error);
      return [];
    }

    return data || [];

  } catch (error) {
    console.error('[Billing] Erro interno ao obter histórico:', error);
    return [];
  }
}

/**
 * Formatar data para exibição
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formatar valor monetário
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Calcular dias restantes do trial
 */
export function calculateTrialDaysLeft(expiresAt: string): number {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffTime = expires.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Verificar se plano está vencido
 */
export function isPlanExpired(endDate: string): boolean {
  return new Date(endDate) < new Date();
}

/**
 * Obter cor do status do plano
 */
export function getPlanStatusColor(status: string): string {
  switch (status) {
    case 'active': return 'text-green-600';
    case 'cancelled': return 'text-red-600';
    case 'past_due': return 'text-yellow-600';
    case 'pending': return 'text-blue-600';
    default: return 'text-gray-600';
  }
}