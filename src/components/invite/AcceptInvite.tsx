import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BackgroundGradient } from '@/components/ui/BackgroundGradient';
import { toast } from 'sonner';

interface InviteData {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_by_user_id: string;
  invite_status: string;
  temp_password: string;
}

export function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  

  useEffect(() => {
    if (token) {
      loadInviteData();
    }
  }, [token]);

  const loadInviteData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_by_user_id, invite_status')
        .eq('invite_token', token)
        .single();

      if (error || !data) {
        toast.error('Convite inválido ou expirado');
        return;
      }

      if (data?.invite_status === 'accepted') {
        toast.info('Este convite já foi aceito');
        navigate('/login');
        return;
      }

      setInviteData(data as any);
    } catch (error) {
      toast.error('Erro ao carregar convite');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvite = async () => {
    if (!inviteData || !newPassword || !confirmPassword) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setAccepting(true);

    try {
      // Chamar edge function para aceitar convite
      const { data: acceptResult, error: acceptError } = await supabase.functions.invoke('accept_invite', {
        body: {
          invite_token: token,
          password: newPassword
        }
      });

      if (acceptError || !acceptResult?.success) {
        toast.error('Erro ao aceitar convite: ' + (acceptResult?.error || acceptError?.message));
        return;
      }

      // Login automático com os tokens retornados
      if (acceptResult.auth?.access_token && acceptResult.auth?.refresh_token) {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: acceptResult.auth.access_token,
          refresh_token: acceptResult.auth.refresh_token
        });

        if (sessionError) {
          toast.success('Conta criada com sucesso! Faça login manualmente.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        toast.success(`Bem-vindo(a) ${acceptResult.user.full_name}! Redirecionando...`);
        
        // Redirecionar para dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        // Fallback: redirecionar para login
        toast.success('Conta criada com sucesso! Faça login manualmente.');
        setTimeout(() => navigate('/login'), 2000);
      }

    } catch (error) {
      toast.error('Erro inesperado ao aceitar convite');
    } finally {
      setAccepting(false);
    }
  };
  
  if (loading) {
    return (
      <BackgroundGradient className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-200">
        <div className="w-full max-w-md relative z-10 animate-fade-in">
          <div className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-2xl p-8 transition-all duration-300 hover:bg-white/50">
            <div className="text-center">
              <div className="relative mx-auto w-12 h-12 mb-4">
                <div className="absolute inset-0 rounded-full border-2 border-yellow-500/30"></div>
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-yellow-500 animate-spin"></div>
              </div>
              <p className="text-sm text-gray-700 font-medium">Carregando convite...</p>
            </div>
          </div>
        </div>
      </BackgroundGradient>
    );
  }

  if (!inviteData) {
    return (
      <BackgroundGradient className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-200">
        <div className="w-full max-w-md relative z-10 animate-fade-in">
          <div className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-2xl p-8 transition-all duration-300 hover:bg-white/50">
            <div className="text-center">
              <div className="h-12 w-12 text-red-600 mx-auto mb-4">❌</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Convite Inválido</h2>
              <p className="text-gray-700 font-medium">Este convite não foi encontrado ou já expirou.</p>
            </div>
          </div>
        </div>
      </BackgroundGradient>
    );
  }

  return (
    <BackgroundGradient className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-200">
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-2xl p-8 transition-all duration-300 hover:bg-white/50">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="p-3 bg-white/30 backdrop-blur-sm rounded-xl border border-white/40 shadow-glass mx-auto w-fit mb-4">
              <div className="h-8 w-8 text-yellow-500">🎉</div>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Aceitar Convite</h1>
            <p className="text-gray-700 font-medium">
              Olá <strong>{inviteData.full_name}</strong>, você foi convidado para se juntar à equipe!
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-gray-800 font-medium">Email</label>
              <input
                id="email"
                type="email"
                value={inviteData.email}
                disabled
                className="w-full bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl px-4 py-3 text-gray-800 font-medium"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="role" className="text-gray-800 font-medium">Função</label>
              <input
                id="role"
                value={inviteData.role === 'admin' ? 'Administrador' : 
                       inviteData.role === 'manager' ? 'Gerente' : 'Operacional'}
                disabled
                className="w-full bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl px-4 py-3 text-gray-800 font-medium"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-gray-800 font-medium">Nova Senha *</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite sua nova senha"
                required
                className="w-full bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl px-4 py-3 text-gray-800 font-medium"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-gray-800 font-medium">Confirmar Senha *</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua nova senha"
                required
                className="w-full bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl px-4 py-3 text-gray-800 font-medium"
              />
            </div>

            <button
              onClick={acceptInvite}
              disabled={accepting || !newPassword || !confirmPassword}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
              type="button"
            >
              {accepting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                  <span>Aceitando convite...</span>
                </div>
              ) : (
                'Aceitar Convite e Criar Conta'
              )}
            </button>

            <p className="text-xs text-gray-600 text-center font-medium leading-relaxed">
              Ao aceitar o convite, você concorda em fazer parte da equipe com a função de{' '}
              <span className="font-bold text-gray-800">
                {inviteData.role === 'admin' ? 'Administrador' : 
                 inviteData.role === 'manager' ? 'Gerente' : 'Operacional'}
              </span>.
            </p>
          </div>
        </div>
      </div>
    </BackgroundGradient>
  );
}