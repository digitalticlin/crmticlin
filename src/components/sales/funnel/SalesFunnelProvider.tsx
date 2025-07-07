import { createContext, useContext, ReactNode } from "react";
import { KanbanColumn, KanbanLead } from "@/types/kanban";
import { Funnel, KanbanStage } from "@/types/funnel";
import { KanbanTag } from "@/types/kanban";

interface SalesFunnelContextValue {
  // Estado de carregamento
  loading: boolean;
  error: string | null;

  // Funnel data
  funnels: Funnel[];
  selectedFunnel: Funnel | null;
  setSelectedFunnel: (funnel: Funnel) => void;
  createFunnel: (name: string, description?: string) => Promise<void>;
  funnelLoading: boolean;

  // Columns and leads
  columns: KanbanColumn[];
  setColumns: (columns: KanbanColumn[]) => void;
  selectedLead: KanbanLead | null;
  isLeadDetailOpen: boolean;
  setIsLeadDetailOpen: (open: boolean) => void;
  availableTags: KanbanTag[];
  stages: KanbanStage[];
  leads: KanbanLead[]; // Adicionando leads totais
  wonStageId?: string;
  lostStageId?: string;

  // Actions
  addColumn: (title: string, color?: string) => Promise<void>;
  updateColumn: (column: KanbanColumn) => Promise<void>;
  deleteColumn: (columnId: string) => Promise<void>;
  openLeadDetail: (lead: KanbanLead) => void;
  toggleTagOnLead: (leadId: string, tagId: string) => void;
  createTag: (name: string, color: string) => void;
  updateLeadNotes: (notes: string) => void;
  updateLeadPurchaseValue: (value: number | undefined) => void;
  updateLeadAssignedUser: (user: string) => void;
  updateLeadName: (name: string) => void;
  moveLeadToStage: (lead: KanbanLead, columnId: string) => void;

  // Refresh functions - changed to Promise<void> to match interface
  refetchLeads: () => Promise<void>;
  refetchStages: () => Promise<void>;

  // UI state
  isAdmin: boolean;
}

const SalesFunnelContext = createContext<SalesFunnelContextValue | null>(null);

export const useSalesFunnelContext = () => {
  const context = useContext(SalesFunnelContext);
  if (!context) {
    console.error('[SalesFunnelContext] ❌ Contexto não encontrado! Verifique se o componente está dentro do SalesFunnelProvider');
    throw new Error("useSalesFunnelContext must be used within SalesFunnelProvider");
  }
  console.log('[SalesFunnelContext] ✅ Contexto acessado com sucesso');
  return context;
};

interface SalesFunnelProviderProps {
  children: ReactNode;
  value: SalesFunnelContextValue;
}

export const SalesFunnelProvider = ({ children, value }: SalesFunnelProviderProps) => {
  return (
    <SalesFunnelContext.Provider value={value}>
      {children}
    </SalesFunnelContext.Provider>
  );
};
