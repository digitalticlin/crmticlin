
import React from 'react';
import { LeadDetailSidebar } from '../LeadDetailSidebar';
import { KanbanLead, KanbanTag } from '@/types/kanban';
import { Deal } from '@/types/chat';

interface SalesFunnelModalsProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLead: KanbanLead | null;
  availableTags: KanbanTag[];
  onToggleTag: (tagId: string) => void;
  onUpdateNotes: (notes: string) => void;
  onCreateTag: (name: string, color: string) => void;
  onUpdatePurchaseValue: (value: number) => void;
  onUpdateAssignedUser: (user: string) => void;
  onDeleteLead: () => void;
  onUpdateEmail: (email: string) => void;
  onUpdateCompany: (company: string) => void;
  onUpdateAddress: (address: string) => void;
  onUpdateDocumentId: (documentId: string) => void;
  onUpdatePurchaseDate: (date: string) => void;
  onUpdateOwner: (owner: string) => void;
  onUpdatePhoneNumber: (phone: string) => void;
  onUpdateLeadName: (name: string) => void;
  onUpdateLeadStage: (stageId: string) => void;
  onCreateDeal: (deal: Omit<Deal, 'id'>) => void;
  onUpdateDeal: (dealId: string, deal: Partial<Deal>) => void;
  onDeleteDeal: (dealId: string) => void;
  onOpenChat: (leadId: string) => void;
  isUpdating?: boolean;
}

export const SalesFunnelModals: React.FC<SalesFunnelModalsProps> = ({
  isOpen,
  onClose,
  selectedLead,
  availableTags,
  onToggleTag,
  onUpdateNotes,
  onCreateTag,
  onUpdatePurchaseValue,
  onUpdateAssignedUser,
  onDeleteLead,
  onUpdateEmail,
  onUpdateCompany,
  onUpdateAddress,
  onUpdateDocumentId,
  onUpdatePurchaseDate,
  onUpdateOwner,
  onUpdatePhoneNumber,
  onUpdateLeadName,
  onUpdateLeadStage,
  onCreateDeal,
  onUpdateDeal,
  onDeleteDeal,
  onOpenChat,
  isUpdating = false
}) => {
  if (!selectedLead) return null;

  return (
    <LeadDetailSidebar
      selectedLead={selectedLead}
      isOpen={isOpen}
      onClose={onClose}
      onOpenChat={onOpenChat}
      availableTags={availableTags}
      onToggleTag={onToggleTag}
      onUpdateNotes={onUpdateNotes}
      onCreateTag={onCreateTag}
      onUpdatePurchaseValue={onUpdatePurchaseValue}
      onUpdateAssignedUser={onUpdateAssignedUser}
      onDeleteLead={onDeleteLead}
      onUpdateEmail={onUpdateEmail}
      onUpdateCompany={onUpdateCompany}
      onUpdateAddress={onUpdateAddress}
      onUpdateDocumentId={onUpdateDocumentId}
      onUpdatePurchaseDate={onUpdatePurchaseDate}
      onUpdateOwner={onUpdateOwner}
      onUpdatePhoneNumber={onUpdatePhoneNumber}
      onUpdateLeadName={onUpdateLeadName}
      onUpdateLeadStage={onUpdateLeadStage}
      onCreateDeal={onCreateDeal}
      onUpdateDeal={onUpdateDeal}
      onDeleteDeal={onDeleteDeal}
      isUpdating={isUpdating}
    />
  );
};
