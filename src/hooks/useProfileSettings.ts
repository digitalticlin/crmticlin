
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
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  
  // Import functionality from modular hooks
  const { 
    fullName, setFullName, 
    documentId, setDocumentId, 
    whatsapp, setWhatsapp, 
    avatarUrl,
    userRole,
    loadCompleteProfileData, 
    saveProfileData 
  } = useProfileData();
  
  const { 
    companyName, setCompanyName, 
    companyId, setCompanyId, 
    companyDocument, setCompanyDocument,
    companyPhone, setCompanyPhone,
    companyEmail, setCompanyEmail,
    setCompanyData,
    saveCompany 
  } = useCompanyData();
  
  const { handleChangePassword } = useAuthActions();

  /**
   * Centralized function to load all user data from Supabase
   */
  const loadUserData = async (forceReload = false) => {
    try {
      setSyncStatus('syncing');
      console.log('[Profile Settings] 🚀 Iniciando carregamento dos dados do Supabase...');
      
      // Obter a sessão atual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('[Profile Settings] ❌ Usuário não autenticado');
        setLoading(false);
        setSyncStatus('error');
        return;
      }

      console.log('[Profile Settings] 👤 Usuário autenticado:', session.user.email);
      
      setUser(session.user);
      setEmail(session.user.email || "");
      setUsername(generateUsername(session.user.email || ""));
      
      // Carregar dados completos do perfil E empresa numa única operação
      const { profile, company } = await loadCompleteProfileData(session.user.id);
      
      if (profile) {
        console.log('[Profile Settings] ✅ Dados do perfil carregados do Supabase:', {
          name: profile.full_name,
          role: profile.role,
          companyId: profile.company_id,
          hasCompany: !!company
        });
        
        // Atualizar dados da empresa se existir
        if (company) {
          console.log('[Profile Settings] 🏢 Empresa vinculada encontrada no Supabase:', company.name);
          setCompanyData(company);
        } else {
          console.log('[Profile Settings] ⚠️ Nenhuma empresa vinculada encontrada');
          // Limpar dados da empresa se não existir
          setCompanyData(null);
        }
        
        setSyncStatus('success');
        toast.success("Dados carregados do Supabase com sucesso!");
      } else {
        console.log('[Profile Settings] ⚠️ Perfil não encontrado no Supabase');
        setSyncStatus('error');
        toast.warning("Perfil não encontrado no Supabase");
      }
      
    } catch (error) {
      console.error("❌ Erro ao carregar dados do Supabase:", error);
      setSyncStatus('error');
      toast.error("Ocorreu um erro ao carregar dados do Supabase");
    } finally {
      setLoading(false);
    }
  };

  // Carregar os dados do perfil quando o componente é montado
  useEffect(() => {
    loadUserData();
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

  // Função para re-sincronizar dados manualmente
  const handleResync = async () => {
    console.log('[Profile Settings] 🔄 Re-sincronização manual com Supabase solicitada');
    await loadUserData(true);
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
      console.log('[Profile Settings] 💾 Salvando no Supabase...');
      
      // Save company data first
      const newCompanyId = await saveCompany(companyName);
      
      if (!newCompanyId) {
        toast.error("Erro ao salvar dados da empresa no Supabase");
        return;
      }
      
      // Then save profile data
      const profileSaved = await saveProfileData(user.id, newCompanyId);
      
      if (profileSaved) {
        toast.success("Perfil atualizado no Supabase com sucesso!");
        console.log('[Profile Settings] ✅ Perfil salvo no Supabase com sucesso');
        
        // Atualizar company_id local se mudou
        if (newCompanyId !== companyId) {
          setCompanyId(newCompanyId);
        }
        
        // Re-carregar dados para garantir consistência
        await loadUserData(true);
      }
    } catch (error: any) {
      console.error("❌ Erro ao atualizar perfil no Supabase:", error);
      toast.error(error.message || "Não foi possível atualizar o perfil no Supabase");
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
    syncStatus,
    setFullName,
    setCompanyName,
    setDocumentId,
    setWhatsapp,
    setCompanyDocument,
    handleEmailChange,
    handleSaveChanges,
    handleResync,
    handleChangePassword: () => handleChangePassword(email)
  };
};
