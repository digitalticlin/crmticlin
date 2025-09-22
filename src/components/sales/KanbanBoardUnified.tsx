/**
 * 🎯 UNIFIED KANBAN BOARD
 *
 * Este componente substitui e unifica:
 * - KanbanBoard.tsx
 * - DndKanbanBoardWrapper.tsx
 *
 * Funciona com ou sem DnD, sem conflitos, coordenado centralmente.
 */

import React, { useCallback, useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DragOverlay } from '@dnd-kit/core';
import { KanbanColumn as IKanbanColumn, KanbanLead } from '@/types/kanban';
import { MassSelectionCoordinatedReturn } from '@/hooks/useMassSelectionCoordinated';
import { useSalesFunnelCoordinator } from './core/SalesFunnelCoordinator';
import { KanbanColumnUnified } from './KanbanColumnUnified';
import { LeadCard } from './LeadCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

interface KanbanBoardUnifiedProps {
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
  massSelection?: MassSelectionCoordinatedReturn;
  funnelId?: string | null;
  hasActiveFilters?: boolean;
  enableDnd?: boolean;
  className?: string;
}

/**
 * Board unificado que funciona com ou sem DnD, sem conflitos
 */
export const KanbanBoardUnified: React.FC<KanbanBoardUnifiedProps> = ({
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
  funnelId,
  hasActiveFilters = false,
  enableDnd = true,
  className
}) => {
  const coordinator = useSalesFunnelCoordinator();
  const { user } = useAuth();
  const { role } = useUserRole();

  // Estados do DnD
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedLead, setDraggedLead] = useState<KanbanLead | null>(null);

  // Sensores otimizados para DnD
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Pequena distância para evitar ativação acidental
        delay: 100,   // Pequeno delay para distinguir de cliques
        tolerance: 5
      },
    })
  );

  // Verificar se DnD deve estar ativo (coordenado)
  const isDndActive = enableDnd && coordinator.canExecute('dnd:move');

  console.log('[KanbanBoardUnified] 🎛️ Estado do componente:', {
    enableDnd,
    isDndActive,
    columnsReceived: columns.length,
    columnsDetail: columns.map(col => ({
      id: col.id,
      title: col.title,
      leadsCount: col.leads?.length || 0
    })),
    hasActiveFilters,
    isSelectionMode: massSelection?.isSelectionMode,
    canDragWithSelection: massSelection?.canDragWithSelection()
  });

  // Início do drag
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;

    // Verificar se pode iniciar drag
    if (!coordinator.canExecute('dnd:move')) {
      console.log('[KanbanBoardUnified] ⚠️ Drag bloqueado por coordinator');
      return;
    }

    // Notificar início do drag
    coordinator.emit({
      type: 'dnd:start',
      payload: { leadId: activeId },
      priority: 'immediate',
      source: 'KanbanBoard'
    });

    // Encontrar lead sendo arrastado
    let foundLead: KanbanLead | null = null;
    for (const column of columns) {
      const lead = column.leads.find(l => l.id === activeId);
      if (lead) {
        foundLead = lead;
        break;
      }
    }

    setActiveId(activeId);
    setDraggedLead(foundLead);

    console.log('[KanbanBoardUnified] 🎯 Drag iniciado:', {
      leadId: activeId,
      leadName: foundLead?.name,
      canDragWithSelection: massSelection?.canDragWithSelection()
    });
  }, [coordinator, columns, massSelection]);

  // Fim do drag
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    // Limpar estados
    setActiveId(null);
    setDraggedLead(null);

    // Notificar fim do drag
    coordinator.emit({
      type: 'dnd:end',
      payload: { leadId: active.id },
      priority: 'immediate',
      source: 'KanbanBoard'
    });

    if (!over) {
      console.log('[KanbanBoardUnified] ❌ Drop cancelado - sem área de destino');
      return;
    }

    // Encontrar lead e colunas
    let sourceLead: KanbanLead | null = null;
    let sourceColumnId: string | null = null;

    for (const column of columns) {
      const lead = column.leads.find(l => l.id === active.id);
      if (lead) {
        sourceLead = lead;
        sourceColumnId = column.id;
        break;
      }
    }

    if (!sourceLead || !sourceColumnId) {
      console.error('[KanbanBoardUnified] ❌ Lead não encontrado:', active.id);
      return;
    }

    // Determinar coluna de destino
    let targetColumnId: string | null = null;

    if (typeof over.id === 'string' && over.id.startsWith('column-')) {
      targetColumnId = over.id.replace('column-', '');
    } else {
      // Droppou em outro lead
      for (const column of columns) {
        if (column.leads.some(l => l.id === over.id)) {
          targetColumnId = column.id;
          break;
        }
      }
    }

    if (!targetColumnId) {
      console.error('[KanbanBoardUnified] ❌ Coluna de destino não encontrada');
      return;
    }

    console.log('[KanbanBoardUnified] 🎯 Movimento detectado:', {
      leadId: active.id,
      leadName: sourceLead.name,
      fromColumn: sourceColumnId,
      toColumn: targetColumnId,
      isSameColumn: sourceColumnId === targetColumnId
    });

    // Se for seleção múltipla, mover todos os selecionados
    if (massSelection?.isSelectionMode && massSelection.selectedLeads.has(sourceLead.id)) {
      const selectedLeads = massSelection.getSelectedLeadsData(
        columns.flatMap(col => col.leads)
      );

      console.log('[KanbanBoardUnified] 🔄 Movendo seleção múltipla:', {
        totalSelecionados: selectedLeads.length,
        destino: targetColumnId
      });

      // Aqui integraria com MassMoveModal ou moveria diretamente
      // Por enquanto, mover apenas o lead arrastado
    }

    // Atualizar UI otimisticamente
    const newColumns = columns.map(column => {
      if (column.id === sourceColumnId) {
        return {
          ...column,
          leads: column.leads.filter(l => l.id !== active.id)
        };
      } else if (column.id === targetColumnId) {
        return {
          ...column,
          leads: [...column.leads, {
            ...sourceLead,
            columnId: targetColumnId,
            kanban_stage_id: targetColumnId
          }]
        };
      }
      return column;
    });

    onColumnsChange(newColumns);

    // Persistir no banco
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          kanban_stage_id: targetColumnId,
          updated_at: new Date().toISOString()
        })
        .eq('id', active.id);

      if (error) throw error;

      const targetColumn = columns.find(col => col.id === targetColumnId);
      toast.success(`Lead "${sourceLead.name}" movido para: ${targetColumn?.title}`);

      console.log('[KanbanBoardUnified] ✅ Movimento persistido com sucesso');

    } catch (error) {
      console.error('[KanbanBoardUnified] ❌ Erro ao persistir movimento:', error);
      toast.error('Erro ao salvar movimento');
      onColumnsChange(columns); // Reverter
    }
  }, [coordinator, columns, massSelection, onColumnsChange]);

  // Drag over (preview)
  const handleDragOver = useCallback((event: DragOverEvent) => {
    // Implementar preview se necessário
  }, []);

  // Renderizar conteúdo das colunas
  const renderColumns = () => {
    return columns.map(column => (
      <KanbanColumnUnified
        key={column.id}
        column={column}
        onOpenLeadDetail={onOpenLeadDetail}
        onOpenChat={onOpenChat}
        onMoveToWonLost={onMoveToWonLost}
        onReturnToFunnel={onReturnToFunnel}
        isWonLostView={isWonLostView}
        wonStageId={wonStageId}
        lostStageId={lostStageId}
        massSelection={massSelection}
        funnelId={funnelId}
        enableDnd={isDndActive}
        hasActiveFilters={hasActiveFilters}
      />
    ));
  };

  // Se DnD estiver desabilitado, renderizar sem DndContext
  if (!isDndActive) {
    return (
      <div className={`flex gap-6 min-w-max px-6 py-4 ${className || ''}`}>
        {renderColumns()}
      </div>
    );
  }

  // Renderizar com DnD ativo
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className={`flex gap-6 min-w-max px-6 py-4 ${className || ''}`}>
        {renderColumns()}
      </div>

      <DragOverlay
        dropAnimation={{
          duration: 150,
          easing: 'ease-out'
        }}
      >
        {draggedLead && (
          <div className="opacity-90 transform rotate-5">
            <LeadCard
              lead={draggedLead}
              onClick={() => {}}
              onOpenChat={onOpenChat ? () => onOpenChat(draggedLead) : undefined}
              onMoveToWon={onMoveToWonLost ? () => onMoveToWonLost(draggedLead, "won") : undefined}
              onMoveToLost={onMoveToWonLost ? () => onMoveToWonLost(draggedLead, "lost") : undefined}
              onReturnToFunnel={onReturnToFunnel ? () => onReturnToFunnel(draggedLead) : undefined}
              isWonLostView={isWonLostView}
              wonStageId={wonStageId}
              lostStageId={lostStageId}
              massSelection={massSelection}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

