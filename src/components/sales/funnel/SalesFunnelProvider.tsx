
import React, { createContext, useContext } from "react";
import { useFunnelManagement } from "@/hooks/salesFunnel/useFunnelManagement";
import { useRealSalesFunnel } from "@/hooks/salesFunnel/useRealSalesFunnel";
import { useUserPermissions } from "@/hooks/useUserPermissions";

interface SalesFunnelContextType {
  // Gerenciamento de funis
  funnels: any[];
  selectedFunnel: any;
  setSelectedFunnel: (funnel: any) => void;
  createFunnel: (name: string, description?: string) => Promise<any>;
  
  // Gerenciamento de estágios
  stages: any[];
  addColumn: (title: string, color?: string) => Promise<void>;
  updateColumn: (id: string, updates: any) => Promise<void>;
  deleteColumn: (id: string) => Promise<void>;
  
  // Dados do kanban
  columns: any[];
  setColumns: (columns: any[]) => void;
  selectedLead: any;
  isLeadDetailOpen: boolean;
  setIsLeadDetailOpen: (open: boolean) => void;
  availableTags: any[];
  
  // Dados adicionais necessários
  leads: any[];
  wonStageId?: string;
  lostStageId?: string;
  isAdmin: boolean;
  refetchLeads: () => Promise<void>;
  refetchStages: () => Promise<void>;
  
  // Ações
  openLeadDetail: (lead: any) => void;
  toggleTagOnLead: (leadId: string, tagId: string) => void;
  createTag: (name: string, color: string) => void;
  updateLeadNotes: (leadId: string, notes: string) => void;
  updateLeadPurchaseValue: (leadId: string, value: number) => void;
  updateLeadAssignedUser: (leadId: string, userId: string) => void;
  updateLeadName: (leadId: string, name: string) => void;
  moveLeadToStage: (lead: any, newColumnId: string, funnelId: string) => Promise<void>;
  receiveNewLead: (lead: any) => void;
}

const SalesFunnelContext = createContext<SalesFunnelContextType | null>(null);

export const useSalesFunnelContext = () => {
  const context = useContext(SalesFunnelContext);
  if (!context) {
    throw new Error("useSalesFunnelContext deve ser usado dentro de SalesFunnelProvider");
  }
  return context;
};

export const SalesFunnelProvider = ({ children }: { children: React.ReactNode }) => {
  // Gerenciamento de funis
  const { funnels, selectedFunnel, setSelectedFunnel, createFunnel } = useFunnelManagement();
  
  // Hook principal do funil real
  const {
    columns,
    setColumns,
    selectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    stages,
    leads,
    availableTags,
    wonStageId,
    lostStageId,
    addColumn,
    updateColumn,
    deleteColumn,
    moveLeadToStage,
    openLeadDetail,
    toggleTagOnLead,
    updateLeadNotes,
    updateLeadPurchaseValue,
    updateLeadAssignedUser,
    updateLeadName,
    receiveNewLead,
    createTag,
    refetchStages,
    refetchLeads
  } = useRealSalesFunnel(selectedFunnel?.id);

  // Verificar permissões do usuário
  const { permissions } = useUserPermissions();

  const value: SalesFunnelContextType = {
    // Funis
    funnels,
    selectedFunnel,
    setSelectedFunnel,
    createFunnel,
    
    // Estágios
    stages,
    addColumn: async (title: string, color: string = '#3b82f6') => {
      await addColumn(title, color);
    },
    updateColumn: async (id: string, updates: any) => {
      await updateColumn(id, updates);
    },
    deleteColumn,
    
    // Kanban
    columns,
    setColumns,
    selectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    availableTags,
    
    // Dados adicionais
    leads,
    wonStageId,
    lostStageId,
    isAdmin: permissions?.canManageTeam || false,
    refetchLeads: async () => {
      await refetchLeads();
    },
    refetchStages: async () => {
      await refetchStages();
    },
    
    // Ações
    openLeadDetail,
    toggleTagOnLead,
    createTag,
    updateLeadNotes,
    updateLeadPurchaseValue,
    updateLeadAssignedUser,
    updateLeadName,
    moveLeadToStage,
    receiveNewLead
  };

  return (
    <SalesFunnelContext.Provider value={value}>
      {children}
    </SalesFunnelContext.Provider>
  );
};
