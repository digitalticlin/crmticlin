
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
      console.log(`Atualizando lead ${leadId} para estágio ${newStageId} no banco`);
      
      const { error } = await supabase
        .from("leads")
        .update({ kanban_stage_id: newStageId })
        .eq("id", leadId);

      if (error) throw error;
      console.log(`Lead ${leadId} movido para estágio ${newStageId} no banco com sucesso`);
    } catch (error) {
      console.error("Erro ao mover lead no banco:", error);
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

    // *** SALVAR ESTADO ANTERIOR PARA POSSÍVEL ROLLBACK ***
    const previousColumns = columns;

    // *** ATUALIZAÇÃO OTIMISTA - MOVER IMEDIATAMENTE NA UI ***
    const updatedLead = { ...lead, columnId: destination.droppableId };
    
    // Remover da coluna origem
    const newSourceLeads = sourceColumn.leads.filter(l => l.id !== draggableId);
    
    // Adicionar na coluna destino na posição correta
    const newDestLeads = [...destColumn.leads];
    newDestLeads.splice(destination.index, 0, updatedLead);

    // Atualizar as colunas imediatamente
    const newColumns = columns.map(col => {
      if (col.id === source.droppableId) {
        return { ...col, leads: newSourceLeads };
      }
      if (col.id === destination.droppableId) {
        return { ...col, leads: newDestLeads };
      }
      return col;
    });

    // *** APLICAR MUDANÇA VISUAL IMEDIATAMENTE ***
    onColumnsChange(newColumns);

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
          // Rollback em caso de erro
          onColumnsChange(previousColumns);
          toast.error("Erro ao marcar lead como ganho");
          return;
        }
      } else if (destStage === "PERDIDO") {
        try {
          await moveLeadToDatabase(lead.id, destination.droppableId);
          onMoveToWonLost(lead, "lost");
          toast.success("Lead marcado como perdido!");
          return;
        } catch (error) {
          // Rollback em caso de erro
          onColumnsChange(previousColumns);
          toast.error("Erro ao marcar lead como perdido");
          return;
        }
      }
    }

    // *** SALVAR NO BANCO EM BACKGROUND ***
    try {
      await moveLeadToDatabase(lead.id, destination.droppableId);
      
      // Toast específico para retorno ao funil
      if (isWonLostView || sourceColumn.title === "GANHO" || sourceColumn.title === "PERDIDO") {
        toast.success("Lead retornado ao funil com sucesso!");
      } else {
        toast.success("Etapa alterada com sucesso!");
      }
    } catch (error) {
      // *** ROLLBACK EM CASO DE ERRO ***
      onColumnsChange(previousColumns);
      toast.error("Erro ao salvar mudança de etapa");
      console.error("Erro ao salvar no banco:", error);
    }
  };

  return {
    showDropZones,
    onDragStart,
    onDragEnd
  };
};
