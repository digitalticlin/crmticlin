
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useProfileSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Função para extrair o nome de usuário do email
  const generateUsername = (email: string) => {
    return email.split("@")[0];
  };

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
        
        // Buscar os dados do perfil do usuário
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          console.error("Erro ao carregar perfil:", error);
          toast.error("Não foi possível carregar os dados do perfil");
        } else if (profile) {
          setFullName(profile.full_name || "");
          setDocumentId(profile.document_id || "");
          setWhatsapp(profile.whatsapp || "");
          setAvatarUrl(profile.avatar_url);
          
          // Buscar dados da empresa do usuário
          if (profile.company_id) {
            setCompanyId(profile.company_id);
            const { data: company } = await supabase
              .from('companies')
              .select('name')
              .eq('id', profile.company_id)
              .single();
              
            if (company) {
              setCompanyName(company.name);
            }
          }
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
    
    try {
      setSaving(true);
      
      // Atualizar o perfil do usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          document_id: documentId,
          whatsapp: whatsapp,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (profileError) {
        throw profileError;
      }

      // Se tiver companyId, atualiza o nome da empresa
      if (companyId) {
        const { error: companyError } = await supabase
          .from('companies')
          .update({
            name: companyName,
            updated_at: new Date().toISOString()
          })
          .eq('id', companyId);

        if (companyError) {
          throw companyError;
        }
      }
      
      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error(error.message || "Não foi possível atualizar o perfil");
    } finally {
      setSaving(false);
    }
  };

  // Função para lidar com alteração de senha
  const handleChangePassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        throw error;
      }
      
      toast.success("Email para redefinição de senha enviado!");
    } catch (error: any) {
      console.error("Erro ao solicitar redefinição de senha:", error);
      toast.error(error.message || "Não foi possível solicitar redefinição de senha");
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
    handleChangePassword
  };
};
