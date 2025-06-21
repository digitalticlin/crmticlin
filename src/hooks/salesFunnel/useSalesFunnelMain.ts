
import { useUserRole } from "@/hooks/useUserRole";
import { useExtendedSalesFunnel } from "@/hooks/salesFunnel/useExtendedSalesFunnel";
import { useNewLeadIntegration } from "@/hooks/salesFunnel/useNewLeadIntegration";
import { useFunnelManagement } from "@/hooks/salesFunnel/useFunnelManagement";
import { useSalesFunnelWrappers } from "./useSalesFunnelWrappers";
import { useKanbanColumns } from "./useKanbanColumns";
import { KanbanLead } from "@/types/kanban";

export function useSalesFunnelMain() {
  const { isAdmin, role } = useUserRole();
  
  const {
    funnels,
    selectedFunnel,
    setSelectedFunnel,
    createFunnel: originalCreateFunnel,
    loading: funnelLoading
  } = useFunnelManagement();

  const {
    selectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    availableTags,
    stages,
    leads: rawLeads,
    addColumn,
    updateColumn,
    deleteColumn,
    openLeadDetail,
    toggleTagOnLead,
    createTag: createTagMutation,
    updateLeadNotes,
    updateLeadPurchaseValue,
    updateLeadAssignedUser,
    updateLeadName,
    moveLeadToStage: originalMoveLeadToStage,
    wonStageId,
    lostStageId,
    refetchLeads,
    refetchStages
  } = useExtendedSalesFunnel(selectedFunnel?.id);

  useNewLeadIntegration(selectedFunnel?.id);

  // Transform leads to match KanbanLead interface
  const leads: KanbanLead[] = rawLeads?.map(lead => ({
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

  // Use useKanbanColumns to generate proper columns
  const { columns, setColumns } = useKanbanColumns(stages || [], leads, selectedFunnel?.id);

  console.log('[SalesFunnelMain] 🔍 Estado completo:', {
    funnelsCount: funnels.length,
    selectedFunnel: selectedFunnel ? { 
      id: selectedFunnel.id, 
      name: selectedFunnel.name 
    } : null,
    funnelLoading,
    isAdmin,
    role,
    stagesCount: stages?.length || 0,
    stagesDetails: stages?.map(s => ({ 
      id: s.id, 
      title: s.title, 
      order: s.order_position,
      isWon: s.is_won,
      isLost: s.is_lost,
      isFixed: s.is_fixed
    })),
    leadsCount: leads?.length || 0,
    leadsDetails: leads?.map(l => ({
      id: l.id,
      name: l.name,
      columnId: l.columnId
    })),
    columnsCount: columns.length,
    columnsDetails: columns.map(c => ({
      id: c.id,
      title: c.title,
      leadsCount: c.leads.length
    }))
  });

  // Wrapper function to match the expected interface
  const createFunnel = async (name: string, description?: string): Promise<void> => {
    try {
      console.log('[SalesFunnelMain] 📝 Criando funil:', { name, description, isAdmin, role });
      await originalCreateFunnel(name, description);
    } catch (error) {
      console.error('[SalesFunnelMain] ❌ Erro ao criar funil:', error);
      throw error;
    }
  };

  const wrappers = useSalesFunnelWrappers({
    selectedFunnel,
    selectedLead,
    addColumn,
    updateColumn,
    createTagMutation,
    originalMoveLeadToStage,
    updateLeadNotes,
    updateLeadPurchaseValue,
    updateLeadAssignedUser,
    updateLeadName
  });

  return {
    // Basic state
    isAdmin,
    role,
    funnelLoading,
    
    // Funnel data
    funnels,
    selectedFunnel,
    setSelectedFunnel,
    createFunnel,
    
    // Kanban data
    columns,
    setColumns,
    selectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    availableTags,
    stages,
    leads,
    
    // Actions
    deleteColumn,
    openLeadDetail,
    toggleTagOnLead,
    wonStageId,
    lostStageId,
    refetchLeads,
    refetchStages,
    
    // Wrapped functions
    ...wrappers
  };
}
