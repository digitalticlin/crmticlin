
import { useState, useEffect } from 'react';
import { UsageTrackingService } from '../services/usageTrackingService';
import { MessageUsageTracking, UsageLimitCheck } from '../types/billing';
import { useAuth } from '@/contexts/AuthContext';

export const useMessageUsage = () => {
  const { user } = useAuth();
  const [usage, setUsage] = useState<MessageUsageTracking | null>(null);
  const [limitCheck, setLimitCheck] = useState<UsageLimitCheck | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [currentUsage, limitInfo] = await Promise.all([
        UsageTrackingService.getCurrentUsage(user.id),
        UsageTrackingService.checkMessageLimit(user.id)
      ]);
      
      setUsage(currentUsage);
      setLimitCheck(limitInfo);
    } catch (error) {
      console.error('[useMessageUsage] Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const incrementMessage = async (type: 'sent' | 'received' = 'sent') => {
    if (!user) return false;
    
    const success = await UsageTrackingService.incrementMessageCount(user.id, type);
    if (success) {
      // Atualizar dados após incremento
      await fetchUsage();
    }
    return success;
  };

  const checkCanSendMessage = async (): Promise<boolean> => {
    if (!user) return false;
    
    const check = await UsageTrackingService.checkMessageLimit(user.id);
    setLimitCheck(check);
    return check.allowed;
  };

  useEffect(() => {
    fetchUsage();
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
