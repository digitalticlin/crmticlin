
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
  return (
    <>
      {/* Sidebar de Detalhes */}
      <LeadDetailSidebar
        isOpen={isLeadDetailOpen}
        onOpenChange={setIsLeadDetailOpen}
        selectedLead={selectedLead}
        availableTags={availableTags}
        onToggleTag={onToggleTag}
        onUpdateNotes={onUpdateNotes}
        onCreateTag={onCreateTag}
        onUpdatePurchaseValue={onUpdatePurchaseValue}
        onUpdateAssignedUser={onUpdateAssignedUser}
        onUpdateName={onUpdateName}
      />
    </>
  );
};
