
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// FASE 1: Hook simplificado - company_id não é mais obrigatório
export const useCompanyData = () => {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      // FASE 1: Simular company_id como user_id para compatibilidade
      // Na prática, as instâncias agora são associadas diretamente ao user_id
      setCompanyId(user.id);
      console.log('[Company Data] 🏢 FASE 1 - Usando user_id como company_id:', user.id);
    }
    setLoading(false);
  }, [user]);

  return {
    companyId,
    loading
  };
};
