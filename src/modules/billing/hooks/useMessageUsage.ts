
import { useState, useEffect } from 'react';
import { MercadoPagoService } from '../services/mercadopagoService';
import { MessageUsageTracking, UsageLimitCheck } from '../types/billing';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useMessageUsage = () => {
  const { user } = useAuth();
  const [usage, setUsage] = useState<MessageUsageTracking | null>(null);
  const [limitCheck, setLimitCheck] = useState<UsageLimitCheck | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [usageData, statusData] = await Promise.all([
        MercadoPagoService.getCurrentUsage(),
        MercadoPagoService.checkSubscriptionStatus()
      ]);

      // Adaptar dados para o formato esperado
      if (usageData) {
        setLimitCheck({
          allowed: usageData.allowed,
          remaining: usageData.remaining || 0,
          current_usage: usageData.used || 0,
          plan_limit: usageData.limit || 0,
          percentage_used: usageData.percentage || 0,
          status: usageData.allowed ? 'active' : 'exceeded',
          used: usageData.used || 0,
          limit: usageData.limit || 0
        });
      }

      if (statusData?.usage) {
        setUsage({
          ...statusData.usage,
          status: statusData.usage.allowed ? 'active' : 'exceeded'
        });
      }

    } catch (error) {
      console.error('[useMessageUsage] Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const incrementMessage = async (type: 'sent' | 'received' = 'sent') => {
    if (!user) return false;

    // Para mensagens da IA, o incremento é feito automaticamente na edge function
    // Para mensagens manuais, apenas atualizamos os dados
    await fetchUsage();
    return true;
  };

  const checkCanSendMessage = async (): Promise<boolean> => {
    if (!user) return false;

    const usageData = await MercadoPagoService.getCurrentUsage();
    if (usageData) {
      setLimitCheck({
        allowed: usageData.allowed,
        remaining: usageData.remaining || 0,
        current_usage: usageData.used || 0,
        plan_limit: usageData.limit || 0,
        percentage_used: usageData.percentage || 0,
        status: usageData.allowed ? 'active' : 'exceeded',
        used: usageData.used || 0,
        limit: usageData.limit || 0
      });
      return usageData.allowed;
    }
    return false;
  };

  useEffect(() => {
    if (!user) return;

    fetchUsage();

    // Escutar mudanças em tempo real
    const channel = supabase
      .channel('usage_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'message_usage_tracking',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchUsage();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'plan_subscriptions',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchUsage();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    usage,
    limitCheck,
    loading,
    fetchUsage,
    incrementMessage,
    checkCanSendMessage
  };
};
