
import { useState, useEffect, useRef } from "react";
import { Loader2, Users, UserPlus, Crown, Settings } from "lucide-react";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useTeamManagement } from "@/hooks/useTeamManagement";
import { useTeamAuxiliaryData } from "@/hooks/settings/useTeamAuxiliaryData";
import { InviteMemberModal } from "./InviteMemberModal";
import { TeamHeader } from "./team/TeamHeader";
import { TeamMembersList } from "./team/TeamMembersList";

export default function TeamSettings() {
  console.log('[TeamSettings] Component rendering');
  
  const { companyId } = useCompanyData();
  const {
    members,
    loading,
    inviteTeamMember,
    removeTeamMember,
  } = useTeamManagement(companyId);

  const { allWhatsApps, allFunnels, auxDataLoading } = useTeamAuxiliaryData(companyId);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  
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

  if (loading || auxDataLoading) {
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

  return (
    <div className="space-y-8">
      {/* Add New Member Section */}
      <div className="bg-white/35 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-[#D3D800]/20 to-[#D3D800]/10 rounded-2xl">
              <UserPlus className="h-6 w-6 text-[#D3D800]" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Adicionar Membro</h3>
              <p className="text-gray-700">Convide novos colaboradores para sua equipe</p>
            </div>
          </div>
          
          <button
            onClick={() => setInviteModalOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#D3D800] to-[#D3D800]/80 hover:from-[#D3D800]/90 hover:to-[#D3D800]/70 text-black font-semibold rounded-xl transition-all duration-200 hover:scale-105 flex items-center space-x-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>Convidar Membro</span>
          </button>
        </div>
      </div>

      {/* Team Overview */}
      <div className="bg-white/35 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8 animate-fade-in" style={{ animationDelay: "100ms" }}>
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
                <p className="text-2xl font-bold text-gray-800">{members.length}</p>
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
                  {members.filter(m => m.role === 'admin').length}
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
                <p className="text-sm text-gray-700">Funções Ativas</p>
                <p className="text-2xl font-bold text-gray-800">
                  {new Set(members.map(m => m.role)).size}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members List */}
      <div className="bg-white/35 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8 animate-fade-in" style={{ animationDelay: "200ms" }}>
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
          members={members}
          onRemoveMember={removeTeamMember}
        />
      </div>

      <InviteMemberModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onInvite={inviteTeamMember}
        loading={loading}
        allWhatsApps={allWhatsApps}
        allFunnels={allFunnels}
      />
    </div>
  );
}
