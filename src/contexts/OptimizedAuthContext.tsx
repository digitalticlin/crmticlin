
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
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

export function OptimizedAuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Refs para controle de estado e cleanup
  const mountedRef = useRef(true);
  const authSubscriptionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce para atualizações de estado
  const debouncedUpdateAuth = useCallback((newSession: Session | null) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      
      console.log("OptimizedAuthProvider - updateAuthState:", !!newSession);
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    }, 100);
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const initializeAuth = async () => {
      try {
        console.log("OptimizedAuthProvider - inicializando autenticação");
        
        // Timeout para evitar loading infinito
        const initTimeout = setTimeout(() => {
          if (mountedRef.current) {
            console.warn("OptimizedAuthProvider - timeout na inicialização");
            debouncedUpdateAuth(null);
          }
        }, 3000);

        const { data: { session }, error } = await supabase.auth.getSession();
        
        clearTimeout(initTimeout);
        
        if (error) {
          console.error("Erro ao obter sessão:", error);
          debouncedUpdateAuth(null);
          return;
        }
        
        debouncedUpdateAuth(session);
      } catch (error) {
        console.error("Erro na inicialização da auth:", error);
        debouncedUpdateAuth(null);
      }
    };

    // Configurar listener apenas uma vez
    authSubscriptionRef.current = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return;
      
      console.log("OptimizedAuthProvider - auth state change:", event, !!session);
      debouncedUpdateAuth(session);
    });

    initializeAuth();

    return () => {
      mountedRef.current = false;
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      if (authSubscriptionRef.current) {
        authSubscriptionRef.current.data?.subscription?.unsubscribe();
      }
    };
  }, [debouncedUpdateAuth]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
      throw error;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, userData: any) => {
    try {
      setLoading(true);
      
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
      
      if (error) throw error;
      
      window.location.href = "/confirm-email-instructions";
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta");
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      window.location.href = "/";
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer logout");
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      toast.success("Email de recuperação enviado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar email de recuperação");
      throw error;
    }
  }, []);

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

export function useOptimizedAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useOptimizedAuth deve ser usado dentro de um OptimizedAuthProvider");
  }
  
  return context;
}
