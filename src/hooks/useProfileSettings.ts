
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateUsername } from "@/utils/userUtils";
import { useProfileData } from "./useProfileData";
import { useCompanyData } from "./useCompanyData";
import { useAuthActions } from "./useAuthActions";

export const useProfileSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [user, setUser] = useState<any>(null);
  
  // Import functionality from modular hooks
  const { 
    fullName, setFullName, 
    documentId, setDocumentId, 
    whatsapp, setWhatsapp, 
    avatarUrl,
    loadProfileData, 
    saveProfileData 
  } = useProfileData();
  
  const { 
    companyName, setCompanyName, 
    companyId, setCompanyId, 
    fetchCompanyData, 
    saveCompany 
  } = useCompanyData();
  
  const { handleChangePassword } = useAuthActions();

  // Carregar os dados do perfil quando o componente é montado
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Obter a sessão atual
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setLoading(false);
          return;
        }

        setUser(session.user);
        setEmail(session.user.email || "");
        setUsername(generateUsername(session.user.email || ""));
        
        const foundCompanyId = await loadProfileData(session.user.id);
        
        // Buscar dados da empresa do usuário
        if (foundCompanyId) {
          setCompanyId(foundCompanyId);
          await fetchCompanyData(foundCompanyId);
        }
      } catch (error) {
        console.error("Erro:", error);
        toast.error("Ocorreu um erro ao carregar seus dados");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Atualizar o nome de usuário quando o email mudar
  useEffect(() => {
    const newUsername = generateUsername(email);
    setUsername(newUsername);
  }, [email]);

  // Função para lidar com a mudança de email
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  // Função para salvar as alterações do perfil
  const handleSaveChanges = async () => {
    if (!user) return;
    
    if (!companyName.trim()) {
      toast.error("O campo RAZAO SOCIAL ou NOME é obrigatório");
      return;
    }
    
    try {
      setSaving(true);
      
      // Save company data first
      const newCompanyId = await saveCompany(companyName);
      
      // Then save profile data
      if (newCompanyId) {
        await saveProfileData(user.id, newCompanyId);
        toast.success("Perfil atualizado com sucesso!");
      }
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error(error.message || "Não foi possível atualizar o perfil");
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    email,
    username,
    fullName,
    companyName,
    documentId,
    whatsapp,
    avatarUrl,
    user,
    setFullName,
    setCompanyName,
    setDocumentId,
    setWhatsapp,
    handleEmailChange,
    handleSaveChanges,
    handleChangePassword: () => handleChangePassword(email)
  };
};
