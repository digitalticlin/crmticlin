
import { useState, useMemo, useCallback, useRef } from "react";
import { useRealSalesFunnel } from "./useRealSalesFunnel";
import { useStageDatabase } from "./useStageDatabase";
import { useTagDatabase } from "./useTagDatabase";
import { useKanbanColumns } from "./useKanbanColumns";
import { KanbanLead } from "@/types/kanban";

export function useExtendedSalesFunnel(funnelId?: string) {
  console.log('[useExtendedSalesFunnel] 🚀 Inicializando com funnelId:', funnelId);

  // *** ALL HOOKS FIRST ***
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);
  
  const realFunnelData = useRealSalesFunnel(funnelId);
  const { stages } = useStageDatabase(funnelId);
  const { createTag } = useTagDatabase();
  
  // Logs de debugging detalhados
  console.log('[useExtendedSalesFunnel] 📊 Estado dos dados:', {
    funnelId,
    realFunnelDataKeys: Object.keys(realFunnelData),
    leadsCount: realFunnelData.leads?.length || 0,
    stagesCount: stages?.length || 0,
    stagesTypes: stages?.map(s => ({ id: s.id, title: s.title, isWon: s.is_won, isLost: s.is_lost }))
  });
  
  // Estabilizar referências para evitar re-computação desnecessária
  const stableStages = useMemo(() => {
    const validStages = Array.isArray(stages) ? stages : [];
    console.log('[useExtendedSalesFunnel] 📊 Processando stages:', {
      received: stages?.length || 0,
      valid: validStages.length,
      stages: validStages.map(s => ({ 
        id: s.id, 
        title: s.title, 
        isWon: s.is_won, 
        isLost: s.is_lost,
        orderPosition: s.order_position 
      }))
    });
    return validStages;
  }, [stages]);
  
  const stableLeads = useMemo(() => {
    const validLeads = Array.isArray(realFunnelData.leads) ? realFunnelData.leads : [];
    console.log('[useExtendedSalesFunnel] 📊 Processando leads:', {
      received: realFunnelData.leads?.length || 0,
      valid: validLeads.length,
      leadsWithStage: validLeads.filter(l => l.kanban_stage_id).length,
      leadsWithoutStage: validLeads.filter(l => !l.kanban_stage_id).length,
      sampleLeads: validLeads.slice(0, 3).map(l => ({
        id: l.id,
        name: l.name,
        kanban_stage_id: l.kanban_stage_id
      }))
    });
    return validLeads;
  }, [realFunnelData.leads]);
  
  // Transform leads to match KanbanLead interface - com correção robusta para leads sem stage
  const transformedLeads: KanbanLead[] = useMemo(() => {
    if (!stableLeads.length || !stableStages.length) {
      console.log('[useExtendedSalesFunnel] ⚠️ Dados insuficientes para transformação:', {
        leadsCount: stableLeads.length,
        stagesCount: stableStages.length
      });
      return [];
    }

    // Encontrar stage de entrada padrão
    const entryStage = stableStages.find(s => s.title === "Entrada de Leads") || stableStages[0];
    console.log('[useExtendedSalesFunnel] 🎯 Stage de entrada definido:', entryStage?.title);

    const transformed = stableLeads.map(lead => {
      // CORREÇÃO ROBUSTA: Garantir que todo lead tenha um stage
      let columnId = lead.kanban_stage_id;
      let wasAssigned = false;
      
      if (!columnId && entryStage) {
        columnId = entryStage.id;
        wasAssigned = true;
        console.log(`[useExtendedSalesFunnel] 🔧 Lead "${lead.name}" sem stage, atribuído ao: ${entryStage.title}`);
      }
      
      // Verificar se o stage existe
      const stageExists = stableStages.some(s => s.id === columnId);
      if (!stageExists && entryStage) {
        columnId = entryStage.id;
        wasAssigned = true;
        console.log(`[useExtendedSalesFunnel] 🔧 Lead "${lead.name}" com stage inválido, atribuído ao: ${entryStage.title}`);
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

    console.log('[useExtendedSalesFunnel] ✅ Leads transformados:', {
      total: transformed.length,
      withStage: transformed.filter(l => l.columnId).length,
      stageDistribution: Object.entries(
        transformed.reduce((acc, lead) => {
          const stageTitle = stableStages.find(s => s.id === lead.columnId)?.title || 'Unknown';
          acc[stageTitle] = (acc[stageTitle] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      )
    });

    return transformed;
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
  console.log('[useExtendedSalesFunnel] 🎯 Estado final preparado:', {
    stages: stableStages.length,
    leads: transformedLeads.length,
    columns: columns.length,
    wonStageId,
    lostStageId,
    columnsDetails: columns.map(c => ({ id: c.id, title: c.title, leadsCount: c.leads.length }))
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
