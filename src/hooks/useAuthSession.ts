
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateUsername } from "@/utils/userUtils";

export const useAuthSession = () => {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [user, setUser] = useState<any>(null);

  /**
   * Load current session and user data
   */
  const loadSession = async () => {
    try {
      console.log('[Auth Session] 🚀 Carregando sessão...');
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[Auth Session] ❌ Erro ao obter sessão:', sessionError);
        toast.error("Erro de autenticação");
        setLoading(false);
        return null;
      }
      
      if (!session?.user) {
        console.log('[Auth Session] ❌ Usuário não autenticado');
        setLoading(false);
        return null;
      }

      console.log('[Auth Session] 👤 Usuário autenticado:', session.user.email);
      
      setUser(session.user);
      setEmail(session.user.email || "");
      setUsername(generateUsername(session.user.email || ""));
      setLoading(false);
      
      return session.user;
      
    } catch (error: any) {
      console.error("❌ Erro ao carregar sessão:", error);
      toast.error("Erro ao carregar sessão: " + error.message);
      setLoading(false);
      return null;
    }
  };

  // Load session on mount
  useEffect(() => {
    loadSession();
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

  return {
    loading,
    email,
    username,
    user,
    handleEmailChange,
    loadSession
  };
};
