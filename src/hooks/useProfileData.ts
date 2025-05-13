
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
  
  /**
   * Loads profile data for a user
   * @param userId The ID of the user to load data for
   * @returns The company ID if found
   */
  const loadProfileData = async (userId: string): Promise<string | null> => {
    try {
      // Buscar os dados do perfil do usuário
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error("Erro ao carregar perfil:", error);
        toast.error("Não foi possível carregar os dados do perfil");
        return null;
      } 
      
      if (profile) {
        setFullName(profile.full_name || "");
        setDocumentId(profile.document_id || "");
        setWhatsapp(profile.whatsapp || "");
        setAvatarUrl(profile.avatar_url);
        
        return profile.company_id || null;
      }
      
      return null;
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
      
      // Atualizar o perfil do usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);
        
      if (profileError) {
        throw profileError;
      }
      
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
    loadProfileData,
    saveProfileData
  };
};
