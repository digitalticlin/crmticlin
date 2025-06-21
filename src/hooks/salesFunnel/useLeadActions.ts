
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

  const updateLeadNotes = async (leadId: string, notes: string) => {
    if (!selectedLead || selectedLead.id !== leadId) return;
    
    try {
      await updateLead.mutateAsync({ leadId, fields: { notes } });
      setSelectedLead({ ...selectedLead, notes });
      await refetchLeads();
    } catch (error) {
      console.error("Erro ao atualizar observações:", error);
    }
  };

  const updateLeadPurchaseValue = async (leadId: string, purchaseValue: number | undefined) => {
    if (!selectedLead || selectedLead.id !== leadId) return;
    
    try {
      await updateLead.mutateAsync({ leadId, fields: { purchase_value: purchaseValue } });
      setSelectedLead({ ...selectedLead, purchaseValue });
      await refetchLeads();
    } catch (error) {
      console.error("Erro ao atualizar valor de compra:", error);
    }
  };

  const updateLeadAssignedUser = async (leadId: string, assignedUser: string) => {
    if (!selectedLead || selectedLead.id !== leadId) return;
    
    try {
      await updateLead.mutateAsync({ leadId, fields: { assigned_user: assignedUser } });
      setSelectedLead({ ...selectedLead, assignedUser });
      await refetchLeads();
    } catch (error) {
      console.error("Erro ao atualizar usuário responsável:", error);
    }
  };

  const updateLeadName = async (leadId: string, name: string) => {
    if (!selectedLead || selectedLead.id !== leadId) return;
    
    try {
      await updateLead.mutateAsync({ leadId, fields: { name } });
      setSelectedLead({ ...selectedLead, name });
      await refetchLeads();
    } catch (error) {
      console.error("Erro ao atualizar nome:", error);
    }
  };

  const toggleTagOnLead = async (leadId: string, tagId: string, tags: any[]) => {
    if (!selectedLead || selectedLead.id !== leadId) return;

    const hasTag = selectedLead.tags.some(tag => tag.id === tagId);

    try {
      if (hasTag) {
        await removeTagFromLead.mutateAsync({ leadId, tagId });
      } else {
        await addTagToLead.mutateAsync({ leadId, tagId });
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
