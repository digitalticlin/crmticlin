
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModernCard, ModernCardContent } from "@/components/ui/modern-card";
import { Users, Trash2 } from "lucide-react";

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  must_change_password: boolean;
  whatsapp_numbers: { id: string; instance_name: string }[];
  funnels: { id: string; name: string }[];
}

interface ModernTeamMembersListProps {
  members: TeamMember[];
  onRemoveMember: (memberId: string) => void;
}

export function ModernTeamMembersList({ members, onRemoveMember }: ModernTeamMembersListProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "seller":
        return "Vendedor(a)";
      case "admin":
        return "Administrador";
      default:
        return "Personalizado";
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Administrador</Badge>;
      case "seller":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Vendedor(a)</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Personalizado</Badge>;
    }
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Nenhum membro na equipe</h3>
            <p className="text-muted-foreground">
              Adicione membros para começar a colaborar
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {members.map((member) => (
        <ModernCard key={member.id} className="transition-all duration-200 hover:scale-[1.02]">
          <ModernCardContent className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                    {getInitials(member.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-foreground">{member.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                  {member.must_change_password && (
                    <Badge className="bg-red-100 text-red-800 border-red-200 text-xs mt-1">
                      Precisa trocar senha
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onRemoveMember(member.id)}
                className="rounded-lg"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Função
                </label>
                <div className="mt-1">
                  {getRoleBadge(member.role)}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  WhatsApp
                </label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {member.whatsapp_numbers.map((w) => (
                    <Badge key={w.id} variant="outline" className="text-xs">
                      {w.instance_name}
                    </Badge>
                  ))}
                  {member.whatsapp_numbers.length === 0 && (
                    <span className="text-xs text-muted-foreground">Nenhum</span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Funis
                </label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {member.funnels.map((f) => (
                    <Badge key={f.id} variant="outline" className="text-xs">
                      {f.name}
                    </Badge>
                  ))}
                  {member.funnels.length === 0 && (
                    <span className="text-xs text-muted-foreground">Nenhum</span>
                  )}
                </div>
              </div>
            </div>
          </ModernCardContent>
        </ModernCard>
      ))}
    </div>
  );
}
