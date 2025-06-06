
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuthActions } from "./useAuthActions";
import { useCompanyManagement } from "./useCompanyManagement";
import { useAuthSession } from "./useAuthSession";
import { useProfileSettingsOperations } from "./useProfileSettingsOperations";

export const useProfileSettings = () => {
  const [saving, setSaving] = useState(false);
  
  // Profile data state
  const [fullName, setFullName] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // Company data state
  const [companyName, setCompanyName] = useState("");
  const [companyDocument, setCompanyDocument] = useState("");

  // Use the smaller hooks
  const { handleChangePassword } = useAuthActions();
  const { companyData, loadCompanyData, saveCompany } = useCompanyManagement();
  const { loading, email, username, user, handleEmailChange, loadSession } = useAuthSession();
  const { syncStatus, setSyncStatus, loadUserProfile, updateUserProfile } = useProfileSettingsOperations();

  /**
   * Load all user data (profile + company)
   */
  const loadUserData = async () => {
    try {
      setSyncStatus('syncing');
      
      // First load session
      const sessionUser = await loadSession();
      if (!sessionUser) {
        setSyncStatus('error');
        return;
      }

      // Load profile data
      const profile = await loadUserProfile(sessionUser.id);
      if (profile) {
        setFullName(profile.full_name || "");
        setDocumentId(profile.document_id || "");
        setWhatsapp(profile.whatsapp || "");
        setAvatarUrl(profile.avatar_url);
        setUserRole(profile.role);
        
        // Load company data
        const companyInfo = await loadCompanyData();
        if (companyInfo) {
          setCompanyName(companyInfo.name || "");
          setCompanyDocument(companyInfo.document_id || "");
        }
        
        setSyncStatus('success');
        toast.success("Dados carregados com sucesso!");
      }
      
    } catch (error: any) {
      console.error("❌ Erro ao carregar dados:", error);
      setSyncStatus('error');
      toast.error("Erro ao carregar dados: " + error.message);
    }
  };

  // Load profile data on mount (only if not already loaded by useAuthSession)
  useEffect(() => {
    if (user && !loading) {
      loadUserData();
    }
  }, [user, loading]);

  // Manual re-sync
  const handleResync = async () => {
    console.log('[Profile Settings] 🔄 Re-sincronização manual solicitada');
    await loadUserData();
  };

  // Save profile changes
  const handleSaveChanges = async () => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }
    
    try {
      setSaving(true);
      console.log('[Profile Settings] 💾 Salvando perfil...');
      
      // Update profile data
      await updateUserProfile(user.id, {
        full_name: fullName,
        document_id: documentId,
        whatsapp: whatsapp
      });
      
      // Save company data if provided
      if (companyName.trim()) {
        const companySuccess = await saveCompany(companyName, companyDocument);
        if (!companySuccess) {
          throw new Error('Erro ao salvar dados da empresa');
        }
      }
      
      toast.success("Perfil atualizado com sucesso!");
      console.log('[Profile Settings] ✅ Perfil salvo com sucesso');
      
      // Reload data to ensure consistency
      await loadUserData();
    } catch (error: any) {
      console.error("❌ Erro ao atualizar perfil:", error);
      toast.error(error.message || "Erro ao atualizar perfil");
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
    companyData,
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
