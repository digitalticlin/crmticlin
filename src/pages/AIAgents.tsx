
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
import { AIAgentModal } from "@/components/ai-agents/AIAgentModal";
import { useAIAgents } from "@/hooks/useAIAgents";
import { AIAgent } from "@/types/aiAgent";

export default function AIAgents() {
  const { agents, isLoading, deleteAgent, toggleAgentStatus, refetch } = useAIAgents();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);

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

  const handleCreateAgent = () => {
    setEditingAgent(null);
    setIsModalOpen(true);
  };

  const handleEditAgent = (agent: AIAgent) => {
    setEditingAgent(agent);
    setIsModalOpen(true);
  };

  const handleDeleteAgent = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este agente?')) {
      await deleteAgent(id);
    }
  };

  const handleToggleStatus = async (id: string) => {
    await toggleAgentStatus(id);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingAgent(null);
  };

  const handleModalSave = () => {
    refetch();
    handleModalClose();
  };

  const createAgentAction = (
    <Button className="bg-ticlin hover:bg-ticlin/90 text-black" onClick={handleCreateAgent}>
      <Plus className="h-4 w-4 mr-2" />
      Criar Novo Agente
    </Button>
  );

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader 
          title="Agentes IA" 
          description="Configure e gerencie seus assistentes virtuais de IA"
          action={createAgentAction}
        />
        <div className="flex items-center justify-center py-8">
          <p>Carregando agentes...</p>
        </div>
      </PageLayout>
    );
  }

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
                            Criado em {new Date(agent.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">{getTypeBadge(agent.type)}</td>
                    <td className="py-4">
                      <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">
                        {agent.whatsapp_number_id ? "Configurado" : "Não configurado"}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <span className="font-medium">{agent.messages_count.toLocaleString()}</span>
                    </td>
                    <td className="py-4">
                      <Switch 
                        checked={agent.status === "active"} 
                        onCheckedChange={() => handleToggleStatus(agent.id)}
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
                          <DropdownMenuItem onClick={() => handleEditAgent(agent)}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar configuração
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(agent.id)}>
                            <Power className="mr-2 h-4 w-4" /> {agent.status === "active" ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteAgent(agent.id)}
                          >
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
      

      <AIAgentModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        agent={editingAgent}
        onSave={handleModalSave}
      />
    </PageLayout>
  );
}
