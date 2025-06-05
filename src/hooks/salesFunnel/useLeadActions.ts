
import { useState } from "react";
import { KanbanLead } from "@/types/kanban";
import { useLeadsDatabase } from "./useLeadsDatabase";

export const useLeadActions = (funnelId?: string) => {
  const [selectedLead, setSelectedLead] = useState<KanbanLead | null>(null);
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);
  
  const { updateLead, addTagToLead, removeTagFromLead, refetchLeads } = useLeadsDatabase(funnelId);

  const openLeadDetail = (lead: KanbanLead) => {
    setSelectedLead(lead);
    setIsLeadDetailOpen(true);
  };

  const updateLeadNotes = async (notes: string) => {
    if (!selectedLead) return;
    
    try {
      await updateLead({ leadId: selectedLead.id, fields: { notes } });
      setSelectedLead({ ...selectedLead, notes });
    } catch (error) {
      console.error("Erro ao atualizar observações:", error);
    }
  };

  const updateLeadPurchaseValue = async (purchaseValue: number | undefined) => {
    if (!selectedLead) return;
    
    try {
      await updateLead({ leadId: selectedLead.id, fields: { purchaseValue } });
      setSelectedLead({ ...selectedLead, purchaseValue });
    } catch (error) {
      console.error("Erro ao atualizar valor de compra:", error);
    }
  };

  const updateLeadAssignedUser = async (assignedUser: string) => {
    if (!selectedLead) return;
    
    try {
      await updateLead({ leadId: selectedLead.id, fields: { assignedUser } });
      setSelectedLead({ ...selectedLead, assignedUser });
    } catch (error) {
      console.error("Erro ao atualizar usuário responsável:", error);
    }
  };

  const updateLeadName = async (name: string) => {
    if (!selectedLead) return;
    
    try {
      await updateLead({ leadId: selectedLead.id, fields: { name } });
      setSelectedLead({ ...selectedLead, name });
    } catch (error) {
      console.error("Erro ao atualizar nome:", error);
    }
  };

  const toggleTagOnLead = async (leadId: string, tagId: string, tags: any[]) => {
    if (!selectedLead) return;

    const hasTag = selectedLead.tags.some(tag => tag.id === tagId);

    try {
      if (hasTag) {
        await removeTagFromLead({ leadId, tagId });
      } else {
        await addTagToLead({ leadId, tagId });
      }

      // Atualizar lead selecionado
      const updatedLead = {
        ...selectedLead,
        tags: hasTag 
          ? selectedLead.tags.filter(tag => tag.id !== tagId)
          : [...selectedLead.tags, tags.find(tag => tag.id === tagId)!]
      };
      
      setSelectedLead(updatedLead);
      await refetchLeads();
    } catch (error) {
      console.error("Erro ao gerenciar tag:", error);
    }
  };

  return {
    selectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    openLeadDetail,
    updateLeadNotes,
    updateLeadPurchaseValue,
    updateLeadAssignedUser,
    updateLeadName,
    toggleTagOnLead
  };
};
