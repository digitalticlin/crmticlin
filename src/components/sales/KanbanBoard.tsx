
import { DragDropContext, DraggableProvided } from "react-beautiful-dnd";
import { KanbanColumn as IKanbanColumn, KanbanLead } from "@/types/kanban";
import { useDragAndDrop } from "@/hooks/kanban/useDragAndDrop";
import { BoardContent } from "./kanban/BoardContent";
import { LeadCard } from "./LeadCard";
import { useMemo } from "react";

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
  // Validar e estabilizar colunas
  const validatedColumns = useMemo(() => {
    if (!Array.isArray(columns)) {
      console.warn('[KanbanBoard] ⚠️ Colunas não são array:', columns);
      return [];
    }
    
    return columns.filter(col => 
      col && 
      typeof col.id === 'string' && 
      typeof col.title === 'string' &&
      Array.isArray(col.leads)
    );
  }, [columns]);

  const { 
    showDropZones, 
    onDragStart, 
    onDragEnd 
  } = useDragAndDrop({ 
    columns: validatedColumns, 
    onColumnsChange, 
    onMoveToWonLost, 
    isWonLostView
  });

  // Se não há colunas válidas, mostrar estado vazio
  if (!validatedColumns || validatedColumns.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma etapa encontrada
          </h3>
          <p className="text-gray-600">
            {isWonLostView 
              ? "Nenhum lead foi ganho ou perdido ainda" 
              : "Configure as etapas do seu funil para começar"
            }
          </p>
        </div>
      </div>
    );
  }

  // Cria um mapping para lookup por id mais fácil para renderClone
  const leadMap: Record<string, KanbanLead> = useMemo(() => {
    const map: Record<string, KanbanLead> = {};
    validatedColumns.forEach(col => {
      if (Array.isArray(col.leads)) {
        col.leads.forEach(lead => {
          if (lead && lead.id) {
            map[lead.id] = lead;
          }
        });
      }
    });
    return map;
  }, [validatedColumns]);

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

  // Cria uma key estável baseada nas colunas que irá forçar o remount quando necessário
  const boardKey = useMemo(() => {
    return validatedColumns
      .map(col => `${col.id}-${col.leads?.length || 0}`)
      .join('-');
  }, [validatedColumns]);

  return (
    <DragDropContext 
      onDragStart={onDragStart} 
      onDragEnd={onDragEnd}
    >
      <div className="relative w-full h-full flex flex-col" key={boardKey}>
        <BoardContent 
          columns={validatedColumns}
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
