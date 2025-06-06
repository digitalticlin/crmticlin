
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuthActions } from "./useAuthActions";
import { useAuthSession } from "./useAuthSession";
import { useProfileSettingsOperations } from "./useProfileSettingsOperations";

export const useProfileSettings = () => {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(false);
  
  // Profile data state
  const [fullName, setFullName] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyDocument, setCompanyDocument] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Use the smaller hooks
  const { handleChangePassword } = useAuthActions();
  const { loading: sessionLoading, email, username, user, handleEmailChange, loadSession } = useAuthSession();
  const { syncStatus, setSyncStatus, loadUserProfile, updateUserProfile } = useProfileSettingsOperations();

  /**
   * Load all user data with anti-loop protection
   */
  const loadUserData = async () => {
    // Prevent multiple simultaneous calls
    if (loadingRef.current) {
      console.log('[Profile Settings] ⚠️ Load já em progresso, ignorando chamada duplicada');
      return;
    }

    try {
      loadingRef.current = true;
      setSyncStatus('syncing');
      
      // First load session
      const sessionUser = await loadSession();
      if (!sessionUser) {
        setSyncStatus('error');
        setLoading(false);
        return;
      }

      // Try to load profile data with error handling
      try {
        const profile = await loadUserProfile(sessionUser.id);
        if (profile) {
          setFullName(profile.full_name || "");
          setDocumentId(profile.document_id || "");
          setWhatsapp(profile.whatsapp || "");
          setCompanyName(profile.company_name || "");
          setCompanyDocument(profile.company_document || "");
          setAvatarUrl(profile.avatar_url);
          setUserRole(profile.role);
          
          setSyncStatus('success');
          toast.success("Dados carregados com sucesso!");
        } else {
          setSyncStatus('error');
          toast.error("Não foi possível carregar os dados do perfil");
        }
      } catch (profileError: any) {
        console.error("❌ Erro específico ao carregar perfil:", profileError);
        setSyncStatus('error');
        
        // Se for erro de recursão infinita, pausar completamente
        if (profileError.code === '42P17' || profileError.message?.includes('infinite recursion')) {
          toast.error("Sistema pausado devido a erro de configuração no banco. Contacte o suporte.");
          return;
        }
        
        toast.error("Erro ao carregar dados: " + profileError.message);
      }
      
    } catch (error: any) {
      console.error("❌ Erro geral ao carregar dados:", error);
      setSyncStatus('error');
      toast.error("Erro ao carregar dados: " + error.message);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  // Load profile data on mount with debounce protection
  useEffect(() => {
    if (user && !sessionLoading && !loadingRef.current) {
      // Debounce the load call
      const timeoutId = setTimeout(() => {
        loadUserData();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    } else if (!sessionLoading) {
      setLoading(false);
    }
  }, [user, sessionLoading]);

  // Manual re-sync with protection
  const handleResync = async () => {
    if (loadingRef.current) {
      toast.warning("Sincronização já em progresso");
      return;
    }
    
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
      
      // Update profile data including company fields
      await updateUserProfile(user.id, {
        full_name: fullName,
        document_id: documentId,
        whatsapp: whatsapp,
        company_name: companyName,
        company_document: companyDocument
      });
      
      toast.success("Perfil atualizado com sucesso!");
      console.log('[Profile Settings] ✅ Perfil salvo com sucesso');
      
      // Reload data to ensure consistency (with protection)
      if (!loadingRef.current) {
        await loadUserData();
      }
    } catch (error: any) {
      console.error("❌ Erro ao atualizar perfil:", error);
      toast.error(error.message || "Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  return {
    loading: loading || sessionLoading,
    saving,
    email,
    username,
    fullName,
    companyName,
    companyDocument,
    documentId,
    whatsapp,
    avatarUrl,
    userRole,
    user,
    syncStatus,
    setFullName,
    setCompanyName,
    setCompanyDocument,
    setDocumentId,
    setWhatsapp,
    handleEmailChange,
    handleSaveChanges,
    handleResync,
    handleChangePassword: () => handleChangePassword(email)
  };
};
