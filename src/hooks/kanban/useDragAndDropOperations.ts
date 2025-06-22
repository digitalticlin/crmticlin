import { KanbanColumn, KanbanLead } from "@/types/kanban";
import { toast } from "sonner";
import { useDragAndDropDatabase } from "./useDragAndDropDatabase";

interface UseDragAndDropOperationsProps {
  columns: KanbanColumn[];
  onColumnsChange: (newColumns: KanbanColumn[]) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
  isWonLostView?: boolean;
}

export const useDragAndDropOperations = ({
  columns,
  onColumnsChange,
  onMoveToWonLost,
  isWonLostView
}: UseDragAndDropOperationsProps) => {
  // Verificar se o módulo de banco de dados está disponível
  if (!useDragAndDropDatabase) {
    console.error('[useDragAndDropOperations] ❌ Módulo de banco de dados não encontrado');
    // Retornar implementação mínima para evitar erros
    return {
      handleSameColumnReorder: async () => {},
      handleCrossColumnMove: async () => {}
    };
  }

  const { moveLeadToDatabase, updateLeadPositionsInDatabase } = useDragAndDropDatabase();

  const handleSameColumnReorder = async (
    sourceColumn: KanbanColumn,
    sourceIndex: number,
    destIndex: number,
    previousColumns: KanbanColumn[]
  ) => {
    try {
      if (!sourceColumn || sourceColumn.leads.length === 0) {
        console.error('[useDragAndDropOperations] ❌ Coluna de origem inválida ou vazia');
        return;
      }

      const newLeads = Array.from(sourceColumn.leads);
      const [reorderedLead] = newLeads.splice(sourceIndex, 1);
      newLeads.splice(destIndex, 0, reorderedLead);

      const newColumns = columns.map(col => 
        col.id === sourceColumn.id 
          ? { ...col, leads: newLeads }
          : col
      );

      onColumnsChange(newColumns);

      try {
        const leadIds = newLeads.map(l => l.id);
        await updateLeadPositionsInDatabase(sourceColumn.id, leadIds);
        toast.success("Posição alterada com sucesso!");
      } catch (error) {
        onColumnsChange(previousColumns);
        toast.error("Erro ao salvar nova posição");
        console.error("[useDragAndDropOperations] ❌ Erro ao salvar posições:", error);
      }
    } catch (error) {
      console.error("[useDragAndDropOperations] ❌ Erro ao reordenar coluna:", error);
      onColumnsChange(previousColumns);
      toast.error("Erro ao reordenar itens");
    }
  };

  const handleCrossColumnMove = async (
    lead: KanbanLead,
    sourceColumn: KanbanColumn,
    destColumn: KanbanColumn,
    sourceIndex: number,
    destIndex: number,
    previousColumns: KanbanColumn[]
  ) => {
    try {
      if (!lead || !sourceColumn || !destColumn) {
        console.error('[useDragAndDropOperations] ❌ Parâmetros inválidos para movimentação entre colunas');
        return;
      }

      const updatedLead = { ...lead, columnId: destColumn.id };
      
      const newSourceLeads = sourceColumn.leads.filter(l => l.id !== lead.id);
      const newDestLeads = [...destColumn.leads];
      newDestLeads.splice(destIndex, 0, updatedLead);

      const newColumns = columns.map(col => {
        if (col.id === sourceColumn.id) {
          return { ...col, leads: newSourceLeads };
        }
        if (col.id === destColumn.id) {
          return { ...col, leads: newDestLeads };
        }
        return col;
      });

      onColumnsChange(newColumns);

      // Check for Won/Lost movement
      if (onMoveToWonLost && !isWonLostView) {
        const destStage = destColumn.title.toUpperCase();
        if (destStage === "GANHO") {
          try {
            await moveLeadToDatabase(lead.id, destColumn.id);
            const destLeadIds = newDestLeads.map(l => l.id);
            await updateLeadPositionsInDatabase(destColumn.id, destLeadIds);
            onMoveToWonLost(lead, "won");
            toast.success("Lead marcado como ganho!");
            return;
          } catch (error) {
            onColumnsChange(previousColumns);
            toast.error("Erro ao marcar lead como ganho");
            return;
          }
        } else if (destStage === "PERDIDO") {
          try {
            await moveLeadToDatabase(lead.id, destColumn.id);
            const destLeadIds = newDestLeads.map(l => l.id);
            await updateLeadPositionsInDatabase(destColumn.id, destLeadIds);
            onMoveToWonLost(lead, "lost");
            toast.success("Lead marcado como perdido!");
            return;
          } catch (error) {
            onColumnsChange(previousColumns);
            toast.error("Erro ao marcar lead como perdido");
            return;
          }
        }
      }

      // Regular stage move
      try {
        await moveLeadToDatabase(lead.id, destColumn.id);
        
        const sourceLeadIds = newSourceLeads.map(l => l.id);
        const destLeadIds = newDestLeads.map(l => l.id);
        
        await Promise.all([
          sourceLeadIds.length > 0 ? updateLeadPositionsInDatabase(sourceColumn.id, sourceLeadIds) : Promise.resolve(),
          updateLeadPositionsInDatabase(destColumn.id, destLeadIds)
        ]);
        
        if (isWonLostView || sourceColumn.title === "GANHO" || sourceColumn.title === "PERDIDO") {
          toast.success("Lead retornado ao funil com sucesso!");
        } else {
          toast.success("Etapa alterada com sucesso!");
        }
      } catch (error) {
        onColumnsChange(previousColumns);
        toast.error("Erro ao salvar mudança de etapa");
        console.error("[useDragAndDropOperations] ❌ Erro ao salvar no banco:", error);
      }
    } catch (error) {
      console.error("[useDragAndDropOperations] ❌ Erro durante movimentação entre colunas:", error);
      onColumnsChange(previousColumns);
      toast.error("Erro ao mover item");
    }
  };

  return {
    handleSameColumnReorder,
    handleCrossColumnMove
  };
};
