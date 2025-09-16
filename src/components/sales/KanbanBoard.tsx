
import { KanbanColumn as IKanbanColumn, KanbanLead } from "@/types/kanban";
import { MassSelectionReturn } from "@/hooks/useMassSelection";
import { BoardContentOptimized } from "./kanban/BoardContentOptimized";
import { DataErrorBoundary } from "./funnel/DataErrorBoundary";
import { DndKanbanBoardWrapper } from "./DndKanbanBoardWrapper";
import { useMemo, useEffect, useCallback } from "react";

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
  massSelection?: MassSelectionReturn;
  markOptimisticChange?: (value: boolean) => void;
  funnelId?: string | null;
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
  lostStageId,
  massSelection,
  markOptimisticChange,
  funnelId
}: KanbanBoardProps) => {
  // Validar colunas uma vez com memoização
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

    return filtered;
  }, [columns]);

  const isEmpty = !validatedColumns || validatedColumns.length === 0;

  return (
    <div className="relative w-full h-full flex flex-col">
      <DataErrorBoundary context="Kanban Board - Fases 2+3 + Clone Visual">
        {isEmpty ? (
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
        ) : (
          <DndKanbanBoardWrapper
            columns={validatedColumns}
            onColumnsChange={onColumnsChange}
            onOpenLeadDetail={onOpenLeadDetail}
            onColumnUpdate={onColumnUpdate}
            onColumnDelete={onColumnDelete}
            onOpenChat={onOpenChat}
            onMoveToWonLost={onMoveToWonLost}
            onReturnToFunnel={onReturnToFunnel}
            isWonLostView={isWonLostView}
            wonStageId={wonStageId}
            lostStageId={lostStageId}
            massSelection={massSelection}
            markOptimisticChange={markOptimisticChange}
            funnelId={funnelId}
            enableDnd={true}
          />
        )}
      </DataErrorBoundary>
    </div>
  );
};
