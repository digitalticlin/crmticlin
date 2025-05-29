
import { useState, useEffect, useRef } from "react";
import ChartCard from "@/components/dashboard/ChartCard";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useTeamManagement } from "@/hooks/useTeamManagement";
import { supabase } from "@/integrations/supabase/client";
import { InviteMemberModal } from "./InviteMemberModal";

export default function TeamSettings() {
  console.log('[TeamSettings] Component rendering');
  
  const { companyId } = useCompanyData();
  const {
    members,
    loading,
    fetchTeamMembers,
    inviteTeamMember,
    removeTeamMember,
  } = useTeamManagement(companyId);

  // Estado para dados auxiliares
  const [allWhatsApps, setAllWhatsApps] = useState<{ id: string; instance_name: string }[]>([]);
  const [allFunnels, setAllFunnels] = useState<{ id: string; name: string }[]>([]);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [auxDataLoading, setAuxDataLoading] = useState(false);
  
  // Refs para controlar execuções
  const auxDataLoadedRef = useRef(false);
  const isUnmountedRef = useRef(false);

  // Cleanup no desmonte
  useEffect(() => {
    isUnmountedRef.current = false;
    return () => {
      isUnmountedRef.current = true;
      console.log('[TeamSettings] Component unmounting');
    };
  }, []);

  // Buscar dados auxiliares apenas UMA vez quando companyId estiver disponível
  useEffect(() => {
    if (!companyId || auxDataLoadedRef.current || isUnmountedRef.current) {
      console.log('[TeamSettings] Skipping aux data fetch - no companyId or already loaded');
      return;
    }

    const fetchAuxData = async () => {
      try {
        console.log('[TeamSettings] Fetching auxiliary data for company:', companyId);
        setAuxDataLoading(true);
        auxDataLoadedRef.current = true;

        // Buscar WhatsApp instances
        const { data: whatsapps, error: whatsappError } = await supabase
          .from("whatsapp_instances")
          .select("id, instance_name")
          .eq("company_id", companyId);

        if (isUnmountedRef.current) return;

        if (whatsappError) {
          console.error('[TeamSettings] Error fetching WhatsApp instances:', whatsappError);
        } else {
          setAllWhatsApps(whatsapps || []);
          console.log('[TeamSettings] WhatsApp instances loaded:', whatsapps?.length || 0);
        }

        // Buscar Funis
        const { data: funnels, error: funnelsError } = await supabase
          .from("funnels")
          .select("id, name")
          .eq("company_id", companyId);

        if (isUnmountedRef.current) return;

        if (funnelsError) {
          console.error('[TeamSettings] Error fetching funnels:', funnelsError);
        } else {
          setAllFunnels(funnels || []);
          console.log('[TeamSettings] Funnels loaded:', funnels?.length || 0);
        }
      } catch (error) {
        if (!isUnmountedRef.current) {
          console.error('[TeamSettings] Error in fetchAuxData:', error);
        }
      } finally {
        if (!isUnmountedRef.current) {
          setAuxDataLoading(false);
        }
      }
    };

    fetchAuxData();
  }, [companyId]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading || auxDataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-ticlin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button
          className="bg-gradient-to-tr from-[#9b87f5] to-[#6E59A5] text-white font-bold shadow-lg"
          onClick={() => setInviteModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
      </div>

      <InviteMemberModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onInvite={inviteTeamMember}
        loading={loading}
        allWhatsApps={allWhatsApps}
        allFunnels={allFunnels}
      />

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
    </div>
  );
}
