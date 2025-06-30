
import React, { useMemo } from "react";
import { KanbanColumn, KanbanLead } from "@/types/kanban";
import { KanbanColumnMemo } from "../KanbanColumnMemo";
import { useDragHandlersOptimized } from "@/hooks/kanban/useDragHandlersOptimized";

interface BoardContentOptimizedProps {
  columns: KanbanColumn[];
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onColumnUpdate?: (updatedColumn: KanbanColumn) => void;
  onColumnDelete?: (columnId: string) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
  onReturnToFunnel?: (lead: KanbanLead) => void;
  isWonLostView?: boolean;
  wonStageId?: string;
  lostStageId?: string;
}

export const BoardContentOptimized = React.memo<BoardContentOptimizedProps>(({
  columns,
  onOpenLeadDetail,
  onColumnUpdate,
  onColumnDelete,
  onOpenChat,
  onMoveToWonLost,
  onReturnToFunnel,
  isWonLostView = false,
  wonStageId,
  lostStageId
}) => {
  console.log('[BoardContentOptimized] 🎯 Renderizando com otimizações:', {
    columnsCount: columns?.length || 0,
    isWonLostView
  });

  // Handlers otimizados para evitar recriações
  const { getOptimizedHandlers } = useDragHandlersOptimized({
    onOpenLeadDetail,
    onOpenChat,
    onMoveToWonLost,
    onReturnToFunnel
  });

  // Memoizar colunas validadas para evitar recálculos
  const validatedColumns = useMemo(() => {
    if (!Array.isArray(columns)) return [];
    return columns.filter(col => col && col.id && col.title && Array.isArray(col.leads));
  }, [columns]);

  // Memoizar estilos para evitar recriações
  const containerStyles = useMemo(() => ({
    height: '100%',
    minWidth: 'max-content'
  }), []);

  const scrollStyles = useMemo(() => ({
    height: '100%'
  }), []);

  if (!validatedColumns.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Nenhuma etapa encontrada</p>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-hidden">
      <div 
        className="flex h-full min-w-max gap-6 p-6 overflow-x-auto kanban-scrollbar" 
        style={containerStyles}
      >
        {validatedColumns.map((column, index) => (
          <KanbanColumnMemo
            key={column.id}
            column={column}
            index={index}
            onOpenLeadDetail={onOpenLeadDetail}
            onUpdateColumn={onColumnUpdate}
            onDeleteColumn={onColumnDelete}
            onOpenChat={onOpenChat}
            onMoveToWonLost={onMoveToWonLost}
            onReturnToFunnel={onReturnToFunnel}
            isWonLostView={isWonLostView}
            wonStageId={wonStageId}
            lostStageId={lostStageId}
          />
        ))}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparação otimizada do BoardContent
  const columnsChanged = 
    prevProps.columns.length !== nextProps.columns.length ||
    prevProps.columns.some((col, index) => {
      const nextCol = nextProps.columns[index];
      return !nextCol || 
        col.id !== nextCol.id || 
        col.title !== nextCol.title ||
        col.leads.length !== nextCol.leads.length;
    });

  const stateChanged = 
    prevProps.isWonLostView !== nextProps.isWonLostView ||
    prevProps.wonStageId !== nextProps.wonStageId ||
    prevProps.lostStageId !== nextProps.lostStageId;

  return !(columnsChanged || stateChanged);
});

BoardContentOptimized.displayName = 'BoardContentOptimized';
