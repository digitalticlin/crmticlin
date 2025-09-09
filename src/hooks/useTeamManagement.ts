import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Query Keys isolados para useTeamManagement
const TEAM_MANAGEMENT_KEYS = {
  list: (companyId: string | null) => ['teamMembers', companyId] as const,
  all: ['teamMembers'] as const,
} as const;

export interface TeamMember {
  id: string;
  full_name: string;
  email?: string;
  username?: string;
  role: "admin" | "operational";
  whatsapp?: string;
  whatsapp_access?: string[];
  funnel_access?: string[];
  created_at?: string;
  invite_status?: "pending" | "invite_sent" | "accepted";
}

interface CreateMemberData {
  fullName: string;
  username: string;
  email: string;
  role: "operational";
  whatsappAccess: string[];
  funnelAccess: string[];
  whatsappPersonal?: string;
}

/**
 * Hook principal para gestão de equipes
 * RESPONSABILIDADES ISOLADAS:
 * - Buscar membros da equipe
 * - Criar novos membros (invite flow)
 * - Reenviar convites
 * 
 * FUNÇÕES REMOVIDAS (agora em hooks isolados):
 * - editMember -> useTeamMemberEditor + useTeamMemberAssignments  
 * - removeMember -> useTeamMemberEditor
 */
