
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CompanyData {
  id: string;
  name: string;
  document_id: string | null;
  email: string | null;
  phone: string | null;
}

export const useCompanyManagement = () => {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);

  /**
   * Carregar dados da empresa do usuário atual (opcional no novo sistema)
   */
  const loadCompanyData = async (): Promise<CompanyData | null> => {
    try {
      setIsLoadingCompany(true);
      console.log('[Company Management] 📦 Carregando dados da empresa...');

      // Obter company_id do perfil do usuário (agora opcional)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      if (profileError) {
        throw new Error(`Erro ao carregar perfil: ${profileError.message}`);
      }

      if (!profile?.company_id) {
        console.log('[Company Management] ⚠️ Usuário ainda não possui empresa vinculada (opcional no novo sistema)');
        setCompanyData(null);
        return null;
      }

      // Carregar dados da empresa
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .maybeSingle();

      if (companyError) {
        throw new Error(`Erro ao carregar empresa: ${companyError.message}`);
      }

      if (company) {
        console.log('[Company Management] ✅ Dados da empresa carregados:', company.name);
        setCompanyData(company);
        return company;
      }

      return null;
    } catch (error: any) {
      console.error('[Company Management] ❌ Erro ao carregar empresa:', error);
      toast.error(`Erro ao carregar empresa: ${error.message}`);
      return null;
    } finally {
      setIsLoadingCompany(false);
    }
  };

  /**
   * Criar nova empresa para o usuário (opcional)
   */
  const createCompany = async (companyName: string, companyDocument?: string): Promise<boolean> => {
    try {
      console.log('[Company Management] 🏗️ Criando nova empresa:', companyName);

      const { data, error } = await supabase.rpc('create_user_company', {
        company_name: companyName,
        company_document_id: companyDocument || null
      });

      if (error) {
        throw new Error(`Erro ao criar empresa: ${error.message}`);
      }

      console.log('[Company Management] ✅ Empresa criada com sucesso. ID:', data);
      toast.success('Empresa criada com sucesso!');
      
      // Recarregar dados da empresa
      await loadCompanyData();
      
      return true;
    } catch (error: any) {
      console.error('[Company Management] ❌ Erro ao criar empresa:', error);
      toast.error(`Erro ao criar empresa: ${error.message}`);
      return false;
    }
  };

  /**
   * Atualizar dados da empresa existente (opcional)
   */
  const updateCompany = async (companyName: string, companyDocument?: string): Promise<boolean> => {
    try {
      console.log('[Company Management] 📝 Atualizando empresa:', companyName);

      const { data, error } = await supabase.rpc('update_user_company', {
        company_name: companyName,
        company_document_id: companyDocument || null
      });

      if (error) {
        throw new Error(`Erro ao atualizar empresa: ${error.message}`);
      }

      console.log('[Company Management] ✅ Empresa atualizada com sucesso');
      toast.success('Empresa atualizada com sucesso!');
      
      // Recarregar dados da empresa
      await loadCompanyData();
      
      return true;
    } catch (error: any) {
      console.error('[Company Management] ❌ Erro ao atualizar empresa:', error);
      toast.error(`Erro ao atualizar empresa: ${error.message}`);
      return false;
    }
  };

  /**
   * Salvar empresa (criar se não existir, atualizar se existir) - opcional
   */
  const saveCompany = async (companyName: string, companyDocument?: string): Promise<boolean> => {
    if (!companyName.trim()) {
      toast.success('Empresa não é mais obrigatória no novo sistema');
      return true;
    }

    if (companyData) {
      return await updateCompany(companyName, companyDocument);
    } else {
      return await createCompany(companyName, companyDocument);
    }
  };

  return {
    companyData,
    isLoadingCompany,
    loadCompanyData,
    createCompany,
    updateCompany,
    saveCompany
  };
};
