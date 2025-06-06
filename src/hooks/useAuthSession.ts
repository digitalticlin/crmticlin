
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateUsername } from "@/utils/userUtils";

export const useAuthSession = () => {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [user, setUser] = useState<any>(null);
  const loadingRef = useRef(false);

  /**
   * Load current session and user data with anti-loop protection
   */
  const loadSession = async () => {
    if (loadingRef.current) {
      console.log('[Auth Session] ⚠️ Load session já em progresso');
      return user;
    }

    try {
      loadingRef.current = true;
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
    } finally {
      loadingRef.current = false;
    }
  };

  // Load session on mount with debounce
  useEffect(() => {
    if (!loadingRef.current) {
      const timeoutId = setTimeout(() => {
        loadSession();
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }
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
