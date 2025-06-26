
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
      console.log('[DragDropSafe] 🎯 Iniciando drag - interface otimizada');
      setIsDragging(true);
      
      // ENHANCED: Better UX during drag
      document.body.style.userSelect = 'none';
      document.body.style.overflow = 'hidden';
      document.body.style.cursor = 'grabbing';
      
    } catch (error) {
      console.error('[DragDropSafe] ❌ Erro ao iniciar drag:', error);
      setIsDragging(false);
    }
  }, []);

  const onDragEnd = useCallback(async (result: DropResult) => {
    try {
      console.log('[DragDropSafe] 🎯 Finalizando drag:', result);
      setIsDragging(false);
      
      // CRITICAL: Restore UI immediately to prevent freezing
      document.body.style.userSelect = 'unset';
      document.body.style.overflow = 'unset';
      document.body.style.cursor = 'default';

      // Validate drag result
      if (!result.destination || !result.source) {
        console.log('[DragDropSafe] ⚠️ Drag cancelado - sem destino válido');
        return;
      }

      if (result.destination.droppableId === result.source.droppableId && 
          result.destination.index === result.source.index) {
        console.log('[DragDropSafe] ⚠️ Drag cancelado - mesma posição');
        return;
      }

      // Validate columns
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

      // OPTIMIZED: Same column reorder
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
        toast.success(`"${draggedLead.name}" reordenado`);
        return;
      }

      // ENHANCED: Cross-column move with immediate UI update + background sync
      const sourceLeads = Array.from(sourceColumn.leads);
      const destLeads = Array.from(destColumn.leads);
      const [removed] = sourceLeads.splice(result.source.index, 1);
      
      const updatedLead = { ...removed, columnId: destColumn.id };
      destLeads.splice(result.destination.index, 0, updatedLead);

      // PRIORITY 1: Update UI immediately for fluid UX
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
      
      // Show immediate feedback
      toast.success(`"${draggedLead.name}" movido para "${destColumn.title}"`);

      // PRIORITY 2: Sync with database in background
      try {
        console.log('[DragDropSafe] 🔄 Sincronizando com banco:', {
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
          console.error('[DragDropSafe] ❌ Erro no banco:', updateError);
          
          // ROLLBACK: Revert UI changes on database error
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

        console.log('[DragDropSafe] ✅ Sincronização concluída com sucesso');

      } catch (backendError) {
        console.error('[DragDropSafe] ❌ Erro crítico no backend:', backendError);
        toast.error("Erro de conexão. Recarregue a página se necessário.");
      }

      console.log('[DragDropSafe] ✅ Drag completado com sucesso');

    } catch (error) {
      console.error('[DragDropSafe] ❌ Erro durante drag and drop:', error);
      setIsDragging(false);
      
      // CRITICAL: Always restore UI state on error
      document.body.style.userSelect = 'unset';
      document.body.style.overflow = 'unset';
      document.body.style.cursor = 'default';
      
      toast.error("Erro durante operação de drag and drop");
    }
  }, [columns, onColumnsChange]);

  return {
    isDragging,
    onDragStart,
    onDragEnd
  };
};
