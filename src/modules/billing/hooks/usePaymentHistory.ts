import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BILLING_QUERY_KEYS, BILLING_STALE_TIMES } from '../constants/queryKeys';

export interface PaymentHistoryItem {
  id: string;
  date: Date;
  type: 'payment' | 'trial';
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  amount: number;
  plan: string;
  description: string;
  paymentMethod: string;
  invoiceUrl: string | null;
  gateway: string;
}

/**
 * Hook para buscar histórico de pagamentos com segurança multitenant
 * SEMPRE filtra por user_id para garantir isolamento de dados
 */
export const usePaymentHistory = () => {
  const { user } = useAuth();
  const userId = user?.id;

  const paymentHistoryQuery = useQuery({
    queryKey: BILLING_QUERY_KEYS.paymentHistory(userId || ''),
    queryFn: async (): Promise<PaymentHistoryItem[]> => {
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      try {
        // 🔒 SEGURANÇA MULTITENANT: Sempre filtrar por user_id
        const { data: payments, error: paymentsError } = await supabase
          .from('payment_history')
          .select('*')
          .eq('user_id', userId) // 🔒 Filtro obrigatório por user_id
          .order('created_at', { ascending: false });

        if (paymentsError) {
          console.error('[usePaymentHistory] Erro ao buscar pagamentos:', paymentsError);
          // Retornar array vazio em vez de falhar
          return [];
        }

        // Buscar trials ativados via plan_subscriptions
        const { data: trials, error: trialsError } = await supabase
          .from('plan_subscriptions')
          .select('*')
          .eq('user_id', userId) // 🔒 Filtro obrigatório por user_id
          .eq('plan_type', 'free_200')
          .order('created_at', { ascending: false });

        if (trialsError) {
          console.warn('[usePaymentHistory] Erro ao buscar trials:', trialsError);
        }

        // Mapear pagamentos
        const mappedPayments: PaymentHistoryItem[] = (payments || []).map((payment) => {
          // Mapear status do banco para status do componente
          let mappedStatus: PaymentHistoryItem['status'] = 'pending';
          if (payment.status === 'approved') mappedStatus = 'completed';
          else if (payment.status === 'rejected') mappedStatus = 'failed';
          else if (payment.status === 'cancelled') mappedStatus = 'cancelled';
          else if (payment.status === 'pending') mappedStatus = 'pending';

          // Mapear método de pagamento
          let paymentMethod = 'N/A';
          if (payment.payment_method === 'pix') paymentMethod = 'PIX';
          else if (payment.payment_method === 'credit_card') paymentMethod = 'Cartão de Crédito';
          else if (payment.payment_method === 'boleto') paymentMethod = 'Boleto';
          else if (payment.payment_method) paymentMethod = payment.payment_method;

          // Mapear nome do plano
          const planNames: Record<string, string> = {
            'free_200': 'Trial Gratuito',
            'pro_5k': 'Plano Profissional',
            'ultra_15k': 'Plano Ultra'
          };
          const planName = payment.plan_type ? planNames[payment.plan_type] || payment.plan_type : 'Plano';

          // Criar descrição
          const date = new Date(payment.created_at);
          const monthYear = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
          const description = `${planName} - ${monthYear.charAt(0).toUpperCase() + monthYear.slice(1)}`;

          return {
            id: payment.id,
            date: new Date(payment.paid_at || payment.created_at),
            type: 'payment' as const,
            status: mappedStatus,
            amount: Math.round((payment.amount || 0) * 100), // Converter para centavos
            plan: payment.plan_type || 'unknown',
            description,
            paymentMethod,
            invoiceUrl: payment.gateway_response?.receipt_url || null,
            gateway: payment.gateway || 'mercadopago'
          };
        });

        // Mapear trials (agora vem de plan_subscriptions)
        const mappedTrials: PaymentHistoryItem[] = (trials || []).map((trial) => ({
          id: trial.id,
          date: new Date(trial.current_period_start || trial.created_at),
          type: 'trial' as const,
          status: 'completed' as const,
          amount: 0,
          plan: 'free_200',
          description: 'Trial Gratuito Ativado',
          paymentMethod: 'N/A',
          invoiceUrl: null,
          gateway: 'none'
        }));

        // Combinar e ordenar por data (mais recentes primeiro)
        const combined = [...mappedPayments, ...mappedTrials].sort(
          (a, b) => b.date.getTime() - a.date.getTime()
        );

        return combined;
      } catch (error) {
        console.error('[usePaymentHistory] Erro inesperado:', error);
        return []; // Fallback seguro
      }
    },
    enabled: !!userId,
    staleTime: BILLING_STALE_TIMES.PAYMENT_HISTORY || 1000 * 60 * 5, // 5 minutos
    retry: (failureCount, error) => {
      // Não tentar novamente se for erro de permissão
      if (error?.message?.includes('406') || error?.message?.includes('auth')) {
        return false;
      }
      return failureCount < 2;
    }
  });

  return {
    history: paymentHistoryQuery.data || [],
    isLoading: paymentHistoryQuery.isLoading,
    error: paymentHistoryQuery.error,
    refetch: paymentHistoryQuery.refetch
  };
};