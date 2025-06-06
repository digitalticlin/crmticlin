
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Hook simplificado sem dependência de tabela companies
export const useCompanyData = () => {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Como não temos mais tabela companies, vamos usar um ID fixo baseado no usuário
    if (user?.id) {
      setCompanyId(user.id); // Usando o ID do usuário como company_id
    }
    setLoading(false);
  }, [user]);

  const fetchCompanyData = async (id: string) => {
    // Função vazia para compatibilidade
    console.log('fetchCompanyData called with:', id);
  };

  return {
    companyId,
    loading,
    setCompanyId,
    fetchCompanyData
  };
};
