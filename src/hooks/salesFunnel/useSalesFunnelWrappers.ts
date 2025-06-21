
import { KanbanLead, KanbanColumn } from "@/types/kanban";
import { Funnel } from "@/types/funnel";

interface UseSalesFunnelWrappersProps {
  selectedFunnel: Funnel | null;
  selectedLead: KanbanLead | null;
  addColumn: (title: string, color: string, funnelId: string) => void;
  updateColumn: (columnId: string, updates: any) => Promise<void>;
  createTagMutation: any;
  originalMoveLeadToStage: (leadId: string, stageId: string) => Promise<void>;
  updateLeadNotes: (notes: string) => void;
  updateLeadPurchaseValue: (value: number | undefined) => void;
  updateLeadAssignedUser: (user: string) => void;
  updateLeadName: (name: string) => void;
}

export function useSalesFunnelWrappers({
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
}: UseSalesFunnelWrappersProps) {
  
  // Wrapper function for addColumn to match expected signature
  const wrappedAddColumn = (title: string) => {
    if (selectedFunnel?.id) {
      addColumn(title, '#e0e0e0', selectedFunnel.id);
    }
  };

  // Wrapper function for updateColumn to match expected signature
  const wrappedUpdateColumn = (column: KanbanColumn) => {
    if (selectedFunnel?.id) {
      updateColumn(column.id, { title: column.title, color: column.color });
    }
  };

  // Wrapper function for createTag to match expected signature
  const wrappedCreateTag = (name: string, color: string) => {
    createTagMutation({ name, color });
  };

  // Wrapper function for moveLeadToStage to match expected signature
  const wrappedMoveLeadToStage = (lead: KanbanLead, columnId: string) => {
    if (lead.id) {
      originalMoveLeadToStage(lead.id, columnId);
    }
  };

  // Wrapper functions para usar selectedLead.id quando necessário
  const handleUpdateLeadNotes = (notes: string) => {
    if (selectedLead?.id) {
      console.log('[SalesFunnel] 📝 Atualizando notas do lead:', selectedLead.id);
      updateLeadNotes(notes);
    }
  };

  const handleUpdateLeadPurchaseValue = (value: number | undefined) => {
    if (selectedLead?.id) {
      console.log('[SalesFunnel] 💰 Atualizando valor do lead:', selectedLead.id, value);
      updateLeadPurchaseValue(value);
    }
  };

  const handleUpdateLeadAssignedUser = (user: string) => {
    if (selectedLead?.id) {
      console.log('[SalesFunnel] 👤 Atualizando usuário responsável:', selectedLead.id, user);
      updateLeadAssignedUser(user);
    }
  };

  const handleUpdateLeadName = (name: string) => {
    if (selectedLead?.id) {
      console.log('[SalesFunnel] 📛 Atualizando nome do lead:', selectedLead.id, name);
      updateLeadName(name);
    }
  };

  return {
    wrappedAddColumn,
    wrappedUpdateColumn,
    wrappedCreateTag,
    wrappedMoveLeadToStage,
    handleUpdateLeadNotes,
    handleUpdateLeadPurchaseValue,
    handleUpdateLeadAssignedUser,
    handleUpdateLeadName
  };
}
