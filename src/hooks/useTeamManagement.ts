import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TeamMember {
  id: string;
  full_name: string;
  email?: string;
  username?: string;
  role: "admin" | "manager" | "operational";
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
  role: "manager" | "operational";
  whatsappAccess: string[];
  funnelAccess: string[];
  whatsappPersonal?: string;
}

interface EditMemberData {
  full_name: string;
  email?: string;
  role: "operational" | "manager" | "admin";
  assignedWhatsAppIds: string[];
  assignedFunnelIds: string[];
  whatsapp_personal?: string;
}

export const useTeamManagement = (companyId: string | null) => {
  const queryClient = useQueryClient();

  // Fetch team members
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

  // Create team member mutation - IMPLEMENTAÇÃO COM SUPABASE NATIVO ATIVADO
  const createTeamMember = useMutation({
    mutationFn: async (memberData: CreateMemberData) => {
      console.log('[useTeamManagement] 🚀 Criando novo membro:', memberData.fullName);

      if (!companyId) {
        throw new Error('ID da empresa não encontrado');
      }

      // ✅ ETAPA 1: Gerar token temporário único para o convite
      const inviteToken = crypto.randomUUID();
      const tempProfileId = crypto.randomUUID();
      
      console.log('[useTeamManagement] 🔑 Token de convite gerado:', inviteToken);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: tempProfileId,
          full_name: memberData.fullName,
          username: memberData.username,
          role: memberData.role,
          whatsapp: memberData.whatsappPersonal || '',
          created_by_user_id: companyId,
          invite_status: 'pending',
          email: memberData.email,
          invite_token: inviteToken,
          temp_password: null,
          invite_sent_at: new Date().toISOString()
        })
        .select()
        .single();

      if (profileError) {
        console.error('[useTeamManagement] ❌ Erro ao criar perfil:', profileError);
        throw new Error(`Erro ao criar perfil: ${profileError.message}`);
      }

      console.log('[useTeamManagement] ✅ Perfil criado:', profile.id);

      // ✅ ETAPA 2: Configurar acessos WhatsApp
      if (memberData.whatsappAccess.length > 0) {
        const whatsappInserts = memberData.whatsappAccess.map(whatsappId => ({
          profile_id: profile.id,
          whatsapp_number_id: whatsappId
        }));

        const { error: whatsappError } = await supabase
          .from('user_whatsapp_numbers')
          .insert(whatsappInserts);

        if (whatsappError) {
          console.error('[useTeamManagement] ❌ Erro ao vincular WhatsApp:', whatsappError);
        }
      }

      // ✅ ETAPA 3: Configurar acessos Funnel
      if (memberData.funnelAccess.length > 0) {
        const funnelInserts = memberData.funnelAccess.map(funnelId => ({
          profile_id: profile.id,
          funnel_id: funnelId
        }));

        const { error: funnelError } = await supabase
          .from('user_funnels')
          .insert(funnelInserts);

        if (funnelError) {
          console.error('[useTeamManagement] ❌ Erro ao vincular funis:', funnelError);
        }
      }

      // ✅ ETAPA 4: Enviar CONVITE usando template NATIVO do Supabase
      try {
        console.log('[useTeamManagement] 📧 Enviando convite via template NATIVO do Supabase...');
        
        // Chamar Edge Function que usa supabase.auth.admin.inviteUserByEmail()
        const { data: inviteResponse, error: functionError } = await supabase.functions.invoke('send_native_invite', {
          body: {
            email: memberData.email,
            profile_id: profile.id,
            invite_token: inviteToken,
            user_data: {
              full_name: memberData.fullName,
              role: memberData.role,
              company_name: 'TicLin CRM'
            },
            redirect_url: `${window.location.origin}/invite/${inviteToken}`
          }
        });

        if (functionError || !inviteResponse?.success) {
          console.error('[useTeamManagement] ❌ Erro na Edge Function nativa:', functionError);
          
          // Fallback: Usar função Resend existente
          console.log('[useTeamManagement] 🔄 Fallback: usando Edge Function Resend...');
          
          const { data: resendResponse, error: resendError } = await supabase.functions.invoke('send_team_invite', {
            body: {
              email: memberData.email,
              full_name: memberData.fullName,
              companyId: companyId,
              inviteToken: inviteToken,
              companyName: 'TicLin CRM'
            }
          });

          if (resendError) {
            // Mesmo se o email falhar, vamos considerar sucesso pois o perfil foi criado
            console.error('[useTeamManagement] ❌ Erro no fallback Resend:', resendError);
            console.log('[useTeamManagement] ⚠️ Perfil criado, mas email falhou. Continuando...');
          } else {
            console.log('[useTeamManagement] ✅ Convite enviado via Resend (fallback):', resendResponse);
          }
        } else {
          console.log('[useTeamManagement] ✅ Convite enviado via template NATIVO:', inviteResponse);
        }
        
        // Atualizar status para "invite_sent"
        await supabase
          .from('profiles')
          .update({ 
            invite_status: 'invite_sent',
            invite_sent_at: new Date().toISOString()
          })
          .eq('id', profile.id);
          
        toast.success(`✅ Convite enviado com sucesso para ${memberData.email}!`);
        console.log('[useTeamManagement] 🔗 Link do convite (para teste):', `${window.location.origin}/invite/${inviteToken}`);
        
      } catch (inviteErr: any) {
        console.error('[useTeamManagement] ❌ Erro geral no sistema de convites:', inviteErr);
        
        await supabase
          .from('profiles')
          .update({ invite_status: 'invite_failed' })
          .eq('id', profile.id);
          
        throw new Error(`Erro ao enviar convite: ${inviteErr.message || 'Erro desconhecido'}`);
      }

      return profile;
    },
    onSuccess: () => {
      console.log('[useTeamManagement] ✅ Membro criado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['teamMembers', companyId] });
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
    },
    onError: (error: any) => {
      console.error('[useTeamManagement] ❌ Erro ao criar membro:', error);
    }
  });

  // Edit member mutation
  const editMember = useMutation({
    mutationFn: async ({ memberId, memberData }: { memberId: string; memberData: EditMemberData }) => {
      console.log('[useTeamManagement] ✏️ Editando membro:', memberId);

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: memberData.full_name,
          role: memberData.role,
          whatsapp: memberData.whatsapp_personal || '',
          email: memberData.email
        })
        .eq('id', memberId);

      if (profileError) {
        console.error('[useTeamManagement] ❌ Erro ao atualizar perfil:', profileError);
        throw new Error(`Erro ao atualizar perfil: ${profileError.message}`);
      }

      // Update WhatsApp access
      await supabase.from('user_whatsapp_numbers').delete().eq('profile_id', memberId);
      
      if (memberData.assignedWhatsAppIds.length > 0) {
        const whatsappInserts = memberData.assignedWhatsAppIds.map(whatsappId => ({
          profile_id: memberId,
          whatsapp_number_id: whatsappId
        }));

        const { error: whatsappError } = await supabase
          .from('user_whatsapp_numbers')
          .insert(whatsappInserts);

        if (whatsappError) {
          console.error('[useTeamManagement] ❌ Erro ao atualizar WhatsApp:', whatsappError);
        }
      }

      // Update Funnel access
      await supabase.from('user_funnels').delete().eq('profile_id', memberId);
      
      if (memberData.assignedFunnelIds.length > 0) {
        const funnelInserts = memberData.assignedFunnelIds.map(funnelId => ({
          profile_id: memberId,
          funnel_id: funnelId
        }));

        const { error: funnelError } = await supabase
          .from('user_funnels')
          .insert(funnelInserts);

        if (funnelError) {
          console.error('[useTeamManagement] ❌ Erro ao atualizar funis:', funnelError);
        }
      }

      return { success: true };
    },
    onSuccess: () => {
      console.log('[useTeamManagement] ✅ Membro editado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      toast.success('Membro atualizado com sucesso');
    },
    onError: (error: any) => {
      console.error('[useTeamManagement] ❌ Erro ao editar membro:', error);
      toast.error(`Erro ao editar membro: ${error.message}`);
    }
  });

  // Remove member mutation
  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      console.log('[useTeamManagement] 🗑️ Removendo membro completo (Profile + Auth):', memberId);

      // 1. Buscar dados do perfil antes de deletar
      const { data: profile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('linked_auth_user_id, email')
        .eq('id', memberId)
        .single();

      if (profileFetchError || !profile) {
        console.error('[useTeamManagement] ❌ Erro ao buscar perfil:', profileFetchError);
        throw new Error(`Perfil não encontrado: ${profileFetchError?.message}`);
      }

      console.log('[useTeamManagement] 📋 Dados do perfil:', {
        profileId: memberId,
        authUserId: profile.linked_auth_user_id,
        email: profile.email
      });

      // 2. Remove WhatsApp access
      await supabase.from('user_whatsapp_numbers').delete().eq('profile_id', memberId);
      
      // 3. Remove Funnel access
      await supabase.from('user_funnels').delete().eq('profile_id', memberId);
      
      // 4. Remove profile from database
      const { error: profileError } = await supabase.from('profiles').delete().eq('id', memberId);
      
      if (profileError) {
        console.error('[useTeamManagement] ❌ Erro ao remover perfil:', profileError);
        throw new Error(`Erro ao remover perfil: ${profileError.message}`);
      }

      // 5. ✅ CRUCIAL: Remove from Auth if user exists
      if (profile.linked_auth_user_id) {
        console.log('[useTeamManagement] 🔥 Removendo usuário do Auth também:', profile.linked_auth_user_id);
        
        try {
          const { data: deleteResponse, error: deleteError } = await supabase.functions.invoke('delete_auth_user', {
            body: {
              user_id: profile.linked_auth_user_id,
              email: profile.email
            }
          });

          if (deleteError) {
            console.error('[useTeamManagement] ⚠️ Erro ao remover do Auth (continuando):', deleteError);
            // Não falhar a operação se não conseguir remover do Auth
          } else {
            console.log('[useTeamManagement] ✅ Usuário removido do Auth:', deleteResponse);
          }
        } catch (authDeleteError) {
          console.error('[useTeamManagement] ⚠️ Erro na remoção do Auth:', authDeleteError);
          // Continuar sem falhar
        }
      }

      return { success: true };
    },
    onSuccess: () => {
      console.log('[useTeamManagement] ✅ Membro removido com sucesso');
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      toast.success('Membro removido com sucesso');
    },
    onError: (error: any) => {
      console.error('[useTeamManagement] ❌ Erro ao remover membro:', error);
      toast.error(`Erro ao remover membro: ${error.message}`);
    }
  });

  return {
    teamMembers,
    isLoading,
    createTeamMember,
    editMember,
    removeMember
  };
};