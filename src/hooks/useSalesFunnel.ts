
import { useColumnManagement } from "./salesFunnel/useColumnManagement";
import { useLeadManagement } from "./salesFunnel/useLeadManagement";
import { useTagManagement } from "./salesFunnel/useTagManagement";
import { initialColumns, initialTags } from "@/data/initialSalesFunnelData";
import { KanbanLead, KanbanTag } from "@/types/kanban";

export const useSalesFunnel = () => {
  // Initialize column management
  const { 
    columns, 
    setColumns,
    addColumn,
    updateColumn,
    deleteColumn,
    receiveNewLead
  } = useColumnManagement(initialColumns);
  
  // Initialize tag management
  const { availableTags, createTag: createTagBase } = useTagManagement(initialTags);
  
  // Initialize lead management with necessary dependencies
  const { 
    selectedLead, 
    isLeadDetailOpen, 
    setIsLeadDetailOpen,
    openLeadDetail,
    toggleTagOnLead: toggleTagOnLeadBase,
    updateLeadNotes 
  } = useLeadManagement(setColumns);

  // Create a wrapper for toggleTagOnLead that provides availableTags
  const toggleTagOnLead = (tagId: string) => {
    if (!selectedLead) return;

    const tag = availableTags.find(t => t.id === tagId);
    if (!tag) return;

    const hasTag = selectedLead.tags.some(t => t.id === tagId);
    
    const updatedLead = {
      ...selectedLead,
      tags: hasTag
        ? selectedLead.tags.filter(t => t.id !== tagId)
        : [...selectedLead.tags, tag]
    };
    
    // Update selected lead
    if (selectedLead) {
      setColumns(columns => columns.map(col => ({
        ...col,
        leads: col.leads.map(l => 
          l.id === selectedLead.id ? updatedLead : l
        )
      })));
    }
  };

  // Create a wrapper for createTag that adds the tag to the selected lead
  const createTag = (name: string, color: string) => {
    const newTag = createTagBase(name, color);
    
    // If a lead is selected, add the new tag to the lead
    if (selectedLead) {
      const updatedLead = {
        ...selectedLead,
        tags: [...selectedLead.tags, newTag]
      };
      
      // Update the lead in the columns
      setColumns(columns => columns.map(col => ({
        ...col,
        leads: col.leads.map(l => 
          l.id === selectedLead.id ? updatedLead : l
        )
      })));
    }
  };

  return {
    columns,
    setColumns,
    selectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    availableTags,
    addColumn,
    updateColumn,
    deleteColumn,
    openLeadDetail,
    toggleTagOnLead,
    createTag,
    updateLeadNotes,
    receiveNewLead
  };
};
