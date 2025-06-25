
import { useState, useMemo, useCallback, useRef } from "react";
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
  
  // Estabilizar referências para evitar re-computação desnecessária
  const stableStages = useMemo(() => {
    const validStages = Array.isArray(stages) ? stages : [];
    console.log('[useExtendedSalesFunnel] 📊 Stages processados:', {
      count: validStages.length,
      stages: validStages.map(s => ({ id: s.id, title: s.title, isWon: s.is_won, isLost: s.is_lost }))
    });
    return validStages;
  }, [stages]);
  
  const stableLeads = useMemo(() => {
    const validLeads = Array.isArray(realFunnelData.leads) ? realFunnelData.leads : [];
    console.log('[useExtendedSalesFunnel] 📊 Leads processados:', {
      count: validLeads.length,
      leadsWithStage: validLeads.filter(l => l.kanban_stage_id).length,
      leadsWithoutStage: validLeads.filter(l => !l.kanban_stage_id).length
    });
    return validLeads;
  }, [realFunnelData.leads]);
  
  // Transform leads to match KanbanLead interface - com correção para leads sem stage
  const transformedLeads: KanbanLead[] = useMemo(() => {
    return stableLeads.map(lead => {
      // CORREÇÃO: Se lead não tem stage, colocar no primeiro stage disponível
      let columnId = lead.kanban_stage_id;
      if (!columnId && stableStages.length > 0) {
        // Encontrar stage "Entrada de Leads" ou usar o primeiro
        const entryStage = stableStages.find(s => s.title === "Entrada de Leads") || stableStages[0];
        columnId = entryStage.id;
        console.log(`[useExtendedSalesFunnel] 🔧 Lead ${lead.name} sem stage, atribuindo ao stage: ${entryStage.title}`);
      }
      
      return {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        columnId: columnId,
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
      };
    });
  }, [stableLeads, stableStages]);

  // Use useKanbanColumns to generate proper columns - com leads corrigidos
  const { columns, setColumns } = useKanbanColumns(stableStages, transformedLeads, funnelId);
  
  // Find won and lost stages - memoizado
  const wonStageId = useMemo(() => stableStages.find(stage => stage.is_won)?.id, [stableStages]);
  const lostStageId = useMemo(() => stableStages.find(stage => stage.is_lost)?.id, [stableStages]);

  // Usar refs para manter funções estáveis sem re-criação
  const refetchDataRef = useRef(realFunnelData.refetchData);
  refetchDataRef.current = realFunnelData.refetchData;

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

  // Estabilizar refetchLeads para evitar loops infinitos
  const refetchLeads = useCallback(async (): Promise<void> => {
    try {
      if (refetchDataRef.current) {
        refetchDataRef.current();
      }
    } catch (error) {
      console.error('Error refetching leads:', error);
    }
  }, []); // Sem dependências - função estável

  const refetchStages = useCallback(async (): Promise<void> => {
    try {
      // Stage refetch is handled by useStageDatabase
      console.log('Stages refetch handled by useStageDatabase');
    } catch (error) {
      console.error('Error refetching stages:', error);
    }
  }, []);

  // Log final para debug
  console.log('[useExtendedSalesFunnel] 🎯 Estado final:', {
    stages: stableStages.length,
    leads: transformedLeads.length,
    columns: columns.length,
    wonStageId,
    lostStageId
  });

  // Memoizar o retorno para evitar re-renders desnecessários
  const returnValue = useMemo(() => ({
    ...realFunnelData,
    leads: transformedLeads,
    columns,
    setColumns,
    selectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    availableTags: realFunnelData.tags,
    stages: stableStages,
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
  }), [
    realFunnelData,
    transformedLeads,
    columns,
    setColumns,
    selectedLead,
    isLeadDetailOpen,
    stableStages,
    openLeadDetail,
    toggleTagOnLead,
    updateLeadNotes,
    updateLeadPurchaseValue,
    updateLeadAssignedUser,
    updateLeadName,
    createTag.mutateAsync,
    wonStageId,
    lostStageId,
    refetchLeads,
    refetchStages
  ]);

  return returnValue;
}
