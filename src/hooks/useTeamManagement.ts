import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TeamMember {
  id: string;
  full_name: string;
  email?: string;
  username?: string;
  role: 'admin' | 'operational' | 'manager';
  created_at: string;
  whatsapp_access: string[];
  funnel_access: string[];
  whatsapp?: string;
}

interface CreateTeamMemberData {
  fullName: string;
  username: string;
  email?: string;
  password?: string;
  role: 'admin' | 'operational' | 'manager';
  whatsappAccess: string[];
  funnelAccess: string[];
  whatsappPersonal?: string;
}

export function useTeamManagement(companyId?: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ["team-members", companyId],
    queryFn: async (): Promise<TeamMember[]> => {
      if (!companyId) return [];

      const { data: profiles, error } = await supabase
        .from("profiles")
        .select(`
          *,
          whatsapp_access:user_whatsapp_numbers(whatsapp_number_id),
          funnel_access:user_funnels(funnel_id)
        `)
        .or(`created_by_user_id.eq.${companyId},id.eq.${companyId}`);

      if (error) throw error;

      return (profiles || []).map(profile => ({
        id: profile.id,
        full_name: profile.full_name,
        username: profile.username,
        email: profile.username ? `${profile.username}@domain.com` : undefined,
        role: profile.role,
        created_at: profile.created_at,
        whatsapp_access: profile.whatsapp_access?.map((w: any) => w.whatsapp_number_id) || [],
        funnel_access: profile.funnel_access?.map((f: any) => f.funnel_id) || [],
        whatsapp: profile.whatsapp,
      }));
    },
    enabled: !!companyId,
  });

  const { data: whatsappInstances = [] } = useQuery({
    queryKey: ["whatsapp-instances", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("whatsapp_instances")
        .select("*")
        .eq("created_by_user_id", companyId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: funnels = [] } = useQuery({
    queryKey: ["funnels", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("funnels")
        .select("*")
        .eq("created_by_user_id", companyId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const createTeamMember = useMutation({
    mutationFn: async (memberData: CreateTeamMemberData) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // 1. Gerar ID único
      const userId = crypto.randomUUID();
      
      // 2. Verificar se username já existe e criar um único se necessário
      let uniqueUsername = memberData.username;
      let counter = 1;
      
      // Tentar até 10 vezes para encontrar um username único
      while (counter <= 10) {
        const { data: existingUser } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", uniqueUsername)
          .eq("created_by_user_id", user.id)
          .single();
          
        if (!existingUser) {
          break; // Username disponível
        }
        
        uniqueUsername = `${memberData.username}${counter}`;
        counter++;
      }

      // 3. Criar perfil
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          full_name: memberData.fullName,
          username: uniqueUsername,
          role: memberData.role,
          created_by_user_id: user.id,
          whatsapp: memberData.whatsappPersonal,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      // 4. Atribuir acessos aos funis
      if (memberData.funnelAccess.length > 0) {
        const funnelInserts = memberData.funnelAccess.map(funnelId => ({
          profile_id: userId,
          funnel_id: funnelId,
          created_by_user_id: user.id,
        }));

        const { error: funnelError } = await supabase
          .from("user_funnels")
          .insert(funnelInserts);

        if (funnelError) throw funnelError;
      }

      // 5. Atribuir acessos às instâncias WhatsApp
      if (memberData.whatsappAccess.length > 0) {
        const whatsappInserts = memberData.whatsappAccess.map(whatsappId => ({
          profile_id: userId,
          whatsapp_number_id: whatsappId,
          created_by_user_id: user.id,
        }));

        const { error: whatsappError } = await supabase
          .from("user_whatsapp_numbers")
          .insert(whatsappInserts);

        if (whatsappError) throw whatsappError;
      }

      // 6. Enviar convite por email se fornecido
      if (memberData.email && memberData.password) {
        try {
          await supabase.functions.invoke('send_team_invite', {
            body: {
              email: memberData.email,
              full_name: memberData.fullName,
              tempPassword: memberData.password,
              companyId: user.id,
            }
          });
        } catch (emailError) {
          console.warn("Erro ao enviar email de convite:", emailError);
          // Não falha a criação do membro se o email falhar
        }
      }

      return { userId, finalUsername: uniqueUsername };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      const originalUsername = data.finalUsername.replace(/\d+$/, '');
      if (data.finalUsername !== originalUsername) {
        toast.success(`Membro criado com sucesso! Username final: ${data.finalUsername}`);
      } else {
        toast.success("Membro da equipe criado com sucesso!");
      }
    },
    onError: (error) => {
      console.error("Erro ao criar membro:", error);
      toast.error("Erro ao criar membro da equipe");
    },
  });

  const updateMemberAccess = useMutation({
    mutationFn: async ({ 
      memberId, 
      whatsappAccess, 
      funnelAccess 
    }: { 
      memberId: string; 
      whatsappAccess: string[]; 
      funnelAccess: string[] 
    }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // Remove acessos existentes
      await supabase
        .from("user_whatsapp_numbers")
        .delete()
        .eq("profile_id", memberId);

      await supabase
        .from("user_funnels")
        .delete()
        .eq("profile_id", memberId);

      // Adiciona novos acessos aos funis
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

      // Adiciona novos acessos ao WhatsApp
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Acessos do membro atualizados com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar acessos:", error);
      toast.error("Erro ao atualizar acessos do membro");
    },
  });

  const updateMemberRole = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: 'admin' | 'operational' | 'manager' }) => {
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

      // Tentar remover do auth (pode falhar se usuário não existir no auth)
      try {
        await supabase.auth.admin.deleteUser(memberId);
      } catch (error) {
        console.warn("Usuário não encontrado no auth ou erro ao remover:", error);
      }
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

  // Hook para obter funis e instâncias que o usuário atual tem acesso
  const { data: userAccessibleFunnels = [] } = useQuery({
    queryKey: ["user-accessible-funnels", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Verificar se é admin - tem acesso a todos
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === 'admin') {
        return funnels;
      }

      // Para operacionais, buscar apenas funis atribuídos
      const { data: userFunnels, error } = await supabase
        .from("user_funnels")
        .select("funnel_id, funnels(*)")
        .eq("profile_id", user.id);

      if (error) throw error;
      return userFunnels?.map(uf => uf.funnels).filter(Boolean) || [];
    },
    enabled: !!user?.id,
  });

  const { data: userAccessibleWhatsApp = [] } = useQuery({
    queryKey: ["user-accessible-whatsapp", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Verificar se é admin - tem acesso a todos
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === 'admin') {
        return whatsappInstances;
      }

      // Para operacionais, buscar apenas instâncias atribuídas
      const { data: userWhatsApp, error } = await supabase
        .from("user_whatsapp_numbers")
        .select("whatsapp_number_id, whatsapp_instances(*)")
        .eq("profile_id", user.id);

      if (error) throw error;
      return userWhatsApp?.map(uw => uw.whatsapp_instances).filter(Boolean) || [];
    },
    enabled: !!user?.id,
  });

  return {
    teamMembers,
    whatsappInstances,
    funnels,
    userAccessibleFunnels,
    userAccessibleWhatsApp,
    isLoading,
    createTeamMember,
    updateMemberAccess,
    updateMemberRole,
    removeMember,
    // Aliases para compatibilidade
    removeTeamMember: removeMember,
  };
}
