
import { useCallback } from "react";
import { DropResult } from "react-beautiful-dnd";
import { KanbanColumn, KanbanLead } from "@/types/kanban";
import { toast } from "sonner";
import { useDragSync } from "./useDragSync";

interface UseDragOperationsProps {
  columns: KanbanColumn[];
  onColumnsChange: (newColumns: KanbanColumn[]) => void;
}

export const useDragOperations = ({
  columns,
  onColumnsChange
}: UseDragOperationsProps) => {

  // Função para reverter UI em caso de erro
  const revertMove = useCallback((leadId: string, originalColumnId: string) => {
    console.log('[DragOperations] ↩️ Revertendo movimentação:', leadId);
    
    // Encontrar lead e restaurar posição original
    const originalColumns = [...columns];
    onColumnsChange(originalColumns);
  }, [columns, onColumnsChange]);

  const { syncToDatabase } = useDragSync({ onRevert: revertMove });

  // Operação de reordenação na mesma coluna
  const reorderInSameColumn = useCallback((
    result: DropResult,
    sourceColumn: KanbanColumn
  ) => {
    console.log('[DragOperations] 🔄 Reordenação na mesma coluna');
    
    const newLeads = Array.from(sourceColumn.leads);
    const [removed] = newLeads.splice(result.source.index, 1);
    newLeads.splice(result.destination!.index, 0, removed);

    const newColumns = columns.map(col => 
      col.id === sourceColumn.id 
        ? { ...col, leads: newLeads }
        : col
    );

    onColumnsChange(newColumns);
    toast.success(`"${removed.name}" reordenado`);
  }, [columns, onColumnsChange]);

  // Operação de movimento entre colunas com optimistic update
  const moveBetweenColumns = useCallback(async (
    result: DropResult,
    sourceColumn: KanbanColumn,
    destColumn: KanbanColumn
  ) => {
    console.log('[DragOperations] 🚀 Movimento entre colunas (OPTIMISTIC)');
    
    const draggedLead = sourceColumn.leads[result.source.index];
    
    // PASSO 1: Atualizar UI IMEDIATAMENTE (Optimistic Update)
    const sourceLeads = Array.from(sourceColumn.leads);
    const destLeads = Array.from(destColumn.leads);
    const [removed] = sourceLeads.splice(result.source.index, 1);
    
    const updatedLead = { ...removed, columnId: destColumn.id };
    destLeads.splice(result.destination!.index, 0, updatedLead);

    const optimisticColumns = columns.map(col => {
      if (col.id === sourceColumn.id) {
        return { ...col, leads: sourceLeads };
      }
      if (col.id === destColumn.id) {
        return { ...col, leads: destLeads };
      }
      return col;
    });

    // Aplicar mudança na UI
    onColumnsChange(optimisticColumns);
    
    // Feedback imediato
    toast.success(`"${draggedLead.name}" movido para "${destColumn.title}"`);

    // PASSO 2: Sincronizar com banco em background
    const syncSuccess = await syncToDatabase(
      draggedLead, 
      destColumn.id, 
      sourceColumn.id
    );

    if (!syncSuccess) {
      console.log('[DragOperations] ❌ Sync falhou, UI já foi revertida');
    }
    
  }, [columns, onColumnsChange, syncToDatabase]);

  return {
    reorderInSameColumn,
    moveBetweenColumns
  };
};
