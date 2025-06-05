
import { KanbanColumn } from "@/types/kanban";
import { StageListItem } from "./StageListItem";

interface StagesListProps {
  stages: KanbanColumn[];
  onUpdateStage: (stage: KanbanColumn) => Promise<void>;
  onDeleteStage: (stageId: string) => Promise<void>;
}

export const StagesList = ({ stages, onUpdateStage, onDeleteStage }: StagesListProps) => {
  // Filtrar apenas etapas editáveis (não GANHO nem PERDIDO)
  const editableStages = stages.filter(col => 
    col.title !== "GANHO" && col.title !== "PERDIDO"
  );

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-700">Etapas do Funil</h3>
      
      {editableStages.map((stage) => (
        <StageListItem
          key={stage.id}
          stage={stage}
          onUpdate={onUpdateStage}
          onDelete={onDeleteStage}
        />
      ))}
    </div>
  );
};
