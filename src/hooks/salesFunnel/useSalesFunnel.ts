
import { useColumnManagement } from "./useColumnManagement";
import { useLeadManagement } from "./useLeadManagement";
import { useTagManagement } from "./useTagManagement";
import { initialColumns, initialTags } from "@/data/initialSalesFunnelData";
import { KanbanLead } from "@/types/kanban";
import { supabase } from "@/integrations/supabase/client";
import { useLeadsDatabase } from "./useLeadsDatabase";
import { useStageDatabase } from "./useStageDatabase";
import { useCompanyData } from "../useCompanyData";

// Novo: sincronizar movimentação de lead
async function moveLeadToStageDB(leadId: string, kanban_stage_id: string, funnel_id: string) {
  await supabase
    .from("leads")
    .update({ kanban_stage_id, funnel_id })
    .eq("id", leadId);
}

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
    toggleTagOnLead,
    updateLeadNotes,
    updateLeadPurchaseValue,
    updateLeadAssignedUser,
    updateLeadName
  } = useLeadManagement(setColumns);

  // Create a wrapper for createTag that adds the tag to the selected lead
  const createTag = (name: string, color: string) => {
    const newTag = createTagBase(name, color);
    if (selectedLead) {
      const updatedLead = {
        ...selectedLead,
        tags: [...selectedLead.tags, newTag]
      };
      setColumns(columns => columns.map(col => ({
        ...col,
        leads: col.leads.map(l => 
          l.id === selectedLead.id ? updatedLead : l
        )
      })));
    }
  };

  const moveLeadToStage = async (lead: KanbanLead, newColumnId: string, funnelId: string) => {
    setColumns(columns =>
      columns.map(col =>
        col.id === lead.columnId
          ? { ...col, leads: col.leads.filter(l => l.id !== lead.id) }
          : col
      ).map(col =>
        col.id === newColumnId
          ? { ...col, leads: [{ ...lead, columnId: newColumnId }, ...col.leads] }
          : col
      )
    );
    await moveLeadToStageDB(lead.id, newColumnId, funnelId);
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
    updateLeadPurchaseValue,
    updateLeadAssignedUser,
    updateLeadName,
    receiveNewLead,
    moveLeadToStage
  };
};
