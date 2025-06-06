import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "operational" | "manager";
  whatsapp_numbers: { id: string, instance_name: string }[];
  funnels: { id: string, name: string }[];
  created_at?: string;
}

interface CreateMemberData {
  full_name: string;
  email: string;
  password: string;
  role: "operational" | "manager";
  assignedWhatsAppIds: string[];
  assignedFunnelIds: string[];
}

export const useTeamManagement = (companyId?: string | null) => {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);

  // Carrega membros da empresa
  const fetchTeamMembers = async () => {
    if (!companyId) return;
    setLoading(true);
    
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select(`
          id, full_name, role, created_at,
          user_whatsapp_numbers (
            whatsapp_number_id,
            whatsapp_instances!inner (id, instance_name)
          ),
          user_funnels (
            funnel_id,
            funnels!inner (id, name)
          )
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Buscar emails dos usuários do auth
      const userIds = profiles?.map(p => p.id) || [];
      if (userIds.length === 0) {
        setMembers([]);
        setLoading(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) throw authError;

      const authUserMap = new Map<string, string>();
      authData.users.forEach((user: any) => {
        if (user.email) {
          authUserMap.set(user.id, user.email);
        }
      });

      setMembers(
        (profiles || []).map((p: any) => ({
          id: p.id,
          full_name: p.full_name || "Sem nome",
          email: authUserMap.get(p.id) || "Email não encontrado",
          role: p.role || "operational",
          created_at: p.created_at,
          whatsapp_numbers: (p.user_whatsapp_numbers || []).map((wn: any) => ({
            id: wn.whatsapp_number_id,
            instance_name: wn.whatsapp_instances?.instance_name || "",
          })),
          funnels: (p.user_funnels || []).map((f: any) => ({
            id: f.funnel_id,
            name: f.funnels?.name || "",
          })),
        }))
      );
    } catch (error: any) {
      console.error("Erro ao buscar membros:", error);
      toast.error("Erro ao carregar membros da equipe");
    } finally {
      setLoading(false);
    }
  };

  // Criar novo membro manualmente
  const createTeamMember = async (data: CreateMemberData) => {
    if (!companyId) {
      toast.error("ID da empresa não encontrado");
      return false;
    }

    setLoading(true);
    try {
      // 1. Criar usuário no auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: { 
          full_name: data.full_name,
          company_id: companyId,
          role: data.role
        },
      });

      if (authError || !authUser?.user) {
        throw new Error(authError?.message || "Erro ao criar usuário");
      }

      // 2. Criar/atualizar profile
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: authUser.user.id,
          full_name: data.full_name,
          company_id: companyId,
          role: data.role,
        });

      if (profileError) throw profileError;

      // 3. Atribuir WhatsApp numbers
      if (data.assignedWhatsAppIds.length > 0) {
        const whatsappAssignments = data.assignedWhatsAppIds.map(whatsappId => ({
          profile_id: authUser.user.id,
          whatsapp_number_id: whatsappId,
        }));

        const { error: whatsappError } = await supabase
          .from("user_whatsapp_numbers")
          .insert(whatsappAssignments);

        if (whatsappError) throw whatsappError;
      }

      // 4. Atribuir funis
      if (data.assignedFunnelIds.length > 0) {
        const funnelAssignments = data.assignedFunnelIds.map(funnelId => ({
          profile_id: authUser.user.id,
          funnel_id: funnelId,
        }));

        const { error: funnelError } = await supabase
          .from("user_funnels")
          .insert(funnelAssignments);

        if (funnelError) throw funnelError;
      }

      toast.success("Membro criado com sucesso!");
      await fetchTeamMembers();
      return true;
    } catch (error: any) {
      console.error("Erro ao criar membro:", error);
      toast.error(error.message || "Erro ao criar membro da equipe");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Remover membro da equipe
  const removeTeamMember = async (profileId: string) => {
    setLoading(true);
    try {
      // Deletar usuário do auth (isso vai cascatear para o profile)
      const { error } = await supabase.auth.admin.deleteUser(profileId);
      if (error) throw error;

      toast.success("Membro removido com sucesso!");
      await fetchTeamMembers();
    } catch (error: any) {
      console.error("Erro ao remover membro:", error);
      toast.error("Erro ao remover membro da equipe");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, [companyId]);

  return {
    members,
    loading,
    fetchTeamMembers,
    createTeamMember,
    removeTeamMember,
  };
};
