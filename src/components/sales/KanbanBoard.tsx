
import { KanbanColumn as IKanbanColumn, KanbanLead } from "@/types/kanban";
import { useDragAndDropSafe } from "@/hooks/kanban/useDragAndDropSafe";
import { BoardContent } from "./kanban/BoardContent";
import { StableDragDropWrapper } from "./funnel/StableDragDropWrapper";
import { DataErrorBoundary } from "./funnel/DataErrorBoundary";
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
  console.log('[KanbanBoard] 🚀 RADICAL - Renderizando com drag direto:', {
    columnsReceived: columns?.length || 0,
    isArray: Array.isArray(columns)
  });

  // Validar colunas uma vez
  const validatedColumns = useMemo(() => {
    if (!Array.isArray(columns)) {
      console.error('[KanbanBoard] ❌ Colunas não são array:', typeof columns);
      return [];
    }
    
    const filtered = columns.filter(col => 
      col && 
      typeof col.id === 'string' && 
      typeof col.title === 'string' &&
      Array.isArray(col.leads)
    );

    console.log('[KanbanBoard] ✅ Colunas validadas:', filtered.length);
    return filtered;
  }, [columns]);

  // RADICAL: Usar diretamente useDragAndDropSafe sem intermediários
  const { isDragging, onDragStart, onDragEnd } = useDragAndDropSafe({ 
    columns: validatedColumns, 
    onColumnsChange, 
    onMoveToWonLost, 
    isWonLostView
  });

  // Estado vazio otimizado
  if (!validatedColumns || validatedColumns.length === 0) {
    console.log('[KanbanBoard] 📭 Estado vazio');
    
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isWonLostView ? "Nenhum lead ganho/perdido" : "Nenhuma etapa encontrada"}
          </h3>
          <p className="text-gray-600 mb-4">
            {isWonLostView 
              ? "Nenhum lead foi ganho ou perdido ainda" 
              : "Configure as etapas do seu funil para começar"
            }
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }

  console.log('[KanbanBoard] 🎯 RADICAL - Renderizando board com drag direto');

  return (
    <div className="relative w-full h-full flex flex-col">
      <DataErrorBoundary context="Kanban Board - Drag and Drop Radical">
        <StableDragDropWrapper onDragStart={onDragStart} onDragEnd={onDragEnd}>
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
        </StableDragDropWrapper>
      </DataErrorBoundary>
    </div>
  );
};
