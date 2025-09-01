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
          .from('user_funnel_access')
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

  // Create team member mutation - NOVA IMPLEMENTAÇÃO com Supabase nativo
  const createTeamMember = useMutation({
    mutationFn: async (memberData: CreateMemberData) => {
      console.log('[useTeamManagement] 🚀 Criando novo membro:', memberData.fullName);

      if (!companyId) {
        throw new Error('ID da empresa não encontrado');
      }

      // ✅ ETAPA 1: Criar perfil temporário (sem auth.user ainda)
      const tempProfileId = crypto.randomUUID(); // Gerar ID temporário
      
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
          email: memberData.email
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
          .from('user_funnel_access')
          .insert(funnelInserts);

        if (funnelError) {
          console.error('[useTeamManagement] ❌ Erro ao vincular funis:', funnelError);
        }
      }

      // ✅ ETAPA 4: Enviar convite usando sistema 100% nativo do Supabase
      try {
        console.log('[useTeamManagement] 📧 Enviando convite nativo do Supabase...');
        
        // IMPORTANTE: Esta chamada só funciona no servidor com Service Key
        // Para funcionar no frontend, precisa ser configurada no dashboard do Supabase
        // ou o Supabase precisa permitir convites via RLS policies
        
        console.log('[useTeamManagement] ⚠️ Sistema nativo requer configuração no dashboard');
        console.log('[useTeamManagement] 💡 Alternativa: Enviar convite manual via dashboard do Supabase');
        
        // Marcar como pendente para envio manual
        await supabase
          .from('profiles')
          .update({ 
            invite_status: 'pending',
            invite_sent_at: new Date().toISOString()
          })
          .eq('id', profile.id);
          
        toast.success(`Membro criado! Use o dashboard do Supabase para enviar convite para ${memberData.email}`);
        
      } catch (inviteErr) {
        console.error('[useTeamManagement] ❌ Erro no sistema nativo:', inviteErr);
        
        await supabase
          .from('profiles')
          .update({ invite_status: 'failed' })
          .eq('id', profile.id);
          
        toast.error('Membro criado, mas falha no sistema de convite');
      }

      return profile;
    },
    onSuccess: () => {
      console.log('[useTeamManagement] ✅ Membro criado com sucesso');
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
      await supabase.from('user_funnel_access').delete().eq('profile_id', memberId);
      
      if (memberData.assignedFunnelIds.length > 0) {
        const funnelInserts = memberData.assignedFunnelIds.map(funnelId => ({
          profile_id: memberId,
          funnel_id: funnelId
        }));

        const { error: funnelError } = await supabase
          .from('user_funnel_access')
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
      console.log('[useTeamManagement] 🗑️ Removendo membro:', memberId);

      // Remove WhatsApp access
      await supabase.from('user_whatsapp_numbers').delete().eq('profile_id', memberId);
      
      // Remove Funnel access
      await supabase.from('user_funnel_access').delete().eq('profile_id', memberId);
      
      // Remove profile
      const { error } = await supabase.from('profiles').delete().eq('id', memberId);
      
      if (error) {
        console.error('[useTeamManagement] ❌ Erro ao remover membro:', error);
        throw new Error(`Erro ao remover membro: ${error.message}`);
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