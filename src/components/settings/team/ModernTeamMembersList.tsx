
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Shield, User, Crown, Users, Phone, TrendingUp } from "lucide-react";
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
          color: "bg-purple-100 text-purple-800 border-purple-200",
          description: "Acesso total ao sistema"
        };
      case "user":
        return {
          label: "USUÁRIO",
          icon: TrendingUp,
          color: "bg-blue-100 text-blue-800 border-blue-200",
          description: "Acesso completo exceto gestão de equipe"
        };
      case "operational":
        return {
          label: "OPERACIONAL",
          icon: User,
          color: "bg-green-100 text-green-800 border-green-200",
          description: "Acesso limitado aos recursos vinculados"
        };
      default:
        return {
          label: "DESCONHECIDO",
          icon: Shield,
          color: "bg-gray-100 text-gray-800 border-gray-200",
          description: "Função não definida"
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D3D800]"></div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">Nenhum membro da equipe encontrado</p>
        <p className="text-gray-500 text-sm">Adicione o primeiro membro usando o formulário acima</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {members.map((member) => {
        const roleInfo = getRoleInfo(member.role);
        const RoleIcon = roleInfo.icon;
        
        return (
          <div
            key={member.id}
            className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:border-white/50 transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-gradient-to-br from-[#D3D800]/20 to-[#D3D800]/10 text-[#D3D800] font-semibold">
                    {member.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 truncate">
                      {member.full_name}
                    </h3>
                    <Badge className={`${roleInfo.color} flex items-center gap-1 px-3 py-1`}>
                      <RoleIcon className="h-3 w-3" />
                      {roleInfo.label}
                    </Badge>
                  </div>

                  <p className="text-gray-600 text-sm mb-3">{member.email || `${member.username}@domain.com`}</p>
                  <p className="text-gray-500 text-xs mb-4">{roleInfo.description}</p>

                  {/* Permissões específicas para operacional */}
                  {member.role === "operational" && (
                    <div className="space-y-3">
                      {member.whatsapp_access && member.whatsapp_access.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Phone className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-gray-700">WhatsApp Permitidos:</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {member.whatsapp_access.map((whatsappId) => (
                              <Badge key={whatsappId} variant="outline" className="text-xs">
                                WhatsApp {whatsappId.slice(0, 8)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {member.funnel_access && member.funnel_access.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-700">Funis Permitidos:</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {member.funnel_access.map((funnelId) => (
                              <Badge key={funnelId} variant="outline" className="text-xs">
                                Funil {funnelId.slice(0, 8)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {(!member.whatsapp_access || member.whatsapp_access.length === 0) && 
                       (!member.funnel_access || member.funnel_access.length === 0) && (
                        <p className="text-amber-600 text-sm bg-amber-50 p-2 rounded-lg">
                          ⚠️ Usuário sem permissões específicas definidas
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Só mostrar botão de deletar se não for admin */}
              {member.role !== "admin" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover Membro</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja remover <strong>{member.full_name}</strong> da equipe?
                        Esta ação não pode ser desfeita e o usuário perderá acesso ao sistema.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onRemoveMember(member.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
