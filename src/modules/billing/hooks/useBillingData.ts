import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BILLING_QUERY_KEYS, BILLING_STALE_TIMES } from '../constants/queryKeys';
import { BILLING_PERMISSIONS, hasBillingPermission } from '../constants/permissions';
import { useBillingErrorHandler } from '../components/BillingErrorBoundary';

/**
 * Hook principal para dados de billing com defensive coding
 * Isola todas as queries e estados relacionados a billing
 */
export const useBillingData = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { handleError } = useBillingErrorHandler();
  const [retryCount, setRetryCount] = useState(0);

  // IDs seguros
  const userId = user?.id;
  const isAuthenticated = !!userId;

  /**
   * Query para dados da assinatura com fallbacks
   */
  const subscriptionQuery = useQuery({
    queryKey: BILLING_QUERY_KEYS.userSubscription(userId || ''),
    queryFn: async () => {
      if (!userId) throw new Error('Usuário não autenticado');

      try {
        const { data, error } = await supabase
          .from('plan_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(); // Usar maybeSingle() para não falhar se não encontrar

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = no rows found, que é OK
          throw error;
        }

        return data; // Pode ser null se não existir
      } catch (error) {
        handleError(error as Error, 'subscriptionQuery');
        return null; // Fallback seguro
      }
    },
    enabled: isAuthenticated,
    staleTime: BILLING_STALE_TIMES.SUBSCRIPTION,
    retry: (failureCount, error) => {
      // Não tentar novamente se for erro de permissão ou auth
      if (error?.message?.includes('406') || error?.message?.includes('auth')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  /**
   * Query para dados de uso com fallbacks
   */
  const usageQuery = useQuery({
    queryKey: BILLING_QUERY_KEYS.usageCheck(userId || ''),
    queryFn: async () => {
      if (!userId) return null;

      try {
        // Tentar RPC primeiro
        const { data, error } = await supabase.rpc('check_and_increment_ai_usage', {
          p_user_id: userId,
          p_increment: false
        });

        if (error) {
          // Se RPC falhar, tentar query direta na tabela
          console.warn('[useBillingData] RPC falhou, tentando query direta:', error);

          const { data: directData, error: directError } = await supabase
            .from('message_usage_tracking')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (directError) {
            console.warn('[useBillingData] Query direta também falhou:', directError);
            return createFallbackUsageData();
          }

          return directData || createFallbackUsageData();
        }

        return data;
      } catch (error) {
        handleError(error as Error, 'usageQuery');
        return createFallbackUsageData();
      }
    },
    enabled: isAuthenticated,
    staleTime: BILLING_STALE_TIMES.USAGE,
    retry: false, // Não retry para uso, pois temos fallback
  });

  /**
   * Query para trial gratuito
   */
  const trialQuery = useQuery({
    queryKey: BILLING_QUERY_KEYS.userTrial(userId || ''),
    queryFn: async () => {
      if (!userId) return null;

      try {
        const { data, error } = await supabase
          .from('free_trial_usage')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        return data;
      } catch (error) {
        handleError(error as Error, 'trialQuery');
        return null;
      }
    },
    enabled: isAuthenticated,
    staleTime: BILLING_STALE_TIMES.TRIAL,
    retry: 1,
  });

  /**
   * Criar dados de fallback para uso quando queries falham
   */
  const createFallbackUsageData = useCallback(() => ({
    allowed: true,
    used: 0,
    limit: 200, // Limite padrão
    percentage: 0,
    remaining: 200,
    status: 'active' as const,
    is_trial: false,
    message: 'Dados não disponíveis - usando padrões',
  }), []);

  /**
   * Dados computados com defensive coding
   */
  const billingData = useMemo(() => {
    const subscription = subscriptionQuery.data;
    const usage = usageQuery.data || createFallbackUsageData();
    const trial = trialQuery.data;

    // Determinar status do plano
    const hasActiveSubscription = subscription?.status === 'active';
    const hasActiveTrial = trial && new Date(trial.expires_at) > new Date();
    const isBlocked = subscription?.platform_blocked_at !== null;
    const isOverdue = subscription?.payment_overdue_since !== null;

    // 🔒 LÓGICA CORRETA: Usuário pode ativar trial SE:
    // 1. Nunca ativou trial antes (trial === null OU não existe registro)
    // 2. E não tem has_used_free_trial = true na subscription
    // 3. E não tem plano pago ativo atualmente
    const hasUsedFreeTrial = subscription?.has_used_free_trial === true || trial !== null;
    const canActivateTrial = !hasUsedFreeTrial && !hasActiveSubscription;

    // Determinar plano atual
    const currentPlan = subscription?.plan_type || (hasActiveTrial ? 'free_200' : null);

    // Calcular limites efetivos
    const effectiveLimit = usage?.limit || 200;
    const currentUsage = usage?.used || 0;
    const percentage = effectiveLimit > 0 ? (currentUsage / effectiveLimit) * 100 : 0;

    // Status consolidado
    const billingStatus = isBlocked ? 'blocked' :
                         isOverdue ? 'overdue' :
                         hasActiveSubscription ? 'active' :
                         hasActiveTrial ? 'trial' :
                         'inactive';

    return {
      // Estados das queries
      isLoading: subscriptionQuery.isLoading || usageQuery.isLoading || trialQuery.isLoading,
      isError: subscriptionQuery.isError || usageQuery.isError || trialQuery.isError,
      error: subscriptionQuery.error || usageQuery.error || trialQuery.error,

      // Dados brutos
      subscription,
      usage,
      trial,

      // Estados computados
      hasActiveSubscription,
      hasActiveTrial,
      isBlocked,
      isOverdue,
      currentPlan,
      billingStatus,
      hasUsedFreeTrial, // ✅ Novo campo para rastreamento

      // Métricas de uso
      currentUsage,
      effectiveLimit,
      percentage: Math.min(percentage, 100), // Cap em 100%
      remaining: Math.max(effectiveLimit - currentUsage, 0),

      // Flags de estado
      canActivateTrial, // ✅ Agora com lógica correta
      needsUpgrade: percentage >= 90 || currentUsage >= effectiveLimit,
      isNearLimit: percentage >= 75,
    };
  }, [
    subscriptionQuery.data, subscriptionQuery.isLoading, subscriptionQuery.isError, subscriptionQuery.error,
    usageQuery.data, usageQuery.isLoading, usageQuery.isError, usageQuery.error,
    trialQuery.data, trialQuery.isLoading, trialQuery.isError, trialQuery.error,
    createFallbackUsageData
  ]);

  /**
   * Função para invalidar cache específico
   */
  const invalidateUserData = useCallback(async () => {
    if (!userId) return;

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.userSubscription(userId) }),
      queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.usageCheck(userId) }),
      queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.userTrial(userId) }),
    ]);
  }, [userId, queryClient]);

  /**
   * Função para retry manual
   */
  const retryQueries = useCallback(() => {
    setRetryCount(prev => prev + 1);
    subscriptionQuery.refetch();
    usageQuery.refetch();
    trialQuery.refetch();
  }, [subscriptionQuery, usageQuery, trialQuery]);

  return {
    ...billingData,

    // Métodos de controle
    invalidateUserData,
    retryQueries,
    retryCount,

    // Estados das queries individuais
    queries: {
      subscription: subscriptionQuery,
      usage: usageQuery,
      trial: trialQuery,
    },
  };
};

/**
 * Hook para verificar permissões de billing
 */
export const useBillingPermissions = () => {
  const { user } = useAuth();

  const userRole = user?.user_metadata?.role || user?.app_metadata?.role || 'operational';

  const can = useCallback((permission: string) => {
    return hasBillingPermission(userRole, permission as any);
  }, [userRole]);

  const canActivateTrial = can(BILLING_PERMISSIONS.ACTIVATE_TRIAL);
  const canChangePlan = can(BILLING_PERMISSIONS.CHANGE_PLAN);
  const canViewPayments = can(BILLING_PERMISSIONS.VIEW_PAYMENTS);
  const canManageUsers = can(BILLING_PERMISSIONS.MANAGE_USER_PLANS);

  return {
    userRole,
    can,
    canActivateTrial,
    canChangePlan,
    canViewPayments,
    canManageUsers,
  };
};

/**
 * Type exports para TypeScript
 */
export type BillingData = ReturnType<typeof useBillingData>;
export type BillingPermissions = ReturnType<typeof useBillingPermissions>;