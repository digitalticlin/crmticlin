
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ requiresPayment: boolean; userId?: string; plan?: string }>;
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
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('[Auth] 🔄 Configurando auth...');

    // Primeiro, verificar se já existe uma sessão ativa
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[Auth] ❌ Erro ao obter sessão:', error);
        } else {
          console.log('[Auth] 🔍 Sessão inicial:', session?.user?.email || 'Nenhuma');
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('[Auth] ❌ Erro ao verificar sessão inicial:', error);
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[Auth] 📡', event, session?.user?.email);

        // Ignorar eventos TOKEN_REFRESHED para evitar loops
        if (event === 'TOKEN_REFRESHED') {
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        setIsInitialized(true);

        // 🎯 CHAVE: Só redirecionar em SIGNED_IN/SIGNED_OUT, nunca em INITIAL_SESSION
        if (event === 'SIGNED_IN' && window.location.pathname.includes('/login')) {
          const from = (location.state as any)?.from?.pathname;
          const redirectTo = from && from !== '/login' && from !== '/register' ? from : '/dashboard';
          console.log('[Auth] ➡️ Redirecionando para:', redirectTo);
          navigate(redirectTo, { replace: true });
        } else if (event === 'SIGNED_OUT') {
          console.log('[Auth] ➡️ Logout - indo para login');
          navigate('/login', { replace: true });
        }
        // Para INITIAL_SESSION: não faz nada, mantém onde está
      }
    );

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

      const selectedPlan = userData?.selected_plan;

      if (data.user && !data.session) {
        console.log('[Auth] Confirmação de email necessária');

        if (selectedPlan === 'free_200') {
          toast.success('Conta criada! Verifique seu email para confirmar e ativar o plano gratuito.');
          localStorage.setItem('pending_plan', selectedPlan);

          setTimeout(() => {
            navigate('/confirm-email', { replace: true });
          }, 2000);

        } else if (selectedPlan === 'pro_5k' || selectedPlan === 'ultra_15k') {
          toast.success('Redirecionando para pagamento...');
          localStorage.setItem('pending_plan', selectedPlan);
          localStorage.setItem('pending_user_id', data.user.id);

          return { requiresPayment: true, userId: data.user.id, plan: selectedPlan };
        } else {
          toast.success('Conta criada! Verifique seu email para confirmar.');
          setTimeout(() => {
            navigate('/confirm-email', { replace: true });
          }, 2000);
        }

      } else if (data.session) {
        console.log('[Auth] Usuário logado automaticamente após registro');

        if (selectedPlan === 'free_200') {
          console.log('[Auth] Ativando trial gratuito...');
          toast.success('Conta criada! Ativando plano gratuito...');

          setTimeout(() => {
            navigate('/confirm-email', { replace: true });
          }, 2000);

        } else if (selectedPlan === 'pro_5k' || selectedPlan === 'ultra_15k') {
          toast.success('Conta criada! Redirecionando para pagamento...');

          return { requiresPayment: true, userId: data.user.id, plan: selectedPlan };

        } else {
          toast.success('Conta criada com sucesso!');
        }
      }

      return { requiresPayment: false };

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
