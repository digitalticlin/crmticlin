
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
    userRole,
    loadProfileData, 
    saveProfileData 
  } = useProfileData();
  
  const { 
    companyName, setCompanyName, 
    companyId, setCompanyId, 
    companyDocument, setCompanyDocument,
    companyPhone, setCompanyPhone,
    companyEmail, setCompanyEmail,
    fetchCompanyData, 
    saveCompany 
  } = useCompanyData();
  
  const { handleChangePassword } = useAuthActions();

  // Carregar os dados do perfil quando o componente é montado
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        console.log('[Profile Settings] Iniciando carregamento do perfil...');
        
        // Obter a sessão atual
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('[Profile Settings] Usuário não autenticado');
          setLoading(false);
          return;
        }

        console.log('[Profile Settings] Usuário autenticado:', session.user.email);
        
        setUser(session.user);
        setEmail(session.user.email || "");
        setUsername(generateUsername(session.user.email || ""));
        
        // Carregar dados do perfil primeiro
        const foundCompanyId = await loadProfileData(session.user.id);
        
        // Se encontrou company_id no perfil, usar esse valor
        if (foundCompanyId && foundCompanyId !== companyId) {
          console.log('[Profile Settings] Company ID encontrado no perfil:', foundCompanyId);
          setCompanyId(foundCompanyId);
          
          // Buscar dados específicos da empresa se necessário
          await fetchCompanyData(foundCompanyId);
        }
        
        console.log('[Profile Settings] Perfil carregado com sucesso');
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
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
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }
    
    if (!companyName.trim()) {
      toast.error("O campo RAZAO SOCIAL ou NOME é obrigatório");
      return;
    }
    
    try {
      setSaving(true);
      console.log('[Profile Settings] Iniciando salvamento...');
      
      // Save company data first
      const newCompanyId = await saveCompany(companyName);
      
      if (!newCompanyId) {
        toast.error("Erro ao salvar dados da empresa");
        return;
      }
      
      // Then save profile data
      const profileSaved = await saveProfileData(user.id, newCompanyId);
      
      if (profileSaved) {
        toast.success("Perfil atualizado com sucesso!");
        console.log('[Profile Settings] Perfil salvo com sucesso');
        
        // Atualizar company_id local se mudou
        if (newCompanyId !== companyId) {
          setCompanyId(newCompanyId);
        }
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
    userRole,
    user,
    companyDocument,
    setFullName,
    setCompanyName,
    setDocumentId,
    setWhatsapp,
    setCompanyDocument,
    handleEmailChange,
    handleSaveChanges,
    handleChangePassword: () => handleChangePassword(email)
  };
};
