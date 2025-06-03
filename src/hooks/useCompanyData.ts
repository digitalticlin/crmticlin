
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook for managing company data
 */
export const useCompanyData = () => {
  const [companyName, setCompanyName] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Carregar company_id automaticamente quando o usuário estiver disponível
  useEffect(() => {
    isMountedRef.current = true;
    
    const loadUserCompany = async () => {
      if (authLoading || !isMountedRef.current) return; // Aguardar auth carregar
      
      if (!user) {
        if (isMountedRef.current) {
          setCompanyId(null);
          setCompanyName("");
          setLoading(false);
        }
        return;
      }

      // Cancelar requisição anterior se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (!isMountedRef.current || abortControllerRef.current?.signal.aborted) return;

        if (error) {
          console.error("Error loading user profile:", error);
          setLoading(false);
          return;
        }

        if (profile?.company_id) {
          setCompanyId(profile.company_id);
          await fetchCompanyData(profile.company_id);
        }
      } catch (error) {
        if (!abortControllerRef.current?.signal.aborted) {
          console.error("Error loading user company:", error);
        }
      } finally {
        if (isMountedRef.current && !abortControllerRef.current?.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadUserCompany();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [user, authLoading]); // Dependências simplificadas
  
  /**
   * Fetches company data based on company ID
   * @param id The company ID to fetch
   */
  const fetchCompanyData = async (id: string) => {
    if (!isMountedRef.current) return;
    
    try {
      const { data: company, error } = await supabase
        .from('companies')
        .select('name')
        .eq('id', id)
        .single();
        
      if (error) throw error;
        
      if (company && isMountedRef.current) {
        setCompanyName(company.name);
      }
    } catch (error) {
      console.error("Error fetching company data:", error);
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
        
        if (newCompany && isMountedRef.current) {
          setCompanyId(newCompany.id);
          return newCompany.id;
        }
      } else if (companyId) {
        // Update existing company
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
      console.error("Error saving company:", error);
      toast.error(error.message || "Não foi possível salvar os dados da empresa");
      return null;
    }
  };

  // Cleanup na desmontagem
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
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
