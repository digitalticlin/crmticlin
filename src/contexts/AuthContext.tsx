
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
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
  
  // Refs para controlar state e evitar múltiplas execuções
  const isInitialized = useRef(false);
  const authStateTimer = useRef<NodeJS.Timeout | null>(null);

  // Debounce para mudanças de estado de auth
  const debounceAuthChange = useCallback((event: string, newSession: Session | null) => {
    if (authStateTimer.current) {
      clearTimeout(authStateTimer.current);
    }
    
    authStateTimer.current = setTimeout(() => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      // Só navegar se já estiver inicializado e for um evento relevante
      if (isInitialized.current) {
        if (event === 'SIGNED_OUT') {
          navigate("/", { replace: true });
        } else if (event === 'SIGNED_IN' && window.location.pathname === '/') {
          navigate("/dashboard", { replace: true });
        }
      }
    }, 100);
  }, [navigate]);

  useEffect(() => {
    let mounted = true;
    
    // Configurar listener de autenticação PRIMEIRO
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      debounceAuthChange(event, session);
    });

    // ENTÃO verificar se já existe uma sessão
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.warn("Erro ao obter sessão:", error);
          setSession(null);
          setUser(null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.warn("Erro na inicialização de auth:", error);
        setSession(null);
        setUser(null);
      } finally {
        if (mounted) {
          setLoading(false);
          isInitialized.current = true;
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (authStateTimer.current) {
        clearTimeout(authStateTimer.current);
      }
    };
  }, []); // Remover navigate das dependências

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }
      
      // A navegação será feita pelo listener de auth state
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
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
      
      // A navegação será feita pelo listener de auth state
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
