import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { UserCheck, Save, X, Edit, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  full_name: string;
  username?: string;
  role: 'admin' | 'operational' | 'manager';
}

interface AssignedUserSectionProps {
  assignedUser?: string;
  onUpdateAssignedUser: (userId: string) => void;
  isLoading: boolean;
}

export const AssignedUserSection = ({
  assignedUser,
  onUpdateAssignedUser,
  isLoading
}: AssignedUserSectionProps) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(assignedUser || '');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);

  // ✅ NOVO: Buscar membros da equipe
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!user?.id) return;

      setLoadingTeam(true);
      try {
        console.log('[AssignedUserSection] 👥 Buscando membros da equipe para:', user.id);

        // Buscar todos os usuários criados pelo admin atual + o próprio admin
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, role')
          .or(`created_by_user_id.eq.${user.id},id.eq.${user.id}`)
          .order('full_name');

        if (error) {
          console.error('[AssignedUserSection] ❌ Erro ao buscar equipe:', error);
          throw error;
        }

        const members = (profiles || []).map(profile => ({
          id: profile.id,
          full_name: profile.full_name || 'Usuário sem nome',
          username: profile.username,
          role: profile.role
        }));

        console.log('[AssignedUserSection] ✅ Membros da equipe carregados:', {
          count: members.length,
          members: members.map(m => ({ id: m.id, name: m.full_name, role: m.role }))
        });

        setTeamMembers(members);
      } catch (error: any) {
        console.error('[AssignedUserSection] ❌ Erro ao carregar equipe:', error);
        toast.error('Erro ao carregar membros da equipe');
      } finally {
        setLoadingTeam(false);
      }
    };

    fetchTeamMembers();
  }, [user?.id]);

  // ✅ ATUALIZAR: Sincronizar selectedUserId quando assignedUser muda
  useEffect(() => {
    setSelectedUserId(assignedUser || '');
  }, [assignedUser]);

  const startEditing = () => {
    setIsEditing(true);
    setSelectedUserId(assignedUser || '');
  };

  const saveUser = async () => {
    if (selectedUserId !== (assignedUser || '')) {
      await onUpdateAssignedUser(selectedUserId);
    }
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setSelectedUserId(assignedUser || '');
    setIsEditing(false);
  };

  // ✅ ENCONTRAR: Nome do usuário atual
  const currentUserName = teamMembers.find(member => member.id === assignedUser)?.full_name;

  // ✅ MOSTRAR: Loading se estiver carregando equipe
  if (loadingTeam) {
    return (
      <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/40">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Users className="h-5 w-5 text-lime-400" />
            Usuário Responsável
          </h3>
        </div>
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-lime-400"></div>
          <span className="ml-2 text-sm text-gray-600">Carregando equipe...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/40">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Users className="h-5 w-5 text-lime-400" />
          Usuário Responsável
        </h3>
        {!isEditing && (
          <Button
            onClick={startEditing}
            variant="ghost"
            size="sm"
            className="text-lime-400 hover:text-lime-500 hover:bg-lime-50 rounded-lg text-xs px-2 py-1"
            disabled={teamMembers.length === 0}
          >
            <Edit className="h-3 w-3 mr-1" />
            Alterar
          </Button>
        )}
      </div>

      <div className="space-y-1">
        <Label className="text-gray-700 font-medium flex items-center gap-2 text-sm">
          <UserCheck className="h-3 w-3 text-lime-400" />
          Responsável pelo Atendimento
        </Label>

        {isEditing ? (
          <div className="space-y-3">
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              disabled={isLoading}
            >
              <SelectTrigger className="bg-white/80 border-white/40 focus:border-lime-400 focus:ring-lime-400/20 text-sm h-10">
                <SelectValue placeholder="Selecione um usuário..." />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.length === 0 ? (
                  <SelectItem value="" disabled>
                    Nenhum membro encontrado
                  </SelectItem>
                ) : (
                  teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{member.full_name}</span>
                        <span className="text-xs text-gray-500 capitalize">
                          ({member.role === 'admin' ? 'Administrador' : 
                            member.role === 'manager' ? 'Gerente' : 
                            'Operacional'})
                        </span>
                        {member.username && (
                          <span className="text-xs text-gray-400">
                            @{member.username}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={saveUser}
                disabled={isLoading || selectedUserId === (assignedUser || '')}
                className="bg-lime-400/80 hover:bg-lime-500/80 text-black border border-lime-400 shadow-lg rounded-lg font-semibold text-xs h-6 px-2 flex-1"
              >
                <Save className="h-3 w-3 mr-1" />
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={cancelEdit}
                disabled={isLoading}
                className="text-gray-600 border-gray-300 hover:bg-gray-50 text-xs h-6 px-2"
              >
                <X className="h-3 w-3 mr-1" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div 
            className="text-gray-700 text-sm break-words cursor-pointer hover:bg-gray-50/60 p-3 rounded-lg transition-colors border border-gray-200/50"
            onClick={startEditing}
          >
            {currentUserName ? (
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-lime-500" />
                <span className="font-medium">{currentUserName}</span>
                {teamMembers.find(m => m.id === assignedUser)?.role && (
                  <span className="text-xs bg-lime-100 text-lime-700 px-2 py-1 rounded-full">
                    {teamMembers.find(m => m.id === assignedUser)?.role === 'admin' ? 'Admin' :
                     teamMembers.find(m => m.id === assignedUser)?.role === 'manager' ? 'Gerente' : 'Operacional'}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-gray-400 italic flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-gray-300" />
                Clique para atribuir um responsável
              </span>
            )}
          </div>
        )}
      </div>

      {teamMembers.length === 0 && !loadingTeam && (
        <div className="mt-3 p-3 bg-yellow-50/80 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-700">
            <strong>Aviso:</strong> Nenhum membro da equipe encontrado. 
            Verifique se há usuários cadastrados no sistema.
          </p>
        </div>
      )}
    </div>
  );
}; 