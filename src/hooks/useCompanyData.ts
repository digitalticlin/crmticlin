
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useCompanyData = () => {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadCompanyId = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Buscar company_id do perfil do usuário
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Erro ao carregar company_id:', error);
        } else if (profile?.company_id) {
          console.log('[useCompanyData] Company ID carregado:', profile.company_id);
          setCompanyId(profile.company_id);
        } else {
          console.log('[useCompanyData] Usuário ainda não possui empresa vinculada');
          setCompanyId(null);
        }
      } catch (error) {
        console.error('Erro ao carregar company_id:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCompanyId();
  }, [user]);

  const fetchCompanyData = async (id: string) => {
    try {
      const { data: company, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar dados da empresa:', error);
        return null;
      }

      console.log('Dados da empresa carregados:', company);
      return company;
    } catch (error) {
      console.error('Erro ao buscar dados da empresa:', error);
      return null;
    }
  };

  const refreshCompanyId = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && profile?.company_id) {
        setCompanyId(profile.company_id);
        console.log('[useCompanyData] Company ID atualizado:', profile.company_id);
      }
    } catch (error) {
      console.error('Erro ao atualizar company_id:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    companyId,
    loading,
    setCompanyId,
    fetchCompanyData,
    refreshCompanyId
  };
};
