import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Query Keys isolados para useTeamInvites
const TEAM_INVITES_KEYS = {
  list: (companyId: string | null) => ['teamMembers', companyId] as const,
  invites: (companyId: string | null) => ['teamInvites', companyId] as const,
  inviteStatus: (memberId: string) => ['inviteStatus', memberId] as const,
} as const;

/**
 * Hook isolado para gerenciar convites de equipe
 * Responsabilidades:
 * - Reenviar convites
 * - Cancelar convites pendentes
 * - Verificar status de convites
 */
export const useTeamInvites = (companyId: string | null) => {
  const queryClient = useQueryClient();

  // Mutation para reenviar convite
  const resendInvite = useMutation({
    mutationFn: async (memberId: string) => {
      console.log('[useTeamInvites] 📧 Reenviando convite para membro:', memberId);
      
      if (!companyId) {
        throw new Error('Company ID é obrigatório');
      }

      // Buscar dados do membro
      const { data: member, error: fetchError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          username, 
          email,
          role,
          whatsapp,
          invite_status
        `)
        .eq('id', memberId)
        .single();

      if (fetchError || !member) {
        console.error('[useTeamInvites] ❌ Erro ao buscar dados do membro:', fetchError);
        throw new Error('Membro não encontrado');
      }

      console.log('[useTeamInvites] 👤 Dados do membro encontrado:', member);

      // Validar status do convite
      if (member.invite_status === 'accepted') {
        console.warn('[useTeamInvites] ⚠️ Tentativa de reenviar convite para membro já aceito');
        throw new Error('Este membro já aceitou o convite');
      }

      // Get member access data
      const { data: whatsappAccess } = await supabase
        .from('user_whatsapp_numbers')
        .select('whatsapp_number_id')
        .eq('profile_id', memberId);

      const { data: funnelAccess } = await supabase
        .from('user_funnels')  
        .select('funnel_id')
        .eq('profile_id', memberId);

      console.log('[useTeamInvites] 🔍 Acessos do membro:');
      console.log('[useTeamInvites]   WhatsApp:', whatsappAccess?.map(wa => wa.whatsapp_number_id));
      console.log('[useTeamInvites]   Funis:', funnelAccess?.map(fa => fa.funnel_id));

      // Gerar novo token de convite
      const newInviteToken = crypto.randomUUID();
      const redirectUrl = `${window.location.origin}/invite/${newInviteToken}`;
      
      // Buscar nome da empresa para o template
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', companyId)
        .single();

      // Chamar edge function para reenvio
      console.log('[useTeamInvites] ⚡ Chamando edge function send_resend_invite...');
      const { data: resendResult, error: resendError } = await supabase.functions.invoke('send_resend_invite', {
        body: {
          email: member.email,
          profile_id: memberId,
          invite_token: newInviteToken,
          user_data: {
            full_name: member.full_name,
            role: member.role,
            company_name: adminProfile?.full_name || 'Equipe'
          },
          redirect_url: redirectUrl,
          is_resend: true
        }
      });

      if (resendError) {
        console.error('[useTeamInvites] ❌ Erro ao reenviar convite:', resendError);
        
        // Mensagens de erro específicas
        if (resendError.message.includes('RESEND_API_KEY')) {
          throw new Error('Configuração de email não encontrada. Contate o suporte.');
        }
        if (resendError.message.includes('rate limit')) {
          throw new Error('Muitos convites enviados. Aguarde alguns minutos.');
        }
        
        throw new Error(`Erro ao reenviar convite: ${resendError.message}`);
      }

      if (!resendResult?.success) {
        console.error('[useTeamInvites] ❌ Falha no reenvio:', resendResult);
        
        // Tratamento específico de erros da edge function
        if (resendResult?.error_code === 'email_exists') {
          throw new Error('Este email já está registrado no sistema');
        }
        if (resendResult?.error_code === 'profile_exists') {
          throw new Error('Já existe um perfil com este email');
        }
        
        throw new Error(resendResult?.error || 'Erro desconhecido ao reenviar convite');
      }

      console.log('[useTeamInvites] ✅ Convite reenviado com sucesso:', resendResult);

      // Atualizar o token no perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          invite_token: newInviteToken,
          invite_sent_at: new Date().toISOString(),
          invite_status: 'invite_sent' // Status correto para reenvio
        })
        .eq('id', memberId);

      if (updateError) {
        console.error('[useTeamInvites] ❌ Erro ao atualizar token no perfil:', updateError);
        // Não lançar erro aqui pois o email já foi enviado
      }

      return { 
        success: true,
        memberName: member.full_name,
        memberId: memberId 
      };
    },
    onSuccess: (data) => {
      console.log('[useTeamInvites] ✅ Convite reenviado com sucesso');
      queryClient.invalidateQueries({ queryKey: TEAM_INVITES_KEYS.list(companyId) });
      queryClient.invalidateQueries({ queryKey: TEAM_INVITES_KEYS.inviteStatus(data.memberId) });
      toast.success(`✅ Convite reenviado para ${data.memberName}!`);
    },
    onError: (error: any) => {
      console.error('[useTeamInvites] ❌ Erro ao reenviar convite:', error);
      toast.error(error.message || 'Erro ao reenviar convite');
    }
  });

  // Mutation para cancelar convite
  const cancelInvite = useMutation({
    mutationFn: async (memberId: string) => {
      console.log('[useTeamInvites] 🚫 Cancelando convite para membro:', memberId);
      
      // Verificar se o membro existe e tem convite pendente
      const { data: member, error: fetchError } = await supabase
        .from('profiles')
        .select('id, full_name, invite_status')
        .eq('id', memberId)
        .single();

      if (fetchError || !member) {
        throw new Error('Membro não encontrado');
      }

      if (member.invite_status === 'accepted') {
        throw new Error('Este convite já foi aceito e não pode ser cancelado');
      }

      // Limpar o token e atualizar status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          invite_token: null,
          invite_status: 'cancelled',
          invite_sent_at: null
        })
        .eq('id', memberId);

      if (updateError) {
        console.error('[useTeamInvites] ❌ Erro ao cancelar convite:', updateError);
        throw new Error('Erro ao cancelar convite');
      }

      return { 
        success: true,
        memberName: member.full_name,
        memberId: memberId 
      };
    },
    onSuccess: (data) => {
      console.log('[useTeamInvites] ✅ Convite cancelado com sucesso');
      queryClient.invalidateQueries({ queryKey: TEAM_INVITES_KEYS.list(companyId) });
      queryClient.invalidateQueries({ queryKey: TEAM_INVITES_KEYS.inviteStatus(data.memberId) });
      toast.success(`Convite cancelado para ${data.memberName}`);
    },
    onError: (error: any) => {
      console.error('[useTeamInvites] ❌ Erro ao cancelar convite:', error);
      toast.error(error.message || 'Erro ao cancelar convite');
    }
  });

  return {
    resendInvite,
    cancelInvite
  };
};