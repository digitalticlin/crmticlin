
import { KanbanLead, KanbanTag } from "@/types/kanban";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
} from "@/components/ui/sheet";
import { TagSelector } from "./TagSelector";
import { LeadDetailHeader } from "./leadDetail/LeadDetailHeader";
import { PurchaseValueField } from "./leadDetail/PurchaseValueField";
import { AssignedUserField } from "./leadDetail/AssignedUserField";
import { NotesField } from "./leadDetail/NotesField";
import { ChatPreview } from "./leadDetail/ChatPreview";
import { LeadDetailFooter } from "./leadDetail/LeadDetailFooter";
import { useEffect, useState } from "react";

interface LeadDetailSidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLead: KanbanLead | null;
  availableTags: KanbanTag[];
  onToggleTag: (tagId: string) => void;
  onUpdateNotes: (notes: string) => void;
  onUpdatePurchaseValue?: (purchaseValue: number | undefined) => void;
  onUpdateAssignedUser?: (assignedUser: string) => void;
  onUpdateName?: (name: string) => void;
  onCreateTag?: (name: string, color: string) => void;
}

export const LeadDetailSidebar = ({
  isOpen,
  onOpenChange,
  selectedLead,
  availableTags,
  onToggleTag,
  onUpdateNotes,
  onUpdatePurchaseValue,
  onUpdateAssignedUser,
  onUpdateName,
  onCreateTag,
}: LeadDetailSidebarProps) => {
  const handleOpenChat = () => {
    onOpenChange(false);
    // In a real app, this would navigate to the chat page with this contact
  };

  // Handle name updates
  const handleNameUpdate = (name: string) => {
    if (onUpdateName) {
      onUpdateName(name);
      toast.success("Nome do lead atualizado");
    }
  };

  if (!selectedLead) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <LeadDetailHeader 
            selectedLead={selectedLead}
            onUpdateName={handleNameUpdate}
          />
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Purchase Value Field */}
          <PurchaseValueField 
            purchaseValue={selectedLead.purchaseValue}
            onUpdatePurchaseValue={onUpdatePurchaseValue ? 
              (value) => {
                onUpdatePurchaseValue(value);
                toast.success("Valor de compra atualizado");
              } : undefined}
          />
          
          {/* Assigned User Field */}
          <AssignedUserField 
            assignedUser={selectedLead.assignedUser}
            onUpdateAssignedUser={onUpdateAssignedUser ? 
              (user) => {
                onUpdateAssignedUser(user);
                toast.success("Responsável atualizado");
              } : undefined}
          />
          
          {/* Tags Selector */}
          <TagSelector
            availableTags={availableTags}
            selectedTags={selectedLead.tags}
            onToggleTag={onToggleTag}
            onCreateTag={onCreateTag}
          />
          
          {/* Notes Field */}
          <NotesField 
            notes={selectedLead.notes}
            onUpdateNotes={onUpdateNotes}
          />
          
          {/* Chat Preview */}
          <ChatPreview 
            lastMessage={selectedLead.lastMessage}
            lastMessageTime={selectedLead.lastMessageTime}
            onOpenChat={handleOpenChat}
          />
        </div>
        
        <LeadDetailFooter onClose={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
};
