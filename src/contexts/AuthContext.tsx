
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    // Configurar listener de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      console.log("Auth state change:", event, !!session);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      // Evitar redirecionamentos em loop - só redirecionar em eventos específicos
      if (event === 'SIGNED_OUT') {
        // Só redirecionar se não estiver já na página inicial
        if (location.pathname !== "/") {
          navigate("/", { replace: true });
        }
      } else if (event === 'SIGNED_IN' && location.pathname === "/") {
        // Só redirecionar para dashboard se estiver na página de login
        navigate("/dashboard", { replace: true });
      }
      
      // Definir loading como false após qualquer mudança de estado
      setLoading(false);
    });

    // Verificar sessão existente apenas uma vez
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      console.log("Initial session check:", !!session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Remover navigate e location das dependências para evitar loops

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }
      
      // Não fazer navigate aqui - deixar o onAuthStateChange gerenciar
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      // Certifique-se de que userData não contém nenhum campo company_id vazio
      if (userData.company_id === "") {
        delete userData.company_id;
      }
      
      // Definindo o papel de usuário como "admin" por padrão para todos os novos registros
      userData.role = "admin";
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: `${window.location.origin}/confirm-email`,
        },
      });
      
      if (error) {
        throw error;
      }
      
      navigate("/confirm-email-instructions");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta");
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      // Não fazer navigate aqui - deixar o onAuthStateChange gerenciar
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer logout");
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        throw error;
      }
      
      toast.success("Email de recuperação enviado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar email de recuperação");
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  
  return context;
}
