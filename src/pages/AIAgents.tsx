
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAIAgents } from "@/hooks/useAIAgents";
import { AIAgent } from "@/types/aiAgent";
import { AIAgentCard } from "@/components/ai-agents/AIAgentCard";
import { AIAgentCardSkeleton } from "@/components/ai-agents/AIAgentCardSkeleton";
import { AIAgentEmptyState } from "@/components/ai-agents/AIAgentEmptyState";
import { useIsMobile } from "@/hooks/use-mobile";

export default function AIAgents() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { agents, isLoading, deleteAgent, toggleAgentStatus, refetch } = useAIAgents();
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);
  const [deletingAgent, setDeletingAgent] = useState<AIAgent | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleCreateAgent = () => {
    navigate('/ai-agents/create');
  };

  const handleEditAgent = (agent: AIAgent) => {
    navigate(`/ai-agents/edit/${agent.id}`);
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
        await refetch();
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

  const createAgentAction = (
    <Button className="bg-ticlin hover:bg-ticlin/90 text-black" onClick={handleCreateAgent}>
      <Plus className="h-4 w-4 mr-2" />
      Criar Novo Agente
    </Button>
  );

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Agentes IA"
          description="Configure e gerencie seus assistentes virtuais de IA"
          action={createAgentAction}
        />
        <div className="mt-6">
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
            <AIAgentCardSkeleton />
            <AIAgentCardSkeleton />
            <AIAgentCardSkeleton />
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Agentes IA"
        description="Configure e gerencie seus assistentes virtuais de IA"
        action={createAgentAction}
      />

      <div className="mt-6">
        {agents.length === 0 ? (
          <AIAgentEmptyState onCreateAgent={handleCreateAgent} />
        ) : (
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
            {agents.map((agent) => (
              <AIAgentCard
                key={agent.id}
                agent={agent as any}
                onEdit={() => handleEditAgent(agent)}
                onDelete={() => handleDeleteAgent(agent)}
                onToggleStatus={() => handleToggleStatus(agent.id)}
                isTogglingStatus={togglingStatus === agent.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de confirmação para exclusão */}
      <Dialog open={showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(false)}>
        <DialogContent className="max-w-md bg-white/20 backdrop-blur-md border border-white/30 shadow-glass md:rounded-xl rounded-none">
          <DialogHeader className="border-b border-white/30 pb-3 bg-white/20 backdrop-blur-sm md:rounded-t-xl -mx-6 -mt-6 px-4 md:px-6 pt-4 md:pt-6">
            <DialogTitle className="flex items-center gap-2 text-base md:text-lg font-bold text-gray-900">
              <div className="p-2 bg-red-500/20 backdrop-blur-sm rounded-lg border border-red-500/30">
                <Trash2 className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
              </div>
              Confirmar exclusão
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-gray-700 text-sm leading-relaxed mb-3">
              Tem certeza que deseja excluir o agente <strong>"{deletingAgent?.name}"</strong>?
            </p>
            <p className="text-red-600 text-xs md:text-sm font-medium">
              ⚠️ Esta ação não pode ser desfeita. Todas as configurações, prompts e fluxos serão perdidos permanentemente.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-white/30 bg-white/10 backdrop-blur-sm -mx-6 -mb-6 px-4 md:px-6 pb-4 md:pb-6 md:rounded-b-xl">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="w-full sm:w-auto px-4 h-10 bg-white/40 backdrop-blur-sm border border-white/30 hover:bg-white/60 rounded-lg transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmDeleteAgent}
              className="w-full sm:w-auto px-4 h-10 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-all duration-200"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Agente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
