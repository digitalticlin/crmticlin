
import { useState } from "react";
import { KanbanColumn, FIXED_COLUMN_IDS } from "@/types/kanban";
import { toast } from "sonner";

export function useColumnManagement(initialColumns: KanbanColumn[]) {
  const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns);

  // Add a new column
  const addColumn = (title: string) => {
    if (!title.trim()) return;
    
    const newColumn: KanbanColumn = {
      id: `column-${Date.now()}`,
      title,
      leads: [],
    };
    
    // Add the new column before the fixed hidden columns
    const visibleColumns = columns.filter(col => !col.isHidden);
    const hiddenColumns = columns.filter(col => col.isHidden);
    
    setColumns([...visibleColumns, newColumn, ...hiddenColumns]);
  };

  // Update a column
  const updateColumn = (updatedColumn: KanbanColumn) => {
    if (!updatedColumn || !updatedColumn.title.trim()) return;
    
    // Don't allow updating fixed columns
    if (updatedColumn.isFixed) {
      toast.error("Não é possível editar etapas padrão do sistema.");
      return;
    }
    
    setColumns(columns.map(col => 
      col.id === updatedColumn.id ? { ...col, title: updatedColumn.title } : col
    ));
  };

  // Delete a column
  const deleteColumn = (columnId: string) => {
    const columnToDelete = columns.find(col => col.id === columnId);
    
    // Don't allow deleting fixed columns
    if (columnToDelete?.isFixed) {
      toast.error("Não é possível excluir etapas padrão do sistema.");
      return;
    }
    
    // Move any leads in this column to the first column (NEW_LEAD)
    const columnLeads = columnToDelete?.leads || [];
    
    if (columnLeads.length > 0) {
      const newColumns = columns.map(col => {
        if (col.id === FIXED_COLUMN_IDS.NEW_LEAD) {
          return {
            ...col,
            leads: [...col.leads, ...columnLeads]
          };
        }
        return col;
      });
      
      setColumns(newColumns.filter(col => col.id !== columnId));
      toast.success("Coluna excluída e leads movidos para Entrada de Lead");
    } else {
      setColumns(columns.filter(col => col.id !== columnId));
      toast.success("Coluna excluída com sucesso");
    }
  };

  // Simulate receiving a new lead from WhatsApp API
  const receiveNewLead = (lead: any) => {
    setColumns(columns.map(col => {
      if (col.id === FIXED_COLUMN_IDS.NEW_LEAD) {
        return {
          ...col,
          leads: [lead, ...col.leads]
        };
      }
      return col;
    }));
    
    toast.success(`Novo lead recebido: ${lead.name}`, {
      description: "Lead adicionado automaticamente à etapa de entrada."
    });
  };

  return {
    columns,
    setColumns,
    addColumn,
    updateColumn,
    deleteColumn,
    receiveNewLead
  };
}
