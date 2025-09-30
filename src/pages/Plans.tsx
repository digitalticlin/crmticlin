
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  BillingErrorBoundary,
  HeroStatus,
  QuickStatus,
  BillingHistory,
  BILLING_QUERY_KEYS
} from "@/modules/billing";
import { useAuth } from '@/contexts/AuthContext';

export default function Plans() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Detectar retorno do checkout do Stripe
  useEffect(() => {
    const upgradeStatus = searchParams.get('upgrade');
    const planId = searchParams.get('plan');

    if (upgradeStatus === 'success' && user?.id) {
      console.log('[Plans] Upgrade bem-sucedido detectado, invalidando cache...', { planId });

      // Invalidar todos os dados de billing para forçar refresh
      queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.all });

      // Mostrar toast de sucesso
      const planName = planId === 'pro_5k' ? 'Profissional' : planId === 'ultra_15k' ? 'Ultra' : 'Plano';
      toast.success(`Plano ${planName} ativado com sucesso!`);

      // Limpar parâmetros da URL
      setSearchParams({});
    } else if (upgradeStatus === 'canceled') {
      console.log('[Plans] Upgrade cancelado pelo usuário');
      toast.info('Checkout cancelado. Você pode tentar novamente quando quiser.');
      setSearchParams({});
    }
  }, [searchParams, user?.id, queryClient, setSearchParams]);

  return (
    <BillingErrorBoundary>
      <div className="w-full space-y-8 relative z-40">
        {/* Header inteligente com status do usuário */}
        <BillingErrorBoundary>
          <HeroStatus />
        </BillingErrorBoundary>

        {/* Cards de status atual (uso, período, próxima ação) */}
        <BillingErrorBoundary>
          <QuickStatus />
        </BillingErrorBoundary>

        {/* Histórico e Faturamento Unificado */}
        <div id="billing-section">
          <BillingErrorBoundary>
            <BillingHistory />
          </BillingErrorBoundary>
        </div>
      </div>
    </BillingErrorBoundary>
  );
}
