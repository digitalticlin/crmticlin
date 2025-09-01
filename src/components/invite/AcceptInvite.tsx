import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

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
  const { toast } = useToast();
  
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

      // 2. Atualizar perfil linkando ao usuário Auth
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          linked_auth_user_id: authData.user.id,
          invite_status: 'accepted',
          temp_password: null, // Remover senha temporária
        })
        .eq('id', inviteData.id);

      if (updateError) {
        console.error('[AcceptInvite] Erro ao atualizar perfil:', updateError);
        toast.error('Erro ao finalizar convite');
        return;
      }

      console.log('[AcceptInvite] ✅ Convite aceito com sucesso');
      toast.success('Conta criada com sucesso! Faça login para continuar.');
      
      // Redirecionar para login
      navigate('/login', { 
        state: { 
          message: 'Conta criada! Use suas credenciais para fazer login.',
          email: inviteData.email 
        } 
      });

    } catch (error) {
      console.error('[AcceptInvite] Erro inesperado:', error);
      toast.error('Erro inesperado ao aceitar convite');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-center text-gray-600 mt-4">Carregando convite...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!inviteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Convite Inválido</h2>
            <p className="text-gray-600">Este convite não foi encontrado ou já expirou.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <CardTitle className="text-2xl font-bold text-gray-900">
            Aceitar Convite
          </CardTitle>
          <p className="text-gray-600">
            Olá <strong>{inviteData.full_name}</strong>, você foi convidado para se juntar à equipe!
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={inviteData.email}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Função</Label>
            <Input
              id="role"
              value={inviteData.role === 'admin' ? 'Administrador' : 
                     inviteData.role === 'manager' ? 'Gerente' : 'Operacional'}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha *</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite sua nova senha"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua nova senha"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            onClick={acceptInvite}
            disabled={accepting}
            className="w-full"
          >
            {accepting ? 'Aceitando convite...' : 'Aceitar Convite e Criar Conta'}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Ao aceitar o convite, você concorda em fazer parte da equipe com a função de{' '}
            <strong>{inviteData.role === 'admin' ? 'Administrador' : 
                     inviteData.role === 'manager' ? 'Gerente' : 'Operacional'}</strong>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}