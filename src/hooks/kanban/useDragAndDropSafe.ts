
import { useState, useCallback } from "react";
import { DropResult } from "react-beautiful-dnd";
import { KanbanColumn, KanbanLead } from "@/types/kanban";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseDragAndDropSafeProps {
  columns: KanbanColumn[];
  onColumnsChange: (newColumns: KanbanColumn[]) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
  isWonLostView?: boolean;
}

export const useDragAndDropSafe = ({ 
  columns, 
  onColumnsChange, 
  onMoveToWonLost,
  isWonLostView = false
}: UseDragAndDropSafeProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const onDragStart = useCallback(() => {
    try {
      console.log('[DragDropSafe] 🎯 RADICAL - Iniciando drag com interface otimizada');
      setIsDragging(true);
      
      // RADICAL: Não manipular DOM aqui - deixar para o StableDragDropWrapper
      // Apenas marcar estado interno
      
    } catch (error) {
      console.error('[DragDropSafe] ❌ Erro ao iniciar drag:', error);
      setIsDragging(false);
    }
  }, []);

  const onDragEnd = useCallback(async (result: DropResult) => {
    try {
      console.log('[DragDropSafe] 🎯 RADICAL - Finalizando drag:', result);
      setIsDragging(false);

      // RADICAL: Não manipular DOM aqui - StableDragDropWrapper já fez

      // Validação básica
      if (!result.destination || !result.source) {
        console.log('[DragDropSafe] ⚠️ Drag cancelado - sem destino válido');
        return;
      }

      if (result.destination.droppableId === result.source.droppableId && 
          result.destination.index === result.source.index) {
        console.log('[DragDropSafe] ⚠️ Drag cancelado - mesma posição');
        return;
      }

      // Validação de colunas
      if (!Array.isArray(columns) || columns.length === 0) {
        console.error('[DragDropSafe] ❌ Colunas inválidas');
        toast.error("Erro: dados das etapas inválidos");
        return;
      }

      const sourceColumn = columns.find(col => col.id === result.source.droppableId);
      const destColumn = columns.find(col => col.id === result.destination!.droppableId);

      if (!sourceColumn || !destColumn) {
        console.error('[DragDropSafe] ❌ Coluna não encontrada', {
          sourceId: result.source.droppableId,
          destId: result.destination.droppableId
        });
        toast.error("Erro: etapa não encontrada");
        return;
      }

      const draggedLead = sourceColumn.leads[result.source.index];
      if (!draggedLead) {
        console.error('[DragDropSafe] ❌ Lead não encontrado');
        toast.error("Erro: item não encontrado");
        return;
      }

      // RADICAL: Reordenação na mesma coluna
      if (result.source.droppableId === result.destination.droppableId) {
        console.log('[DragDropSafe] 🔄 RADICAL - Reordenação na mesma coluna');
        
        const newLeads = Array.from(sourceColumn.leads);
        const [removed] = newLeads.splice(result.source.index, 1);
        newLeads.splice(result.destination.index, 0, removed);

        const newColumns = columns.map(col => 
          col.id === sourceColumn.id 
            ? { ...col, leads: newLeads }
            : col
        );

        onColumnsChange(newColumns);
        toast.success(`"${draggedLead.name}" reordenado`);
        return;
      }

      // RADICAL: Movimentação entre colunas com UI imediata + sync em background
      console.log('[DragDropSafe] 🔄 RADICAL - Movimentação entre colunas:', {
        leadName: draggedLead.name,
        from: sourceColumn.title,
        to: destColumn.title
      });

      const sourceLeads = Array.from(sourceColumn.leads);
      const destLeads = Array.from(destColumn.leads);
      const [removed] = sourceLeads.splice(result.source.index, 1);
      
      const updatedLead = { ...removed, columnId: destColumn.id };
      destLeads.splice(result.destination.index, 0, updatedLead);

      // PRIORIDADE 1: Atualizar UI IMEDIATAMENTE
      const newColumns = columns.map(col => {
        if (col.id === sourceColumn.id) {
          return { ...col, leads: sourceLeads };
        }
        if (col.id === destColumn.id) {
          return { ...col, leads: destLeads };
        }
        return col;
      });

      onColumnsChange(newColumns);
      
      // Feedback imediato
      toast.success(`"${draggedLead.name}" movido para "${destColumn.title}"`);

      // PRIORIDADE 2: Sincronizar com banco em background
      try {
        console.log('[DragDropSafe] 🔄 RADICAL - Sincronizando com Supabase:', {
          leadId: draggedLead.id,
          newStageId: destColumn.id
        });

        const { error: updateError } = await supabase
          .from("leads")
          .update({ 
            kanban_stage_id: destColumn.id,
            updated_at: new Date().toISOString()
          })
          .eq("id", draggedLead.id);

        if (updateError) {
          console.error('[DragDropSafe] ❌ Erro no Supabase:', updateError);
          
          // ROLLBACK: Reverter UI em caso de erro no banco
          const revertedColumns = columns.map(col => {
            if (col.id === sourceColumn.id) {
              return { ...col, leads: sourceColumn.leads };
            }
            if (col.id === destColumn.id) {
              return { ...col, leads: destColumn.leads };
            }
            return col;
          });
          
          onColumnsChange(revertedColumns);
          toast.error("Erro ao salvar. Operação revertida.");
          return;
        }

        console.log('[DragDropSafe] ✅ RADICAL - Sincronização Supabase concluída');

        // ✅ Invalidar caches para evitar rollback visual por refetch antigo
        try {
          const { useQueryClient } = await import('@tanstack/react-query');
          const qc = useQueryClient();
          qc.invalidateQueries({ queryKey: ['kanban-leads'] });
          qc.invalidateQueries({ queryKey: ['leads'] });
        } catch (e) {
          // sem react-query neste escopo, ignore
        }

      } catch (backendError) {
        console.error('[DragDropSafe] ❌ Erro crítico no backend:', backendError);
        toast.error("Erro de conexão. Tente novamente.");
      }

      console.log('[DragDropSafe] ✅ RADICAL - Drag completado com sucesso');

    } catch (error) {
      console.error('[DragDropSafe] ❌ Erro durante drag and drop:', error);
      setIsDragging(false);
      toast.error("Erro durante operação de drag and drop");
    }
  }, [columns, onColumnsChange]);

  return {
    isDragging,
    onDragStart,
    onDragEnd
  };
};
