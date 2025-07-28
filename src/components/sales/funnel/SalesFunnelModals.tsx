
import { LeadDetailSidebar } from "../LeadDetailSidebar";
import { KanbanLead } from "@/types/kanban";
import { KanbanTag } from "@/types/kanban";

interface SalesFunnelModalsProps {
  // Lead Detail Sidebar
  selectedLead: KanbanLead | null;
  isLeadDetailOpen: boolean;
  setIsLeadDetailOpen: (open: boolean) => void;
  availableTags?: KanbanTag[];
  onToggleTag?: (tagId: string) => void;
  onUpdateNotes: (notes: string) => void;
  onCreateTag?: (name: string, color: string) => void;
  onUpdatePurchaseValue: (value: number | undefined) => void;
  onUpdateAssignedUser: (user: string) => void;
  onUpdateName: (name: string) => void;
  refetchLeads: () => Promise<void>;
  refetchStages: () => Promise<void>;
}

export const SalesFunnelModals = ({
  selectedLead,
  isLeadDetailOpen,
  setIsLeadDetailOpen,
  availableTags = [],
  onToggleTag = () => {},
  onUpdateNotes,
  onCreateTag = () => {},
  onUpdatePurchaseValue,
  onUpdateAssignedUser,
  onUpdateName,
  refetchLeads,
  refetchStages
}: SalesFunnelModalsProps) => {
  
  const handleUpdateLead = (leadId: string, updates: Partial<KanbanLead>) => {
    // Handle lead updates based on the field being updated
    if (updates.notes !== undefined) {
      onUpdateNotes(updates.notes);
    }
    if (updates.purchaseValue !== undefined) {
      onUpdatePurchaseValue(updates.purchaseValue);
    }
    if (updates.name !== undefined) {
      onUpdateName(updates.name);
    }
    // Add other field handlers as needed
  };

  const handleOpenChat = (lead: KanbanLead) => {
    // Handle opening chat with the lead
    console.log('Opening chat for lead:', lead.id);
  };

  return (
    <>
      {/* Sidebar de Detalhes */}
      <LeadDetailSidebar
        lead={selectedLead}
        isOpen={isLeadDetailOpen}
        onClose={() => setIsLeadDetailOpen(false)}
        onUpdateLead={handleUpdateLead}
        onOpenChat={handleOpenChat}
        availableTags={availableTags}
        onCreateTag={onCreateTag}
      />
    </>
  );
};
