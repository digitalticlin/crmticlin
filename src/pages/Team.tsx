
import { useState, useMemo } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { ModernPageHeader } from "@/components/layout/ModernPageHeader";
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle, ModernCardDescription } from "@/components/ui/modern-card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useTeamManagement } from "@/hooks/useTeamManagement";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { supabase } from "@/integrations/supabase/client";
import { ModernTeamMembersList } from "@/components/settings/team/ModernTeamMembersList";
import { ManualMemberForm } from "@/components/settings/team/ManualMemberForm";

export default function Team() {
  const { companyId } = useCompanyData();
  const { permissions, loading: permissionsLoading } = useUserPermissions();
  const {
    teamMembers,
    isLoading,
    createTeamMember,
    removeMember,
  } = useTeamManagement(companyId);

  const [allWhatsApps, setAllWhatsApps] = useState<{ id: string; instance_name: string }[]>([]);
  const [allFunnels, setAllFunnels] = useState<{ id: string; name: string }[]>([]);

  // Verificar se o usuário tem permissão para gerenciar equipe
  if (permissionsLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#D3D800]"></div>
        </div>
      </PageLayout>
    );
  }

  if (!permissions.canManageTeam) {
    return (
      <PageLayout>
        <ModernPageHeader 
          title="Acesso Negado" 
          description="Você não tem permissão para acessar esta página"
        />
        <ModernCard>
          <ModernCardContent className="text-center py-8">
            <p className="text-gray-600">Apenas administradores podem gerenciar a equipe.</p>
          </ModernCardContent>
        </ModernCard>
      </PageLayout>
    );
  }

  useMemo(() => {
    async function fetchAux() {
      if (!companyId) return;
      const { data: whatsapps } = await supabase
        .from("whatsapp_instances")
        .select("id, instance_name")
        .eq("created_by_user_id", companyId);
      setAllWhatsApps(whatsapps || []);
      
      const { data: funnels } = await supabase
        .from("funnels")
        .select("id, name")
        .eq("created_by_user_id", companyId);
      setAllFunnels(funnels || []);
    }
    fetchAux();
  }, [companyId]);

  const refreshAction = (
    <Button 
      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-2.5 font-medium shadow-lg transition-all duration-200 hover:shadow-xl"
      onClick={() => window.location.reload()}
      disabled={isLoading}
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
      Atualizar
    </Button>
  );

  // Transform the mutation function to match ManualMemberForm interface
  const handleCreateMember = async (data: {
    full_name: string;
    email: string;
    password: string;
    role: "operational" | "manager";
    assignedWhatsAppIds: string[];
    assignedFunnelIds: string[];
  }): Promise<boolean> => {
    try {
      await createTeamMember.mutateAsync({
        fullName: data.full_name,
        username: data.email.split('@')[0],
        role: data.role === "manager" ? "admin" : "operational",
        whatsappAccess: data.assignedWhatsAppIds,
        funnelAccess: data.assignedFunnelIds,
      });
      return true;
    } catch (error) {
      console.error("Error creating member:", error);
      return false;
    }
  };

  const handleRemoveMember = (memberId: string) => {
    removeMember.mutate(memberId);
  };

  return (
    <PageLayout>
      <ModernPageHeader 
        title="Gestão de Equipe" 
        description="Gerencie os membros da sua equipe e suas permissões"
        action={refreshAction}
      />

      <div className="space-y-8">
        {/* Formulário para adicionar membro */}
        <ManualMemberForm
          onSubmit={handleCreateMember}
          loading={isLoading}
          allWhatsApps={allWhatsApps}
          allFunnels={allFunnels}
        />

        {/* Lista de membros da equipe */}
        <ModernCard>
          <ModernCardHeader>
            <ModernCardTitle>Membros da Equipe</ModernCardTitle>
            <ModernCardDescription>
              Gerencie os membros da sua equipe e suas permissões
            </ModernCardDescription>
          </ModernCardHeader>
          <ModernCardContent>
            <ModernTeamMembersList 
              members={teamMembers}
              onRemoveMember={handleRemoveMember}
              loading={isLoading}
            />
          </ModernCardContent>
        </ModernCard>
      </div>
    </PageLayout>
  );
}
