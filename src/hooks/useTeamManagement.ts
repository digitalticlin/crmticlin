import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  invite_status?: "pending" | "accepted";
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
    queryKey: ['teamMembers', companyId],
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
      // 🔧 FIX: Gerar UUID para o profile
      const profileId = crypto.randomUUID();
      
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
          invite_status: 'pending'
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
          whatsapp_number_id: whatsappId
        }));
        
        const { error: whatsappError } = await supabase
          .from('user_whatsapp_numbers')
          .insert(whatsappInserts);
          
        if (whatsappError) {
          console.error('[useTeamManagement] ❌ Erro ao configurar WhatsApp:', whatsappError);
        }
      }

      if (memberData.funnelAccess?.length > 0) {
        console.log('[useTeamManagement] 🎯 Configurando acesso aos funis...');
        const funnelInserts = memberData.funnelAccess.map(funnelId => ({
          profile_id: newProfile.id,
          funnel_id: funnelId
        }));
        
        const { error: funnelError } = await supabase
          .from('user_funnels')
          .insert(funnelInserts);
          
        if (funnelError) {
          console.error('[useTeamManagement] ❌ Erro ao configurar funis:', funnelError);
        }
      }

      // ETAPA 4: Gerar token de convite e URL
      const inviteToken = crypto.randomUUID();
      const redirectUrl = `${window.location.origin}/accept-invite?token=${inviteToken}&profile_id=${newProfile.id}`;

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
      queryClient.invalidateQueries({ queryKey: ['teamMembers', companyId] });
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      toast.success(`✅ Convite enviado com sucesso!`);
    },
    onError: (error: any) => {
      console.error('[useTeamManagement] ❌ Erro ao criar membro:', error);
      toast.error(`Erro ao criar membro: ${error.message}`);
    }
  });

  // Resend invite mutation - PRESERVADO
  const resendInvite = useMutation({
    mutationFn: async (memberId: string) => {
      console.log('[useTeamManagement] 📧 Reenviando convite para membro:', memberId);
      
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
          whatsapp_access,
          funnel_access,
          invite_status
        `)
        .eq('id', memberId)
        .single();

      if (fetchError || !member) {
        console.error('[useTeamManagement] ❌ Erro ao buscar dados do membro:', fetchError);
        throw new Error('Membro não encontrado');
      }

      console.log('[useTeamManagement] 👤 Dados do membro encontrado:', member);

      if (member.invite_status === 'accepted') {
        console.warn('[useTeamManagement] ⚠️ Tentativa de reenviar convite para membro já aceito');
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

      console.log('[useTeamManagement] 🔍 Acessos do membro:');
      console.log('[useTeamManagement]   WhatsApp:', whatsappAccess?.map(wa => wa.whatsapp_number_id));
      console.log('[useTeamManagement]   Funis:', funnelAccess?.map(fa => fa.funnel_id));

      // Chamar edge function para reenvio
      console.log('[useTeamManagement] ⚡ Chamando edge function send_resend_invite...');
      const { data: resendResult, error: resendError } = await supabase.functions.invoke('send_resend_invite', {
        body: {
          profile_id: memberId,
          email: member.email,
          full_name: member.full_name,
          username: member.username,
          role: member.role,
          whatsapp_personal: member.whatsapp,
          whatsapp_access: whatsappAccess?.map(wa => wa.whatsapp_number_id) || [],
          funnel_access: funnelAccess?.map(fa => fa.funnel_id) || [],
          created_by_user_id: companyId
        }
      });

      if (resendError) {
        console.error('[useTeamManagement] ❌ Erro ao reenviar convite:', resendError);
        throw new Error(`Erro ao reenviar convite: ${resendError.message}`);
      }

      if (!resendResult?.success) {
        console.error('[useTeamManagement] ❌ Falha no reenvio:', resendResult);
        throw new Error(resendResult?.error || 'Erro desconhecido ao reenviar convite');
      }

      console.log('[useTeamManagement] ✅ Convite reenviado com sucesso:', resendResult);

      toast.success(`✅ Convite reenviado para ${member.full_name}!`);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers', companyId] });
    },
    onError: (error: any) => {
      console.error('[useTeamManagement] ❌ Erro ao reenviar convite:', error);
      toast.error(`Erro ao reenviar convite: ${error.message}`);
    }
  });

  return {
    teamMembers,
    isLoading,
    createTeamMember,
    resendInvite
    // REMOVIDO: editMember, removeMember -> usar hooks isolados
  };
};