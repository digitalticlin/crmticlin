
import { useState, useEffect, useRef } from "react";
import { Loader2, Users, UserPlus, Crown, Settings, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamManagement } from "@/hooks/useTeamManagement";
import { useTeamMemberEditor } from "@/hooks/useTeamMemberEditor";
import { useTeamMemberAssignments } from "@/hooks/useTeamMemberAssignments";
import { useTeamAuxiliaryData } from "@/hooks/settings/useTeamAuxiliaryData";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { ModernTeamMembersList } from "./team/ModernTeamMembersList";
import { AddMemberModal } from "./team/AddMemberModal";
import { AddMemberButton } from "./team/AddMemberButton";

export default function TeamSettings() {
  console.log('[TeamSettings] Component rendering');
  
  const { user } = useAuth();
  console.log('[TeamSettings] User data:', user);
  
  const { permissions, loading: permissionsLoading } = useUserPermissions();
  console.log('[TeamSettings] Permissions data:', permissions, 'Loading:', permissionsLoading);
  // Hook principal - apenas criação e listagem
  const {
    teamMembers,
    isLoading,
    createTeamMember,
    resendInvite
  } = useTeamManagement(user?.id);

  // Hooks isolados para edição
  const { updateMemberProfile, removeMember } = useTeamMemberEditor(user?.id);
  const { updateMemberAssignments } = useTeamMemberAssignments(user?.id);

  const { allWhatsApps, allFunnels, auxDataLoading } = useTeamAuxiliaryData(user?.id);
  
  // State for modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Refs para controlar execuções
  const isUnmountedRef = useRef(false);

  // Filter out the admin user from team members
  const teamMembersFiltered = teamMembers.filter(member => member.id !== user?.id);

  // Cleanup no desmonte
  useEffect(() => {
    isUnmountedRef.current = false;
    return () => {
      isUnmountedRef.current = true;
      console.log('[TeamSettings] Component unmounting');
    };
  }, []);

  // Verificar permissões
  if (permissionsLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-yellow-500/30"></div>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-yellow-500 animate-spin"></div>
          </div>
          <p className="text-sm text-gray-700 font-medium">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!permissions.canManageTeam) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-2xl p-8 transition-all duration-300 hover:bg-white/50">
          <div className="text-center space-y-4">
            <Shield className="h-16 w-16 text-yellow-500 mx-auto" />
            <h3 className="text-xl font-bold text-gray-800">Acesso Restrito</h3>
            <p className="text-gray-700 font-medium">Apenas administradores podem gerenciar a equipe.</p>
            <div className="bg-yellow-50/60 backdrop-blur-sm border border-yellow-200/60 rounded-xl p-4 mt-4">
              <p className="text-sm text-yellow-700">
                Seu nível atual: <strong>{permissions.role?.toUpperCase()}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || auxDataLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-yellow-500/30"></div>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-yellow-500 animate-spin"></div>
          </div>
          <p className="text-sm text-gray-700 font-medium">Carregando equipe...</p>
        </div>
      </div>
    );
  }

  // Transform the mutation function to match AddMemberModal interface
  const handleCreateMember = async (data: {
    full_name: string;
    email: string;
    role: "operational" | "manager";
    assignedWhatsAppIds: string[];
    assignedFunnelIds: string[];
    whatsapp_personal?: string;
  }): Promise<boolean> => {
    console.log('[TeamSettings] Iniciando criação de membro com dados:', data);
    
    try {
      const result = await createTeamMember.mutateAsync({
        fullName: data.full_name,
        username: data.email.split('@')[0], // Extract username from email
        email: data.email,
        role: "operational" as const,
        whatsappAccess: data.assignedWhatsAppIds,
        funnelAccess: data.assignedFunnelIds,
        whatsappPersonal: data.whatsapp_personal,
      });
      
      console.log('[TeamSettings] Membro criado com sucesso:', result);
      return true;
    } catch (error) {
      console.error("[TeamSettings] Erro ao criar membro:", error);
      toast.error(`Erro ao criar membro: ${error.message || 'Erro desconhecido'}`);
      return false;
    }
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Card: Lista de Membros da Equipe */}
      <div className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-2xl p-8 transition-all duration-300 hover:bg-white/50 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/30 backdrop-blur-sm rounded-xl border border-white/40 shadow-glass">
              <Users className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Membros da Equipe</h3>
              <p className="text-gray-700 font-medium">Gerencie permissões e configurações dos membros</p>
            </div>
          </div>
          
          {/* Botão de Adicionar Membro */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-3 rounded-xl shadow-glass hover:shadow-glass-lg transition-all duration-200 flex items-center justify-center gap-2 w-full md:w-auto"
          >
            <UserPlus className="h-5 w-5" />
            Adicionar Membro
          </button>
        </div>

        <ModernTeamMembersList 
          members={teamMembersFiltered}
          onRemoveMember={removeMember.mutateAsync}
          onEditMember={async (memberId: string, data: any) => {
            try {
              console.log('[TeamSettings] ===== EDITANDO MEMBRO COM HOOKS ISOLADOS =====');
              console.log('[TeamSettings] Member ID:', memberId);
              console.log('[TeamSettings] Dados recebidos:', data);
              
              // 1. Atualizar dados do perfil (nome, email, role, whatsapp_personal)
              const profileData = {
                full_name: data.full_name,
                email: data.email,
                role: data.role,
                whatsapp_personal: data.whatsapp_personal
              };
              
              console.log('[TeamSettings] 👤 Atualizando perfil:', profileData);
              await updateMemberProfile.mutateAsync({ memberId, profileData });
              
              // 2. Atualizar atribuições (funis + WhatsApp) + transferir leads automaticamente
              const assignmentData = {
                funnelIds: data.assignedFunnelIds || [],
                whatsappIds: data.assignedWhatsAppIds || []
              };
              
              console.log('[TeamSettings] 🎯 Atualizando assignments:', assignmentData);
              await updateMemberAssignments.mutateAsync({ memberId, assignments: assignmentData });
              
              console.log('[TeamSettings] ✅ Edição completa bem-sucedida!');
              return true;
            } catch (error) {
              console.error('[TeamSettings] ❌ Erro ao editar membro:', error);
              return false;
            }
          }}
          onResendInvite={resendInvite.mutateAsync}
          allWhatsApps={allWhatsApps}
          allFunnels={allFunnels}
          loading={isLoading}
        />
      </div>

      {/* Modal de Adicionar Membro */}
      <AddMemberModal 
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSubmit={handleCreateMember}
        loading={createTeamMember.isPending}
        allWhatsApps={allWhatsApps}
        allFunnels={allFunnels}
      />
    </div>
  );
}
