
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Hook for managing user profile data
 */
export const useProfileData = () => {
  const [fullName, setFullName] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  /**
   * Loads profile data for a user
   * @param userId The ID of the user to load data for
   * @returns The company ID if found
   */
  const loadProfileData = async (userId: string): Promise<string | null> => {
    try {
      console.log('[Profile Data] Carregando dados do perfil para:', userId);
      
      // Buscar os dados do perfil do usuário com informações da empresa
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          *,
          companies (
            id,
            name
          )
        `)
        .eq('id', userId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Erro ao carregar perfil:", error);
        toast.error("Não foi possível carregar os dados do perfil");
        return null;
      } 
      
      if (profile) {
        console.log('[Profile Data] Perfil carregado:', {
          name: profile.full_name,
          role: profile.role,
          companyId: profile.company_id,
          companyName: profile.companies?.name
        });
        
        setFullName(profile.full_name || "");
        setDocumentId(profile.document_id || "");
        setWhatsapp(profile.whatsapp || "");
        setAvatarUrl(profile.avatar_url);
        setUserRole(profile.role);
        
        return profile.company_id || null;
      } else {
        console.log('[Profile Data] Perfil não encontrado para usuário:', userId);
        return null;
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      return null;
    }
  };
  
  /**
   * Saves profile data to the database
   * @param userId User ID
   * @param companyId Company ID
   */
  const saveProfileData = async (userId: string, companyId: string | null) => {
    try {
      const updateData: any = {
        full_name: fullName,
        document_id: documentId,
        whatsapp: whatsapp,
        updated_at: new Date().toISOString()
      };
      
      if (companyId) {
        updateData.company_id = companyId;
      }
      
      console.log('[Profile Data] Salvando dados do perfil:', updateData);
      
      // Atualizar o perfil do usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);
        
      if (profileError) {
        throw profileError;
      }
      
      console.log('[Profile Data] Perfil salvo com sucesso');
      return true;
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error(error.message || "Não foi possível atualizar o perfil");
      return false;
    }
  };
  
  return {
    fullName,
    setFullName,
    documentId,
    setDocumentId,
    whatsapp,
    setWhatsapp,
    avatarUrl,
    setAvatarUrl,
    userRole,
    setUserRole,
    loadProfileData,
    saveProfileData
  };
};
