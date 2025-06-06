
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateUsername } from "@/utils/userUtils";
import { useAuthActions } from "./useAuthActions";

export const useProfileSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [user, setUser] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  
  // Profile data state
  const [fullName, setFullName] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // Simplified company data (no longer linked to database)
  const [companyName, setCompanyName] = useState("");
  const [companyDocument, setCompanyDocument] = useState("");

  const { handleChangePassword } = useAuthActions();

  /**
   * Load user profile data from Supabase
   */
  const loadUserData = async () => {
    try {
      setSyncStatus('syncing');
      console.log('[Profile Settings] 🚀 Carregando dados do perfil...');
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[Profile Settings] ❌ Erro ao obter sessão:', sessionError);
        setSyncStatus('error');
        toast.error("Erro de autenticação");
        setLoading(false);
        return;
      }
      
      if (!session?.user) {
        console.log('[Profile Settings] ❌ Usuário não autenticado');
        setLoading(false);
        setSyncStatus('error');
        return;
      }

      console.log('[Profile Settings] 👤 Usuário autenticado:', session.user.email);
      
      setUser(session.user);
      setEmail(session.user.email || "");
      setUsername(generateUsername(session.user.email || ""));
      
      // Load profile data using the new RLS policies
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error("❌ Erro ao carregar perfil:", profileError);
        setSyncStatus('error');
        toast.error("Erro ao carregar dados do perfil: " + profileError.message);
        return;
      }
      
      if (profile) {
        console.log('[Profile Settings] ✅ Perfil carregado:', profile.full_name);
        
        setFullName(profile.full_name || "");
        setDocumentId(profile.document_id || "");
        setWhatsapp(profile.whatsapp || "");
        setAvatarUrl(profile.avatar_url);
        setUserRole(profile.role);
        
        setSyncStatus('success');
        toast.success("Dados carregados com sucesso!");
      } else {
        console.log('[Profile Settings] ⚠️ Perfil não encontrado, criando...');
        
        // Try to create a basic profile if it doesn't exist
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            full_name: session.user.user_metadata?.full_name || '',
            document_id: '',
            whatsapp: ''
          });
          
        if (createError) {
          console.error("❌ Erro ao criar perfil:", createError);
          setSyncStatus('error');
          toast.error("Erro ao criar perfil: " + createError.message);
        } else {
          console.log('[Profile Settings] ✅ Perfil criado com sucesso');
          setSyncStatus('success');
          toast.success("Perfil criado com sucesso!");
        }
      }
      
    } catch (error: any) {
      console.error("❌ Erro ao carregar dados:", error);
      setSyncStatus('error');
      toast.error("Erro ao carregar dados: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load profile data on mount
  useEffect(() => {
    loadUserData();
  }, []);

  // Update username when email changes
  useEffect(() => {
    const newUsername = generateUsername(email);
    setUsername(newUsername);
  }, [email]);

  // Handle email change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

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
      
      const updateData = {
        full_name: fullName,
        document_id: documentId,
        whatsapp: whatsapp,
        updated_at: new Date().toISOString()
      };
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);
        
      if (profileError) {
        throw new Error(`Erro ao atualizar perfil: ${profileError.message}`);
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
