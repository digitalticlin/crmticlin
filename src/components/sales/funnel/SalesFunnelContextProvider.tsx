
import { ReactNode, useEffect, useState } from "react";
import { SalesFunnelProvider } from "./SalesFunnelProvider";
import { useSalesFunnelOptimized } from "@/hooks/salesFunnel/useSalesFunnelOptimized";
import { useUserRole } from "@/hooks/useUserRole";

interface SalesFunnelContextProviderProps {
  children: ReactNode;
}

export const SalesFunnelContextProvider = ({ children }: SalesFunnelContextProviderProps) => {
  const salesFunnelData = useSalesFunnelOptimized();
  const { isAdmin } = useUserRole();
  const [isInitialized, setIsInitialized] = useState(false);

  console.log('[SalesFunnelContextProvider] 📊 Estado atual (OTIMIZADO):', {
    loading: salesFunnelData.loading,
    funnelsCount: salesFunnelData.funnels?.length || 0,
    selectedFunnel: salesFunnelData.selectedFunnel?.name || 'None',
    stagesCount: salesFunnelData.stages?.length || 0,
    leadsCount: salesFunnelData.leads?.length || 0,
    columnsCount: salesFunnelData.columns?.length || 0,
    isInitialized
  });

  // Auto-selecionar primeiro funil se necessário
  useEffect(() => {
    if (!salesFunnelData.loading && 
        !salesFunnelData.selectedFunnel && 
        salesFunnelData.funnels && 
        salesFunnelData.funnels.length > 0) {
      console.log('[SalesFunnelContextProvider] 🔄 Auto-selecionando primeiro funil');
      salesFunnelData.setSelectedFunnel(salesFunnelData.funnels[0]);
    }
    
    // Marcar como inicializado após primeiro load
    if (!salesFunnelData.loading && !isInitialized) {
      setIsInitialized(true);
    }
  }, [
    salesFunnelData.loading,
    salesFunnelData.selectedFunnel,
    salesFunnelData.funnels,
    salesFunnelData.setSelectedFunnel,
    isInitialized
  ]);

  // Wrapper functions para compatibilidade com interface existente
  const addColumnWrapper = (title: string) => {
    console.log('[SalesFunnelContextProvider] ➕ Adicionando coluna:', title);
    // Por agora apenas log - pode implementar depois
  };

  const updateColumnWrapper = (column: any) => {
    console.log('[SalesFunnelContextProvider] ✏️ Atualizando coluna:', column.title);
    // Por agora apenas log - pode implementar depois
  };

  const createTagWrapper = (name: string, color: string) => {
    console.log('[SalesFunnelContextProvider] 🏷️ Criando tag:', name, color);
    // Por agora apenas log - pode implementar depois
  };

  const moveLeadToStageWrapper = (lead: any, columnId: string) => {
    console.log('[SalesFunnelContextProvider] 🔄 Movendo lead:', lead.name, 'para', columnId);
    // Por agora apenas log - pode implementar depois
  };

  // SEMPRE fornecer um contexto válido - nunca retornar early
  const contextValue = {
    // Estado de carregamento
    loading: salesFunnelData.loading || false,
    error: salesFunnelData.error || null,
    
    // Funnel data - sempre disponível com fallbacks
    funnels: salesFunnelData.funnels || [],
    selectedFunnel: salesFunnelData.selectedFunnel || null,
    setSelectedFunnel: salesFunnelData.setSelectedFunnel,
    createFunnel: salesFunnelData.createFunnel,
    funnelLoading: salesFunnelData.loading || false,
    
    // Dados com fallbacks seguros - Transform raw database leads to KanbanLead format
    columns: salesFunnelData.columns || [],
    setColumns: salesFunnelData.setColumns || (() => {}),
    selectedLead: salesFunnelData.selectedLead || null,
    isLeadDetailOpen: salesFunnelData.isLeadDetailOpen || false,
    setIsLeadDetailOpen: salesFunnelData.setIsLeadDetailOpen || (() => {}),
    availableTags: salesFunnelData.availableTags || [],
    stages: salesFunnelData.stages || [],
    leads: (salesFunnelData.leads || []).map(lead => ({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email || undefined,
      company: lead.company || undefined,
      lastMessage: lead.last_message || "Sem mensagens",
      lastMessageTime: lead.last_message_time ? new Date(lead.last_message_time).toISOString() : new Date().toISOString(),
      tags: [],
      notes: lead.notes || undefined,
      columnId: lead.kanban_stage_id || undefined,
      purchaseValue: lead.purchase_value ? Number(lead.purchase_value) : undefined,
      assignedUser: lead.owner_id || undefined,
      unreadCount: lead.unread_count || 0,
      avatar: undefined,
      created_at: lead.created_at,
      updated_at: lead.updated_at,
      company_id: undefined,
      whatsapp_number_id: lead.whatsapp_number_id || undefined,
      funnel_id: lead.funnel_id,
      kanban_stage_id: lead.kanban_stage_id || undefined,
      owner_id: lead.owner_id || undefined
    })),
    
    // Ações sempre disponíveis
    addColumn: addColumnWrapper,
    updateColumn: updateColumnWrapper,
    deleteColumn: salesFunnelData.deleteColumn || (() => {}),
    openLeadDetail: salesFunnelData.openLeadDetail || (() => {}),
    toggleTagOnLead: salesFunnelData.toggleTagOnLead || (() => {}),
    createTag: createTagWrapper,
    updateLeadNotes: salesFunnelData.updateLeadNotes || (() => {}),
    updateLeadPurchaseValue: salesFunnelData.updateLeadPurchaseValue || (() => {}),
    updateLeadAssignedUser: salesFunnelData.updateLeadAssignedUser || (() => {}),
    updateLeadName: salesFunnelData.updateLeadName || (() => {}),
    moveLeadToStage: moveLeadToStageWrapper,
    isAdmin: isAdmin || false,
    wonStageId: salesFunnelData.wonStageId,
    lostStageId: salesFunnelData.lostStageId,
    refetchLeads: salesFunnelData.refetchLeads || (async () => {}),
    refetchStages: salesFunnelData.refetchStages || (async () => {})
  };

  console.log('[SalesFunnelContextProvider] ✅ Fornecendo contexto OTIMIZADO estável');

  return (
    <SalesFunnelProvider value={contextValue}>
      {children}
    </SalesFunnelProvider>
  );
};
