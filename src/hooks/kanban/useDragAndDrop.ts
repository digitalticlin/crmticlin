
import { DropResult } from "react-beautiful-dnd";
import { KanbanColumn, KanbanLead } from "@/types/kanban";
import { useDragAndDropSafe } from "./useDragAndDropSafe";
import { useDragAndDropDatabase } from "./useDragAndDropDatabase";

interface UseDragAndDropProps {
  columns: KanbanColumn[];
  onColumnsChange: (newColumns: KanbanColumn[]) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
  isWonLostView?: boolean;
}

export const useDragAndDrop = ({ 
  columns, 
  onColumnsChange, 
  onMoveToWonLost,
  isWonLostView = false
}: UseDragAndDropProps) => {
  console.log('[useDragAndDrop] 🔄 Inicializando com colunas:', columns?.length || 0);

  // Hooks para diferentes funcionalidades
  const safeImplementation = useDragAndDropSafe({
    columns,
    onColumnsChange,
    onMoveToWonLost,
    isWonLostView
  });

  const databaseOperations = useDragAndDropDatabase();

  // Handler integrado que combina UI + Database
  const handleDragEnd = async (result: DropResult) => {
    try {
      console.log('[useDragAndDrop] 🎯 Processando drag end integrado');
      
      // Primeiro, atualizar a UI imediatamente (UX responsiva)
      await safeImplementation.onDragEnd(result);
      
      // Depois, sincronizar com banco de dados (persistência)
      if (result.destination && result.source.droppableId !== result.destination.droppableId) {
        // Movimento entre colunas - atualizar stage no banco
        await databaseOperations.moveLeadToDatabase(
          result.draggableId, 
          result.destination.droppableId
        );
      }
      
      // Atualizar posições dentro da coluna
      const targetColumn = columns.find(col => col.id === (result.destination?.droppableId || result.source.droppableId));
      if (targetColumn) {
        const leadIds = targetColumn.leads.map(lead => lead.id);
        await databaseOperations.updateLeadPositionsInDatabase(
          result.destination?.droppableId || result.source.droppableId,
          leadIds
        );
      }
      
      console.log('[useDragAndDrop] ✅ Drag integrado completado com sucesso');
    } catch (error) {
      console.error('[useDragAndDrop] ❌ Erro no drag integrado:', error);
      // UI já foi atualizada, então não quebra a experiência do usuário
    }
  };

  return {
    showDropZones: safeImplementation.isDragging,
    onDragStart: safeImplementation.onDragStart,
    onDragEnd: handleDragEnd
  };
};
