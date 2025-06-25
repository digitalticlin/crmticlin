
import { KanbanColumn as IKanbanColumn, KanbanLead } from "@/types/kanban";
import { useDragAndDrop } from "@/hooks/kanban/useDragAndDrop";
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
  console.log('[KanbanBoard] 🚀 Renderizando com props:', {
    columnsReceived: columns?.length || 0,
    isArray: Array.isArray(columns),
    columnsPreview: columns?.slice(0, 2).map(c => ({ id: c?.id, title: c?.title, leadsCount: c?.leads?.length }))
  });

  // Validar e estabilizar colunas com mais detalhes de debug
  const validatedColumns = useMemo(() => {
    console.log('[KanbanBoard] 🔍 Iniciando validação de colunas:', {
      received: columns?.length || 0,
      isArray: Array.isArray(columns),
      type: typeof columns
    });

    if (!Array.isArray(columns)) {
      console.error('[KanbanBoard] ❌ Colunas não são array:', typeof columns);
      return [];
    }
    
    const filtered = columns.filter(col => {
      const isValid = col && 
        typeof col.id === 'string' && 
        typeof col.title === 'string' &&
        Array.isArray(col.leads);
      
      if (!isValid) {
        console.error('[KanbanBoard] ❌ Coluna inválida filtrada:', {
          col: col,
          hasId: !!col?.id,
          hasTitle: !!col?.title,
          hasLeadsArray: Array.isArray(col?.leads)
        });
      }
      
      return isValid;
    });

    console.log('[KanbanBoard] ✅ Validação concluída:', {
      original: columns.length,
      filtered: filtered.length,
      totalLeads: filtered.reduce((acc, col) => acc + col.leads.length, 0),
      columnsDetail: filtered.map(c => ({ 
        id: c.id, 
        title: c.title, 
        leadsCount: c.leads.length 
      }))
    });
    
    return filtered;
  }, [columns]);

  // Hook de drag and drop com colunas estáveis
  const { onDragStart, onDragEnd } = useDragAndDrop({ 
    columns: validatedColumns, 
    onColumnsChange, 
    onMoveToWonLost, 
    isWonLostView
  });

  // Estado vazio melhorado com mais diagnósticos
  if (!validatedColumns || validatedColumns.length === 0) {
    console.log('[KanbanBoard] 📭 Exibindo estado vazio:', {
      originalColumns: columns?.length || 0,
      isArray: Array.isArray(columns),
      validatedLength: validatedColumns?.length || 0
    });

    const isDataError = Array.isArray(columns) && columns.length > 0;
    
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isDataError 
              ? "Erro nos Dados das Etapas" 
              : "Nenhuma etapa encontrada"
            }
          </h3>
          <p className="text-gray-600 mb-4">
            {isWonLostView 
              ? "Nenhum lead foi ganho ou perdido ainda" 
              : isDataError
                ? "As etapas foram carregadas mas contêm dados inválidos"
                : "Configure as etapas do seu funil para começar"
            }
          </p>
          
          {isDataError && (
            <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded mb-4">
              Debug: {columns.length} etapas carregadas, mas {validatedColumns.length} válidas
            </div>
          )}
          
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

  console.log('[KanbanBoard] 🎯 Renderizando board final com', validatedColumns.length, 'colunas válidas');

  return (
    <div className="relative w-full h-full flex flex-col">
      <DataErrorBoundary context="Carregamento de dados do Kanban">
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
