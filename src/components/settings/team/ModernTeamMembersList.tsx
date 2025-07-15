
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Shield, User, Crown, Users, Phone, TrendingUp, Edit } from "lucide-react";
import { TeamMember } from "@/hooks/useTeamManagement";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ModernTeamMembersListProps {
  members: TeamMember[];
  onRemoveMember: (memberId: string) => void;
  loading?: boolean;
}

export const ModernTeamMembersList = ({
  members,
  onRemoveMember,
  loading = false
}: ModernTeamMembersListProps) => {
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  const getRoleInfo = (role: string) => {
    switch (role) {
      case "admin":
        return {
          label: "ADMINISTRADOR",
          icon: Crown,
          color: "bg-yellow-100/80 text-yellow-800 border-yellow-300/60",
          bgColor: "bg-yellow-50/60",
          description: "Acesso total ao sistema, incluindo gestão de equipe"
        };
      case "manager":
        return {
          label: "GESTOR",
          icon: TrendingUp,
          color: "bg-purple-100/80 text-purple-800 border-purple-300/60",
          bgColor: "bg-purple-50/60",
          description: "Acesso completo exceto gestão de equipe"
        };
      case "operational":
        return {
          label: "OPERACIONAL",
          icon: User,
          color: "bg-blue-100/80 text-blue-800 border-blue-300/60",
          bgColor: "bg-blue-50/60",
          description: "Acesso limitado aos recursos vinculados"
        };
      default:
        return {
          label: "DESCONHECIDO",
          icon: Shield,
          color: "bg-gray-100/80 text-gray-800 border-gray-300/60",
          bgColor: "bg-gray-50/60",
          description: "Função não definida"
        };
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-yellow-500/30"></div>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-yellow-500 animate-spin"></div>
          </div>
          <p className="text-sm text-gray-700 font-medium">Carregando membros da equipe...</p>
        </div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-2xl p-8 transition-all duration-300 hover:bg-white/50">
          <Users className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Nenhum membro da equipe</h3>
          <p className="text-gray-600 font-medium">Adicione o primeiro membro usando o botão acima</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {members.map((member) => {
        const roleInfo = getRoleInfo(member.role);
        const initials = getInitials(member.full_name);

        return (
          <div
            key={member.id}
            className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-2xl p-6 transition-all duration-300 hover:bg-white/50 hover:shadow-glass-lg"
          >
            <div className="flex items-start justify-between">
              {/* Informações do Membro */}
              <div className="flex items-start gap-4 flex-1">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <Avatar className="h-12 w-12 border-2 border-white/40 shadow-glass">
                    <AvatarFallback className="bg-yellow-500/20 text-yellow-700 font-bold text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Detalhes */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-bold text-gray-900 truncate">
                      {member.full_name}
                    </h4>
                    <Badge className={`${roleInfo.color} backdrop-blur-sm font-medium`}>
                      <roleInfo.icon className="h-3 w-3 mr-1" />
                      {roleInfo.label}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {member.email && (
                      <p className="text-sm text-gray-700 font-medium">
                        📧 {member.email}
                      </p>
                    )}
                    
                    {member.whatsapp && (
                      <p className="text-sm text-gray-700 font-medium flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {member.whatsapp}
                      </p>
                    )}

                    <p className="text-xs text-gray-600">
                      {roleInfo.description}
                    </p>

                    {/* Acessos - Apenas para Operacionais */}
                    {member.role === "operational" && (
                      <div className="mt-3 space-y-2">
                        {member.funnel_access.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-700">Funis:</span>
                            <span className="text-xs bg-white/40 px-2 py-1 rounded-lg border border-white/30">
                              {member.funnel_access.length} atribuído(s)
                            </span>
                          </div>
                        )}
                        
                        {member.whatsapp_access.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-700">WhatsApp:</span>
                            <span className="text-xs bg-white/40 px-2 py-1 rounded-lg border border-white/30">
                              {member.whatsapp_access.length} instância(s)
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Nota para Gestores */}
                    {(member.role === "admin" || member.role === "manager") && (
                      <div className="mt-3">
                        <div className={`${roleInfo.bgColor} backdrop-blur-sm border border-white/30 rounded-lg p-2`}>
                          <p className="text-xs font-medium text-gray-700">
                            {member.role === "admin" 
                              ? "Acesso total incluindo gestão de equipe" 
                              : "Acesso total exceto gestão de equipe"
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/40 backdrop-blur-sm border border-white/30 hover:bg-white/60 rounded-xl text-gray-700"
                >
                  <Edit className="h-4 w-4" />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-red-50/60 backdrop-blur-sm border border-red-200/60 hover:bg-red-100/60 rounded-xl text-red-600"
                      onClick={() => setMemberToDelete(member)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white/20 backdrop-blur-md border border-white/30 shadow-glass rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-gray-900 font-bold">
                        Remover Membro da Equipe
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-700 font-medium">
                        Tem certeza que deseja remover <strong>{member.full_name}</strong> da equipe?
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-white/40 backdrop-blur-sm border border-white/30 hover:bg-white/60 rounded-xl">
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onRemoveMember(member.id)}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-glass"
                      >
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
