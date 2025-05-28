
import { useState, useMemo } from "react";
import Sidebar from "@/components/layout/Sidebar";
import ChartCard from "@/components/dashboard/ChartCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TeamInviteForm } from "@/components/settings/TeamInviteForm";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useTeamManagement } from "@/hooks/useTeamManagement";
import { toast } from "sonner";
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

  // Buscar todas instâncias WhatsApp e funis da empresa para usar em atribuições
  const [allWhatsApps, setAllWhatsApps] = useState<{ id: string; instance_name: string }[]>([]);
  const [allFunnels, setAllFunnels] = useState<{ id: string; name: string }[]>([]);

  useMemo(() => {
    async function fetchAux() {
      if (!companyId) return;
      // WhatsApp instances
      const { data: whatsapps } = await supabase
        .from("whatsapp_instances")
        .select("id, instance_name")
        .eq("company_id", companyId);
      setAllWhatsApps(whatsapps || []);
      // Funis
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

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">Gestão de Equipe</h1>
              <p className="text-muted-foreground">Gerencie os membros da sua equipe e suas permissões</p>
            </div>
            <Button className="bg-ticlin hover:bg-ticlin/90 text-black" onClick={fetchTeamMembers}>
              <Plus className="h-4 w-4 mr-2" />
              Atualizar lista
            </Button>
          </div>

          <ChartCard
            title="Novo membro"
            description="Convide um colaborador para sua equipe e já defina funis/instâncias permitidos"
          >
            <TeamInviteForm
              onInvite={inviteTeamMember}
              loading={loading}
              allWhatsApps={allWhatsApps}
              allFunnels={allFunnels}
            />
          </ChartCard>

          <ChartCard
            title="Membros da Equipe"
            description="Gerencie os membros da sua equipe e suas permissões"
            className="mt-4"
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
        </div>
      </main>
    </div>
  );
}
