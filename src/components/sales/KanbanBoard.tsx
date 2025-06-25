
import { KanbanColumn as IKanbanColumn, KanbanLead } from "@/types/kanban";
import { useDragAndDrop } from "@/hooks/kanban/useDragAndDrop";
import { BoardContent } from "./kanban/BoardContent";
import { StableDragDropWrapper } from "./funnel/StableDragDropWrapper";
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
  // Validar e estabilizar colunas com mais detalhes de debug
  const validatedColumns = useMemo(() => {
    console.log('[KanbanBoard] 🔍 Validando colunas recebidas:', {
      isArray: Array.isArray(columns),
      count: columns?.length || 0,
      columns: columns?.map(c => ({ 
        id: c?.id, 
        title: c?.title, 
        leadsCount: c?.leads?.length || 0,
        hasValidLeads: Array.isArray(c?.leads)
      }))
    });

    if (!Array.isArray(columns)) {
      console.warn('[KanbanBoard] ⚠️ Colunas não são array, usando array vazio');
      return [];
    }
    
    const filtered = columns.filter(col => {
      const isValid = col && 
        typeof col.id === 'string' && 
        typeof col.title === 'string' &&
        Array.isArray(col.leads);
      
      if (!isValid) {
        console.warn('[KanbanBoard] ⚠️ Coluna inválida filtrada:', col);
      }
      
      return isValid;
    });

    console.log('[KanbanBoard] ✅ Colunas válidas após filtro:', {
      original: columns.length,
      filtered: filtered.length,
      totalLeads: filtered.reduce((acc, col) => acc + col.leads.length, 0)
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

  // Estado vazio com mais informações
  if (!validatedColumns || validatedColumns.length === 0) {
    console.log('[KanbanBoard] 📭 Exibindo estado vazio');
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {Array.isArray(columns) ? "Nenhuma etapa encontrada" : "Erro ao carregar etapas"}
          </h3>
          <p className="text-gray-600">
            {isWonLostView 
              ? "Nenhum lead foi ganho ou perdido ainda" 
              : Array.isArray(columns) 
                ? "Configure as etapas do seu funil para começar"
                : "Recarregue a página para tentar novamente"
            }
          </p>
          {!Array.isArray(columns) && (
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Recarregar Página
            </button>
          )}
        </div>
      </div>
    );
  }

  console.log('[KanbanBoard] 🎯 Renderizando board com', validatedColumns.length, 'colunas');

  return (
    <div className="relative w-full h-full flex flex-col">
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
    </div>
  );
};
