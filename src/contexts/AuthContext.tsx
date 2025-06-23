
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
    let isMounted = true;
    
    console.log("[Auth] Setting up auth state listener");
    
    // Configurar listener de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      console.log(`[Auth] Auth event: ${event}`, { userId: session?.user?.id, path: location.pathname });
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Navegação simples baseada no estado
      if (event === 'SIGNED_OUT') {
        if (location.pathname !== '/login') {
          navigate('/login', { replace: true });
        }
      } else if (event === 'SIGNED_IN' && session?.user) {
        if (location.pathname === '/login' || location.pathname === '/register') {
          navigate('/dashboard', { replace: true });
        }
      }
    });

    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return;
      
      if (error) {
        console.error('[Auth] Error getting session:', error);
      }
      
      console.log('[Auth] Initial session check', { 
        hasSession: !!session, 
        userId: session?.user?.id,
        path: location.pathname 
      });
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log("[Auth] Attempting sign in");
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }
      
      console.log("[Auth] Sign in successful");
    } catch (error: any) {
      console.error("[Auth] Sign in error:", error);
      toast.error(error.message || "Erro ao fazer login");
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      console.log("[Auth] Attempting sign up");
      
      if (userData.company_id === "") {
        delete userData.company_id;
      }
      
      userData.role = "admin";
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      
      if (error) {
        throw error;
      }
      
      toast.success("Conta criada com sucesso! Verifique seu email.");
    } catch (error: any) {
      console.error("[Auth] Sign up error:", error);
      toast.error(error.message || "Erro ao criar conta");
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log("[Auth] Attempting sign out");
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      console.log("[Auth] Sign out successful");
    } catch (error: any) {
      console.error("[Auth] Sign out error:", error);
      toast.error(error.message || "Erro ao fazer logout");
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log("[Auth] Attempting password reset");
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        throw error;
      }
      
      toast.success("Email de recuperação enviado com sucesso!");
    } catch (error: any) {
      console.error("[Auth] Password reset error:", error);
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
