import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

export interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  must_change_password: boolean;
  whatsapp_numbers: { id: string, instance_name: string }[];
  funnels: { id: string, name: string }[];
}

const allowedRoles = ["admin", "seller", "custom"] as const;
type Role = typeof allowedRoles[number];

function getValidRole(role: any): Role {
  return allowedRoles.includes(role) ? role : "seller";
}

export const useTeamManagement = (companyId?: string | null) => {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);

  // Carrega membros da empresa
  const fetchTeamMembers = async () => {
    if (!companyId) return;
    setLoading(true);
    // Buscar membros da empresa, role != 'admin' inclusive
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select(`
        id, full_name, email, role, must_change_password, 
        user_whatsapp_numbers (
          id,
          whatsapp_number_id,
          whatsapp_numbers (instance_name)
        ),
        user_funnels (
          id,
          funnel_id,
          funnels (name)
        )
      `)
      .eq("company_id", companyId);

    if (error) {
      toast.error("Erro ao buscar equipe");
      setLoading(false);
      return;
    }

    setMembers(
      (profiles || []).map((p: any) => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        role: getValidRole(p.role),
        must_change_password: !!p.must_change_password,
        whatsapp_numbers: (p.user_whatsapp_numbers || []).map((wn: any) => ({
          id: wn.whatsapp_number_id,
          instance_name: wn.whatsapp_numbers?.instance_name || "",
        })),
        funnels: (p.user_funnels || []).map((f: any) => ({
          id: f.funnel_id,
          name: f.funnels?.name || "",
        })),
      })),
    );
    setLoading(false);
  };

  // Convidar novo membro (cria no banco e aciona edge function para email)
  const inviteTeamMember = async ({
    full_name,
    email,
    role,
    assignedWhatsAppIds,
    assignedFunnelIds,
  }: {
    full_name: string;
    email: string;
    role: string;
    assignedWhatsAppIds: string[];
    assignedFunnelIds: string[];
  }) => {
    setLoading(true);
    // 1. Gerar senha temporária
    const tempPassword = uuidv4().slice(0, 8) + "A!";
    // 2. Criar usuário no auth
    const { data: signUp, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name, company_id: companyId, role },
    });

    if (signUpError || !signUp?.user) {
      toast.error("Erro ao criar usuário");
      setLoading(false);
      return false;
    }

    // 3. Atualizar profile: garantir campos/flags e role
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name,
        company_id: companyId,
        role,
        must_change_password: true,
      })
      .eq("id", signUp.user.id);

    if (profileError) {
      toast.error("Não foi possível completar cadastro do colaborador");
      setLoading(false);
      return false;
    }

    // 4. Atribuir instâncias WhatsApp
    for (const wid of assignedWhatsAppIds) {
      await supabase.from("user_whatsapp_numbers").insert({
        profile_id: signUp.user.id,
        whatsapp_number_id: wid,
      });
    }
    // 5. Atribuir funis
    for (const fid of assignedFunnelIds) {
      await supabase.from("user_funnels").insert({
        profile_id: signUp.user.id,
        funnel_id: fid,
      });
    }

    // 6. Acionar edge function para enviar email convite
    await fetch("/functions/v1/send_team_invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        full_name,
        tempPassword,
        companyId,
      }),
    });

    toast.success("Convite enviado por email!");
    setLoading(false);
    fetchTeamMembers();
    return true;
  };

  // Remover membro da equipe
  const removeTeamMember = async (profileId: string) => {
    setLoading(true);
    const { error } = await supabase.from("profiles").delete().eq("id", profileId);
    if (error) toast.error("Erro ao remover membro!");
    else toast.success("Membro removido.");
    fetchTeamMembers();
    setLoading(false);
  };

  useEffect(() => {
    fetchTeamMembers();
  }, [companyId]);

  return {
    members,
    loading,
    fetchTeamMembers,
    inviteTeamMember,
    removeTeamMember,
  };
};
