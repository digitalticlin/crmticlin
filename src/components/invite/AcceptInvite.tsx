import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BackgroundGradient } from '@/components/ui/BackgroundGradient';
import { toast } from 'sonner';
import { Eye, EyeOff, CheckCircle, AlertCircle, UserPlus } from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (token) {
      loadInviteData();
    }
  }, [token]);

  const loadInviteData = async () => {
    try {
      console.log('[AcceptInvite] Carregando dados do convite:', token);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_by_user_id, invite_status, temp_password')
        .eq('invite_token', token)
        .single();

      if (error || !data) {
        console.error('[AcceptInvite] Erro ao carregar convite:', error);
        toast.error('Convite inválido ou expirado');
        return;
      }

      if (data.invite_status === 'accepted') {
        console.log('[AcceptInvite] Convite já foi aceito');
        toast.info('Este convite já foi aceito');
        navigate('/login');
        return;
      }

      setInviteData(data);
      console.log('[AcceptInvite] Dados do convite carregados:', data.full_name);
    } catch (error) {
      console.error('[AcceptInvite] Erro inesperado:', error);
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
      console.log('[AcceptInvite] Criando usuário no Auth...');
      
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: inviteData.email,
        password: newPassword,
        options: {
          data: {
            full_name: inviteData.full_name,
            role: inviteData.role,
            invite_accepted: true
          }
        }
      });

      if (authError || !authData.user) {
        console.error('[AcceptInvite] Erro ao criar usuário:', authError);
        toast.error('Erro ao criar conta: ' + (authError?.message || 'Falha desconhecida'));
        return;
      }

      console.log('[AcceptInvite] Usuário criado com sucesso:', authData.user.id);

      // 2. Usar função segura para aceitar convite
      console.log('[AcceptInvite] Aceitando convite de forma segura...');
      
      const { data: acceptResult, error: acceptError } = await supabase.rpc(
        'accept_team_invite_safely',
        {
          p_invite_token: token,
          p_auth_user_id: authData.user.id
        }
      );

      console.log('[AcceptInvite] 🔍 Resultado da função accept_team_invite_safely:');
      console.log('[AcceptInvite] acceptError:', acceptError);
      console.log('[AcceptInvite] acceptResult:', acceptResult);
      
      if (acceptError) {
        console.error('[AcceptInvite] ❌ Erro técnico na RPC:', acceptError);
        toast.error(`Erro técnico: ${acceptError.message}`);
      } else if (!(acceptResult as any)?.success) {
        console.error('[AcceptInvite] ❌ Erro lógico na vinculação:', acceptResult);
        toast.error((acceptResult as any)?.error || 'Erro ao vincular conta ao convite');
        
        // Rollback: deletar usuário criado no Auth se falhar
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
        } catch (rollbackError) {
          console.error('[AcceptInvite] Erro no rollback:', rollbackError);
        }
        return;
      }

      console.log('[AcceptInvite] ✅ Convite aceito com segurança:', acceptResult);

      // Mostrar resumo dos acessos atribuídos
      const accessSummary = [];
      if ((acceptResult as any).assigned_funnels > 0) {
        accessSummary.push(`${(acceptResult as any).assigned_funnels} funil(is)`);
      }
      if ((acceptResult as any).assigned_whatsapp > 0) {
        accessSummary.push(`${(acceptResult as any).assigned_whatsapp} instância(s) WhatsApp`);
      }
      
      const accessMessage = accessSummary.length > 0 
        ? ` Você tem acesso a: ${accessSummary.join(' e ')}.`
        : '';
      
      console.log('[AcceptInvite] ✅ Convite aceito com sucesso');
      toast.success(`Conta criada com sucesso!${accessMessage}`);
      
      // NÃO fazer login automático - redirecionar para tela de login
      console.log('[AcceptInvite] ✅ Redirecionando para login (SEM auto-login)');
      toast.success('Conta criada! Faça login com suas credenciais.', {
        duration: 3000
      });
      
      // Redirecionar para login com as credenciais preenchidas
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: `Conta criada com sucesso!${accessMessage} Use suas credenciais para fazer login.`,
            email: inviteData.email 
          } 
        });
      }, 2000);

    } catch (error) {
      console.error('[AcceptInvite] Erro inesperado:', error);
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
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
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
              <UserPlus className="h-8 w-8 text-yellow-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Aceitar Convite</h1>
            <p className="text-gray-700 font-medium">
              Olá <strong>{inviteData.full_name}</strong>, você foi convidado para se juntar à equipe!
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-800 font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={inviteData.email}
                disabled
                className="bg-white/60 backdrop-blur-sm border-white/40 text-gray-800 font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-gray-800 font-medium">Função</Label>
              <Input
                id="role"
                value={inviteData.role === 'admin' ? 'Administrador' : 
                       inviteData.role === 'manager' ? 'Gerente' : 'Operacional'}
                disabled
                className="bg-white/60 backdrop-blur-sm border-white/40 text-gray-800 font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-gray-800 font-medium">Nova Senha *</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                  required
                  className="bg-white/60 backdrop-blur-sm border-white/40 text-gray-800 font-medium pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-800 font-medium">Confirmar Senha *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme sua nova senha"
                  required
                  className="bg-white/60 backdrop-blur-sm border-white/40 text-gray-800 font-medium pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              onClick={acceptInvite}
              disabled={accepting}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {accepting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                  <span>Aceitando convite...</span>
                </div>
              ) : (
                'Aceitar Convite e Criar Conta'
              )}
            </Button>

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