
import { useState } from "react";
import { KanbanLead } from "@/types/kanban";

export function useLeadManagement(setColumns: React.Dispatch<React.SetStateAction<any[]>>) {
  const [selectedLead, setSelectedLead] = useState<KanbanLead | null>(null);
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);
  
  // Open lead detail
  const openLeadDetail = (lead: KanbanLead) => {
    setSelectedLead(lead);
    setIsLeadDetailOpen(true);
  };

  // Update lead notes
  const updateLeadNotes = (notes: string) => {
    if (!selectedLead) return;
    
    const updatedLead = {
      ...selectedLead,
      notes
    };
    
    setSelectedLead(updatedLead);
    
    // Update the lead in the columns
    setColumns(columns => columns.map(col => ({
      ...col,
      leads: col.leads.map(l => 
        l.id === selectedLead.id ? updatedLead : l
      )
    })));
  };

  return {
    selectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    openLeadDetail,
    updateLeadNotes
  };
}
