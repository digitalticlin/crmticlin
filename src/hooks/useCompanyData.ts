
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Hook for managing company data
 */
export const useCompanyData = () => {
  const [companyName, setCompanyName] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // CORREÇÃO: Carregar company_id otimizado
  useEffect(() => {
    const loadUserCompany = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log('[Company Data] Usuário não autenticado');
          setLoading(false);
          return;
        }

        console.log('[Company Data] Carregando dados para usuário:', user.email);

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("[Company Data] Erro ao carregar perfil:", error);
          
          // CORREÇÃO: Se não há profile, criar um automaticamente
          if (error.code === 'PGRST116') {
            console.log('[Company Data] Profile não existe, será criado automaticamente pelo trigger');
            // Aguardar um pouco para o trigger criar o profile
            setTimeout(() => loadUserCompany(), 1000);
            return;
          }
          
          setLoading(false);
          return;
        }

        if (profile?.company_id) {
          console.log('[Company Data] Company ID encontrado:', profile.company_id);
          setCompanyId(profile.company_id);
          await fetchCompanyData(profile.company_id);
        } else {
          console.log('[Company Data] Nenhum company_id encontrado no profile');
          setLoading(false);
        }
      } catch (error) {
        console.error("[Company Data] Erro ao carregar dados da empresa:", error);
        setLoading(false);
      }
    };

    loadUserCompany();
  }, []);
  
  /**
   * Fetches company data based on company ID
   * @param id The company ID to fetch
   */
  const fetchCompanyData = async (id: string) => {
    try {
      console.log('[Company Data] Buscando dados da empresa:', id);
      
      const { data: company, error } = await supabase
        .from('companies')
        .select('name')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error('[Company Data] Erro ao buscar empresa:', error);
        throw error;
      }
        
      if (company) {
        console.log('[Company Data] Empresa encontrada:', company.name);
        setCompanyName(company.name);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("[Company Data] Erro ao buscar dados da empresa:", error);
      setLoading(false);
    }
  };
  
  /**
   * Creates a new company or updates an existing one
   * @param name The company name
   * @returns The company ID
   */
  const saveCompany = async (name: string): Promise<string | null> => {
    try {
      if (!name.trim()) {
        toast.error("O campo RAZAO SOCIAL ou NOME é obrigatório");
        return null;
      }
      
      // If no companyId, create a new company
      if (!companyId && name.trim()) {
        console.log('[Company Data] Criando nova empresa:', name);
        
        const { data: newCompany, error: newCompanyError } = await supabase
          .from('companies')
          .insert({
            name: name.trim(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (newCompanyError) {
          throw newCompanyError;
        }
        
        if (newCompany) {
          console.log('[Company Data] Nova empresa criada:', newCompany.id);
          setCompanyId(newCompany.id);
          return newCompany.id;
        }
      } else if (companyId) {
        // Update existing company
        console.log('[Company Data] Atualizando empresa existente:', companyId);
        
        const { error: companyError } = await supabase
          .from('companies')
          .update({
            name: name,
            updated_at: new Date().toISOString()
          })
          .eq('id', companyId);

        if (companyError) {
          throw companyError;
        }
        
        return companyId;
      }
      
      return null;
    } catch (error: any) {
      console.error("[Company Data] Erro ao salvar empresa:", error);
      toast.error(error.message || "Não foi possível salvar os dados da empresa");
      return null;
    }
  };
  
  return {
    companyName,
    setCompanyName,
    companyId,
    setCompanyId,
    loading,
    fetchCompanyData,
    saveCompany
  };
};
