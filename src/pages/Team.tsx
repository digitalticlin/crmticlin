
import { useState, useMemo } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { ModernPageHeader } from "@/components/layout/ModernPageHeader";
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle, ModernCardDescription } from "@/components/ui/modern-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { InviteMemberForm } from "@/components/settings/team/InviteMemberForm";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useTeamManagement } from "@/hooks/useTeamManagement";
import { supabase } from "@/integrations/supabase/client";
import { ModernTeamMembersList } from "@/components/settings/team/ModernTeamMembersList";

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
      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-2.5 font-medium shadow-lg transition-all duration-200 hover:shadow-xl"
      onClick={fetchTeamMembers}
    >
      <Plus className="h-4 w-4 mr-2" />
      Atualizar Lista
    </Button>
  );

  return (
    <PageLayout>
      <ModernPageHeader 
        title="Gestão de Equipe" 
        description="Gerencie os membros da sua equipe e suas permissões"
        action={addMemberAction}
      />

      <div className="space-y-8">
        {/* Invite Member Form */}
        <ModernCard>
          <ModernCardHeader>
            <ModernCardTitle>Novo Membro</ModernCardTitle>
            <ModernCardDescription>
              Convide um colaborador para sua equipe e já defina funis/instâncias permitidos
            </ModernCardDescription>
          </ModernCardHeader>
          <ModernCardContent>
            <InviteMemberForm
              onSubmit={handleInvite}
              loading={loading}
              allWhatsApps={allWhatsApps}
              allFunnels={allFunnels}
            />
          </ModernCardContent>
        </ModernCard>

        {/* Team Members List */}
        <ModernCard>
          <ModernCardHeader>
            <ModernCardTitle>Membros da Equipe</ModernCardTitle>
            <ModernCardDescription>
              Gerencie os membros da sua equipe e suas permissões
            </ModernCardDescription>
          </ModernCardHeader>
          <ModernCardContent>
            <ModernTeamMembersList 
              members={members}
              onRemoveMember={removeTeamMember}
            />
          </ModernCardContent>
        </ModernCard>
      </div>
    </PageLayout>
  );
}
