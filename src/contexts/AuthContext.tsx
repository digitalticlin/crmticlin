
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
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

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    // Função para atualizar estado de forma segura
    const updateAuthState = (newSession: Session | null) => {
      if (!mounted) return;
      
      console.log("AuthProvider - updateAuthState:", !!newSession);
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    };

    // Verificação inicial da sessão
    const initializeAuth = async () => {
      try {
        console.log("AuthProvider - inicializando autenticação");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Erro ao obter sessão:", error);
        }
        
        updateAuthState(session);
      } catch (error) {
        console.error("Erro na inicialização da auth:", error);
        updateAuthState(null);
      }
    };

    // Configurar listener de mudanças de autenticação
    const setupAuthListener = () => {
      authSubscription = supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted) return;

        console.log("AuthProvider - auth state change:", event, !!session);
        updateAuthState(session);
      });
    };

    // Inicializar
    initializeAuth();
    setupAuthListener();

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.data.subscription.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }
      
      // AuthStateChange vai gerenciar o estado
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      setLoading(true);
      
      // Limpar campos vazios
      if (userData.company_id === "") {
        delete userData.company_id;
      }
      
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
      
      // Redirecionar para instruções de confirmação
      window.location.href = "/confirm-email-instructions";
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      // Redirecionamento manual após logout
      window.location.href = "/";
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer logout");
    } finally {
      setLoading(false);
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
