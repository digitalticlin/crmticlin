
import { DragDropContext, DraggableProvided } from "react-beautiful-dnd";
import { KanbanColumn as IKanbanColumn, KanbanLead } from "@/types/kanban";
import { useDragAndDrop } from "@/hooks/kanban/useDragAndDrop";
import { BoardContent } from "./kanban/BoardContent";
import { LeadCard } from "./LeadCard";

interface KanbanBoardProps {
  columns: IKanbanColumn[];
  onColumnsChange: (newColumns: IKanbanColumn[]) => void;
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onColumnUpdate?: (updatedColumn: IKanbanColumn) => void;
  onColumnDelete?: (columnId: string) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
  onReturnToFunnel?: (lead: KanbanLead) => void;
  isWonLostView?: boolean;
  wonStageId?: string;
  lostStageId?: string;
}

export const KanbanBoard = ({
  columns,
  onColumnsChange,
  onOpenLeadDetail,
  onColumnUpdate,
  onColumnDelete,
  onOpenChat,
  onMoveToWonLost,
  onReturnToFunnel,
  isWonLostView = false,
  wonStageId,
  lostStageId
}: KanbanBoardProps) => {
  const { 
    showDropZones, 
    onDragStart, 
    onDragEnd 
  } = useDragAndDrop({ 
    columns, 
    onColumnsChange, 
    onMoveToWonLost, 
    isWonLostView
  });

  // Cria um mapping para lookup por id mais fácil para renderClone
  const leadMap: Record<string, KanbanLead> = {};
  columns.forEach(col => {
    col.leads.forEach(lead => {
      leadMap[lead.id] = lead;
    });
  });

  // Renderização personalizada do clone flutuante durante drag
  const renderClone = (provided: DraggableProvided, snapshot: any, rubric: any) => {
    const leadId = rubric.draggableId;
    const lead = leadMap[leadId];
    if (!lead) return null;

    return (
      <div style={{ width: provided.draggableProps?.style?.width || "340px", pointerEvents: "none" }}>
        <LeadCard
          lead={lead}
          provided={provided}
          onClick={() => undefined}
          isDragging={true}
          isClone={true}
        />
      </div>
    );
  };

  // Cria uma key baseada nas colunas que irá forçar o remount quando as colunas mudarem
  const boardKey = columns.map(col => `${col.id}-${col.leads.length}`).join('-');

  return (
    <DragDropContext 
      onDragStart={onDragStart} 
      onDragEnd={onDragEnd}
    >
      <div className="relative w-full h-full flex flex-col" key={boardKey}>
        <BoardContent 
          columns={columns}
          onOpenLeadDetail={onOpenLeadDetail}
          onColumnUpdate={onColumnUpdate}
          onColumnDelete={onColumnDelete}
          onOpenChat={onOpenChat}
          onMoveToWonLost={!isWonLostView ? onMoveToWonLost : undefined}
          onReturnToFunnel={isWonLostView ? onReturnToFunnel : undefined}
          isWonLostView={isWonLostView}
          wonStageId={wonStageId}
          lostStageId={lostStageId}
        />
      </div>
    </DragDropContext>
  );
};
