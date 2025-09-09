import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Query Keys isolados para useTeamMemberEditor
const TEAM_EDITOR_KEYS = {
  list: (companyId: string | null) => ['teamMembers', companyId] as const,
  member: (memberId: string) => ['teamMember', memberId] as const,
} as const;

interface EditMemberProfileData {
  full_name: string;
  email?: string;
  role: "operational" | "admin";
  whatsapp_personal?: string;
}

/**
 * Hook isolado para editar dados pessoais de membros
 * Responsabilidade única: atualizar perfil básico + remover membros
 */
export const useTeamMemberEditor = (companyId: string | null) => {
  const queryClient = useQueryClient();

  // Mutation para atualizar dados pessoais do membro
  const updateMemberProfile = useMutation({
    mutationFn: async ({ memberId, profileData }: { memberId: string; profileData: EditMemberProfileData }) => {
      console.log('[useTeamMemberEditor] ===== EDIT MEMBER PROFILE =====');
      console.log('[useTeamMemberEditor] ✏️ Editando perfil do membro ID:', memberId);
      console.log('[useTeamMemberEditor] 📝 Dados do perfil:', profileData);

      // Update profile basic data only
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          role: profileData.role,
          whatsapp: profileData.whatsapp_personal || '',
          email: profileData.email
        })
        .eq('id', memberId);

      if (profileError) {
        console.error('[useTeamMemberEditor] ❌ Erro ao atualizar perfil:', profileError);
        throw profileError;
      }

      console.log('[useTeamMemberEditor] ✅ Perfil atualizado com sucesso');
      return { success: true };
    },
    onSuccess: () => {
      console.log('[useTeamMemberEditor] ✅ Perfil do membro editado com sucesso');
      queryClient.invalidateQueries({ queryKey: TEAM_EDITOR_KEYS.list(companyId) });
      queryClient.invalidateQueries({ queryKey: TEAM_EDITOR_KEYS.member(memberId) });
      toast.success('Dados do membro atualizados com sucesso');
    },
    onError: (error: any) => {
      console.error('[useTeamMemberEditor] ❌ Erro ao editar perfil do membro:', error);
      toast.error(`Erro ao editar membro: ${error.message}`);
    }
  });

  // Remove member mutation
  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      console.log('[useTeamMemberEditor] 🗑️ Removendo membro completo (Profile + Auth):', memberId);

      // 1. Buscar dados do perfil antes de deletar
      const { data: profile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('linked_auth_user_id, email')
        .eq('id', memberId)
        .single();

      if (profileFetchError || !profile) {
        console.error('[useTeamMemberEditor] ❌ Erro ao buscar perfil:', profileFetchError);
        throw new Error(`Perfil não encontrado: ${profileFetchError?.message}`);
      }

      console.log('[useTeamMemberEditor] 📋 Dados do perfil:', {
        profileId: memberId,
        authUserId: profile.linked_auth_user_id,
        email: profile.email
      });

      // 2. Verificar se o usuário possui leads antes de deletar (apenas se linked_auth_user_id existir)
      if (profile.linked_auth_user_id && profile.linked_auth_user_id !== 'null') {
        console.log('[useTeamMemberEditor] 🔍 Verificando se usuário possui leads...');
        const { data: userLeads, error: leadsCheckError } = await supabase
          .from('leads')
          .select('id')
          .eq('owner_id', profile.linked_auth_user_id)
          .limit(1);

        if (leadsCheckError) {
          console.error('[useTeamMemberEditor] ❌ Erro ao verificar leads:', leadsCheckError);
          throw new Error(`Erro ao verificar leads do usuário: ${leadsCheckError.message}`);
        }

        if (userLeads && userLeads.length > 0) {
          console.error('[useTeamMemberEditor] ⚠️ Usuário possui leads vinculados');
          throw new Error('Este usuário possui leads vinculados. Por favor, transfira os leads para outro usuário antes de excluir.');
        }

        console.log('[useTeamMemberEditor] ✅ Usuário não possui leads, pode ser removido');
      } else {
        console.log('[useTeamMemberEditor] ℹ️ Membro sem linked_auth_user_id, pulando verificação de leads');
      }

      // 3. Remove WhatsApp access  
      await supabase.from('user_whatsapp_numbers').delete().eq('profile_id', memberId);
      
      // 4. Remove Funnel access
      await supabase.from('user_funnels').delete().eq('profile_id', memberId);
      
      console.log('[useTeamMemberEditor] ✅ Acessos removidos (WhatsApp + Funis)');

      // 5. Delete Profile
      const { error: profileDeleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', memberId);

      if (profileDeleteError) {
        console.error('[useTeamMemberEditor] ❌ Erro ao deletar perfil:', profileDeleteError);
        throw new Error(`Erro ao deletar perfil: ${profileDeleteError.message}`);
      }

      console.log('[useTeamMemberEditor] ✅ Perfil deletado');

      // 6. Delete Auth User via edge function (se existir linked_auth_user_id)
      if (profile.linked_auth_user_id) {
        console.log('[useTeamMemberEditor] 🔐 Chamando edge function para remover auth user:', profile.linked_auth_user_id);
        
        try {
          const { data: deleteResult, error: deleteAuthError } = await supabase.functions.invoke('delete_auth_user', {
            body: {
              user_id: profile.linked_auth_user_id,
              email: profile.email
            }
          });

          if (deleteAuthError) {
            console.error('[useTeamMemberEditor] ⚠️ Erro na edge function delete_auth_user:', deleteAuthError);
            // Não falha a operação, apenas avisa
          } else {
            console.log('[useTeamMemberEditor] ✅ Edge function delete_auth_user executada:', deleteResult);
          }
        } catch (error) {
          console.error('[useTeamMemberEditor] ⚠️ Erro ao chamar edge function:', error);
          // Não falha a operação, apenas avisa
        }
      } else {
        console.log('[useTeamMemberEditor] ⚠️ Membro sem linked_auth_user_id, pulando remoção auth');
      }

      console.log('[useTeamMemberEditor] ✅ Remoção completa realizada');
      
      return { 
        success: true,
        removedProfileId: memberId,
        removedAuthUserId: profile.linked_auth_user_id 
      };
    },
    onSuccess: (result) => {
      console.log('[useTeamMemberEditor] ✅ Membro removido completamente:', result);
      queryClient.invalidateQueries({ queryKey: TEAM_EDITOR_KEYS.list(companyId) });
      queryClient.invalidateQueries({ queryKey: TEAM_EDITOR_KEYS.member(memberId) });
      toast.success('Membro removido da equipe');
    },
    onError: (error: any) => {
      console.error('[useTeamMemberEditor] ❌ Erro ao remover membro:', error);
      toast.error(`Erro ao remover membro: ${error.message}`);
    }
  });

  return {
    updateMemberProfile,
    removeMember
  };
};