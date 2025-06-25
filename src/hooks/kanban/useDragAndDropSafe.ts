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
      console.log('[DragDropSafe] 🎯 Drag iniciado');
      setIsDragging(true);
    } catch (error) {
      console.error('[DragDropSafe] ❌ Erro ao iniciar drag:', error);
      setIsDragging(false);
    }
  }, []);

  const onDragEnd = useCallback(async (result: DropResult) => {
    try {
      console.log('[DragDropSafe] 🎯 Drag finalizado:', result);
      setIsDragging(false);

      if (!result.destination || !result.source) {
        console.log('[DragDropSafe] ⚠️ Drag cancelado - sem destino válido');
        return;
      }

      if (result.destination.droppableId === result.source.droppableId && 
          result.destination.index === result.source.index) {
        console.log('[DragDropSafe] ⚠️ Drag cancelado - mesma posição');
        return;
      }

      // Validar colunas
      if (!Array.isArray(columns) || columns.length === 0) {
        console.error('[DragDropSafe] ❌ Colunas inválidas');
        return;
      }

      const sourceColumn = columns.find(col => col.id === result.source.droppableId);
      const destColumn = columns.find(col => col.id === result.destination!.droppableId);

      if (!sourceColumn || !destColumn) {
        console.error('[DragDropSafe] ❌ Coluna não encontrada', {
          sourceId: result.source.droppableId,
          destId: result.destination.droppableId
        });
        return;
      }

      const draggedLead = sourceColumn.leads[result.source.index];
      if (!draggedLead) {
        console.error('[DragDropSafe] ❌ Lead não encontrado');
        return;
      }

      // Reordenar na mesma coluna
      if (result.source.droppableId === result.destination.droppableId) {
        const newLeads = Array.from(sourceColumn.leads);
        const [removed] = newLeads.splice(result.source.index, 1);
        newLeads.splice(result.destination.index, 0, removed);

        const newColumns = columns.map(col => 
          col.id === sourceColumn.id 
            ? { ...col, leads: newLeads }
            : col
        );

        onColumnsChange(newColumns);
        return;
      }

      // Mover entre colunas
      const sourceLeads = Array.from(sourceColumn.leads);
      const destLeads = Array.from(destColumn.leads);
      const [removed] = sourceLeads.splice(result.source.index, 1);
      
      // Atualizar columnId do lead
      const updatedLead = { ...removed, columnId: destColumn.id };
      destLeads.splice(result.destination.index, 0, updatedLead);

      // ATUALIZAR UI PRIMEIRO (UX responsivo)
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

      // ATUALIZAR BACKEND (sem bloquear UI)
      try {
        console.log('[DragDropSafe] 🔄 Atualizando backend:', {
          leadId: draggedLead.id,
          leadName: draggedLead.name,
          oldStageId: sourceColumn.id,
          newStageId: destColumn.id,
          newStageName: destColumn.title
        });

        const { error: updateError } = await supabase
          .from("leads")
          .update({ 
            kanban_stage_id: destColumn.id,
            updated_at: new Date().toISOString()
          })
          .eq("id", draggedLead.id);

        if (updateError) {
          console.error('[DragDropSafe] ❌ Erro ao atualizar backend:', updateError);
          toast.error("Erro ao salvar alteração. Recarregue a página.");
          
          // REVERTER UI em caso de erro
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
          return;
        }

        // VERIFICAR se atualização foi bem-sucedida
        const { data: verifyData, error: verifyError } = await supabase
          .from("leads")
          .select("kanban_stage_id")
          .eq("id", draggedLead.id)
          .single();

        if (verifyError) {
          console.error('[DragDropSafe] ❌ Erro ao verificar atualização:', verifyError);
        } else if (verifyData?.kanban_stage_id === destColumn.id) {
          console.log('[DragDropSafe] ✅ Atualização confirmada no banco');
          toast.success(`Lead "${draggedLead.name}" movido para "${destColumn.title}"`);
        } else {
          console.error('[DragDropSafe] ❌ Inconsistência detectada:', {
            expected: destColumn.id,
            actual: verifyData?.kanban_stage_id
          });
          toast.error("Inconsistência detectada. Recarregue a página.");
        }

      } catch (backendError) {
        console.error('[DragDropSafe] ❌ Erro crítico no backend:', backendError);
        toast.error("Erro de conexão. Recarregue a página.");
        
        // REVERTER UI em caso de erro crítico
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
      }

      console.log('[DragDropSafe] ✅ Drag completado com sucesso');

    } catch (error) {
      console.error('[DragDropSafe] ❌ Erro durante drag and drop:', error);
      setIsDragging(false);
    }
  }, [columns, onColumnsChange]);

  return {
    isDragging,
    onDragStart,
    onDragEnd
  };
};
