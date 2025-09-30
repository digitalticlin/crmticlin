import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MessagePlan } from '../types/billing';
import { toast } from 'sonner';

export const useStripeCheckout = () => {
  const [loading, setLoading] = useState(false);

  const createCheckoutSession = async (plan: MessagePlan, context: 'plans' | 'register' = 'plans'): Promise<boolean> => {
    setLoading(true);

    try {
      // Se for plano gratuito/trial, ativar diretamente no frontend
      if (plan.is_trial || plan.id === 'free_200') {
        console.log('[Stripe Checkout] Ativando trial gratuito diretamente...');

        const success = await activateFreeTrial(plan);

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

      // Para planos pagos, chamar edge function do Stripe
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Usuário não autenticado');
        return false;
      }

      console.log('[Stripe Checkout] Criando sessão de checkout...', {
        plan_id: plan.id,
        user_id: user.id,
        context
      });

      const { data, error } = await supabase.functions.invoke('stripe-checkout-plans', {
        body: {
          plan_id: plan.id,
          user_id: user.id,
          context
        }
      });

      if (error) {
        console.error('[Stripe Checkout] Erro ao criar checkout:', error);
        toast.error('Erro ao criar sessão de pagamento');
        return false;
      }

      if (!data?.url) {
        console.error('[Stripe Checkout] Checkout criado mas sem URL');
        toast.error('Erro ao processar checkout');
        return false;
      }

      console.log('[Stripe Checkout] Redirecionando para Stripe...');
      // Redirecionar para checkout do Stripe
      window.location.href = data.url;
      return true;

    } catch (error) {
      console.error('[Stripe Checkout] Erro:', error);
      toast.error('Erro interno. Tente novamente.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    createCheckoutSession,
    loading
  };
};

// Função auxiliar para ativar trial gratuito
async function activateFreeTrial(plan: MessagePlan): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('[Free Trial] Usuário não autenticado');
      return false;
    }

    console.log('[Free Trial] Ativando trial para usuário:', user.id);

    // Verificar se já tem trial ativo
    const { data: existingTrial } = await supabase
      .from('free_trial_usage')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingTrial) {
      console.error('[Free Trial] Usuário já possui trial');
      toast.error('Você já utilizou seu trial gratuito');
      return false;
    }

    // Criar free_trial_usage
    const { error: trialError } = await supabase
      .from('free_trial_usage')
      .insert({
        user_id: user.id,
        activated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        messages_limit: 200,
        consumed_messages: 0
      });

    if (trialError) {
      console.error('[Free Trial] Erro ao criar trial:', trialError);
      return false;
    }

    // Atualizar plan_subscriptions
    const { error: planError } = await supabase
      .from('plan_subscriptions')
      .upsert({
        user_id: user.id,
        plan_type: 'free_200',
        status: 'active',
        member_limit: 0,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        has_used_free_trial: true
      });

    if (planError) {
      console.error('[Free Trial] Erro ao atualizar plano:', planError);
      return false;
    }

    // Criar message_usage_tracking
    await supabase
      .from('message_usage_tracking')
      .upsert({
        user_id: user.id,
        plan_limit: 200,
        period_start: new Date().toISOString(),
        period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        messages_sent_count: 0,
        messages_received_count: 0,
        total_messages_count: 0,
        ai_messages_sent: 0,
        status: 'active'
      });

    console.log('[Free Trial] Trial ativado com sucesso');
    return true;

  } catch (error) {
    console.error('[Free Trial] Erro ao ativar trial:', error);
    return false;
  }
}