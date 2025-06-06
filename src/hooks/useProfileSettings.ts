
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession } from "./useAuthSession";
import { toast } from "sonner";

export interface ProfileData {
  full_name: string;
  document_id: string;
  whatsapp: string;
  company_name: string;
  company_document: string;
  position: string;
  avatar_url?: string;
}

export const useProfileSettings = () => {
  const { user } = useAuthSession();
  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: "",
    document_id: "",
    whatsapp: "",
    company_name: "",
    company_document: "",
    position: "",
    avatar_url: ""
  });
  const [loading, setLoading] = useState(true);

  // Carregar dados do perfil ao montar o componente
  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Erro ao carregar perfil:", error);
        toast.error("Erro ao carregar dados do perfil");
        return;
      }

      if (data) {
        setProfileData({
          full_name: data.full_name || "",
          document_id: data.document_id || "",
          whatsapp: data.whatsapp || "",
          company_name: data.company_name || "",
          company_document: data.company_document || "",
          position: data.position || "",
          avatar_url: data.avatar_url || ""
        });
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      toast.error("Erro ao carregar dados do perfil");
    } finally {
      setLoading(false);
    }
  };

  const updateProfileData = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveProfile = async () => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return false;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profileData.full_name,
          document_id: profileData.document_id,
          whatsapp: profileData.whatsapp,
          company_name: profileData.company_name,
          company_document: profileData.company_document,
          position: profileData.position,
          avatar_url: profileData.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) {
        console.error("Erro ao salvar perfil:", error);
        toast.error("Erro ao salvar perfil");
        return false;
      }

      toast.success("Perfil atualizado com sucesso!");
      return true;
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      toast.error("Erro ao salvar perfil");
      return false;
    }
  };

  return {
    profileData,
    loading,
    updateProfileData,
    saveProfile,
    loadProfileData
  };
};
