
import { useState, useMemo } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { InviteMemberForm } from "@/components/settings/team/InviteMemberForm";
import { TeamMembersList } from "@/components/settings/team/TeamMembersList";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useTeamManagement } from "@/hooks/useTeamManagement";
import { supabase } from "@/integrations/supabase/client";

export default function Team() {
  const { companyId } = useCompanyData();
  const {
    members,
    loading,
    fetchTeamMembers,
    inviteTeamMember,
    removeTeamMember,
  } = useTeamManagement(companyId);

  const [allWhatsApps, setAllWhatsApps] = useState<{ id: string; instance_name: string }[]>([]);
  const [allFunnels, setAllFunnels] = useState<{ id: string; name: string }[]>([]);

  useMemo(() => {
    async function fetchAux() {
      if (!companyId) return;
      const { data: whatsapps } = await supabase
        .from("whatsapp_instances")
        .select("id, instance_name")
        .eq("company_id", companyId);
      setAllWhatsApps(whatsapps || []);
      const { data: funnels } = await supabase
        .from("funnels")
        .select("id, name")
        .eq("company_id", companyId);
      setAllFunnels(funnels || []);
    }
    fetchAux();
  }, [companyId]);

  const handleInvite = async (data: {
    full_name: string;
    email: string;
    role: string;
    assignedWhatsAppIds: string[];
    assignedFunnelIds: string[];
  }) => {
    const roleTyped = data.role as "admin" | "seller" | "custom";
    const success = await inviteTeamMember({
      ...data,
      role: roleTyped,
    });
  };

  const addMemberAction = (
    <Button 
      onClick={fetchTeamMembers}
    >
      <Plus className="h-4 w-4 mr-2" />
      Atualizar Lista
    </Button>
  );

  return (
    <PageLayout>
      <PageHeader 
        title="Gestão de Equipe" 
        description="Gerencie os membros da sua equipe e suas permissões"
        action={addMemberAction}
      />

      <div className="space-y-8">
        {/* Invite Member Form */}
        <Card>
          <CardHeader>
            <CardTitle>Novo Membro</CardTitle>
            <CardDescription>
              Convide um colaborador para sua equipe e já defina funis/instâncias permitidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InviteMemberForm
              onSubmit={handleInvite}
              loading={loading}
              allWhatsApps={allWhatsApps}
              allFunnels={allFunnels}
            />
          </CardContent>
        </Card>

        {/* Team Members List */}
        <Card>
          <CardHeader>
            <CardTitle>Membros da Equipe</CardTitle>
            <CardDescription>
              Gerencie os membros da sua equipe e suas permissões
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TeamMembersList 
              members={members}
              onRemoveMember={removeTeamMember}
            />
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
