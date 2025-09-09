import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Query Keys isolados para useTeamMemberAssignments
const TEAM_ASSIGNMENTS_KEYS = {
  list: (companyId: string | null) => ['teamMembers', companyId] as const,
  assignments: (memberId: string) => ['memberAssignments', memberId] as const,
  whatsappAssignments: (memberId: string) => ['memberWhatsappAssignments', memberId] as const,
  funnelAssignments: (memberId: string) => ['memberFunnelAssignments', memberId] as const,
} as const;

interface AssignmentData {
  funnelIds: string[];
  whatsappIds: string[];
}

/**
 * Hook isolado para gerenciar atribuições de funis e instâncias WhatsApp
 * Responsabilidade única: assignments + transferência automática de leads
 */
export const useTeamMemberAssignments = (companyId: string | null) => {
  const queryClient = useQueryClient();

  // Funções de transferência automática REMOVIDAS
  // Admin deve fazer transferências manuais quando necessário

  // Mutation para atualizar assignments de um membro
  const updateMemberAssignments = useMutation({
    mutationFn: async ({ memberId, assignments }: { memberId: string; assignments: AssignmentData }) => {
      console.log('[useTeamMemberAssignments] ===== ATUALIZANDO ASSIGNMENTS =====');
      console.log('[useTeamMemberAssignments] 👤 Membro ID:', memberId);
      console.log('[useTeamMemberAssignments] 📊 Assignments:', assignments);

      if (!companyId) {
        throw new Error('Company ID é obrigatório para assignments');
      }

      // Validar que os dados são arrays
      const funnelIds = Array.isArray(assignments.funnelIds) ? assignments.funnelIds : [];
      const whatsappIds = Array.isArray(assignments.whatsappIds) ? assignments.whatsappIds : [];

      console.log('[useTeamMemberAssignments] 🔍 Arrays validados:');
      console.log('[useTeamMemberAssignments]   funnelIds:', funnelIds, 'Tipo:', typeof funnelIds, 'É array:', Array.isArray(funnelIds));
      console.log('[useTeamMemberAssignments]   whatsappIds:', whatsappIds, 'Tipo:', typeof whatsappIds, 'É array:', Array.isArray(whatsappIds));

      // 🏢 CORREÇÃO MULTI-TENANT: Buscar created_by_user_id do profile do usuário operacional
      const { data: memberProfile, error: memberProfileError } = await supabase
        .from('profiles')
        .select('created_by_user_id')
        .eq('id', memberId)
        .single();

      if (memberProfileError || !memberProfile?.created_by_user_id) {
        console.error('[useTeamMemberAssignments] ❌ Erro ao buscar created_by_user_id do membro:', memberProfileError);
        throw new Error('Não foi possível encontrar o admin responsável pelo usuário operacional');
      }

      const adminUserId = memberProfile.created_by_user_id;
      console.log('[useTeamMemberAssignments] 🏢 Admin responsável (created_by_user_id):', adminUserId);

      // ===== WHATSAPP ASSIGNMENTS =====
      console.log('[useTeamMemberAssignments] ===== WHATSAPP ASSIGNMENTS =====');
      console.log('[useTeamMemberAssignments] 🗑️ Deletando WhatsApps existentes para membro:', memberId);
      
      const { error: deleteWhatsAppError } = await supabase
        .from('user_whatsapp_numbers')
        .delete()
        .eq('profile_id', memberId);
      
      if (deleteWhatsAppError) {
        console.error('[useTeamMemberAssignments] Erro ao deletar WhatsApps existentes:', deleteWhatsAppError);
        throw deleteWhatsAppError;
      } else {
        console.log('[useTeamMemberAssignments] ✅ WhatsApps existentes deletados');
      }
      
      if (whatsappIds.length > 0) {
        console.log('[useTeamMemberAssignments] 📝 Inserindo novos WhatsApps:', whatsappIds);
        
        const whatsappInserts = whatsappIds.map(whatsappId => ({
          profile_id: memberId,
          whatsapp_number_id: whatsappId,
          created_by_user_id: adminUserId
        }));
        
        console.log('[useTeamMemberAssignments] Dados para insert WhatsApp:', whatsappInserts);

        const { error: whatsappError } = await supabase
          .from('user_whatsapp_numbers')
          .insert(whatsappInserts);

        if (whatsappError) {
          console.error('[useTeamMemberAssignments] ❌ Erro ao inserir WhatsApp:', whatsappError);
          throw whatsappError;
        } else {
          console.log('[useTeamMemberAssignments] ✅ WhatsApps inseridos com sucesso');
        }
      } else {
        console.log('[useTeamMemberAssignments] 📝 Nenhum WhatsApp para inserir');
      }

      // ===== FUNNEL ASSIGNMENTS =====
      console.log('[useTeamMemberAssignments] ===== FUNNEL ASSIGNMENTS =====');
      console.log('[useTeamMemberAssignments] 🗑️ Deletando funis existentes para membro:', memberId);
      
      const { error: deleteFunnelError } = await supabase
        .from('user_funnels')
        .delete()
        .eq('profile_id', memberId);
      
      if (deleteFunnelError) {
        console.error('[useTeamMemberAssignments] Erro ao deletar funis existentes:', deleteFunnelError);
        throw deleteFunnelError;
      } else {
        console.log('[useTeamMemberAssignments] ✅ Funis existentes deletados');
      }
      
      if (funnelIds.length > 0) {
        console.log('[useTeamMemberAssignments] 📝 Inserindo novos funis:', funnelIds);
        
        const funnelInserts = funnelIds.map(funnelId => ({
          profile_id: memberId,
          funnel_id: funnelId,
          created_by_user_id: adminUserId
        }));
        
        console.log('[useTeamMemberAssignments] Dados para insert Funnel:', funnelInserts);

        const { error: funnelError } = await supabase
          .from('user_funnels')
          .insert(funnelInserts);

        if (funnelError) {
          console.error('[useTeamMemberAssignments] ❌ Erro ao inserir funis:', funnelError);
          throw funnelError;
        } else {
          console.log('[useTeamMemberAssignments] ✅ Funis inseridos com sucesso');
        }
      } else {
        console.log('[useTeamMemberAssignments] 📝 Nenhum funil para inserir');
      }

      // ===== TRANSFERÊNCIA REMOVIDA =====
      // Nova lógica: apenas leads NOVOS terão owner_id do operacional
      // Leads existentes ficam com admin até transferência manual
      console.log('[useTeamMemberAssignments] ℹ️ Leads existentes permanecem com admin - transferência manual necessária');

      // ===== VERIFICAÇÃO FINAL =====
      console.log('[useTeamMemberAssignments] ===== VERIFICANDO DADOS SALVOS =====');
      
      const { data: savedWhatsApps } = await supabase
        .from('user_whatsapp_numbers')
        .select('whatsapp_number_id')
        .eq('profile_id', memberId);
        
      const { data: savedFunnels } = await supabase
        .from('user_funnels')
        .select('funnel_id')
        .eq('profile_id', memberId);
        
      console.log('[useTeamMemberAssignments] 🔍 WhatsApps salvos no banco:', savedWhatsApps?.map(w => w.whatsapp_number_id));
      console.log('[useTeamMemberAssignments] 🔍 Funis salvos no banco:', savedFunnels?.map(f => f.funnel_id));

      return { success: true };
    },
    onSuccess: (_, variables) => {
      console.log('[useTeamMemberAssignments] ✅ Assignments atualizados com sucesso');
      queryClient.invalidateQueries({ queryKey: TEAM_ASSIGNMENTS_KEYS.list(companyId) });
      queryClient.invalidateQueries({ queryKey: TEAM_ASSIGNMENTS_KEYS.assignments(variables.memberId) });
      toast.success('Atribuições atualizadas com sucesso');
    },
    onError: (error: any) => {
      console.error('[useTeamMemberAssignments] ❌ Erro ao atualizar assignments:', error);
      toast.error(`Erro ao atualizar atribuições: ${error.message}`);
    }
  });

  return {
    updateMemberAssignments
  };
};