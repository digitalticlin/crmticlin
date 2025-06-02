
import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import ChartCard from "@/components/dashboard/ChartCard";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Bot, 
  MessageSquare, 
  Users, 
  Zap, 
  MoreHorizontal,
  Power,
  Pencil,
  Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface AIAgent {
  id: string;
  name: string;
  type: "attendance" | "sales" | "support" | "custom";
  status: "active" | "inactive";
  whatsappNumbers: string[];
  messagesCount: number;
  createdAt: string;
}

export default function AIAgents() {
  const [agents, setAgents] = useState<AIAgent[]>([
    {
      id: "1",
      name: "Assistente de Vendas",
      type: "sales",
      status: "active",
      whatsappNumbers: ["Vendas"],
      messagesCount: 1243,
      createdAt: "2023-05-10"
    },
    {
      id: "2",
      name: "Suporte Técnico IA",
      type: "support",
      status: "inactive",
      whatsappNumbers: ["Suporte"],
      messagesCount: 567,
      createdAt: "2023-06-15"
    },
    {
      id: "3",
      name: "Atendente Virtual",
      type: "attendance",
      status: "active",
      whatsappNumbers: ["Atendimento Principal"],
      messagesCount: 2891,
      createdAt: "2023-04-22"
    }
  ]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "attendance":
        return <MessageSquare className="h-4 w-4" />;
      case "sales":
        return <Zap className="h-4 w-4" />;
      case "support":
        return <Users className="h-4 w-4" />;
      case "custom":
        return <Bot className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "attendance":
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
            {getTypeIcon(type)} Atendimento
          </Badge>
        );
      case "sales":
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-ticlin/10 text-black border-ticlin/30">
            {getTypeIcon(type)} Vendas
          </Badge>
        );
      case "support":
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800">
            {getTypeIcon(type)} Suporte
          </Badge>
        );
      case "custom":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            {getTypeIcon(type)} Personalizado
          </Badge>
        );
      default:
        return null;
    }
  };

  const toggleAgentStatus = (id: string) => {
    setAgents(agents.map(agent => 
      agent.id === id 
        ? { ...agent, status: agent.status === "active" ? "inactive" : "active" } 
        : agent
    ));
  };

  const createAgentAction = (
    <Button className="bg-ticlin hover:bg-ticlin/90 text-black">
      <Plus className="h-4 w-4 mr-2" />
      Criar Novo Agente
    </Button>
  );

  return (
    <PageLayout>
      <PageHeader 
        title="Agentes IA" 
        description="Configure e gerencie seus assistentes virtuais de IA"
        action={createAgentAction}
      />
      
      <ChartCard 
        title="Agentes Ativos" 
        description="Agentes de IA disponíveis para uso nos seus números de WhatsApp"
      >
        <div className="mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 font-medium">Agente</th>
                  <th className="pb-2 font-medium">Tipo</th>
                  <th className="pb-2 font-medium">WhatsApp</th>
                  <th className="pb-2 font-medium">Mensagens</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-4">
                      <div className="flex items-center">
                        <div className="h-9 w-9 rounded-full bg-ticlin/10 grid place-items-center mr-3">
                          <Bot className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium">{agent.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Criado em {new Date(agent.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">{getTypeBadge(agent.type)}</td>
                    <td className="py-4">
                      <div className="flex flex-wrap gap-1">
                        {agent.whatsappNumbers.map((number, i) => (
                          <Badge key={i} variant="outline" className="bg-gray-100 dark:bg-gray-800">
                            {number}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="font-medium">{agent.messagesCount.toLocaleString()}</span>
                    </td>
                    <td className="py-4">
                      <Switch 
                        checked={agent.status === "active"} 
                        onCheckedChange={() => toggleAgentStatus(agent.id)}
                      />
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
                            <Pencil className="mr-2 h-4 w-4" /> Editar configuração
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Power className="mr-2 h-4 w-4" /> {agent.status === "active" ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Remover agente
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {agents.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum agente de IA configurado. Crie seu primeiro agente para começar.</p>
            </div>
          )}
        </div>
      </ChartCard>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard 
          title="Limites do Plano" 
          description="Seu plano atual permite até 3 agentes de IA"
        >
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-ticlin h-2.5 rounded-full" 
                style={{ width: `${Math.min((agents.length / 3) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <span>{agents.length} de 3 agentes utilizados</span>
              <span>{3 - agents.length} restantes</span>
            </div>
          </div>
        </ChartCard>
        
        <ChartCard 
          title="Desempenho dos Agentes" 
          description="Métricas de utilização dos seus agentes de IA"
        >
          <div className="mt-4 space-y-3">
            <div>
              <div className="flex justify-between mb-1 text-sm">
                <span>Taxa de resolução média</span>
                <span className="font-medium">87%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: "87%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1 text-sm">
                <span>Satisfação do cliente</span>
                <span className="font-medium">92%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-ticlin h-2 rounded-full" style={{ width: "92%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1 text-sm">
                <span>Tempo médio de resposta</span>
                <span className="font-medium">5s</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: "95%" }}></div>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>
    </PageLayout>
  );
}
