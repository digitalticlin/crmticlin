
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TeamMember {
  id: string;
  full_name: string;
  username?: string;
  role: 'admin' | 'user';
  created_at: string;
  whatsapp_access: string[];
  funnel_access: string[];
}

export function useTeamManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ["team-members", user?.id],
    queryFn: async (): Promise<TeamMember[]> => {
      if (!user?.id) return [];

      const { data: profiles, error } = await supabase
        .from("profiles")
        .select(`
          *,
          whatsapp_access:user_whatsapp_numbers(whatsapp_number_id),
          funnel_access:user_funnels(funnel_id)
        `)
        .eq("created_by_user_id", user.id);

      if (error) throw error;

      return (profiles || []).map(profile => ({
        id: profile.id,
        full_name: profile.full_name,
        username: profile.username,
        role: profile.role,
        created_at: profile.created_at,
        whatsapp_access: profile.whatsapp_access?.map((w: any) => w.whatsapp_number_id) || [],
        funnel_access: profile.funnel_access?.map((f: any) => f.funnel_id) || []
      }));
    },
    enabled: !!user?.id,
  });

  const { data: whatsappInstances = [] } = useQuery({
    queryKey: ["whatsapp-instances", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("whatsapp_instances")
        .select("*")
        .eq("created_by_user_id", user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: funnels = [] } = useQuery({
    queryKey: ["funnels", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("funnels")
        .select("*")
        .eq("created_by_user_id", user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const updateMemberAccess = useMutation({
    mutationFn: async ({ 
      memberId, 
      whatsappAccess, 
      funnelAccess 
    }: { 
      memberId: string; 
      whatsappAccess: string[]; 
      funnelAccess: string[]; 
    }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // Remove existing access
      await supabase
        .from("user_whatsapp_numbers")
        .delete()
        .eq("profile_id", memberId);

      await supabase
        .from("user_funnels")
        .delete()
        .eq("profile_id", memberId);

      // Add new WhatsApp access
      if (whatsappAccess.length > 0) {
        const whatsappInserts = whatsappAccess.map(whatsappId => ({
          profile_id: memberId,
          whatsapp_number_id: whatsappId,
          created_by_user_id: user.id,
        }));

        const { error: whatsappError } = await supabase
          .from("user_whatsapp_numbers")
          .insert(whatsappInserts);

        if (whatsappError) throw whatsappError;
      }

      // Add new funnel access
      if (funnelAccess.length > 0) {
        const funnelInserts = funnelAccess.map(funnelId => ({
          profile_id: memberId,
          funnel_id: funnelId,
          created_by_user_id: user.id,
        }));

        const { error: funnelError } = await supabase
          .from("user_funnels")
          .insert(funnelInserts);

        if (funnelError) throw funnelError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Acesso do membro atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar acesso:", error);
      toast.error("Erro ao atualizar acesso do membro");
    },
  });

  const updateMemberRole = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: 'admin' | 'user' }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", memberId)
        .eq("created_by_user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Função do membro atualizada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar função:", error);
      toast.error("Erro ao atualizar função do membro");
    },
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // Remove access records first
      await supabase
        .from("user_whatsapp_numbers")
        .delete()
        .eq("profile_id", memberId);

      await supabase
        .from("user_funnels")
        .delete()
        .eq("profile_id", memberId);

      // Remove profile
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", memberId)
        .eq("created_by_user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Membro removido com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao remover membro:", error);
      toast.error("Erro ao remover membro da equipe");
    },
  });

  return {
    teamMembers,
    whatsappInstances,
    funnels,
    isLoading,
    updateMemberAccess,
    updateMemberRole,
    removeMember
  };
}
