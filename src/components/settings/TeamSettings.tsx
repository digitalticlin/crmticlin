
import { useState, useEffect, useRef } from "react";
import { Loader2, Users, UserPlus, Crown, Settings, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamManagement } from "@/hooks/useTeamManagement";
import { useTeamAuxiliaryData } from "@/hooks/settings/useTeamAuxiliaryData";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { TeamMembersList } from "./team/TeamMembersList";
import { AddMemberModal } from "./team/AddMemberModal";
import { AddMemberButton } from "./team/AddMemberButton";

export default function TeamSettings() {
  console.log('[TeamSettings] Component rendering');
  
  const { user } = useAuth();
  const { permissions, loading: permissionsLoading } = useUserPermissions();
  const {
    teamMembers,
    isLoading,
    createTeamMember,
    removeMember,
  } = useTeamManagement(user?.id);

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
    password: string;
    role: "operational" | "manager";
    assignedWhatsAppIds: string[];
    assignedFunnelIds: string[];
    whatsapp_personal?: string;
  }): Promise<boolean> => {
    try {
      await createTeamMember.mutateAsync({
        fullName: data.full_name,
        username: data.email.split('@')[0], // Extract username from email
        email: data.email,
        password: data.password,
        role: data.role === "manager" ? "manager" : "operational",
        whatsappAccess: data.assignedWhatsAppIds,
        funnelAccess: data.assignedFunnelIds,
        whatsappPersonal: data.whatsapp_personal,
      });
      return true;
    } catch (error) {
      console.error("Error creating member:", error);
      return false;
    }
  };

  return (
    <div className="space-y-8">
      {/* 1º Card: Visão Geral da Equipe */}
      <div className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-2xl p-8 transition-all duration-300 hover:bg-white/50 animate-fade-in">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-white/30 backdrop-blur-sm rounded-xl border border-white/40 shadow-glass">
            <Users className="h-6 w-6 text-yellow-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Visão Geral da Equipe</h3>
            <p className="text-gray-700 font-medium">Estatísticas e informações gerais</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/30 backdrop-blur-sm border border-white/30 shadow-glass rounded-xl p-6 transition-all duration-300 hover:bg-white/40">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Users className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-700 font-medium">Total de Membros</p>
                <p className="text-2xl font-bold text-gray-800">{teamMembersFiltered.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/30 backdrop-blur-sm border border-white/30 shadow-glass rounded-xl p-6 transition-all duration-300 hover:bg-white/40">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Crown className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-gray-700 font-medium">Gestores</p>
                <p className="text-2xl font-bold text-gray-800">
                  {teamMembersFiltered.filter(m => m.role === 'manager').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/30 backdrop-blur-sm border border-white/30 shadow-glass rounded-xl p-6 transition-all duration-300 hover:bg-white/40">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Settings className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-700 font-medium">Operacionais</p>
                <p className="text-2xl font-bold text-gray-800">
                  {teamMembersFiltered.filter(m => m.role === 'operational').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2º Card: Lista de Membros da Equipe */}
      <div className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-2xl p-8 transition-all duration-300 hover:bg-white/50 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center justify-between mb-6">
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
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-3 rounded-xl shadow-glass hover:shadow-glass-lg transition-all duration-200 flex items-center gap-2"
          >
            <UserPlus className="h-5 w-5" />
            Adicionar Membro
          </button>
        </div>

        <TeamMembersList 
          members={teamMembersFiltered}
          onRemoveMember={removeMember.mutateAsync}
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
