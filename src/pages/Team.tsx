
import { useState, useMemo } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import ChartCard from "@/components/dashboard/ChartCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { InviteMemberForm } from "@/components/settings/team/InviteMemberForm";
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

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

  const refreshAction = (
    <Button className="bg-ticlin hover:bg-ticlin/90 text-black" onClick={fetchTeamMembers}>
      <Plus className="h-4 w-4 mr-2" />
      Atualizar lista
    </Button>
  );

  return (
    <PageLayout>
      <PageHeader 
        title="Gestão de Equipe" 
        description="Gerencie os membros da sua equipe e suas permissões"
        action={refreshAction}
      />

      <ChartCard
        title="Novo membro"
        description="Convide um colaborador para sua equipe e já defina funis/instâncias permitidos"
      >
        <InviteMemberForm
          onSubmit={handleInvite}
          loading={loading}
          allWhatsApps={allWhatsApps}
          allFunnels={allFunnels}
        />
      </ChartCard>

      <ChartCard
        title="Membros da Equipe"
        description="Gerencie os membros da sua equipe e suas permissões"
      >
        <div className="space-y-4 mt-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 font-medium">Membro</th>
                  <th className="pb-2 font-medium">Função</th>
                  <th className="pb-2 font-medium">Números WhatsApp</th>
                  <th className="pb-2 font-medium">Funis</th>
                  <th className="pb-2 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-4">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarFallback className="bg-ticlin/20 text-black">
                            {getInitials(member.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.full_name}</div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                          {member.must_change_password && (
                            <span className="text-xs text-red-500">Precisa trocar senha</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4">{member.role === "seller" ? "Vendedor(a)" : "Personalizado"}</td>
                    <td className="py-4">
                      <div className="flex flex-wrap gap-1">
                        {member.whatsapp_numbers.map((w) => (
                          <span key={w.id} className="bg-gray-100 text-xs p-1 rounded">{w.instance_name}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-wrap gap-1">
                        {member.funnels.map((f) => (
                          <span key={f.id} className="bg-gray-100 text-xs p-1 rounded">{f.name}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeTeamMember(member.id)}
                      >
                        Remover
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {members.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum membro na equipe. Adicione membros para começar.</p>
            </div>
          )}
        </div>
      </ChartCard>
    </PageLayout>
  );
}
