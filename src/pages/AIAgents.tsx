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
  Pencil,
  Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AIAgentModal } from "@/components/ai-agents/AIAgentModal";
import { useAIAgents } from "@/hooks/useAIAgents";
import { AIAgent } from "@/types/aiAgent";

export default function AIAgents() {
  const { agents, isLoading, deleteAgent, toggleAgentStatus, refetch } = useAIAgents();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);
  const [agentsConfig, setAgentsConfig] = useState<Record<string, any>>({});
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);
  const [deletingAgent, setDeletingAgent] = useState<AIAgent | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleDeleteAgent = (agent: AIAgent) => {
    setDeletingAgent(agent);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAgent = async () => {
    if (!deletingAgent) return;
    
    try {
      const success = await deleteAgent(deletingAgent.id);
      if (success) {
        setShowDeleteConfirm(false);
        setDeletingAgent(null);
        // Recarregar lista e configurações
        await refetch();
        await loadAgentsConfig();
      }
    } catch (error) {
      console.error('❌ Erro ao excluir agente:', error);
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
    <Button className="bg-ticlin hover:bg-ticlin/90 text-black" onClick={() => {
      setEditingAgent(null);
      setIsModalOpen(true);
    }}>
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
      
      <div className="flex-1 space-y-6">
        <ChartCard 
          title="Agentes Ativos" 
          description="Agentes de IA disponíveis para uso nos seus números de WhatsApp"
          className="flex-1"
        >
          <div className="w-full">
            {/* Tabela responsiva com scroll horizontal em telas menores */}
            <div className="overflow-x-auto -mx-2 px-2">
              <div className="min-w-[800px]">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                      <th className="pb-3 font-medium text-sm text-gray-700 w-[35%]">Agente</th>
                      <th className="pb-3 font-medium text-sm text-gray-700 w-[25%]">Configuração</th>
                      <th className="pb-3 font-medium text-sm text-gray-700 text-center w-[15%]">Mensagens</th>
                      <th className="pb-3 font-medium text-sm text-gray-700 text-center w-[10%]">Status</th>
                      <th className="pb-3 font-medium text-sm text-gray-700 text-center w-[15%]">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map((agent) => (
                      <tr key={agent.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                        {/* Coluna Agente */}
                        <td className="py-4 pr-4">
                          <div className="flex items-center min-w-0">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-ticlin/20 to-ticlin/10 grid place-items-center mr-3 border border-ticlin/20 flex-shrink-0">
                              {getTypeIcon(agent.type)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-gray-900 text-sm truncate">{agent.name}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {new Date(agent.created_at).toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Coluna Configuração */}
                        <td className="py-4 pr-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${agentsConfig[agent.id]?.hasPrompt ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                              <span className="text-xs text-gray-600 truncate">
                                {agentsConfig[agent.id]?.hasPrompt ? 'Prompt configurado' : 'Prompt pendente'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${(agentsConfig[agent.id]?.flowSteps || 0) > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                              <span className="text-xs text-gray-600 truncate">
                                Fluxo ({agentsConfig[agent.id]?.flowSteps || 0} passos)
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${agent.funnel_id ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                              <span className="text-xs text-gray-600 truncate">
                                {agent.funnel_id ? 'Funil conectado' : 'Sem funil'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Coluna Mensagens */}
                        <td className="py-4 text-center">
                          <div className="font-bold text-lg text-gray-900">
                            {agent.messages_count.toLocaleString('pt-BR')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            mensagens
                          </div>
                        </td>

                        {/* Coluna Status */}
                        <td className="py-4">
                          <div className="flex justify-center items-center">
                            <Switch 
                              checked={agent.status === "active"} 
                              onCheckedChange={() => {
                                setTogglingStatus(agent.id);
                                toggleAgentStatus(agent.id).finally(() => setTogglingStatus(null));
                              }}
                              disabled={togglingStatus === agent.id}
                            />
                            {togglingStatus === agent.id && (
                              <div className="ml-2 animate-spin h-3 w-3 border border-ticlin border-t-transparent rounded-full"></div>
                            )}
                          </div>
                        </td>

                        {/* Coluna Ações */}
                        <td className="py-4">
                          <div className="flex justify-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setEditingAgent(agent);
                                setIsModalOpen(true);
                              }}
                              className="h-8 w-8 p-0 hover:bg-ticlin/10 hover:text-ticlin transition-colors"
                              title="Editar agente"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setDeletingAgent(agent);
                                setShowDeleteConfirm(true);
                              }}
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Excluir agente"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {agents.length === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Bot className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-600 text-sm mb-2">Nenhum agente de IA configurado</p>
                <p className="text-gray-500 text-xs">Crie seu primeiro agente para começar a automatizar conversas</p>
              </div>
            )}
          </div>
        </ChartCard>
      </div>

      <AIAgentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAgent(null);
        }}
        agent={editingAgent}
        onSave={handleModalSave}
      />

      {/* Modal de confirmação para exclusão */}
      <Dialog open={showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(false)}>
        <DialogContent className="max-w-md bg-white/20 backdrop-blur-md border border-white/30 shadow-glass rounded-xl">
          <DialogHeader className="border-b border-white/30 pb-3 bg-white/20 backdrop-blur-sm rounded-t-xl -mx-6 -mt-6 px-6 pt-6">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <div className="p-2 bg-red-500/20 backdrop-blur-sm rounded-lg border border-red-500/30">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              Confirmar exclusão
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-gray-700 text-sm leading-relaxed mb-3">
              Tem certeza que deseja excluir o agente <strong>"{deletingAgent?.name}"</strong>?
            </p>
            <p className="text-red-600 text-sm font-medium">
              ⚠️ Esta ação não pode ser desfeita. Todas as configurações, prompts e fluxos serão perdidos permanentemente.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/30 bg-white/10 backdrop-blur-sm -mx-6 -mb-6 px-6 pb-6 rounded-b-xl">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 h-10 bg-white/40 backdrop-blur-sm border border-white/30 hover:bg-white/60 rounded-lg transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmDeleteAgent}
              className="px-4 h-10 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-all duration-200"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Agente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
