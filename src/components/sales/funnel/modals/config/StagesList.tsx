import { KanbanColumn } from "@/types/kanban";
import { StageListItem } from "./StageListItem";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface StagesListProps {
  stages: KanbanColumn[];
  onUpdateStage: (stage: KanbanColumn) => Promise<void>;
  onDeleteStage: (stageId: string) => Promise<void>;
  onRefreshStages?: () => Promise<void>;
}

export const StagesList = ({ stages, onUpdateStage, onDeleteStage, onRefreshStages }: StagesListProps) => {
  const { user } = useAuth();
  
  // Filtrar apenas etapas editáveis (não GANHO nem PERDIDO)
  const editableStages = stages.filter(col => 
    col.title !== "GANHO" && col.title !== "PERDIDO"
  );

  // Ordenar por order_position para garantir ordem correta
  const sortedStages = [...editableStages].sort((a, b) => {
    // Assumindo que stages já vem com order_position ou podemos usar o índice
    const aOrder = (a as any).order_position || stages.indexOf(a);
    const bOrder = (b as any).order_position || stages.indexOf(b);
    return aOrder - bOrder;
  });

  // Função para mover etapa para cima
  const handleMoveUp = async (stageId: string) => {
    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    const currentIndex = sortedStages.findIndex(s => s.id === stageId);
    if (currentIndex <= 0) return; // Já está no topo

    const currentStage = sortedStages[currentIndex];
    const previousStage = sortedStages[currentIndex - 1];

    try {
      // Trocar as posições
      const currentOrder = (currentStage as any).order_position || currentIndex;
      const previousOrder = (previousStage as any).order_position || (currentIndex - 1);

      await supabase
        .from('kanban_stages')
        .update({ order_position: previousOrder })
        .eq('id', currentStage.id)
        .eq('created_by_user_id', user.id);

      await supabase
        .from('kanban_stages')
        .update({ order_position: currentOrder })
        .eq('id', previousStage.id)
        .eq('created_by_user_id', user.id);

      toast.success("Posição alterada com sucesso!");
      
      if (onRefreshStages) {
        await onRefreshStages();
      }
    } catch (error: any) {
      console.error('Erro ao mover etapa:', error);
      toast.error("Erro ao alterar posição");
    }
  };

  // Função para mover etapa para baixo
  const handleMoveDown = async (stageId: string) => {
    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    const currentIndex = sortedStages.findIndex(s => s.id === stageId);
    if (currentIndex >= sortedStages.length - 1) return; // Já está no final

    const currentStage = sortedStages[currentIndex];
    const nextStage = sortedStages[currentIndex + 1];

    try {
      // Trocar as posições
      const currentOrder = (currentStage as any).order_position || currentIndex;
      const nextOrder = (nextStage as any).order_position || (currentIndex + 1);

      await supabase
        .from('kanban_stages')
        .update({ order_position: nextOrder })
        .eq('id', currentStage.id)
        .eq('created_by_user_id', user.id);

      await supabase
        .from('kanban_stages')
        .update({ order_position: currentOrder })
        .eq('id', nextStage.id)
        .eq('created_by_user_id', user.id);

      toast.success("Posição alterada com sucesso!");
      
      if (onRefreshStages) {
        await onRefreshStages();
      }
    } catch (error: any) {
      console.error('Erro ao mover etapa:', error);
      toast.error("Erro ao alterar posição");
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-700">Etapas do Funil</h3>
      
      {sortedStages.map((stage, index) => (
        <StageListItem
          key={stage.id}
          stage={stage}
          onUpdate={onUpdateStage}
          onDelete={onDeleteStage}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          isFirst={index === 0}
          isLast={index === sortedStages.length - 1}
        />
      ))}
    </div>
  );
};
