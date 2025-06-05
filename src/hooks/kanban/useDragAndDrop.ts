
import { useState } from "react";
import { DropResult } from "react-beautiful-dnd";
import { KanbanColumn, KanbanLead } from "@/types/kanban";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [showDropZones, setShowDropZones] = useState(false);

  const moveLeadToDatabase = async (leadId: string, newStageId: string) => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ kanban_stage_id: newStageId })
        .eq("id", leadId);

      if (error) throw error;
      console.log(`Lead ${leadId} movido para estágio ${newStageId}`);
    } catch (error) {
      console.error("Erro ao mover lead no banco:", error);
      toast.error("Erro ao salvar mudança de etapa");
      throw error;
    }
  };

  const onDragStart = () => {
    setShowDropZones(true);
  };

  const onDragEnd = async (result: DropResult) => {
    setShowDropZones(false);

    const { destination, source, draggableId } = result;

    if (!destination) return;

    // Se for na mesma coluna e mesma posição, não fazer nada
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) return;

    const lead = sourceColumn.leads.find(lead => lead.id === draggableId);
    if (!lead) return;

    // Verificar se é movimento para Won/Lost
    if (onMoveToWonLost && !isWonLostView) {
      const destStage = destColumn.title.toUpperCase();
      if (destStage === "GANHO") {
        try {
          await moveLeadToDatabase(lead.id, destination.droppableId);
          onMoveToWonLost(lead, "won");
          toast.success("Lead marcado como ganho!");
          return;
        } catch (error) {
          return; // Erro já tratado na função moveLeadToDatabase
        }
      } else if (destStage === "PERDIDO") {
        try {
          await moveLeadToDatabase(lead.id, destination.droppableId);
          onMoveToWonLost(lead, "lost");
          toast.success("Lead marcado como perdido!");
          return;
        } catch (error) {
          return; // Erro já tratado na função moveLeadToDatabase
        }
      }
    }

    // Atualizar estado local primeiro (otimistic update)
    const newColumns = columns.map(column => {
      if (column.id === source.droppableId) {
        return {
          ...column,
          leads: column.leads.filter(lead => lead.id !== draggableId)
        };
      }
      if (column.id === destination.droppableId) {
        const newLeads = [...column.leads];
        const updatedLead = { ...lead, columnId: destination.droppableId };
        newLeads.splice(destination.index, 0, updatedLead);
        return {
          ...column,
          leads: newLeads
        };
      }
      return column;
    });

    onColumnsChange(newColumns);

    // Salvar no banco de dados
    try {
      await moveLeadToDatabase(lead.id, destination.droppableId);
      toast.success("Etapa alterada com sucesso!");
    } catch (error) {
      // Reverter mudança local se falhou no banco
      onColumnsChange(columns);
    }
  };

  return {
    showDropZones,
    onDragStart,
    onDragEnd
  };
};