export const useTeamManagement = (companyId: string | null) => {
  const queryClient = useQueryClient();

  // Fetch team members - PRESERVADO
  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: TEAM_MANAGEMENT_KEYS.list(companyId),
    queryFn: async () => {
      if (!companyId) return [];
      
      console.log('[useTeamManagement] 📋 Buscando membros da equipe para empresa:', companyId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          username,
          role,
          whatsapp,
          created_at,
          invite_status,
          email
        `)
        .eq('created_by_user_id', companyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useTeamManagement] ❌ Erro ao buscar membros:', error);
        throw error;
      }

      console.log('[useTeamManagement] ✅ Membros encontrados:', data?.length || 0);
      
      // Get WhatsApp and Funnel access for each member
      const membersWithAccess = await Promise.all((data || []).map(async (member) => {
        // Get WhatsApp access
        const { data: whatsappAccess } = await supabase
          .from('user_whatsapp_numbers')
          .select('whatsapp_number_id')
          .eq('profile_id', member.id);

        // Get Funnel access
        const { data: funnelAccess } = await supabase
          .from('user_funnels')
          .select('funnel_id')
          .eq('profile_id', member.id);

        return {
          ...member,
          whatsapp_access: whatsappAccess?.map(wa => wa.whatsapp_number_id) || [],
          funnel_access: funnelAccess?.map(fa => fa.funnel_id) || []
        } as TeamMember;
      }));

      return membersWithAccess;
    },
    enabled: !!companyId,
  });

  // Create team member mutation - PRESERVADO INTACTO - FLUXO SEGURO: EMAIL PRIMEIRO, DEPOIS PERFIL
  const createTeamMember = useMutation({
    mutationFn: async (memberData: CreateMemberData) => {
      console.log('[useTeamManagement] 🚀 Iniciando criação de membro:', memberData.fullName);
      console.log('[useTeamManagement] 📧 Email que será usado:', memberData.email);

      if (!companyId) {
        throw new Error('Company ID é obrigatório para criar membro da equipe');
      }

      // ETAPA 1: Validar se email já existe
      console.log('[useTeamManagement] 🔍 Verificando se email já existe...');
      const { data: existingProfiles } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', memberData.email);
      
      if (existingProfiles && existingProfiles.length > 0) {
        console.error('[useTeamManagement] ❌ Email já existe:', memberData.email);
        throw new Error('Email já está em uso por outro usuário');
      }

      console.log('[useTeamManagement] ✅ Email disponível');

      // ETAPA 2: Criar perfil no Supabase primeiro
      console.log('[useTeamManagement] 👤 Criando perfil no Supabase...');
      // 🔧 FIX: Gerar UUID para o profile e token de convite
      const profileId = crypto.randomUUID();
      const inviteToken = crypto.randomUUID();
      
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: profileId, // 🎯 ID obrigatório para evitar constraint error
          email: memberData.email,
          full_name: memberData.fullName,
          username: memberData.username,
          role: memberData.role,
          whatsapp: memberData.whatsappPersonal || '',
          created_by_user_id: companyId,
          invite_status: 'invite_sent', // Status correto para indicar que convite foi enviado
          invite_token: inviteToken,
          invite_sent_at: new Date().toISOString()
        })
        .select()
        .single();

      if (profileError) {
        console.error('[useTeamManagement] ❌ Erro ao criar perfil:', profileError);
        throw new Error(`Erro ao criar perfil: ${profileError.message}`);
      }

      console.log('[useTeamManagement] ✅ Perfil criado:', newProfile.id);

      // ETAPA 3: Configurar acessos (WhatsApp e Funis)
      if (memberData.whatsappAccess?.length > 0) {
        console.log('[useTeamManagement] 📱 Configurando acesso WhatsApp...');
        
        const whatsappInserts = memberData.whatsappAccess.map(whatsappId => ({
          profile_id: newProfile.id,
          whatsapp_number_id: whatsappId,
          created_by_user_id: companyId
        }));
        
        const { error: whatsappError } = await supabase
          .from('user_whatsapp_numbers')
          .insert(whatsappInserts);
          
        if (whatsappError) {
          console.error('[useTeamManagement] ❌ Erro ao configurar WhatsApp:', whatsappError);
          throw new Error(`Erro ao configurar acessos WhatsApp: ${whatsappError.message}`);
        }
        
        console.log('[useTeamManagement] ✅ Acessos WhatsApp configurados - novos leads serão atribuídos ao operacional');
      }

      if (memberData.funnelAccess?.length > 0) {
        console.log('[useTeamManagement] 🎯 Configurando acesso aos funis...');
        const funnelInserts = memberData.funnelAccess.map(funnelId => ({
          profile_id: newProfile.id,
          funnel_id: funnelId,
          created_by_user_id: companyId // FIX: Adicionar created_by_user_id
        }));
        
        const { error: funnelError } = await supabase
          .from('user_funnels')
          .insert(funnelInserts);
          
        if (funnelError) {
          console.error('[useTeamManagement] ❌ Erro ao configurar funis:', funnelError);
          throw new Error(`Erro ao configurar acessos aos funis: ${funnelError.message}`);
        }
      }

      // ETAPA 4: Construir URL de redirecionamento
      const redirectUrl = `${window.location.origin}/invite/${inviteToken}`;

      // Buscar nome da empresa para o template
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', companyId)
        .single();

      // ETAPA 5: Chamar edge function para enviar email
      console.log('[useTeamManagement] ⚡ Chamando send_resend_invite...');
      const { data: inviteResult, error: inviteError } = await supabase.functions.invoke('send_resend_invite', {
        body: {
          email: memberData.email,
          profile_id: newProfile.id,
          invite_token: inviteToken,
          user_data: {
            full_name: memberData.fullName,
            role: memberData.role,
            company_name: adminProfile?.full_name || 'Equipe'
          },
          redirect_url: redirectUrl,
          is_resend: false
        }
      });

      if (inviteError) {
        console.error('[useTeamManagement] ❌ Erro na edge function:', inviteError);
        throw new Error(`Erro ao enviar convite: ${inviteError.message}`);
      }

      if (!inviteResult?.success) {
        console.error('[useTeamManagement] ❌ Edge function retornou falha:', inviteResult);
        throw new Error(`Falha ao enviar convite: ${inviteResult?.error || 'Erro desconhecido'}`);
      }

      console.log('[useTeamManagement] ✅ Convite enviado com sucesso');
      console.log('[useTeamManagement] 📄 Resultado:', inviteResult);

      return {
        success: true,
        profile_id: newProfile.id,
        message: 'Convite enviado com sucesso'
      };
    },
    onSuccess: (result) => {
      console.log('[useTeamManagement] ✅ Membro criado com sucesso:', result);
      console.log('[useTeamManagement] 🔄 Invalidando queries para atualizar lista...');
      queryClient.invalidateQueries({ queryKey: TEAM_MANAGEMENT_KEYS.list(companyId) });
      
      // Mensagem de sucesso mais informativa
      toast.success(
        '✅ Membro adicionado com sucesso!',
        {
          description: 'Um email de convite foi enviado para configurar a senha.',
          duration: 5000
        }
      );
    },
    onError: (error: any) => {
      console.error('[useTeamManagement] ❌ Erro ao criar membro:', error);
      
      // Feedback de erro mais específico e detalhado
      let errorMessage = 'Erro ao criar membro';
      let errorDescription = '';
      
      if (error.message.includes('Email já está em uso')) {
        errorMessage = '🚫 Email já cadastrado';
        errorDescription = 'Este email já está sendo usado por outro membro da equipe.';
      } else if (error.message.includes('Email já existe no Auth')) {
        errorMessage = '🚫 Email já possui conta';
        errorDescription = 'Este email já tem uma conta ativa no sistema.';
      } else if (error.message.includes('RESEND_API_KEY')) {
        errorMessage = '⚠️ Erro na configuração de email';
        errorDescription = 'Problema na configuração do sistema. Contate o suporte.';
      } else if (error.message.includes('acessos WhatsApp')) {
        errorMessage = '❌ Erro ao configurar WhatsApp';
        errorDescription = 'Não foi possível vincular as instâncias WhatsApp selecionadas.';
      } else if (error.message.includes('acessos aos funis')) {
        errorMessage = '❌ Erro ao configurar funis';
        errorDescription = 'Não foi possível vincular os funis selecionados.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = '⏱️ Muitas tentativas';
        errorDescription = 'Aguarde alguns segundos antes de tentar novamente.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, {
        description: errorDescription,
        duration: 6000
      });
    }
  });

  // REMOVIDO: resendInvite movido para useTeamInvites hook
  // Para manter compatibilidade, mantemos separação de responsabilidades

  return {
    teamMembers,
    isLoading,
    createTeamMember
    // REMOVIDO: resendInvite -> movido para useTeamInvites
    // REMOVIDO: editMember, removeMember -> usar hooks isolados
  };
};