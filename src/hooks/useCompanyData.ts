
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
  
  // Carregar company_id e dados da empresa do usuário logado
  useEffect(() => {
    let isMounted = true;
    
    const loadUserCompany = async () => {
      try {
        console.log('[Company Data] Iniciando carregamento dos dados da empresa...');
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log('[Company Data] Usuário não autenticado');
          if (isMounted) setLoading(false);
          return;
        }

        console.log('[Company Data] Carregando dados para usuário:', user.email);

        // Buscar perfil do usuário com dados da empresa
        const { data: profile, error } = await supabase
          .from('profiles')
          .select(`
            *,
            companies!inner (
              id,
              name
            )
          `)
          .eq('id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error("[Company Data] Erro ao carregar perfil com empresa:", error);
          if (isMounted) setLoading(false);
          return;
        }

        if (profile && profile.companies) {
          console.log('[Company Data] Dados encontrados:', {
            companyId: profile.company_id,
            companyName: profile.companies.name,
            userRole: profile.role
          });
          
          if (isMounted) {
            setCompanyId(profile.company_id);
            setCompanyName(profile.companies.name);
            setLoading(false);
          }
        } else {
          // Se não há empresa vinculada, buscar apenas o perfil
          const { data: profileOnly, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (profileError) {
            console.error('[Company Data] Erro ao buscar perfil:', profileError);
          } else if (!profileOnly) {
            console.log('[Company Data] Profile não existe, criando...');
            
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                full_name: user.email?.split('@')[0] || 'Usuário',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });

            if (insertError) {
              console.error('[Company Data] Erro ao criar profile:', insertError);
            } else {
              console.log('[Company Data] Profile criado com sucesso');
            }
          } else {
            console.log('[Company Data] Profile existe mas sem empresa vinculada');
          }
          
          if (isMounted) setLoading(false);
        }
      } catch (error) {
        console.error("[Company Data] Erro ao carregar dados da empresa:", error);
        if (isMounted) setLoading(false);
      }
    };

    loadUserCompany();
    
    return () => {
      isMounted = false;
    };
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
        .maybeSingle();
        
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
