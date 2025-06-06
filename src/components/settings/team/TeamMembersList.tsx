
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import ChartCard from "@/components/dashboard/ChartCard";
import { TeamMember } from "@/hooks/useTeamManagement";

interface TeamMembersListProps {
  members: TeamMember[];
  onRemoveMember: (memberId: string) => void;
}

export const TeamMembersList = ({ members, onRemoveMember }: TeamMembersListProps) => {
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
      case "admin":
        return "Administrador";
      case "manager":
        return "Gestor";
      case "operational":
        return "Operacional";
      default:
        return "Personalizado";
    }
  };

  return (
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
                      </div>
                    </div>
                  </td>
                  <td className="py-4">{getRoleLabel(member.role)}</td>
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
                    {member.role !== "admin" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onRemoveMember(member.id)}
                      >
                        Remover
                      </Button>
                    )}
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
  );
};
