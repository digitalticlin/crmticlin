import { useUserRole } from "@/hooks/useUserRole";
import { useFunnelManagement } from "@/hooks/salesFunnel/useFunnelManagement";
import { useState } from "react";

export function useSalesFunnelMain() {
  const { isAdmin, role } = useUserRole();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);
  
  const {
    funnels,
    selectedFunnel,
    setSelectedFunnel,
    createFunnel,
    loading: funnelLoading
  } = useFunnelManagement();

  console.log('[SalesFunnelMain] 🔍 Estado básico:', {
    funnelsCount: funnels.length,
    selectedFunnel: selectedFunnel ? { 
      id: selectedFunnel.id, 
      name: selectedFunnel.name 
    } : null,
    funnelLoading,
    isAdmin,
    role
  });

  // Estado mínimo para funcionar
  const mockStages = [
    { id: 'stage-1', title: 'Entrada de Leads', order_position: 1, is_fixed: true, is_won: false, is_lost: false, color: '#3b82f6' },
    { id: 'stage-2', title: 'Em atendimento', order_position: 2, is_fixed: false, is_won: false, is_lost: false, color: '#8b5cf6' },
    { id: 'stage-3', title: 'Em negociação', order_position: 3, is_fixed: false, is_won: false, is_lost: false, color: '#f59e0b' },
    { id: 'stage-4', title: 'GANHO', order_position: 4, is_fixed: true, is_won: true, is_lost: false, color: '#10b981' },
    { id: 'stage-5', title: 'PERDIDO', order_position: 5, is_fixed: true, is_won: false, is_lost: true, color: '#6b7280' }
  ];

  const mockLeads: any[] = [];
  const mockColumns = mockStages.filter(s => !s.is_won && !s.is_lost).map(stage => ({
    id: stage.id,
    title: stage.title,
    leads: [],
    color: stage.color,
    isFixed: stage.is_fixed,
    isHidden: false
  }));

  const mockActions = {
    setColumns: () => {},
    addColumn: () => {},
    updateColumn: () => {},
    deleteColumn: () => {},
    openLeadDetail: (lead: any) => {
      setSelectedLead(lead);
      setIsLeadDetailOpen(true);
    },
    toggleTagOnLead: () => {},
    createTag: () => {},
    updateLeadNotes: () => {},
    updateLeadPurchaseValue: () => {},
    updateLeadAssignedUser: () => {},
    updateLeadName: () => {},
    moveLeadToStage: () => {},
    refetchLeads: async () => {},
    refetchStages: async () => {}
  };

  // Wrappers para compatibilidade
  const wrappers = {
    wrappedAddColumn: mockActions.addColumn,
    wrappedUpdateColumn: mockActions.updateColumn,
    wrappedCreateTag: mockActions.createTag,
    wrappedMoveLeadToStage: mockActions.moveLeadToStage,
    handleUpdateLeadNotes: mockActions.updateLeadNotes,
    handleUpdateLeadPurchaseValue: mockActions.updateLeadPurchaseValue,
    handleUpdateLeadAssignedUser: mockActions.updateLeadAssignedUser,
    handleUpdateLeadName: mockActions.updateLeadName
  };

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
    
    // Mock Kanban data
    columns: mockColumns,
    setColumns: mockActions.setColumns,
    selectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    availableTags: [],
    stages: mockStages,
    leads: mockLeads,
    
    // Mock Actions
    deleteColumn: mockActions.deleteColumn,
    openLeadDetail: mockActions.openLeadDetail,
    toggleTagOnLead: mockActions.toggleTagOnLead,
    wonStageId: mockStages.find(s => s.is_won)?.id,
    lostStageId: mockStages.find(s => s.is_lost)?.id,
    refetchLeads: mockActions.refetchLeads,
    refetchStages: mockActions.refetchStages,
    
    // Wrapped functions para compatibilidade
    ...wrappers
  };
}
