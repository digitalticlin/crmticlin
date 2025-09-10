import React, { useCallback, useState, useEffect } from 'react';
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
import { useQueryClient } from '@tanstack/react-query';
import { salesFunnelLeadsQueryKeys, salesFunnelStagesQueryKeys } from '@/hooks/salesFunnel/queryKeys';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

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
  markOptimisticChange?: (value: boolean) => void;
  // Sistema híbrido
  enableDnd?: boolean;
  className?: string;
}

/**
 * Board híbrido que pode funcionar com ou sem DnD
 * Permite migração gradual sem quebrar funcionalidades
 */
/**
 * 🎯 ESTRATÉGIA DE SINCRONIZAÇÃO:
 * 1. DnD atualiza APENAS estado local (columns) - ZERO delay
 * 2. Persiste no Supabase em background silenciosamente
 * 3. NUNCA invalida queries durante a sessão
 * 4. Sincroniza apenas em eventos específicos (navegação, refresh, etc)
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
  markOptimisticChange,
  enableDnd = false,
  className
}) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { role } = useUserRole();
  
  // Estado para o drag overlay
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedLead, setDraggedLead] = useState<KanbanLead | null>(null);

  // 🎯 SINCRONIZAÇÃO MANUAL: Listener para sincronizar quando necessário
  useEffect(() => {
    const handleManualSync = () => {
      console.log('[DndKanbanBoardWrapper] 🔄 Sincronização manual solicitada');
      
      // 🚀 DESABILITADO: Não fazer invalidação automática para evitar delay
      // Só sincroniza quando explicitamente solicitado via F5 ou navegação
      // queryClient.invalidateQueries({
      //   predicate: (query) => {
      //     const key = query.queryKey;
      //     return key.includes('salesfunnel-leads');
      //   }
      // });
    };

    // Escutar evento de sincronização manual
    window.addEventListener('dnd-manual-sync', handleManualSync);
    
    return () => {
      window.removeEventListener('dnd-manual-sync', handleManualSync);
    };
  }, [queryClient]);


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
  

  // 🔴 REMOVIDO: Hook do DnD causava conflito de estado
  // Vamos gerenciar tudo diretamente sem estado intermediário
  
  // Callback simplificado para movimento de items
  const handleItemMove = useCallback(async (itemId: string, fromColumnId: string, toColumnId: string, newIndex: number) => {
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

        console.log('[DndKanbanBoardWrapper] ✅ Mudança de etapa persistida no Supabase - mantendo estado otimista');
        
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

        // 🚀 SOLUÇÃO CIRÚRGICA: Apenas persistir, ZERO invalidação
        console.log('[DndKanbanBoardWrapper] ✅ Estado local atualizado + persistência silenciosa');

      } catch (error) {
        console.error('[DndKanbanBoardWrapper] ❌ Erro inesperado ao persistir:', error);
        toast.error('Erro inesperado ao salvar mudança');
        
        // Reverter UI em caso de erro
        onColumnsChange(columns);
      }
    }, [columns, onColumnsChange]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;
    
    console.log('[DndKanbanBoardWrapper] 🔄 DRAG START:', { activeId });
    
    // 🚀 Marcar que está fazendo drag para evitar invalidações
    document.body.setAttribute('data-dragging', 'true');
    markOptimisticChange?.(true);
    
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
            leads: [...column.leads, { 
              ...movingLead, 
              columnId: overColumnId,
              kanban_stage_id: overColumnId // IMPORTANTE: atualizar também kanban_stage_id
            }]
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
    
    // 🚀 IMPORTANTE: Manter marcação de dragging por mais 3 segundos
    // para evitar conflitos com subscriptions
    setTimeout(() => {
      document.body.removeAttribute('data-dragging');
      markOptimisticChange?.(false);
      console.log('[DndKanbanBoardWrapper] 🔓 Drag lock removido - subscriptions podem reativar');
    }, 3000);
    
    if (!over) {
      console.log('[DndKanbanBoardWrapper] ❌ DROP CANCELADO - Sem área de destino');
      return;
    }
    
    console.log('[DndKanbanBoardWrapper] ✅ DRAG END:', {
      activeId: active.id,
      overId: over.id,
      overData: over.data?.current
    });
    
    // Encontrar lead sendo movido
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
      console.error('[DndKanbanBoardWrapper] ❌ Lead não encontrado:', active.id);
      return;
    }
    
    // Determinar coluna de destino
    let targetColumnId: string | null = null;
    
    // Se droppou numa coluna (over.id começa com 'column-')
    if (typeof over.id === 'string' && over.id.startsWith('column-')) {
      targetColumnId = over.id.replace('column-', '');
    } 
    // Se droppou em outro lead, usar a coluna desse lead
    else {
      for (const column of columns) {
        if (column.leads.some(l => l.id === over.id)) {
          targetColumnId = column.id;
          break;
        }
      }
    }
    
    if (!targetColumnId) {
      console.error('[DndKanbanBoardWrapper] ❌ Coluna de destino não encontrada');
      return;
    }
    
    console.log('[DndKanbanBoardWrapper] 🎯 MOVIMENTO DETECTADO:', {
      leadId: active.id,
      leadName: sourceLead.name,
      fromColumn: sourceColumnId,
      toColumn: targetColumnId,
      sameColumn: sourceColumnId === targetColumnId
    });
    
    // Se mesmo column, reordenar
    if (sourceColumnId === targetColumnId) {
      const sourceColumn = columns.find(col => col.id === sourceColumnId)!;
      const activeIndex = sourceColumn.leads.findIndex(lead => lead.id === active.id);
      const overIndex = sourceColumn.leads.findIndex(lead => lead.id === over.id);
      
      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        console.log('[DndKanbanBoardWrapper] 📋 REORDENANDO DENTRO DA COLUNA');
        
        const newColumns = columns.map(column => {
          if (column.id === sourceColumnId) {
            const reorderedLeads = arrayMove(column.leads, activeIndex, overIndex);
            // Garantir que todos os leads mantêm o columnId correto
            const leadsWithCorrectColumnId = reorderedLeads.map(lead => ({
              ...lead,
              columnId: sourceColumnId,
              kanban_stage_id: sourceColumnId
            }));
            return {
              ...column,
              leads: leadsWithCorrectColumnId
            };
          }
          return column;
        });
        
        onColumnsChange(newColumns);
        
        // 🚀 PERSISTIR reordenação no Supabase usando order_position
        console.log('[DndKanbanBoardWrapper] 💾 PERSISTINDO reordenação no Supabase');
        
        const reorderedLeads = newColumns.find(col => col.id === sourceColumnId)?.leads || [];
        
        // Atualizar order_position de todos os leads da coluna
        const updatePromises = reorderedLeads.map((lead, index) => {
          return supabase
            .from('leads')
            .update({ 
              order_position: index,
              updated_at: new Date().toISOString()
            })
            .eq('id', lead.id);
        });
        
        Promise.all(updatePromises).then((results) => {
          const hasError = results.some(result => result.error);
          if (hasError) {
            console.error('[DndKanbanBoardWrapper] ❌ Erro ao persistir reordenação:', results);
            toast.error('Erro ao salvar nova ordem dos cards');
            // Reverter UI
            onColumnsChange(columns);
          } else {
            console.log('[DndKanbanBoardWrapper] ✅ Reordenação persistida com sucesso');
            toast.success('Ordem dos cards atualizada');
            
            // 🚀 Garantir que a nova ordem persista visualmente
            setTimeout(() => {
              onColumnsChange([...newColumns]);
            }, 100);
          }
        }).catch(error => {
          console.error('[DndKanbanBoardWrapper] ❌ Erro inesperado na reordenação:', error);
          toast.error('Erro inesperado ao reordenar');
          onColumnsChange(columns);
        });
      }
      return;
    }
    
    // Movimento entre colunas - atualizar UI otimisticamente
    const newColumns = columns.map(column => {
      if (column.id === sourceColumnId) {
        // Remover da coluna origem
        return {
          ...column,
          leads: column.leads.filter(l => l.id !== active.id)
        };
      } else if (column.id === targetColumnId) {
        // Adicionar na coluna destino com TODOS os campos atualizados
        const updatedLead = { 
          ...sourceLead, 
          columnId: targetColumnId,
          kanban_stage_id: targetColumnId // IMPORTANTE: atualizar também kanban_stage_id
        };
        
        // Determinar posição de inserção
        let insertIndex = column.leads.length; // Por padrão, adiciona no final
        
        // Se droppou em cima de outro lead, inserir na posição dele
        if (over.id !== `column-${targetColumnId}`) {
          const overIndex = column.leads.findIndex(l => l.id === over.id);
          if (overIndex !== -1) {
            insertIndex = overIndex;
          }
        }
        
        const newLeads = [...column.leads];
        newLeads.splice(insertIndex, 0, updatedLead);
        
        return {
          ...column,
          leads: newLeads
        };
      }
      return column;
    });
    
    onColumnsChange(newColumns);
    
    // Persistir mudança no Supabase
    try {
      console.log('[DndKanbanBoardWrapper] 💾 PERSISTINDO no Supabase:', {
        leadId: active.id,
        leadName: sourceLead.name,
        fromStage: sourceColumnId,
        toStage: targetColumnId,
        userId: user?.id
      });
      
      // 🔴 Preparar query com filtros de segurança corretos
      let updateQuery = supabase
        .from('leads')
        .update({ 
          kanban_stage_id: targetColumnId,
          updated_at: new Date().toISOString()
        })
        .eq('id', active.id);

      // Aplicar filtro baseado no role
      if (role === 'admin') {
        // Admin: só pode mover leads que criou
        updateQuery = updateQuery.eq('created_by_user_id', user.id);
      } else {
        // Operacional: pode mover qualquer lead (RLS já filtra por instância)
        console.log('[DndKanbanBoardWrapper] 🔒 Usuário operacional - RLS aplicará filtros');
      }

      const { error, data } = await updateQuery;

      if (error) {
        console.error('[DndKanbanBoardWrapper] ❌ Erro ao persistir:', error);
        toast.error('Erro ao salvar mudança de etapa');
        
        // Reverter UI em caso de erro
        onColumnsChange(columns);
        
        // Remover marcação de dragging em caso de erro
        document.body.removeAttribute('data-dragging');
        markOptimisticChange?.(false);
        return;
      }

      console.log('[DndKanbanBoardWrapper] ✅ Mudança persistida com sucesso:', {
        leadId: active.id,
        newStage: targetColumnId,
        affectedRows: data?.length || 'N/A',
        data: data
      });
      
      // Encontrar nome da nova etapa
      const targetColumn = columns.find(col => col.id === targetColumnId);
      const stageName = targetColumn?.title || 'Nova etapa';
      
      toast.success(`Lead "${sourceLead.name}" movido para: ${stageName}`);
      
      // Disparar evento para atualização em tempo real
      window.dispatchEvent(new CustomEvent('leadStageChanged', {
        detail: { 
          leadId: active.id, 
          newStageId: targetColumnId, 
          newStageName: stageName,
          fromStageId: sourceColumnId
        }
      }));

      // 🚀 APÓS SUCESSO: Garantir que o estado local persista
      // Forçar re-render das colunas para garantir que a mudança seja vista
      setTimeout(() => {
        onColumnsChange([...newColumns]); // Clone para forçar re-render
      }, 100);
      
      console.log('[DndKanbanBoardWrapper] ✅ Mudança entre etapas - estado local + persistência silenciosa');
      
    } catch (error) {
      console.error('[DndKanbanBoardWrapper] ❌ Erro inesperado:', error);
      toast.error('Erro inesperado ao salvar');
      
      // Reverter UI em caso de erro
      onColumnsChange(columns);
      
      // Remover marcação de dragging em caso de erro
      document.body.removeAttribute('data-dragging');
      markOptimisticChange?.(false);
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
              <div className="opacity-90">
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