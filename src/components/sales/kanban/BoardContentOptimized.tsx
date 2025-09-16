import React, { useMemo, useRef } from "react";
import { KanbanColumn, KanbanLead } from "@/types/kanban";
import { KanbanColumnMemo } from "../KanbanColumnMemo";
import { MassSelectionReturn } from "@/hooks/useMassSelection";

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
  massSelection?: MassSelectionReturn;
  funnelId?: string | null;
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
  lostStageId,
  massSelection,
  funnelId
}) => {
  console.log('[BoardContentOptimized] 🎯 FASES 2+3 - Renderizando com arquitetura refinada:', {
    columnsCount: columns?.length || 0,
    isWonLostView,
    hasMassSelection: !!massSelection,
    massSelectionMode: massSelection?.isSelectionMode
  });

  // Ref para container principal
  const mainScrollRef = useRef<HTMLDivElement>(null);

  // Memoizar colunas validadas para evitar recálculos
  const validatedColumns = useMemo(() => {
    if (!Array.isArray(columns)) return [];
    return columns.filter(col => col && col.id && col.title && Array.isArray(col.leads));
  }, [columns]);

  // Memoizar estilos para evitar recriações
  const containerStyles = useMemo(() => ({
    height: '100%',
    minWidth: 'max-content',
    overscrollBehaviorX: 'contain'
  }), []);

  // Removido useEffect problemático - scroll funciona naturalmente

  if (!validatedColumns.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Nenhuma etapa encontrada</p>
      </div>
    );
  }

  return (
    // VERSÃO FUNCIONAL - Copiando EXATAMENTE o teste que funcionou
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <div
        ref={mainScrollRef}
        data-kanban-board
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
          gap: '24px',
          padding: '24px',
          cursor: 'grab',
          // Estilização da barra de scroll inline - padrão branco glassmorphism
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.8) transparent'
        }}
        // className="kanban-scrollbar" // TEMPORARIAMENTE REMOVIDO
        onWheel={(e) => {
          // Shift+scroll
          if (!e.shiftKey) return;
          e.currentTarget.scrollLeft += e.deltaY;
          e.preventDefault();
        }}
        onPointerDown={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          const target = e.target as HTMLElement;
          
          // Bloquear em elementos interativos
          if (target.closest('button, input, select, textarea, [role="button"], [data-rbd-draggable-id]')) return;
          
          e.preventDefault(); // Prevenir seleção de texto
          
          let startX = e.clientX;
          let startScroll = el.scrollLeft;
          let isScrolling = false;
          let moved = false;
          
          const threshold = 5; // Pixels mínimos para considerar movimento
          
          const onMove = (ev: PointerEvent) => {
            const dx = ev.clientX - startX;
            
            // Só inicia o scroll após threshold para evitar cliques acidentais
            if (!moved && Math.abs(dx) < threshold) return;
            
            if (!moved) {
              moved = true;
              isScrolling = true;
              el.style.cursor = 'grabbing';
              el.style.userSelect = 'none';
            }
            
            // Scroll apenas se estivermos em modo scrolling
            if (isScrolling) {
              el.scrollLeft = startScroll - dx;
            }
          };
          
          const onUp = (ev: PointerEvent) => {
            // IMPORTANTE: Limpar TUDO ao soltar
            isScrolling = false;
            moved = false;
            
            // Restaurar cursor e comportamento
            el.style.cursor = 'grab';
            el.style.userSelect = '';
            
            // Limpar capture e listeners
            el.releasePointerCapture(e.pointerId);
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
            document.removeEventListener('pointercancel', onCancel);
            
          };
          
          const onCancel = (cancelEvent: PointerEvent) => {
            // Mesmo cleanup para cancel
            onUp(cancelEvent);
          };
          
          // Usar document em vez de element para captura global
          el.setPointerCapture(e.pointerId);
          document.addEventListener('pointermove', onMove);
          document.addEventListener('pointerup', onUp);
          document.addEventListener('pointercancel', onCancel);
          
        }}
        onPointerLeave={() => {
          // Garantir limpeza se cursor sair da área durante drag
          const el = mainScrollRef.current;
          if (el) {
            el.style.cursor = 'grab';
            el.style.userSelect = '';
          }
        }}
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
            massSelection={massSelection}
            funnelId={funnelId}
          />
        ))}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparação otimizada do BoardContent (mantida da Fase 1)
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

  // 🚀 CORREÇÃO CRÍTICA: Verificar mudanças no massSelection
  const massSelectionChanged = 
    prevProps.massSelection?.isSelectionMode !== nextProps.massSelection?.isSelectionMode ||
    prevProps.massSelection?.selectedCount !== nextProps.massSelection?.selectedCount;

  // Debug logs removidos para produção

  return !(columnsChanged || stateChanged || massSelectionChanged);
});

BoardContentOptimized.displayName = 'BoardContentOptimized';
