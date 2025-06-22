
import { useState, useMemo, useCallback } from "react";
import { useRealSalesFunnel } from "./useRealSalesFunnel";
import { useStageDatabase } from "./useStageDatabase";
import { useTagDatabase } from "./useTagDatabase";
import { useKanbanColumns } from "./useKanbanColumns";
import { KanbanLead } from "@/types/kanban";

export function useExtendedSalesFunnel(funnelId?: string) {
  // *** ALL HOOKS FIRST ***
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);
  
  const realFunnelData = useRealSalesFunnel(funnelId);
  const { stages } = useStageDatabase(funnelId);
  const { createTag } = useTagDatabase();
  
  // Transform leads to match KanbanLead interface - memoizado com dependências estáveis
  const transformedLeads: KanbanLead[] = useMemo(() => {
    return realFunnelData.leads?.map(lead => ({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      columnId: lead.kanban_stage_id,
      tags: lead.tags?.map(tagRelation => ({
        id: tagRelation.tag.id,
        name: tagRelation.tag.name,
        color: tagRelation.tag.color || '#3b82f6'
      })) || [],
      notes: lead.notes,
      purchaseValue: lead.purchase_value ? Number(lead.purchase_value) : undefined,
      assignedUser: lead.owner_id,
      lastMessage: lead.last_message || '',
      lastMessageTime: lead.last_message_time || '',
      createdAt: lead.created_at,
      address: lead.address,
      company: lead.company,
      documentId: lead.document_id
    })) || [];
  }, [realFunnelData.leads]);

  // Use useKanbanColumns to generate proper columns
  const { columns, setColumns } = useKanbanColumns(stages || [], transformedLeads, funnelId);
  
  // Find won and lost stages - memoizado
  const wonStageId = useMemo(() => stages?.find(stage => stage.is_won)?.id, [stages]);
  const lostStageId = useMemo(() => stages?.find(stage => stage.is_lost)?.id, [stages]);

  // Funções estáveis com useCallback
  const openLeadDetail = useCallback((lead: any) => {
    setSelectedLead(lead);
    setIsLeadDetailOpen(true);
  }, []);

  const toggleTagOnLead = useCallback((leadId: string, tagId: string) => {
    console.log('Toggle tag on lead:', leadId, tagId);
  }, []);

  const updateLeadNotes = useCallback((notes: string) => {
    console.log('Update lead notes:', notes);
  }, []);

  const updateLeadPurchaseValue = useCallback((value: number | undefined) => {
    console.log('Update lead purchase value:', value);
  }, []);

  const updateLeadAssignedUser = useCallback((user: string) => {
    console.log('Update lead assigned user:', user);
  }, []);

  const updateLeadName = useCallback((name: string) => {
    console.log('Update lead name:', name);
  }, []);

  const refetchLeads = useCallback(async (): Promise<void> => {
    try {
      realFunnelData.refetchData();
    } catch (error) {
      console.error('Error refetching leads:', error);
    }
  }, [realFunnelData]);

  const refetchStages = useCallback(async (): Promise<void> => {
    try {
      // Stage refetch is handled by useStageDatabase
    } catch (error) {
      console.error('Error refetching stages:', error);
    }
  }, []);

  return {
    ...realFunnelData,
    leads: transformedLeads,
    columns,
    setColumns,
    selectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    availableTags: realFunnelData.tags,
    stages,
    openLeadDetail,
    toggleTagOnLead,
    updateLeadNotes,
    updateLeadPurchaseValue,
    updateLeadAssignedUser,
    updateLeadName,
    createTag: createTag.mutateAsync,
    wonStageId,
    lostStageId,
    refetchLeads,
    refetchStages
  };
}
