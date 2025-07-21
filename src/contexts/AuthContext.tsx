
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData?: any) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Alias para manter compatibilidade
export const useAuthContext = useAuth;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for auth changes first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[Auth] Estado mudou:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Redirect on successful authentication ONLY for actual login, not page refresh
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('[Auth] Usuário logado, verificando se precisa redirecionar...');
          
          // 🚀 CORREÇÃO: Só redirecionar se estivermos em página de auth ou raiz
          const currentPath = window.location.pathname;
          const isAuthPage = currentPath === '/login' || currentPath === '/register' || currentPath === '/';
          
          if (isAuthPage) {
            console.log('[Auth] Redirecionando para dashboard - estava em página de auth');
            navigate('/dashboard', { replace: true });
          } else {
            console.log('[Auth] Usuário já estava em página protegida, mantendo localização:', currentPath);
            // Não redirecionar - usuário pode estar trabalhando em outra página
          }
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[Auth] Sessão inicial:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('[Auth] Tentando fazer login...');
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('[Auth] Erro no login:', error);
        if (error.message.includes('Email not confirmed')) {
          toast.error('Por favor, confirme seu email antes de fazer login.');
        } else if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos.');
        } else {
          toast.error(error.message);
        }
        throw error;
      }
      
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      console.error('Erro no login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      setLoading(true);
      console.log('[Auth] Criando conta para:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) {
        console.error('[Auth] Erro no registro:', error);
        if (error.message.includes('User already registered')) {
          toast.error('Este email já está registrado. Tente fazer login.');
        } else if (error.message.includes('Password should be at least')) {
          toast.error('A senha deve ter pelo menos 6 caracteres.');
        } else {
          toast.error(error.message);
        }
        throw error;
      }

      console.log('[Auth] Registro bem-sucedido:', data);
      
      // Check if email confirmation is required
      if (data.user && !data.session) {
        // Email confirmation required
        console.log('[Auth] Confirmação de email necessária');
        toast.success('Conta criada! Verifique seu email para confirmar e depois faça login.');
        // Redirect to login page after showing success message
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      } else if (data.session) {
        // User is automatically logged in
        console.log('[Auth] Usuário logado automaticamente após registro');
        toast.success('Conta criada e login realizado com sucesso!');
        // Redirect will happen via onAuthStateChange
      }
      
    } catch (error: any) {
      console.error('Erro no registro:', error);
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
        toast.error(error.message);
        throw error;
      }
      toast.success('Logout realizado com sucesso!');
      navigate('/', { replace: true });
    } catch (error: any) {
      console.error('Erro no logout:', error);
      throw error;
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
        toast.error(error.message);
        throw error;
      }
      
      toast.success('Email de recuperação enviado!');
    } catch (error: any) {
      console.error('Erro ao enviar email de recuperação:', error);
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
