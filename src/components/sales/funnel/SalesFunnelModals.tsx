
import { SelectStageModal } from "./modals/SelectStageModal";
import { DealNoteModal } from "./modals/DealNoteModal";
import { LeadDetailSidebar } from "../LeadDetailSidebar";
import { KanbanLead } from "@/types/kanban";
import { KanbanStage } from "@/types/funnel";
import { KanbanTag } from "@/types/kanban";

interface SalesFunnelModalsProps {
  // Stage Modal
  isStageModalOpen: boolean;
  setIsStageModalOpen: (open: boolean) => void;
  leadToMove: KanbanLead | null;
  setLeadToMove: (lead: KanbanLead | null) => void;
  stages: KanbanStage[];
  onStageSelection: (lead: KanbanLead, stageId: string) => void;

  // Deal Note Modal
  isDealNoteModalOpen: boolean;
  setIsDealNoteModalOpen: (open: boolean) => void;
  pendingDealMove: {lead: KanbanLead, status: "won" | "lost"} | null;
  setPendingDealMove: (move: {lead: KanbanLead, status: "won" | "lost"} | null) => void;
  onDealNoteConfirm: (note: string) => void;

  // Lead Detail Sidebar
  selectedLead: KanbanLead | null;
  isLeadDetailOpen: boolean;
  setIsLeadDetailOpen: (open: boolean) => void;
  availableTags: KanbanTag[];
  onToggleTag: (tagId: string) => void;
  onUpdateNotes: (notes: string) => void;
  onCreateTag: (name: string, color: string) => void;
  onUpdatePurchaseValue: (value: number | undefined) => void;
  onUpdateAssignedUser: (user: string) => void;
  onUpdateName: (name: string) => void;
}

export const SalesFunnelModals = ({
  isStageModalOpen,
  setIsStageModalOpen,
  leadToMove,
  setLeadToMove,
  stages,
  onStageSelection,
  isDealNoteModalOpen,
  setIsDealNoteModalOpen,
  pendingDealMove,
  setPendingDealMove,
  onDealNoteConfirm,
  selectedLead,
  isLeadDetailOpen,
  setIsLeadDetailOpen,
  availableTags,
  onToggleTag,
  onUpdateNotes,
  onCreateTag,
  onUpdatePurchaseValue,
  onUpdateAssignedUser,
  onUpdateName
}: SalesFunnelModalsProps) => {
  return (
    <>
      {/* Modal de Seleção de Etapa */}
      <SelectStageModal
        isOpen={isStageModalOpen}
        onClose={() => {
          setIsStageModalOpen(false);
          setLeadToMove(null);
        }}
        lead={leadToMove}
        stages={stages}
        onSelectStage={onStageSelection}
      />

      {/* Modal de Observação do Deal */}
      <DealNoteModal
        isOpen={isDealNoteModalOpen}
        onClose={() => {
          setIsDealNoteModalOpen(false);
          setPendingDealMove(null);
        }}
        onConfirm={onDealNoteConfirm}
        dealType={pendingDealMove?.status || "won"}
        leadName={pendingDealMove?.lead.name || ""}
      />

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
