
import { useState, useEffect, useRef } from "react";
import { Loader2, Users, UserPlus, Crown, Settings } from "lucide-react";
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
            <div className="absolute inset-0 rounded-full border-2 border-[#D3D800]/30"></div>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#D3D800] animate-spin"></div>
          </div>
          <p className="text-sm text-gray-700">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!permissions.canManageTeam) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Settings className="h-16 w-16 text-gray-400 mx-auto" />
          <h3 className="text-lg font-semibold text-gray-800">Acesso Restrito</h3>
          <p className="text-gray-600">Apenas administradores podem gerenciar a equipe.</p>
        </div>
      </div>
    );
  }

  if (isLoading || auxDataLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-[#D3D800]/30"></div>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#D3D800] animate-spin"></div>
          </div>
          <p className="text-sm text-gray-700">Carregando equipe...</p>
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

  return (
    <div className="space-y-8">
      {/* 1º Card: Visão Geral da Equipe */}
      <div className="bg-white/35 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8 animate-fade-in">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-blue-500/20 to-blue-400/10 rounded-2xl">
            <Users className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Visão Geral da Equipe</h3>
            <p className="text-gray-700">Estatísticas e informações gerais</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/20 rounded-2xl p-6 border border-white/20">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Users className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-700">Total de Membros</p>
                <p className="text-2xl font-bold text-gray-800">{teamMembers.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/20 rounded-2xl p-6 border border-white/20">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Crown className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-700">Administradores</p>
                <p className="text-2xl font-bold text-gray-800">
                  {teamMembers.filter(m => m.role === 'admin').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/20 rounded-2xl p-6 border border-white/20">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Settings className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-700">Operacionais</p>
                <p className="text-2xl font-bold text-gray-800">
                  {teamMembers.filter(m => m.role === 'operational').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2º Card: Lista de Membros da Equipe */}
      <div className="bg-white/35 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-green-500/20 to-green-400/10 rounded-2xl">
            <Users className="h-6 w-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Membros da Equipe</h3>
            <p className="text-gray-700">Gerencie permissões e configurações dos membros</p>
          </div>
        </div>

        <TeamMembersList 
          members={teamMembers}
          onRemoveMember={removeMember.mutateAsync}
        />
      </div>

      {/* Botão para Adicionar Membro */}
      <AddMemberButton onClick={() => setIsAddModalOpen(true)} />

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
