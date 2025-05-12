
import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import ChartCard from "@/components/dashboard/ChartCard";
import { Button } from "@/components/ui/button";
import { Plus, Mail, MoreHorizontal, UserX } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "attendant";
  whatsappNumbers: string[];
}

export default function Team() {
  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: "1",
      name: "Carlos Silva",
      email: "carlos@example.com",
      role: "admin",
      whatsappNumbers: ["Atendimento Principal", "Vendas", "Suporte"]
    },
    {
      id: "2",
      name: "Maria Souza",
      email: "maria@example.com",
      role: "attendant",
      whatsappNumbers: ["Atendimento Principal"]
    },
    {
      id: "3",
      name: "João Pereira",
      email: "joao@example.com",
      role: "attendant",
      whatsappNumbers: ["Vendas", "Suporte"]
    }
  ]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-ticlin text-black hover:bg-ticlin/90">Administrador</Badge>;
      case "attendant":
        return <Badge variant="outline">Atendente</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">Gestão de Equipe</h1>
              <p className="text-muted-foreground">Gerencie os membros da sua equipe e suas permissões</p>
            </div>
            <Button className="bg-ticlin hover:bg-ticlin/90 text-black">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Membro
            </Button>
          </div>
          
          {/* Team Members List */}
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
                                {getInitials(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{member.name}</div>
                              <div className="text-sm text-muted-foreground">{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          {getRoleBadge(member.role)}
                        </td>
                        <td className="py-4">
                          <div className="flex flex-wrap gap-1">
                            {member.whatsappNumbers.map((number, i) => (
                              <Badge key={i} variant="outline" className="bg-gray-100 dark:bg-gray-800">
                                {number}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Mail className="mr-2 h-4 w-4" /> Enviar convite
                              </DropdownMenuItem>
                              <DropdownMenuItem>Editar permissões</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <UserX className="mr-2 h-4 w-4" /> Remover membro
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
          
          <ChartCard 
            title="Limites do Plano" 
            description="Seu plano atual permite até 10 membros na equipe"
            className="mt-6"
          >
            <div className="mt-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-ticlin h-2.5 rounded-full" 
                  style={{ width: `${Math.min((members.length / 10) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <span>{members.length} de 10 membros utilizados</span>
                <span>{10 - members.length} restantes</span>
              </div>
            </div>
          </ChartCard>
        </div>
      </main>
    </div>
  );
}
