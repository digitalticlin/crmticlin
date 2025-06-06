
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Hook for managing company data operations (simplified - no auto-loading)
 */
export const useCompanyData = () => {
  const [companyName, setCompanyName] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyDocument, setCompanyDocument] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [loading, setLoading] = useState(false);
  
  /**
   * Sets company data from external source
   * @param companyData Company data object
   */
  const setCompanyData = (companyData: any) => {
    console.log('[Company Data] 📝 Definindo dados da empresa:', companyData);
    
    if (companyData) {
      setCompanyId(companyData.id);
      setCompanyName(companyData.name || "");
      setCompanyDocument(companyData.document_id || "");
      setCompanyPhone(companyData.phone || "");
      setCompanyEmail(companyData.email || "");
    } else {
      // Reset data if no company
      setCompanyId(null);
      setCompanyName("");
      setCompanyDocument("");
      setCompanyPhone("");
      setCompanyEmail("");
    }
  };
  
  /**
   * Fetches company data based on company ID (manual operation)
   * @param id The company ID to fetch
   */
  const fetchCompanyData = async (id: string) => {
    try {
      setLoading(true);
      console.log('[Company Data] 🔍 Buscando dados da empresa:', id);
      
      const { data: company, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .maybeSingle();
        
      if (error) {
        console.error('[Company Data] ❌ Erro ao buscar empresa:', error);
        throw error;
      }
        
      if (company) {
        console.log('[Company Data] ✅ Empresa encontrada:', company.name);
        setCompanyData(company);
      }
      
    } catch (error) {
      console.error("[Company Data] ❌ Erro ao buscar dados da empresa:", error);
      toast.error("Erro ao carregar dados da empresa");
    } finally {
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
      
      setLoading(true);
      
      // If no companyId, create a new company
      if (!companyId && name.trim()) {
        console.log('[Company Data] ➕ Criando nova empresa:', name);
        
        const { data: newCompany, error: newCompanyError } = await supabase
          .from('companies')
          .insert({
            name: name.trim(),
            document_id: companyDocument,
            phone: companyPhone,
            email: companyEmail,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (newCompanyError) {
          throw newCompanyError;
        }
        
        if (newCompany) {
          console.log('[Company Data] ✅ Nova empresa criada:', newCompany.id);
          setCompanyId(newCompany.id);
          return newCompany.id;
        }
      } else if (companyId) {
        // Update existing company
        console.log('[Company Data] 🔄 Atualizando empresa existente:', companyId);
        
        const { error: companyError } = await supabase
          .from('companies')
          .update({
            name: name,
            document_id: companyDocument,
            phone: companyPhone,
            email: companyEmail,
            updated_at: new Date().toISOString()
          })
          .eq('id', companyId);

        if (companyError) {
          throw companyError;
        }
        
        console.log('[Company Data] ✅ Empresa atualizada');
        return companyId;
      }
      
      return null;
    } catch (error: any) {
      console.error("[Company Data] ❌ Erro ao salvar empresa:", error);
      toast.error(error.message || "Não foi possível salvar os dados da empresa");
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    companyName,
    setCompanyName,
    companyId,
    setCompanyId,
    companyDocument,
    setCompanyDocument,
    companyPhone,
    setCompanyPhone,
    companyEmail,
    setCompanyEmail,
    loading,
    setCompanyData,
    fetchCompanyData,
    saveCompany
  };
};
