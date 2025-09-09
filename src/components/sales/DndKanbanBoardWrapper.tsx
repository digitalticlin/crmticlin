import React, { useCallback, useState } from 'react';
import { DndKanbanWrapper, useDndKanban } from '@/components/dnd';
import { DndKanbanColumnWrapper } from './DndKanbanColumnWrapper';
import { DataErrorBoundary } from './funnel/DataErrorBoundary';
import { KanbanColumn as IKanbanColumn, KanbanLead } from '@/types/kanban';
import { MassSelectionReturn } from '@/hooks/useMassSelection';
import { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { LeadCard } from './LeadCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DndKanbanBoardWrapperProps {
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
  // Sistema híbrido
  enableDnd?: boolean;
  className?: string;
}

/**
 * Board híbrido que pode funcionar com ou sem DnD
 * Permite migração gradual sem quebrar funcionalidades
 */
export const DndKanbanBoardWrapper: React.FC<DndKanbanBoardWrapperProps> = ({
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
  enableDnd = false,
  className
}) => {
  // Estado para o drag overlay
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedLead, setDraggedLead] = useState<KanbanLead | null>(null);

  // Converter colunas para formato do useDndKanban
  const dndColumns = columns.map(column => ({
    id: column.id,
    title: column.title,
    color: column.color,
    items: column.leads.map(lead => ({
      id: lead.id,
      columnId: lead.columnId,
      ...lead
    }))
  }));
  

  // Hook do DnD (só usado se enableDnd = true)
  const dndKanban = useDndKanban({
    initialColumns: dndColumns,
    onItemMove: useCallback(async (itemId: string, fromColumnId: string, toColumnId: string, newIndex: number) => {
      // Encontrar o lead
      const fromColumn = columns.find(col => col.id === fromColumnId);
      const lead = fromColumn?.leads.find(l => l.id === itemId);
      
      if (!lead || !fromColumn) {
        console.error('Lead ou coluna não encontrada:', { itemId, fromColumnId });
        return;
      }

      console.log('[DndKanbanBoardWrapper] 🔄 Movendo lead:', {
        leadId: itemId,
        leadName: lead.name,
        fromStage: fromColumnId,
        toStage: toColumnId,
        newIndex
      });

      // Atualizar UI imediatamente (otimistic update)
      const newColumns = columns.map(column => {
        if (column.id === fromColumnId) {
          // Remover da coluna origem
          return {
            ...column,
            leads: column.leads.filter(l => l.id !== itemId)
          };
        } else if (column.id === toColumnId) {
          // Adicionar na coluna destino
          const updatedLead = { ...lead, columnId: toColumnId };
          const newLeads = [...column.leads];
          newLeads.splice(newIndex, 0, updatedLead);
          return {
            ...column,
            leads: newLeads
          };
        }
        return column;
      });

      onColumnsChange(newColumns);

      // Persistir no Supabase
      try {
        const { error } = await supabase
          .from('leads')
          .update({ 
            kanban_stage_id: toColumnId,
            updated_at: new Date().toISOString()
          })
          .eq('id', itemId);

        if (error) {
          console.error('[DndKanbanBoardWrapper] ❌ Erro ao persistir mudança de etapa:', error);
          toast.error('Erro ao salvar mudança de etapa');
          
          // Reverter UI em caso de erro
          onColumnsChange(columns);
          return;
        }

        console.log('[DndKanbanBoardWrapper] ✅ Mudança de etapa persistida no Supabase');
        
        // Encontrar nome da nova etapa
        const toColumn = columns.find(col => col.id === toColumnId);
        const stageName = toColumn?.title || 'Nova etapa';
        
        toast.success(`Lead "${lead.name}" movido para: ${stageName}`);
        
        // Disparar evento para atualizar outros componentes em tempo real
        window.dispatchEvent(new CustomEvent('leadStageChanged', {
          detail: { 
            leadId: itemId, 
            newStageId: toColumnId, 
            newStageName: stageName,
            fromStageId: fromColumnId
          }
        }));

      } catch (error) {
        console.error('[DndKanbanBoardWrapper] ❌ Erro inesperado ao persistir:', error);
        toast.error('Erro inesperado ao salvar mudança');
        
        // Reverter UI em caso de erro
        onColumnsChange(columns);
      }
    }, [columns, onColumnsChange])
  });

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;
    
    console.log('[DndKanbanBoardWrapper] 🔄 DRAG START:', { activeId });
    
    // Encontrar o lead sendo arrastado
    let foundLead: KanbanLead | null = null;
    for (const column of columns) {
      const lead = column.leads.find(l => l.id === activeId);
      if (lead) {
        foundLead = lead;
        break;
      }
    }
    
    console.log('[DndKanbanBoardWrapper] ✅ DRAG INICIADO:', { 
      leadId: activeId,
      leadName: foundLead?.name 
    });
    
    setActiveId(activeId);
    setDraggedLead(foundLead);
  }, [columns]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    // Encontrar colunas de origem e destino
    const activeColumnId = columns.find(col => 
      col.leads.some(lead => lead.id === active.id)
    )?.id;
    
    const overColumnId = typeof over.id === 'string' && over.id.startsWith('column-') 
      ? over.id.replace('column-', '') 
      : columns.find(col => col.leads.some(lead => lead.id === over.id))?.id;
    
    if (!activeColumnId || !overColumnId || activeColumnId === overColumnId) return;
    
    console.log('[DndKanbanBoardWrapper] 🔄 MOVENDO ENTRE COLUNAS:', {
      activeId: active.id,
      fromColumn: activeColumnId,
      toColumn: overColumnId
    });
    
    // Atualizar visualmente (otimistic update)
    const newColumns = columns.map(column => {
      if (column.id === activeColumnId) {
        return {
          ...column,
          leads: column.leads.filter(lead => lead.id !== active.id)
        };
      } else if (column.id === overColumnId) {
        const movingLead = columns.find(col => col.id === activeColumnId)
          ?.leads.find(lead => lead.id === active.id);
        
        if (movingLead) {
          return {
            ...column,
            leads: [...column.leads, { ...movingLead, columnId: overColumnId }]
          };
        }
      }
      return column;
    });
    
    onColumnsChange(newColumns);
  }, [columns, onColumnsChange]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Limpar estado do drag
    setActiveId(null);
    setDraggedLead(null);
    
    if (!over || active.id === over.id) return;
    
    console.log('[DndKanbanBoardWrapper] ✅ DRAG END:', {
      activeId: active.id,
      overId: over.id
    });
    
    // Encontrar a coluna do lead ativo
    const activeColumn = columns.find(col => 
      col.leads.some(lead => lead.id === active.id)
    );
    
    if (!activeColumn) return;
    
    // Verificar se é reordenação dentro da mesma coluna
    const activeIndex = activeColumn.leads.findIndex(lead => lead.id === active.id);
    const overIndex = activeColumn.leads.findIndex(lead => lead.id === over.id);
    
    if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
      console.log('[DndKanbanBoardWrapper] 📋 REORDENANDO DENTRO DA COLUNA:', {
        columnId: activeColumn.id,
        fromIndex: activeIndex,
        toIndex: overIndex
      });
      
      // Reordenar dentro da mesma coluna
      const newColumns = columns.map(column => {
        if (column.id === activeColumn.id) {
          return {
            ...column,
            leads: arrayMove(column.leads, activeIndex, overIndex)
          };
        }
        return column;
      });
      
      onColumnsChange(newColumns);
    }
    
    // Persistir mudança no banco (se necessário)
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          kanban_stage_id: activeColumn.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', active.id);

      if (error) {
        console.error('[DndKanbanBoardWrapper] ❌ Erro ao persistir:', error);
        toast.error('Erro ao salvar mudança');
      } else {
        console.log('[DndKanbanBoardWrapper] ✅ Mudança persistida');
      }
    } catch (error) {
      console.error('[DndKanbanBoardWrapper] ❌ Erro inesperado:', error);
    }
  }, [columns, onColumnsChange]);

  const isEmpty = !columns || columns.length === 0;

  if (isEmpty) {
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

  const boardContent = (
    <div className={`flex gap-6 min-w-max px-6 py-4 ${className || ''}`}>
      {columns.map(column => (
        <DndKanbanColumnWrapper
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
          enableDnd={enableDnd}
        />
      ))}
    </div>
  );

  return (
    <div className="relative w-full h-full flex flex-col">
      <DataErrorBoundary context={`Kanban Board - DnD ${enableDnd ? 'Enabled' : 'Disabled'}`}>
        {enableDnd ? (
          <DndKanbanWrapper 
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            dragOverlay={draggedLead ? (
              <div className="opacity-90 scale-105 rotate-2">
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
            ) : null}
            className="flex-1"
          >
            {boardContent}
          </DndKanbanWrapper>
        ) : (
          <div className="flex-1 overflow-x-auto">
            {boardContent}
          </div>
        )}
        
      </DataErrorBoundary>
    </div>
  );
};