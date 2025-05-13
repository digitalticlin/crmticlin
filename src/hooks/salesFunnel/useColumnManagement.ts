
import { useState } from "react";
import { KanbanColumn, KanbanLead, FIXED_COLUMN_IDS } from "@/types/kanban";
import { generateLeadId } from "@/lib/utils";

export function useColumnManagement(initialColumns: KanbanColumn[]) {
  const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns);

  // Add a new column
  const addColumn = (title: string, color?: string) => {
    const newColumn: KanbanColumn = {
      id: `column-${Date.now()}`,
      title,
      leads: [],
      color
    };
    
    setColumns([...columns, newColumn]);
  };

  // Update a column's title or other properties
  const updateColumn = (updatedColumn: KanbanColumn) => {
    setColumns(columns.map(column =>
      column.id === updatedColumn.id
        ? updatedColumn
        : column
    ));
  };

  // Delete a column
  const deleteColumn = (columnId: string) => {
    // Find the column to be deleted
    const columnToDelete = columns.find(col => col.id === columnId);
    
    if (!columnToDelete) return;
    
    // Find the first non-hidden column to move leads to
    const firstVisibleColumn = columns.find(col => !col.isHidden && col.id !== columnId);
    
    if (firstVisibleColumn && columnToDelete.leads.length > 0) {
      // Move leads to the first visible column
      firstVisibleColumn.leads = [
        ...firstVisibleColumn.leads,
        ...columnToDelete.leads.map(lead => ({
          ...lead,
          columnId: firstVisibleColumn.id
        }))
      ];
    }
    
    // Remove the column
    setColumns(columns.filter(column => column.id !== columnId));
  };

  // Receive a new lead into the NEW_LEAD column
  const receiveNewLead = (lead: Omit<KanbanLead, 'id' | 'name' | 'columnId'>) => {
    const newLeadColumn = columns.find(col => col.id === FIXED_COLUMN_IDS.NEW_LEAD);
    
    if (!newLeadColumn) return;
    
    const newLead: KanbanLead = {
      id: `lead-${Date.now()}`,
      name: generateLeadId(), // Use ID as name initially for new leads
      columnId: FIXED_COLUMN_IDS.NEW_LEAD,
      ...lead
    };
    
    setColumns(columns.map(col => 
      col.id === FIXED_COLUMN_IDS.NEW_LEAD
        ? { ...col, leads: [newLead, ...col.leads] }
        : col
    ));
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
