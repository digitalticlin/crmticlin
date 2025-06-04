
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
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
  
  // Guards anti-loop
  const lastNavigationRef = useRef<string>("");
  const navigationCountRef = useRef<number>(0);
  const lastAuthEventRef = useRef<string>("");
  const isNavigatingRef = useRef<boolean>(false);

  // Reset navigation counter após um tempo
  useEffect(() => {
    const resetTimer = setTimeout(() => {
      navigationCountRef.current = 0;
    }, 5000);
    
    return () => clearTimeout(resetTimer);
  }, [location.pathname]);

  // Função segura de navegação com proteção anti-loop
  const safeNavigate = (path: string, reason: string) => {
    // Verificar se já estamos no destino
    if (location.pathname === path) {
      console.log(`[Auth] Already at ${path}, skipping navigation`);
      return;
    }

    // Verificar se estamos navegando muito rapidamente
    if (isNavigatingRef.current) {
      console.log(`[Auth] Navigation already in progress, skipping`);
      return;
    }

    // Verificar contador de navegação
    if (navigationCountRef.current > 3) {
      console.error(`[Auth] Too many navigations, possible loop detected. Stopping.`);
      return;
    }

    // Verificar se é o mesmo destino da última navegação
    if (lastNavigationRef.current === path) {
      navigationCountRef.current++;
      if (navigationCountRef.current > 2) {
        console.error(`[Auth] Loop detected for path ${path}, stopping navigation`);
        return;
      }
    } else {
      navigationCountRef.current = 1;
    }

    console.log(`[Auth] Safe navigation to ${path} - Reason: ${reason}`);
    lastNavigationRef.current = path;
    isNavigatingRef.current = true;
    
    // Navegar com timeout para evitar loops síncronos
    setTimeout(() => {
      try {
        navigate(path);
      } catch (error) {
        console.error(`[Auth] Navigation error:`, error);
      } finally {
        isNavigatingRef.current = false;
      }
    }, 50);
  };

  useEffect(() => {
    let isMounted = true;
    
    console.log("[Auth] Setting up auth state listener");
    
    // Configurar listener de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      // Evitar processar o mesmo evento consecutivamente
      const eventKey = `${event}-${session?.user?.id || 'null'}`;
      if (lastAuthEventRef.current === eventKey) {
        console.log(`[Auth] Duplicate event ignored: ${event}`);
        return;
      }
      lastAuthEventRef.current = eventKey;
      
      console.log(`[Auth] Auth event: ${event}`, { userId: session?.user?.id, path: location.pathname });
      
      setSession(session);
      setUser(session?.user ?? null);
      
      // Gerenciar navegação baseado no evento
      if (event === 'SIGNED_OUT') {
        // Apenas redirecionar se não estivermos já na página de login
        if (location.pathname !== '/') {
          safeNavigate('/', 'user signed out');
        }
      } else if (event === 'SIGNED_IN' && session?.user) {
        // Apenas redirecionar se estivermos na página de login
        if (location.pathname === '/' || location.pathname === '/register') {
          safeNavigate('/dashboard', 'user signed in');
        }
      } else if (event === 'TOKEN_REFRESHED') {
        // Token renovado, não fazer navegação
        console.log('[Auth] Token refreshed successfully');
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
      
      // Navegação inicial baseada no estado da sessão
      if (session?.user) {
        // Usuário logado, garantir que não está em páginas de auth
        if (location.pathname === '/' || location.pathname === '/register') {
          safeNavigate('/dashboard', 'initial auth check - user logged in');
        }
      } else {
        // Usuário não logado, garantir que não está em páginas protegidas
        const protectedPaths = ['/dashboard', '/chat', '/whatsapp-chat', '/sales-funnel', '/settings', '/clients', '/team', '/plans', '/automation', '/ai-agents', '/integration', '/global-admin', '/vps-diagnostic'];
        if (protectedPaths.includes(location.pathname)) {
          safeNavigate('/', 'initial auth check - user not logged in');
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [location.pathname]); // Dependência do pathname para reagir a mudanças de rota

  const signIn = async (email: string, password: string) => {
    try {
      console.log("[Auth] Attempting sign in");
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }
      
      // A navegação será feita pelo listener onAuthStateChange
      console.log("[Auth] Sign in successful, waiting for auth state change");
    } catch (error: any) {
      console.error("[Auth] Sign in error:", error);
      toast.error(error.message || "Erro ao fazer login");
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      console.log("[Auth] Attempting sign up");
      
      // Certificar que userData não contém nenhum campo company_id vazio
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
      
      safeNavigate('/confirm-email-instructions', 'sign up successful');
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
      
      // A navegação será feita pelo listener onAuthStateChange
      console.log("[Auth] Sign out successful, waiting for auth state change");
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
