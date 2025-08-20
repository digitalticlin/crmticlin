
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  Pencil
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AIAgentModal } from "@/components/ai-agents/AIAgentModal";
import { useAIAgents } from "@/hooks/useAIAgents";
import { AIAgent } from "@/types/aiAgent";

export default function AIAgents() {
  const { agents, isLoading, deleteAgent, toggleAgentStatus, refetch } = useAIAgents();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);
  const [agentsConfig, setAgentsConfig] = useState<Record<string, any>>({});
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);

  // Carregar configurações dos agentes
  useEffect(() => {
    if (agents.length > 0) {
      loadAgentsConfig();
    }
  }, [agents]);

  const loadAgentsConfig = async () => {
    try {
      const agentIds = agents.map(agent => agent.id);
      const { data: prompts, error } = await supabase
        .from('ai_agent_prompts')
        .select('agent_id, agent_function, flow')
        .in('agent_id', agentIds);

      if (error) throw error;

      const configMap: Record<string, any> = {};
      prompts?.forEach(prompt => {
        const flowSteps = Array.isArray(prompt.flow) ? prompt.flow.length : 0;
        configMap[prompt.agent_id] = {
          hasPrompt: !!prompt.agent_function,
          flowSteps: flowSteps
        };
      });

      setAgentsConfig(configMap);
    } catch (error) {
      console.error('Erro ao carregar configurações dos agentes:', error);
    }
  };

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
    console.log('🔄 handleToggleStatus chamado para agente:', id);
    setTogglingStatus(id);
    
    try {
      const success = await toggleAgentStatus(id);
      console.log('✅ Toggle status concluído:', success);
    } catch (error) {
      console.error('❌ Erro no handleToggleStatus:', error);
    } finally {
      setTogglingStatus(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingAgent(null);
  };

  const handleModalSave = async () => {
    console.log('📱 Modal save triggered - forçando refresh da lista');
    try {
      // Pequeno delay para garantir que a transação do banco terminou
      await new Promise(resolve => setTimeout(resolve, 100));
      await refetch();
      // Também recarregar configurações
      await loadAgentsConfig();
      console.log('✅ Lista de agentes e configurações atualizadas após save do modal');
    } catch (error) {
      console.error('❌ Erro ao atualizar lista:', error);
    }
    // Modal NÃO fecha automaticamente - usuário controla quando fechar
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
                  <th className="pb-2 font-medium">Configuração</th>
                  <th className="pb-2 font-medium text-center">Mensagens</th>
                  <th className="pb-2 font-medium text-center">Status</th>
                  <th className="pb-2 font-medium text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    {/* Coluna Agente */}
                    <td className="py-4">
                      <div className="flex items-center">
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-ticlin/20 to-ticlin/10 grid place-items-center mr-3 border border-ticlin/20">
                          {getTypeIcon(agent.type)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{agent.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Criado em {new Date(agent.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Coluna Configuração */}
                    <td className="py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${agentsConfig[agent.id]?.hasPrompt ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className="text-xs text-gray-600">
                            {agentsConfig[agent.id]?.hasPrompt ? 'Prompt configurado' : 'Prompt pendente'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${(agentsConfig[agent.id]?.flowSteps || 0) > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className="text-xs text-gray-600">
                            Fluxo ({agentsConfig[agent.id]?.flowSteps || 0} passos)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${agent.funnel_id ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className="text-xs text-gray-600">
                            {agent.funnel_id ? 'Funil conectado' : 'Sem funil'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Coluna Mensagens */}
                    <td className="py-4">
                      <div className="text-center">
                        <div className="font-bold text-xl text-gray-900">
                          {agent.messages_count.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          mensagens enviadas
                        </div>
                      </div>
                    </td>

                    {/* Coluna Status */}
                    <td className="py-4">
                      <div className="flex justify-center items-center">
                        <Switch 
                          checked={agent.status === "active"} 
                          onCheckedChange={() => handleToggleStatus(agent.id)}
                          disabled={togglingStatus === agent.id}
                        />
                        {togglingStatus === agent.id && (
                          <div className="ml-2 animate-spin h-4 w-4 border-2 border-ticlin border-t-transparent rounded-full"></div>
                        )}
                      </div>
                    </td>

                    {/* Coluna Ações */}
                    <td className="py-4">
                      <div className="flex justify-center">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditAgent(agent)}
                          className="h-9 w-9 p-0 hover:bg-ticlin/10 hover:text-ticlin transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
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
